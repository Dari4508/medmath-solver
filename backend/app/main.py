from __future__ import annotations

import csv
import io
import json
import logging
import time
import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime

import structlog
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session

from .cases import seed_cases
from .config import settings
from .database import SessionLocal, get_db, init_db
from .gauss import gaussian_elimination, verify_solution
from .i18n import resolve_calc_message, t
from .metrics import RATE_LIMIT_HITS, REQUEST_COUNT, REQUEST_LATENCY
from .models import CalculationHistory, MedicalCase
from .schemas import (
    CalculationResult,
    CaseCalculateRequest,
    CaseCreate,
    CaseResponse,
    CaseUpdate,
    HistoryDeleteResponse,
    HistoryEntry,
    HistoryStepsResponse,
    MatrixInput,
)
from .security import add_security_headers, limiter, sanitize_html

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)
logger = structlog.get_logger()

LangQuery = Query("es", pattern="^(es|en)$", description="Message language")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_cases(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="MedMath Solver",
    description="Sistemas lineales con eliminación de Gauss aplicados a farmacia hospitalaria",
    version=settings.app_version,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    rid = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start

    route = request.scope.get("route")
    path_label = getattr(route, "path", "unmatched")
    REQUEST_COUNT.labels(request.method, path_label, str(response.status_code)).inc()
    REQUEST_LATENCY.labels(request.method, path_label).observe(elapsed)
    if response.status_code == 429:
        RATE_LIMIT_HITS.inc()

    response.headers["X-Request-ID"] = rid
    if not request.url.path.startswith(("/docs", "/redoc", "/openapi.json", "/metrics")):
        add_security_headers(response)

    logger.info(
        "http_request",
        request_id=rid,
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=round(elapsed * 1000, 2),
    )
    return response


@app.get("/metrics", include_in_schema=False)
def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


def _compare_expected(
    expected: list[float] | None, solution: list[float] | None
) -> tuple[bool | None, float | None]:
    if expected is None or solution is None or len(expected) != len(solution):
        return None, None
    if not solution:
        return None, None
    diff = max(abs(e - s) for e, s in zip(expected, solution, strict=True))
    return diff < settings.expected_tolerance, diff


def _case_to_response(case: MedicalCase) -> CaseResponse:
    return CaseResponse(
        id=case.id,
        name=sanitize_html(case.name),
        description=sanitize_html(case.description),
        reference_source=sanitize_html(case.reference_source),
        reference_url=case.reference_url,
        matrix=case.matrix_coefficients,
        vector=case.constants_vector,
        expected=case.expected_solution,
        variables=case.variables,
        units=case.units,
        clinical_notes=sanitize_html(case.clinical_notes) if case.clinical_notes else None,
    )


def _run_and_record(
    request: Request,
    db: Session,
    matrix: list[list[float]],
    vector: list[float],
    case_id: int | None,
    expected: list[float] | None,
    lang: str,
) -> CalculationResult:
    result = gaussian_elimination(matrix, vector, track_steps=True)

    verified = False
    error_margin = None
    if result.success and result.solution is not None:
        verified, error_margin = verify_solution(matrix, vector, result.solution)

    matches, diff = _compare_expected(expected, result.solution)

    history = CalculationHistory(
        case_id=case_id,
        input_matrix=matrix,
        input_vector=vector,
        solution=result.solution,
        steps=[s.to_dict() for s in result.steps],
        verified=verified,
        error_margin=error_margin,
        matches_expected=matches,
        client_ip=request.client.host if request.client else None,
    )
    db.add(history)
    db.commit()

    return CalculationResult(
        solution=result.solution,
        steps=[s.to_dict() for s in result.steps],
        verified=verified,
        error_margin=error_margin,
        matches_expected=matches,
        expected_diff=diff,
        success=result.success,
        message=resolve_calc_message(result.message, lang),
    )


api = APIRouter()


@api.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}


@api.get("/cases", response_model=list[CaseResponse])
def list_cases(db: Session = Depends(get_db)) -> list[CaseResponse]:
    cases = db.query(MedicalCase).filter_by(is_active=True).all()
    return [_case_to_response(c) for c in cases]


@api.get("/cases/{case_id}", response_model=CaseResponse)
def get_case(case_id: int, db: Session = Depends(get_db)) -> CaseResponse:
    case = db.query(MedicalCase).filter_by(id=case_id, is_active=True).first()
    if not case:
        raise HTTPException(status_code=404, detail=t("case_not_found"))
    return _case_to_response(case)


@api.post("/cases", response_model=CaseResponse, status_code=201)
def create_case(body: CaseCreate, db: Session = Depends(get_db)) -> CaseResponse:
    existing = db.query(MedicalCase).filter_by(name=body.name).first()
    if existing:
        raise HTTPException(status_code=409, detail=t("duplicate_case_name"))
    case = MedicalCase(
        name=body.name,
        description=body.description,
        reference_source=body.reference_source,
        reference_url=body.reference_url,
        matrix_coefficients=body.matrix,
        constants_vector=body.vector,
        expected_solution=body.expected,
        variables=body.variables,
        units=body.units,
        clinical_notes=body.clinical_notes,
        is_active=body.is_active,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return _case_to_response(case)


@api.put("/cases/{case_id}", response_model=CaseResponse)
def update_case(case_id: int, body: CaseUpdate, db: Session = Depends(get_db)) -> CaseResponse:
    case = db.query(MedicalCase).filter_by(id=case_id).first()
    if not case or not case.is_active:
        raise HTTPException(status_code=404, detail=t("case_not_found"))
    data = body.model_dump(exclude_unset=True)
    if "name" in data and data["name"] != case.name:
        other = db.query(MedicalCase).filter_by(name=data["name"]).first()
        if other and other.id != case_id:
            raise HTTPException(status_code=409, detail=t("duplicate_case_name"))
    if "matrix" in data:
        case.matrix_coefficients = data.pop("matrix")
    if "vector" in data:
        case.constants_vector = data.pop("vector")
    if "expected" in data:
        case.expected_solution = data.pop("expected")
    for field in (
        "name",
        "description",
        "reference_source",
        "reference_url",
        "variables",
        "units",
        "clinical_notes",
        "is_active",
    ):
        if field in data:
            setattr(case, field, data[field])
    db.commit()
    db.refresh(case)
    return _case_to_response(case)


@api.delete("/cases/{case_id}", response_model=CaseResponse)
def delete_case(case_id: int, db: Session = Depends(get_db)) -> CaseResponse:
    case = db.query(MedicalCase).filter_by(id=case_id, is_active=True).first()
    if not case:
        raise HTTPException(status_code=404, detail=t("case_not_found"))
    case.is_active = False
    db.commit()
    db.refresh(case)
    return _case_to_response(case)


@api.post("/calculate", response_model=CalculationResult)
@limiter.limit(settings.rate_limit)
def calculate_case(
    request: Request,
    body: CaseCalculateRequest,
    lang: str = LangQuery,
    db: Session = Depends(get_db),
) -> CalculationResult:
    case = db.query(MedicalCase).filter_by(id=body.case_id, is_active=True).first()
    if not case:
        raise HTTPException(status_code=404, detail=t("case_not_found", lang))
    return _run_and_record(
        request,
        db,
        case.matrix_coefficients,
        case.constants_vector,
        case.id,
        case.expected_solution,
        lang,
    )


@api.post("/calculate/custom", response_model=CalculationResult)
@limiter.limit(settings.rate_limit)
def calculate_custom(
    request: Request,
    body: MatrixInput,
    lang: str = LangQuery,
    db: Session = Depends(get_db),
) -> CalculationResult:
    return _run_and_record(request, db, body.matrix, body.vector, None, None, lang)


@api.get("/history", response_model=list[HistoryEntry])
def get_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[HistoryEntry]:
    entries = (
        db.query(CalculationHistory)
        .order_by(CalculationHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        HistoryEntry(
            id=e.id,
            case_id=e.case_id,
            input_matrix=e.input_matrix,
            input_vector=e.input_vector,
            solution=e.solution,
            verified=e.verified,
            error_margin=e.error_margin,
            matches_expected=e.matches_expected,
            created_at=e.created_at.isoformat() if e.created_at else "",
        )
        for e in entries
    ]


@api.get("/history/export")
def export_history(db: Session = Depends(get_db)) -> Response:
    entries = db.query(CalculationHistory).order_by(CalculationHistory.created_at.desc()).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "id",
            "case_id",
            "created_at",
            "verified",
            "error_margin",
            "matches_expected",
            "solution",
            "input_matrix",
            "input_vector",
        ]
    )
    for e in entries:
        writer.writerow(
            [
                e.id,
                e.case_id if e.case_id is not None else "",
                e.created_at.isoformat() if e.created_at else "",
                int(bool(e.verified)),
                e.error_margin if e.error_margin is not None else "",
                "" if e.matches_expected is None else int(bool(e.matches_expected)),
                json.dumps(e.solution),
                json.dumps(e.input_matrix),
                json.dumps(e.input_vector),
            ]
        )
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=medmath-history.csv"},
    )


@api.get("/history/{history_id}", response_model=HistoryEntry)
def get_history_entry(history_id: int, db: Session = Depends(get_db)) -> HistoryEntry:
    e = db.query(CalculationHistory).filter_by(id=history_id).first()
    if not e:
        raise HTTPException(status_code=404, detail=t("history_not_found"))
    return HistoryEntry(
        id=e.id,
        case_id=e.case_id,
        input_matrix=e.input_matrix,
        input_vector=e.input_vector,
        solution=e.solution,
        verified=e.verified,
        error_margin=e.error_margin,
        matches_expected=e.matches_expected,
        created_at=e.created_at.isoformat() if e.created_at else "",
    )


@api.get("/history/{history_id}/steps", response_model=HistoryStepsResponse)
def get_history_steps(history_id: int, db: Session = Depends(get_db)) -> HistoryStepsResponse:
    e = db.query(CalculationHistory).filter_by(id=history_id).first()
    if not e:
        raise HTTPException(status_code=404, detail=t("history_not_found"))
    return HistoryStepsResponse(
        history_id=e.id,
        case_id=e.case_id,
        steps=e.steps or [],
    )


@api.delete("/history/{history_id}", response_model=HistoryDeleteResponse)
def delete_history_entry(history_id: int, db: Session = Depends(get_db)) -> HistoryDeleteResponse:
    e = db.query(CalculationHistory).filter_by(id=history_id).first()
    if not e:
        raise HTTPException(status_code=404, detail=t("history_not_found"))
    db.delete(e)
    db.commit()
    return HistoryDeleteResponse(deleted=1)


@api.delete("/history", response_model=HistoryDeleteResponse)
def clear_history(db: Session = Depends(get_db)) -> HistoryDeleteResponse:
    deleted = db.query(CalculationHistory).delete()
    db.commit()
    return HistoryDeleteResponse(deleted=deleted)


app.include_router(api, prefix="/api")
app.include_router(api, prefix="/api/v1")

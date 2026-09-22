import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

transport = ASGITransport(app=app)


@pytest.mark.asyncio
async def test_case_d10w_verification_flow():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/cases")
        assert resp.status_code == 200
        cases = resp.json()
        assert len(cases) >= 1

        d10w = next(c for c in cases if "D10W" in c["name"])
        case_id = d10w["id"]

        resp = await ac.post(
            "/api/calculate",
            json={"case_id": case_id},
        )
        assert resp.status_code == 200
        result = resp.json()

        assert result["success"] is True
        assert result["verified"] is True
        assert result["error_margin"] is not None
        assert result["error_margin"] < 0.01
        assert len(result["steps"]) > 0
        assert result["solution"] is not None
        assert abs(result["solution"][0] - 55.555555) < 0.01
        assert abs(result["solution"][1] - 444.444444) < 0.01


@pytest.mark.asyncio
async def test_case_electrolytes_flow():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/cases")
        assert resp.status_code == 200
        cases = resp.json()

        elec = next(c for c in cases if "Na/K/Cl" in c["name"])
        case_id = elec["id"]

        resp = await ac.post(
            "/api/calculate",
            json={"case_id": case_id},
        )
        assert resp.status_code == 200
        result = resp.json()

        assert result["success"] is True
        assert result["verified"] is True
        assert result["error_margin"] < 0.01


@pytest.mark.asyncio
async def test_free_mode_calculation():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/calculate/custom",
            json={"matrix": [[2, 1], [1, -1]], "vector": [3, 0]},
        )
        assert resp.status_code == 200
        result = resp.json()
        assert result["success"] is True
        assert result["error_margin"] < 1e-9


@pytest.mark.asyncio
async def test_invalid_case_id_returns_404():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/calculate",
            json={"case_id": 99999},
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_history_populated_after_calc():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post(
            "/api/calculate/custom",
            json={"matrix": [[1, 0], [0, 1]], "vector": [5, 5]},
        )
        resp = await ac.get("/api/history")
        assert resp.status_code == 200
        history = resp.json()
        assert len(history) >= 1
        assert history[0]["solution"] is not None


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_get_case_detail_ok():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        list_resp = await ac.get("/api/cases")
        case_id = list_resp.json()[0]["id"]

        resp = await ac.get(f"/api/cases/{case_id}")
        assert resp.status_code == 200
        case = resp.json()
        assert case["id"] == case_id
        assert len(case["matrix"]) == len(case["vector"])
        assert len(case["expected"]) == len(case["variables"])
        assert len(case["units"]) == len(case["variables"])


@pytest.mark.asyncio
async def test_get_case_detail_404():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/cases/99999")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_security_headers_present():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/health")
        assert resp.headers["X-Content-Type-Options"] == "nosniff"
        assert resp.headers["X-Frame-Options"] == "DENY"
        assert resp.headers["X-XSS-Protection"] == "1; mode=block"
        assert resp.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"


@pytest.mark.asyncio
async def test_history_pagination_params():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/history", params={"skip": 0, "limit": 1})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) <= 1


def test_seed_cases_idempotent():
    from app.cases import seed_cases
    from app.database import SessionLocal
    from app.models import MedicalCase

    db = SessionLocal()
    try:
        seed_cases(db)
        seed_cases(db)

        names = [c.name for c in db.query(MedicalCase).all()]
        assert len(names) == len(set(names))
        assert len(names) >= 2
    finally:
        db.close()


@pytest.mark.asyncio
async def test_lifespan_startup_runs():
    from app.database import SessionLocal
    from app.main import app as main_app
    from app.main import lifespan
    from app.models import MedicalCase

    async with lifespan(main_app):
        pass

    db = SessionLocal()
    try:
        assert db.query(MedicalCase).count() >= 2
    finally:
        db.close()


@pytest.mark.asyncio
async def test_history_negative_limit_rejected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/history", params={"limit": -1})
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_history_negative_skip_rejected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/history", params={"skip": -5})
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_history_oversized_limit_rejected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/history", params={"limit": 100000})
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_history_default_params_ok():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/history")
        assert resp.status_code == 200
        resp = await ac.get("/api/history", params={"skip": 0, "limit": 1})
        assert resp.status_code == 200
        assert len(resp.json()) <= 1

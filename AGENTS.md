# MedMath Solver

FastAPI + SQLite backend, vanilla JS frontend (CDN-only, no build). Gaussian elimination with partial pivoting for medical IV solution mixing.

## Quick commands

```bash
# Backend
cd backend && pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000

# Tests (must be run from backend/)
pytest -xvs
pytest -xvs --cov=app --cov-report=term-missing

# Lint / format / types
ruff check app tests alembic locustfile.py
black --check app tests alembic locustfile.py
mypy app

# Migrations
alembic upgrade head
alembic stamp head   # for DBs created via create_all

# Load test
locust -f locustfile.py --host=http://127.0.0.1:8000

# Frontend (static + proxy /api → :8000)
cd frontend && python3 serve.py 3000

# E2E (Playwright)
cd tests/e2e && npm install && npx playwright install && npm test
```

## Architecture

- **`backend/app/gauss.py`** — core algorithm. `gaussian_elimination()` returns `GaussResult` with `.steps` list for frontend animation replay. Never modifies input matrices.
- **`backend/app/schemas.py`** — Pydantic v2 with `model_validator(mode="after")` for cross-field validation (matrix is square + vector length matches). Max 6x6.
- **`backend/app/security.py`** — slowapi rate limiter (30/min), `sanitize_html()` for XSS. All DB access via SQLAlchemy ORM only (no raw SQL).
- **`backend/app/cases.py`** — seeded medical cases (D10W, electrolytes). `seed_cases()` runs at startup.
- **`backend/app/models.py`** — SQLAlchemy 2.0 typed models (`Mapped` / `mapped_column`).
- **`backend/alembic/`** — migrations (`0001_initial`).
- **`backend/locustfile.py`** — load test scenarios.
- **`frontend/`** — zero build step. All libs via CDN (Tailwind, Chart.js, GSAP). `js/app.js` is the entrypoint (i18n es/en, rate-limit cooldown).
- **`tests/e2e/`** — Playwright E2E (cases, D10W solve, ES↔EN, free mode, history).

## Conventions

- Matrix/vector inputs: lists of floats, not numpy. Algorithm is pure Python.
- `GaussStep.to_dict()` for JSON serialization of animation steps.
- All string outputs from DB go through `sanitize_html()` before returning to client.
- Tests use `httpx.AsyncClient` with `app` import from `app.main`.
- Rate limit tests need >30 requests; expect 429 on 31st.
- Models use SQLAlchemy 2.0 `Mapped[T]` / `mapped_column` (mypy-clean).

## Gotchas

- SQLite file created at `backend/medmath.db` on first startup (auto-seeds cases). For existing DBs created via `create_all`, run `alembic stamp head` once.
- pytest config lives in `backend/pyproject.toml` — run tests from `backend/`.
- Frontend expects API at same origin (nginx) or `frontend/serve.py` proxy (dev). `python3 -m http.server` will NOT work.
- `slowapi` limiter key: `X-Real-IP` → `X-Forwarded-For` (last) → `request.client` — proxy-aware for nginx.
- Tests: `tests/conftest.py` sets a temp `DATABASE_URL`, imports `app.models` (registers tables) and seeds cases; rate limiter resets per test.
- Dockerfile installs `requirements-dev.txt` so lint tools are in the test image (`docker run -u root ... ruff/black/mypy`).
- ruff ignores `B008` (FastAPI `Depends()` idiom) and `E501`.
- Locks: `requirements.in` → `requirements.txt` (prod hashed), `requirements-dev.in` → `requirements-dev.txt` (full hashed).

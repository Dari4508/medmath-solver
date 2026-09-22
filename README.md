# MedMath Solver

Solver de sistemas lineales con **eliminación de Gauss** (pivoteo parcial) para farmacia hospitalaria. Backend **FastAPI + SQLite**, frontend **vanilla JS** sin build (CDN).

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

# Migrations (Alembic)
alembic upgrade head          # apply
alembic stamp head            # mark existing DB as migrated
alembic current / heads

# Load test (backend running on :8000)
locust -f locustfile.py --host=http://127.0.0.1:8000

# Frontend (static + proxy /api → :8000)
cd frontend && python3 serve.py 3000

# E2E (Playwright; needs backend + frontend)
cd tests/e2e && npm install && npx playwright install && npm test
```

## Architecture

- **`backend/app/gauss.py`** — core algorithm. `gaussian_elimination()` returns `GaussResult` with `.steps` list for frontend animation replay. Never modifies input matrices.
- **`backend/app/schemas.py`** — Pydantic v2 with `model_validator(mode="after")` for cross-field validation (matrix is square + vector length matches). Max 6x6.
- **`backend/app/security.py`** — slowapi rate limiter (30/min), `sanitize_html()` for XSS. All DB access via SQLAlchemy ORM only (no raw SQL).
- **`backend/app/cases.py`** — seeded medical cases (D10W, electrolytes). `seed_cases()` runs at startup.
- **`backend/app/models.py`** — SQLAlchemy 2.0 typed models (`Mapped` / `mapped_column`).
- **`backend/alembic/`** — migrations. Initial revision `0001_initial`.
- **`backend/locustfile.py`** — load test scenarios for the API.
- **`frontend/`** — zero build step. All libs via CDN (Tailwind, Chart.js, GSAP). `js/app.js` is the entrypoint (i18n es/en dictionary, rate-limit cooldown).
- **`tests/e2e/`** — Playwright E2E (cases load, D10W solve, ES↔EN switch, free mode, history).

## API Endpoints

All routes are mounted under both `/api` (legacy) and `/api/v1` (versioned).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/cases` | List active clinical cases |
| GET | `/cases/{id}` | Case detail |
| POST | `/cases` | Create case |
| PUT | `/cases/{id}` | Update case |
| DELETE | `/cases/{id}` | Deactivate case |
| POST | `/calculate` | Solve seeded case by `case_id` |
| POST | `/calculate/custom` | Solve free-form `matrix` + `vector` |
| GET | `/history` | List calculation history (paginated: `offset`, `limit`) |
| GET | `/history/{id}` | History entry detail |
| GET | `/history/{id}/steps` | Animation steps for entry |
| DELETE | `/history/{id}` | Delete entry |
| DELETE | `/history` | Clear all history |
| GET | `/history/export` | Export CSV |
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics (blocked by nginx) |

**i18n:** all responses accept `?lang=es|en` (default `es`; invalid → 422).

**Rate limit:** 30 req/min per client IP (proxy-aware via `X-Real-IP` / `X-Forwarded-For`). Exceeding returns `429` with `Retry-After` header.

## Dependencies / locks

- `requirements.in` → `requirements.txt` (prod, `pip-compile --generate-hashes`)
- `requirements-dev.in` → `requirements-dev.txt` (prod + test + lint, hashed)

Regenerate: `pip-compile --generate-hashes --allow-unsafe requirements.in -o requirements.txt`

## Conventions

- Matrix/vector inputs: lists of floats, not numpy. Algorithm is pure Python.
- `GaussStep.to_dict()` for JSON serialization of animation steps.
- All string outputs from DB go through `sanitize_html()` before returning to client.
- Tests use `httpx.AsyncClient` with `app` import from `app.main`.
- Rate limit tests need >30 requests; expect 429 on 31st.
- Models use SQLAlchemy 2.0 `Mapped[T]` / `mapped_column` (mypy-clean).

## Gotchas

- SQLite file created at `backend/medmath.db` on first startup (auto-seeds cases). For existing DBs created via `create_all`, run `alembic stamp head` once before using migrations.
- pytest config lives in `backend/pyproject.toml` (`[tool.pytest.ini_options]`) — run tests from `backend/`.
- Frontend expects API at same origin (nginx) or `frontend/serve.py` proxy (dev). `python3 -m http.server` will NOT work.
- `slowapi` limiter key: `X-Real-IP` → `X-Forwarded-For` (last) → `request.client` — proxy-aware for nginx.
- Tests: `tests/conftest.py` sets a temp `DATABASE_URL`, imports `app.models` (registers tables) and seeds cases; rate limiter resets per test.
- Dockerfile installs `requirements-dev.txt` so lint tools are available in the test image (`docker run -u root ... ruff/black/mypy`).
- ruff ignores `B008` (FastAPI `Depends()` in defaults is idiomatic) and `E501` (line length handled by black).

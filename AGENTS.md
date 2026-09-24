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

# Full stack (api :8000 + nginx frontend :3000)
docker compose up -d --build

# Smoke test (compose up → health/cases/calc → teardown)
./scripts/smoke_test.sh

# E2E (Playwright; stack must already be up)
cd tests/e2e && npm install && npx playwright install
E2E_NO_SERVER=1 E2E_BASE_URL=http://127.0.0.1:3000 npm test
```

## Architecture

- **`backend/app/gauss.py`** — core algorithm. `gaussian_elimination()` returns `GaussResult` with `.steps` list for frontend animation replay. Never modifies input matrices.
- **`backend/app/schemas.py`** — Pydantic v2 with `model_validator(mode="after")` for cross-field validation (matrix is square + vector length matches). Max 6x6.
- **`backend/app/security.py`** — slowapi rate limiter (30/min, `headers_enabled=True`), `client_ip_key()` honors `X-Real-IP`/`X-Forwarded-For` only from loopback/private remotes (`_is_trusted_proxy`). `sanitize_html()` kept for unit tests only; API returns raw strings. `validate_case_name()` blocks XSS names. All DB access via SQLAlchemy ORM only (no raw SQL).
- **`backend/app/cases.py`** — 5 seeded medical cases (D10W, electrolitos 3×3, KCl 20/40, NaHCO₃ 8.4%/4.2%, PN AA10%+G50%) with real reference URLs. `seed_cases()` runs at startup.
- **`backend/app/database.py`** — `check_schema()` + `REQUIRED_COLUMNS`; `/api/health` reports `schema_ok`/`missing`.
- **`backend/app/models.py`** — SQLAlchemy 2.0 typed models (`Mapped` / `mapped_column`).
- **`backend/alembic/`** — migrations (`0001_initial`, `0002_*`).
- **`backend/locustfile.py`** — load test scenarios.
- **`frontend/`** — zero build step. All libs via CDN (Tailwind, Chart.js, GSAP). `js/app.js` is the entrypoint (i18n es/en, free mode 2-col, rate-limit badge/cooldown). Fonts: Sora + IBM Plex Mono (Google Fonts). Design: bento cases grid (`.cases-grid`), glass header (`.site-header`), ambient mesh (`body::before`), skeletons (`.case-skeleton`), micro-interactions + `anim-pop` success — all `prefers-reduced-motion` safe. Frontend escapes all DB strings via `escHtml()` (API is raw).
- **`tests/e2e/`** — Playwright E2E, 7 tests (cases×5, D10W solve, ES↔EN, free inline + example, history, rate-limit badge). Rate-limit test runs LAST (shared 30/min quota).
- **`scripts/smoke_test.sh`** — compose smoke (health, ≥5 cases, calc, frontend).
- **`.github/workflows/ci.yml`** — jobs: backend, frontend, e2e (compose + Playwright + smoke).

## Conventions

- Matrix/vector inputs: lists of floats, not numpy. Algorithm is pure Python.
- `GaussStep.to_dict()` for JSON serialization of animation steps (includes `pivot_col`).
- API JSON returns raw strings; frontend escapes with `escHtml()` at render time. `sanitize_html()` is unit-tested only.
- `update_case` validates merged payload via `_validate_merged_case()` → 422 on name/system/length/range errors.
- Tests use `httpx.AsyncClient` with `app` import from `app.main`.
- Rate limit tests need >30 requests; expect 429 on 31st; assert `Retry-After` + `X-RateLimit-Remaining`.
- Models use SQLAlchemy 2.0 `Mapped[T]` / `mapped_column` (mypy-clean).
- Rate-limited FastAPI endpoints MUST declare `response: Response` so slowapi can inject rate-limit headers (otherwise `_inject_headers` raises on the Pydantic return value).
- Free-mode form order is row-major: `a00,a01,b0,a10,a11,b1` (b after each row). `buildFreeForm` is idempotent (key `n|lang|vars`) and preserves values; rows use `overflow-x-auto` + `flex-nowrap` for 6×6.
- Single `<h1>` in `#app-title` (SEO); views use `<h2>`.
- Rate-limit untrusted-remote tests must use a truly public IP (`8.8.8.8`) — Python `ipaddress` treats TEST-NET (`203.0.113.x`) as private.

## Gotchas

- SQLite file created at `backend/medmath.db` on first startup (auto-seeds cases). For existing DBs created via `create_all`, run `alembic stamp head` once.
- pytest config lives in `backend/pyproject.toml` — run tests from `backend/`.
- Frontend expects API at same origin (nginx) or `frontend/serve.py` proxy (dev). `python3 -m http.server` will NOT work.
- `slowapi` limiter key: `client_ip_key` → honors `X-Real-IP` / `X-Forwarded-For` (last) only if remote is loopback/private/`testclient`; otherwise uses `request.client`. Compose binds `127.0.0.1:8000:8000`.
- Tests: `tests/conftest.py` sets a temp `DATABASE_URL`, imports `app.models` (registers tables) and seeds cases; rate limiter resets per test.
- Dockerfile installs `requirements-dev.txt` so lint tools are in the test image (`docker run -u root ... ruff/black/mypy`).
- ruff ignores `B008` (FastAPI `Depends()` idiom) and `E501`.
- Locks: `requirements.in` → `requirements.txt` (prod hashed), `requirements-dev.in` → `requirements-dev.txt` (full hashed).
- E2E with live stack: `E2E_NO_SERVER=1` skips Playwright webServer; restart `api` before run to reset in-memory rate limit. **Run E2E sequentially** — parallel runs exhaust the shared 30/min quota and race on `test-results/` (ENOENT traces). Use `./node_modules/.bin/playwright` from `tests/e2e`, not root `npx`.

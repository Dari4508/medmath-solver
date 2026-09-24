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

# Full stack (api :8000 + nginx frontend :3000)
docker compose up -d --build

# Smoke test (compose → health/cases/calc → teardown)
./scripts/smoke_test.sh

# E2E (Playwright; stack must already be up)
cd tests/e2e && npm install && npx playwright install
E2E_NO_SERVER=1 E2E_BASE_URL=http://127.0.0.1:3000 npm test
```

## Architecture

- **`backend/app/gauss.py`** — core algorithm. `gaussian_elimination()` returns `GaussResult` with `.steps` list for frontend animation replay. Never modifies input matrices.
- **`backend/app/schemas.py`** — Pydantic v2 with `model_validator(mode="after")` for cross-field validation (matrix is square + vector length matches). Max 6x6.
- **`backend/app/security.py`** — slowapi rate limiter (30/min), trusted-proxy-aware `client_ip_key` (`X-Real-IP`/`X-Forwarded-For` only from loopback/private). API returns raw strings; frontend escapes via `escHtml()`. `validate_case_name()` blocks XSS names. All DB access via SQLAlchemy ORM only (no raw SQL).
- **`backend/app/cases.py`** — 5 seeded medical cases (D10W, electrolitos, KCl 20/40, NaHCO₃ 8.4%/4.2%, PN AA10%+G50%) with real reference URLs. `seed_cases()` runs at startup.
- **`backend/app/database.py`** — `check_schema()`; `/api/health` reports `schema_ok` / `missing`.
- **`backend/app/models.py`** — SQLAlchemy 2.0 typed models (`Mapped` / `mapped_column`).
- **`backend/alembic/`** — migrations (`0001_initial`, `0002_*`).
- **`backend/locustfile.py`** — load test scenarios for the API.
- **`frontend/`** — zero build step. All libs via CDN (Tailwind, Chart.js, GSAP). `js/app.js` is the entrypoint (i18n es/en, free mode 2-col, rate-limit badge). Fonts: Sora + IBM Plex Mono. Design: bento cases grid, glass header, ambient mesh, skeletons, micro-interactions (`prefers-reduced-motion` safe).
- **`tests/e2e/`** — Playwright E2E, 7 tests (cases×5, D10W, ES↔EN, free inline + example, history, rate-limit badge last). Run sequentially; restart `api` first to reset the shared 30/min quota.
- **`scripts/smoke_test.sh`** — compose smoke test.
- **`.github/workflows/ci.yml`** — backend + frontend + e2e (compose + Playwright + smoke).

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

**Rate limit:** 30 req/min per client IP (proxy-aware via `X-Real-IP` / `X-Forwarded-For`). Responses include `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset`; exceeding returns `429` with `Retry-After`.

## Dependencies / locks

- `requirements.in` → `requirements.txt` (prod, `pip-compile --generate-hashes`)
- `requirements-dev.in` → `requirements-dev.txt` (prod + test + lint, hashed)

Regenerate: `pip-compile --generate-hashes --allow-unsafe requirements.in -o requirements.txt`

## Conventions

- Matrix/vector inputs: lists of floats, not numpy. Algorithm is pure Python.
- `GaussStep.to_dict()` for JSON serialization of animation steps (includes `pivot_col`).
- API JSON returns raw strings; frontend escapes with `escHtml()` at render time. `sanitize_html()` is unit-tested only.
- Tests use `httpx.AsyncClient` with `app` import from `app.main`.
- Rate limit tests need >30 requests; expect 429 on 31st; assert `Retry-After` + `X-RateLimit-Remaining`.
- Models use SQLAlchemy 2.0 `Mapped[T]` / `mapped_column` (mypy-clean).
- Rate-limited FastAPI endpoints MUST declare `response: Response` so slowapi can inject rate-limit headers.
- Free-mode form order is row-major: `a00,a01,b0,a10,a11,b1`. `buildFreeForm` is idempotent and preserves values; 6×6 rows scroll horizontally (`flex-nowrap`).
- Single `<h1>` in `#app-title` (SEO); views use `<h2>`.

## Gotchas

- SQLite file created at `backend/medmath.db` on first startup (auto-seeds cases). For existing DBs created via `create_all`, run `alembic stamp head` once before using migrations.
- pytest config lives in `backend/pyproject.toml` (`[tool.pytest.ini_options]`) — run tests from `backend/`.
- Frontend expects API at same origin (nginx) or `frontend/serve.py` proxy (dev). `python3 -m http.server` will NOT work.
- `slowapi` limiter key: `client_ip_key` → `X-Real-IP` / `X-Forwarded-For` (last) only if remote is loopback/private; otherwise `request.client`. Compose binds `127.0.0.1:8000:8000`.
- Tests: `tests/conftest.py` sets a temp `DATABASE_URL`, imports `app.models` (registers tables) and seeds cases; rate limiter resets per test.
- Dockerfile installs `requirements-dev.txt` so lint tools are available in the test image (`docker run -u root ... ruff/black/mypy`).
- ruff ignores `B008` (FastAPI `Depends()` in defaults is idiomatic) and `E501` (line length handled by black).
- E2E with live stack: `E2E_NO_SERVER=1` skips Playwright webServer; restart `api` before run to reset in-memory rate limit. Run E2E sequentially — parallel runs exhaust the shared 30/min quota and race on `test-results/`. Use `./node_modules/.bin/playwright` from `tests/e2e`.

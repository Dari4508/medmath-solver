import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

_TEST_DB_DIR = tempfile.mkdtemp(prefix="medmath-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_DIR}/test_medmath.db"

import pytest  # noqa: E402

import app.models  # noqa: F401, E402  — registra las tablas en Base antes de create_all
from app.cases import seed_cases  # noqa: E402
from app.database import SessionLocal, init_db  # noqa: E402
from app.security import limiter  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _setup_test_db():
    init_db()
    db = SessionLocal()
    try:
        seed_cases(db)
    finally:
        db.close()


@pytest.fixture(autouse=True)
def _fresh_rate_limit():
    limiter.reset()
    yield
    limiter.reset()

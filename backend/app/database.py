import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./medmath.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)


REQUIRED_COLUMNS = {
    "calculation_history": ["matches_expected", "verified", "error_margin"],
    "medical_cases": ["expected_solution", "matrix_coefficients", "is_active"],
}


def check_schema() -> dict:
    """Verify critical columns exist. Used by /api/health."""
    from sqlalchemy import inspect

    inspector = inspect(engine)
    missing: dict[str, list[str]] = {}
    for table, required in REQUIRED_COLUMNS.items():
        try:
            existing = {c["name"] for c in inspector.get_columns(table)}
        except Exception:
            missing[table] = required
            continue
        absent = [c for c in required if c not in existing]
        if absent:
            missing[table] = absent
    return {"schema_ok": not missing, "missing": missing}

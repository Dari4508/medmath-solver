from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class MedicalCase(Base):
    __tablename__ = "medical_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    reference_source: Mapped[str] = mapped_column(String(200))
    reference_url: Mapped[str | None] = mapped_column(String(500), default=None)
    matrix_coefficients: Mapped[list] = mapped_column(JSON)
    constants_vector: Mapped[list] = mapped_column(JSON)
    expected_solution: Mapped[list] = mapped_column(JSON)
    variables: Mapped[list] = mapped_column(JSON)
    units: Mapped[list] = mapped_column(JSON)
    clinical_notes: Mapped[str | None] = mapped_column(Text, default=None)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))


class CalculationHistory(Base):
    __tablename__ = "calculation_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    case_id: Mapped[int | None] = mapped_column(ForeignKey("medical_cases.id"), default=None)
    input_matrix: Mapped[list] = mapped_column(JSON)
    input_vector: Mapped[list] = mapped_column(JSON)
    solution: Mapped[list | None] = mapped_column(JSON, default=None)
    steps: Mapped[list | None] = mapped_column(JSON, default=None)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    error_margin: Mapped[float | None] = mapped_column(Float, default=None)
    matches_expected: Mapped[bool | None] = mapped_column(Boolean, default=None)
    client_ip: Mapped[str | None] = mapped_column(String(45), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

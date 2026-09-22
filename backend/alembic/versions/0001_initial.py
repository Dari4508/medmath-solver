"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-22

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "medical_cases",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("reference_source", sa.String(length=200), nullable=False),
        sa.Column("reference_url", sa.String(length=500), nullable=True),
        sa.Column("matrix_coefficients", sa.JSON(), nullable=False),
        sa.Column("constants_vector", sa.JSON(), nullable=False),
        sa.Column("expected_solution", sa.JSON(), nullable=False),
        sa.Column("variables", sa.JSON(), nullable=False),
        sa.Column("units", sa.JSON(), nullable=False),
        sa.Column("clinical_notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "calculation_history",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("medical_cases.id"), nullable=True),
        sa.Column("input_matrix", sa.JSON(), nullable=False),
        sa.Column("input_vector", sa.JSON(), nullable=False),
        sa.Column("solution", sa.JSON(), nullable=True),
        sa.Column("steps", sa.JSON(), nullable=True),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("error_margin", sa.Float(), nullable=True),
        sa.Column("matches_expected", sa.Boolean(), nullable=True),
        sa.Column("client_ip", sa.String(length=45), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("calculation_history")
    op.drop_table("medical_cases")

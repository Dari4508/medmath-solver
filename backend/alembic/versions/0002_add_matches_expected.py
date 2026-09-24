"""add matches_expected column

Revision ID: 0002_add_matches_expected
Revises: 0001_initial
Create Date: 2026-09-22

Idempotent: safe to run on fresh DBs (column created by 0001) and on
existing DBs where alembic_version was stamped but the column is missing
(tables originally created via Base.metadata.create_all).
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_add_matches_expected"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _has_column(conn, table: str, column: str) -> bool:
    columns = {row[1] for row in conn.execute(sa.text(f"PRAGMA table_info({table})"))}
    return column in columns


def upgrade() -> None:
    conn = op.get_bind()
    if not _has_column(conn, "calculation_history", "matches_expected"):
        op.add_column(
            "calculation_history",
            sa.Column("matches_expected", sa.Boolean(), nullable=True),
        )


def downgrade() -> None:
    conn = op.get_bind()
    if _has_column(conn, "calculation_history", "matches_expected"):
        with op.batch_alter_table("calculation_history") as batch_op:
            batch_op.drop_column("matches_expected")

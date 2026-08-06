"""Add legal policy version on user + consent expires_at (RK consent TTL).

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-08-06 22:40:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "b8c9d0e1f2a3"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column("legal_policy_version", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "user",
        sa.Column("legal_accepted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "user_consent",
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("user_consent", "expires_at")
    op.drop_column("user", "legal_accepted_at")
    op.drop_column("user", "legal_policy_version")

"""user_consent table for granular RK §1.4 consents.

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-08-06 21:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "a7b8c9d0e1f2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_consent",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("purpose", sa.String(length=64), nullable=False),
        sa.Column("granted", sa.Boolean(), nullable=False),
        sa.Column("countries", sa.String(length=1024), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "purpose", name="uq_user_consent_purpose"),
    )
    op.create_index("ix_user_consent_user_id", "user_consent", ["user_id"])
    op.create_index("ix_user_consent_tenant_id", "user_consent", ["tenant_id"])
    op.create_index("ix_user_consent_purpose", "user_consent", ["purpose"])


def downgrade() -> None:
    op.drop_index("ix_user_consent_purpose", table_name="user_consent")
    op.drop_index("ix_user_consent_tenant_id", table_name="user_consent")
    op.drop_index("ix_user_consent_user_id", table_name="user_consent")
    op.drop_table("user_consent")

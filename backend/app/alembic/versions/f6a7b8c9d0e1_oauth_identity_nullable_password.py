"""oauth_identity + nullable user.hashed_password for OAuth-only accounts.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-06 19:45:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "user",
        "hashed_password",
        existing_type=sa.String(),
        nullable=True,
    )
    op.create_table(
        "oauth_identity",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("provider_subject", sa.String(length=255), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("encrypted_refresh_token", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "provider", "provider_subject", name="uq_oauth_provider_subject"
        ),
    )
    op.create_index(
        op.f("ix_oauth_identity_provider"), "oauth_identity", ["provider"], unique=False
    )
    op.create_index(
        op.f("ix_oauth_identity_provider_subject"),
        "oauth_identity",
        ["provider_subject"],
        unique=False,
    )
    op.create_index(
        op.f("ix_oauth_identity_user_id"), "oauth_identity", ["user_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_oauth_identity_user_id"), table_name="oauth_identity")
    op.drop_index(
        op.f("ix_oauth_identity_provider_subject"), table_name="oauth_identity"
    )
    op.drop_index(op.f("ix_oauth_identity_provider"), table_name="oauth_identity")
    op.drop_table("oauth_identity")
    op.alter_column(
        "user",
        "hashed_password",
        existing_type=sa.String(),
        nullable=False,
    )

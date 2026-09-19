"""Add candidate self-application permission.

Revision ID: a2b3c4d5e6f7
Revises: f2a3b4c5d6e7
"""

from uuid import UUID

import sqlalchemy as sa
from alembic import op

revision = "a2b3c4d5e6f7"
down_revision = "f2a3b4c5d6e7"
branch_labels = None
depends_on = None

PERMISSION_ID = UUID("b0000000-0000-4000-8000-00000000000e")
CANDIDATE_ROLE_ID = UUID("a0000000-0000-4000-8000-000000000005")


def upgrade() -> None:
    permission = sa.table(
        "permission", sa.column("id", sa.Uuid()), sa.column("name", sa.String())
    )
    role_permission = sa.table(
        "role_permission",
        sa.column("role_id", sa.Uuid()),
        sa.column("permission_id", sa.Uuid()),
    )
    op.bulk_insert(permission, [{"id": PERMISSION_ID, "name": "application.apply"}])
    op.bulk_insert(
        role_permission,
        [{"role_id": CANDIDATE_ROLE_ID, "permission_id": PERMISSION_ID}],
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("DELETE FROM role_permission WHERE permission_id = :permission_id"),
        {"permission_id": PERMISSION_ID},
    )
    conn.execute(
        sa.text("DELETE FROM permission WHERE id = :permission_id"),
        {"permission_id": PERMISSION_ID},
    )

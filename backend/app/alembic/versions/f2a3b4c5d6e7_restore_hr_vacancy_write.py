"""Restore HR vacancy.create / update / delete grants

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-08-24 10:00:00.000000
"""

from uuid import UUID

from alembic import op
import sqlalchemy as sa

revision = "f2a3b4c5d6e7"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None

HR_ROLE_ID = UUID("a0000000-0000-4000-8000-000000000002")

VACANCY_WRITE = (
    UUID("b0000000-0000-4000-8000-000000000003"),  # vacancy.create
    UUID("b0000000-0000-4000-8000-000000000004"),  # vacancy.update
    UUID("b0000000-0000-4000-8000-000000000005"),  # vacancy.delete
)


def upgrade() -> None:
    conn = op.get_bind()
    for perm_id in VACANCY_WRITE:
        conn.execute(
            sa.text(
                "INSERT INTO role_permission (role_id, permission_id) "
                "VALUES (:role_id, :perm_id) "
                "ON CONFLICT (role_id, permission_id) DO NOTHING"
            ),
            {"role_id": HR_ROLE_ID, "perm_id": perm_id},
        )


def downgrade() -> None:
    conn = op.get_bind()
    for perm_id in VACANCY_WRITE:
        conn.execute(
            sa.text(
                "DELETE FROM role_permission "
                "WHERE role_id = :role_id AND permission_id = :perm_id"
            ),
            {"role_id": HR_ROLE_ID, "perm_id": perm_id},
        )

"""Grant HR manual candidate assignment according to UC-04 and RBAC.

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
"""

import sqlalchemy as sa
from alembic import op

revision = "c4d5e6f7a8b9"
down_revision = "b3c4d5e6f7a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.get_bind().execute(
        sa.text(
            "INSERT INTO role_permission (role_id, permission_id) "
            "SELECT role.id, permission.id FROM role CROSS JOIN permission "
            "WHERE role.name = 'hr' AND permission.name = 'application.assign' "
            "ON CONFLICT (role_id, permission_id) DO NOTHING"
        )
    )


def downgrade() -> None:
    op.get_bind().execute(
        sa.text(
            "DELETE FROM role_permission USING role, permission "
            "WHERE role_permission.role_id = role.id "
            "AND role_permission.permission_id = permission.id "
            "AND role.name = 'hr' AND permission.name = 'application.assign'"
        )
    )

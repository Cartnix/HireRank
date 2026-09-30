"""Add an owner role above administrator (no automatic admin promotion)."""

from alembic import op
import sqlalchemy as sa

revision = "d5e6f7a8b9c0"
down_revision = "c4d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            "INSERT INTO role (id, name) VALUES ('a0000000-0000-4000-8000-000000000006', 'superuser')"
        )
    )
    op.execute(
        sa.text(
            "INSERT INTO permission (id, name) VALUES ('b0000000-0000-4000-8000-00000000000f', 'developer.access')"
        )
    )
    op.execute(
        sa.text(
            "INSERT INTO role_permission (role_id, permission_id) SELECT role.id, permission.id FROM role CROSS JOIN permission WHERE role.name = 'superuser'"
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text("UPDATE \"user\" SET role = 'administrator' WHERE role = 'superuser'")
    )
    op.execute(
        sa.text(
            "DELETE FROM role_permission USING role WHERE role_permission.role_id = role.id AND role.name = 'superuser'"
        )
    )
    op.execute(sa.text("DELETE FROM permission WHERE name = 'developer.access'"))
    op.execute(sa.text("DELETE FROM role WHERE name = 'superuser'"))

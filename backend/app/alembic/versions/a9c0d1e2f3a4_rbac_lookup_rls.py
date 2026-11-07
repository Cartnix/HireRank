"""Allow runtime role to read RBAC lookup tables under RLS.

Revision ID: a9c0d1e2f3a4
Revises: a8b9c0d1e2f3
"""

from alembic import op

revision = "a9c0d1e2f3a4"
down_revision = "a8b9c0d1e2f3"
branch_labels = None
depends_on = None

TABLES = ("role", "permission", "role_permission")


def upgrade() -> None:
    for table in TABLES:
        op.execute(
            f"CREATE POLICY hirerank_app_read_policy ON {table} "
            "FOR SELECT TO hirerank_app USING (true)"
        )
        op.execute(
            f"REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER "
            f"ON {table} FROM hirerank_app"
        )
        op.execute(f"GRANT SELECT ON {table} TO hirerank_app")


def downgrade() -> None:
    for table in TABLES:
        op.execute(f"DROP POLICY hirerank_app_read_policy ON {table}")

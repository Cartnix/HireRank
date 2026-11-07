"""Apply tenant RLS to user consent records.

Revision ID: a8b9c0d1e2f3
Revises: f7a8b9c0d1e2
"""

from alembic import op

revision = "a8b9c0d1e2f3"
down_revision = "f7a8b9c0d1e2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE user_consent FORCE ROW LEVEL SECURITY")
    op.execute(
        """
        CREATE POLICY tenant_isolation_policy ON user_consent
        USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
        WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
        """
    )
    op.execute(
        "GRANT SELECT, INSERT, UPDATE, DELETE ON user_consent TO hirerank_app"
    )


def downgrade() -> None:
    op.execute("DROP POLICY tenant_isolation_policy ON user_consent")
    op.execute("ALTER TABLE user_consent NO FORCE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE user_consent DISABLE ROW LEVEL SECURITY")

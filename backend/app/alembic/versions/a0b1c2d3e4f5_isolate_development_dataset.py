"""Restrict the shared demo dataset to its dedicated tenant."""

from alembic import op

revision = "a0b1c2d3e4f5"
down_revision = ("f7a8b9c0d1e2", "a9c0d1e2f3a4")
branch_labels = None
depends_on = None

DEMO_TENANT_ID = "550e8400-e29b-41d4-a716-446655440000"


def upgrade() -> None:
    op.execute("ALTER TABLE development_dataset ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE development_dataset FORCE ROW LEVEL SECURITY")
    op.execute(
        "CREATE POLICY demo_tenant_only ON development_dataset "
        "AS PERMISSIVE FOR ALL TO hirerank_app "
        "USING (NULLIF(current_setting('app.current_tenant', true), '')::uuid "
        f"= '{DEMO_TENANT_ID}'::uuid) "
        "WITH CHECK (NULLIF(current_setting('app.current_tenant', true), '')::uuid "
        f"= '{DEMO_TENANT_ID}'::uuid)"
    )
    op.execute(
        "GRANT SELECT, INSERT, UPDATE, DELETE ON development_dataset TO hirerank_app"
    )


def downgrade() -> None:
    op.execute("REVOKE ALL ON development_dataset FROM hirerank_app")
    op.execute("DROP POLICY demo_tenant_only ON development_dataset")
    op.execute("ALTER TABLE development_dataset NO FORCE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE development_dataset DISABLE ROW LEVEL SECURITY")

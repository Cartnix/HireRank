"""Persistent tenant-scoped HR Copilot settings."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "f7a8b9c0d1e2"
down_revision = "e6f7a8b9c0d1"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "copilot_settings",
        sa.Column(
            "tenant_id",
            sa.Uuid(),
            sa.ForeignKey("tenant.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("config", postgresql.JSONB(), nullable=False),
    )
    op.execute("ALTER TABLE copilot_settings ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE copilot_settings FORCE ROW LEVEL SECURITY")
    op.execute(
        "CREATE POLICY tenant_isolation_policy ON copilot_settings USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid)"
    )
    op.execute("GRANT SELECT, INSERT, UPDATE ON copilot_settings TO hirerank_app")


def downgrade():
    op.drop_table("copilot_settings")

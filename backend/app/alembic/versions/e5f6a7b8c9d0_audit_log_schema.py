"""Add audit.audit_log partitioned table with INSERT-only + FORCE RLS

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-08-03 17:40:00.000000

Separate audit schema, monthly RANGE partitions, hirerank_app may only
INSERT/SELECT (no UPDATE/DELETE). FORCE RLS with tenant isolation.
"""

from __future__ import annotations

from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op

from app.db.rls_policies import tenant_isolation_on_audit_log

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None

APP_ROLE = "hirerank_app"


def _month_start(year: int, month: int) -> datetime:
    return datetime(year, month, 1, tzinfo=UTC)


def _next_month(year: int, month: int) -> tuple[int, int]:
    if month == 12:
        return year + 1, 1
    return year, month + 1


def _partition_sql(year: int, month: int) -> str:
    start = _month_start(year, month)
    ny, nm = _next_month(year, month)
    end = _month_start(ny, nm)
    name = f"audit_log_{year:04d}_{month:02d}"
    return (
        f"CREATE TABLE IF NOT EXISTS audit.{name} "
        f"PARTITION OF audit.audit_log "
        f"FOR VALUES FROM ('{start.isoformat()}') TO ('{end.isoformat()}')"
    )


def upgrade() -> None:
    op.execute(sa.text("CREATE SCHEMA IF NOT EXISTS audit"))

    op.execute(
        sa.text(
            """
            CREATE TABLE audit.audit_log (
                id UUID NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                tenant_id UUID NOT NULL,
                user_id UUID,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL DEFAULT 'user',
                entity_id UUID,
                ip_address INET,
                user_agent TEXT,
                metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
                PRIMARY KEY (id, created_at)
            ) PARTITION BY RANGE (created_at)
            """
        )
    )

    op.execute(
        sa.text(
            "CREATE INDEX ix_audit_log_tenant_action "
            "ON audit.audit_log (tenant_id, action)"
        )
    )
    op.execute(
        sa.text(
            "CREATE INDEX ix_audit_log_tenant_created "
            "ON audit.audit_log (tenant_id, created_at DESC)"
        )
    )

    now = datetime.now(UTC)
    y, m = now.year, now.month
    op.execute(sa.text(_partition_sql(y, m)))
    ny, nm = _next_month(y, m)
    op.execute(sa.text(_partition_sql(ny, nm)))
    # One more month ahead for CI/long-running deploys near month boundary
    ny2, nm2 = _next_month(ny, nm)
    op.execute(sa.text(_partition_sql(ny2, nm2)))

    op.execute(sa.text("ALTER TABLE audit.audit_log ENABLE ROW LEVEL SECURITY"))
    op.execute(sa.text("ALTER TABLE audit.audit_log FORCE ROW LEVEL SECURITY"))

    op.execute(tenant_isolation_on_audit_log.to_sql_statement_create())

    op.execute(sa.text(f"GRANT USAGE ON SCHEMA audit TO {APP_ROLE}"))
    op.execute(
        sa.text(
            f"GRANT SELECT, INSERT ON TABLE audit.audit_log TO {APP_ROLE}"
        )
    )
    # Explicit deny for tamper resistance (default privileges must not re-grant)
    op.execute(
        sa.text(
            f"REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit.audit_log FROM {APP_ROLE}"
        )
    )
    # Partitions inherit privileges from parent on PG16+; re-assert SELECT/INSERT
    op.execute(
        sa.text(
            f"GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO {APP_ROLE}"
        )
    )
    op.execute(
        sa.text(
            f"REVOKE UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA audit FROM {APP_ROLE}"
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP TABLE IF EXISTS audit.audit_log CASCADE"))
    op.execute(sa.text("DROP SCHEMA IF EXISTS audit CASCADE"))

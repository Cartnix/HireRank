"""Harden tenant RLS policies: NULLIF + uuid cast (fail-closed empty GUC)

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-08-03 13:40:00.000000

Replaces text-equality policies with uuid-safe expressions. Empty or missing
app.current_tenant must not raise (''::uuid) and must hide all rows.
"""

from alembic import op
import sqlalchemy as sa
from alembic_utils.pg_policy import PGPolicy

from app.db.rls_policies import tenant_isolation_on_user, tenant_self_on_tenant

revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None

# Previous (pre-harden) definitions for downgrade
_LEGACY_USER = PGPolicy(
    schema="public",
    signature="tenant_isolation_policy",
    on_entity='public."user"',
    definition="""
AS PERMISSIVE
FOR ALL
TO PUBLIC
USING (tenant_id::text = current_setting('app.current_tenant', true))
WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true))
""",
)

_LEGACY_TENANT = PGPolicy(
    schema="public",
    signature="tenant_self_policy",
    on_entity="public.tenant",
    definition="""
AS PERMISSIVE
FOR ALL
TO PUBLIC
USING (id::text = current_setting('app.current_tenant', true))
WITH CHECK (id::text = current_setting('app.current_tenant', true))
""",
)


def upgrade() -> None:
    # DROP + CREATE — Postgres has no CREATE OR REPLACE POLICY
    for statement in tenant_isolation_on_user.to_sql_statement_create_or_replace():
        op.execute(statement)
    for statement in tenant_self_on_tenant.to_sql_statement_create_or_replace():
        op.execute(statement)

    # Ensure app role can read RBAC catalog tables created after role grants
    op.execute(
        sa.text(
            "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "
            "role, permission, role_permission TO hirerank_app"
        )
    )


def downgrade() -> None:
    for statement in _LEGACY_USER.to_sql_statement_create_or_replace():
        op.execute(statement)
    for statement in _LEGACY_TENANT.to_sql_statement_create_or_replace():
        op.execute(statement)
    op.execute(
        sa.text(
            "REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "
            "role, permission, role_permission FROM hirerank_app"
        )
    )

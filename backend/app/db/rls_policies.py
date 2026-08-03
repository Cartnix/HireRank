"""PostgreSQL RLS policies registered for Alembic autogenerate (alembic_utils).

ENABLE / FORCE ROW LEVEL SECURITY stay in hand-written migrations — PGPolicy
only covers CREATE POLICY. Keep definitions aligned with what Postgres stores
in pg_policies (it rewrites casts), or autogenerate will emit ReplaceOps.
"""

from alembic_utils.pg_policy import PGPolicy

# Fail closed when GUC is missing or empty (background jobs, misconfigured pool).
# Without NULLIF, ''::uuid raises and aborts the whole statement.
# Expression matches Postgres' rewritten form from pg_policies.qual.
_TENANT = "(NULLIF(current_setting('app.current_tenant'::text, true), ''::text))::uuid"

tenant_isolation_on_user = PGPolicy(
    schema="public",
    signature="tenant_isolation_policy",
    on_entity='public."user"',
    definition=f"""
as PERMISSIVE for ALL to public using ((tenant_id = {_TENANT})) with check ((tenant_id = {_TENANT}))
""",
)

tenant_self_on_tenant = PGPolicy(
    schema="public",
    signature="tenant_self_policy",
    on_entity="public.tenant",
    definition=f"""
as PERMISSIVE for ALL to public using ((id = {_TENANT})) with check ((id = {_TENANT}))
""",
)

RLS_POLICIES: list[PGPolicy] = [
    tenant_isolation_on_user,
    tenant_self_on_tenant,
]

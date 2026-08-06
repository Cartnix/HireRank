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

_TENANT_ISOLATION = f"""
as PERMISSIVE for ALL to public using ((tenant_id = {_TENANT})) with check ((tenant_id = {_TENANT}))
"""


def _tenant_isolation(on_entity: str) -> PGPolicy:
    return PGPolicy(
        schema="public",
        signature="tenant_isolation_policy",
        on_entity=on_entity,
        definition=_TENANT_ISOLATION,
    )


tenant_isolation_on_user = PGPolicy(
    schema="public",
    signature="tenant_isolation_policy",
    on_entity='public."user"',
    definition=_TENANT_ISOLATION,
)

tenant_self_on_tenant = PGPolicy(
    schema="public",
    signature="tenant_self_policy",
    on_entity="public.tenant",
    definition=f"""
as PERMISSIVE for ALL to public using ((id = {_TENANT})) with check ((id = {_TENANT}))
""",
)

# Append-only audit: SELECT/INSERT under tenant; UPDATE/DELETE revoked at GRANT level.
tenant_isolation_on_audit_log = PGPolicy(
    schema="audit",
    signature="tenant_isolation_policy",
    on_entity="audit.audit_log",
    definition=_TENANT_ISOLATION,
)

tenant_isolation_on_vacancy = _tenant_isolation("public.vacancy")
tenant_isolation_on_pipeline_stage = _tenant_isolation("public.pipeline_stage")
tenant_isolation_on_candidate = _tenant_isolation("public.candidate")
tenant_isolation_on_application = _tenant_isolation("public.application")
tenant_isolation_on_interview = _tenant_isolation("public.interview")
tenant_isolation_on_scorecard = _tenant_isolation("public.scorecard")

RLS_POLICIES: list[PGPolicy] = [
    tenant_isolation_on_user,
    tenant_self_on_tenant,
    tenant_isolation_on_audit_log,
    tenant_isolation_on_vacancy,
    tenant_isolation_on_pipeline_stage,
    tenant_isolation_on_candidate,
    tenant_isolation_on_application,
    tenant_isolation_on_interview,
    tenant_isolation_on_scorecard,
]

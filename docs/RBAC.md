# HireRank — RBAC

Roles and permission matrix for the self-hosted (Core) ATS.

## Roles

| Role | Description |
|------|-------------|
| `administrator` | Admin panel and user management; full vacancy CRUD; resume upload |
| `hr` | Candidate intake; resume upload |
| `manager` | Read vacancies; scoped candidate read (assigned + pending HITL); HITL decisions via Telegram |
| `recruiter` | Resume upload; read all enterprise vacancies |
| `candidate` | Resume upload; read vacancies; own candidate profile |

`administrator` is created via seed / admin tooling, not public registration.

Registerable roles: `candidate`, `hr`, `manager`, `recruiter`.

## Permission matrix (MVP)

Stored in PostgreSQL tables `role`, `permission`, and `role_permission` (M2M). Seeded by Alembic; admins can change grants without redeploying application code.

| Permission | administrator | hr | manager | recruiter | candidate |
|------------|:-------------:|:--:|:-------:|:---------:|:---------:|
| `admin.panel` | yes | no | no | no | no |
| `users.manage` | yes | no | no | no | no |
| `vacancy.create` | yes | no | no | no | no |
| `vacancy.update` | yes | no | no | no | no |
| `vacancy.delete` | yes | no | no | no | no |
| `vacancy.read` | yes | yes | yes | yes | yes |
| `resume.upload` | yes | yes | no | yes | yes |
| `candidate.read` | yes (all) | yes (all) | scoped | no | own |

Manager scope and candidate “own” checks are enforced on domain endpoints (ABAC), not only by the static matrix.

### Hybrid enforcement

1. **Persistence** — role ↔ permission links live in Postgres.
2. **Performance** — at login / refresh, permissions are loaded once and signed into the access JWT `permissions` claim. FastAPI `require_permission()` checks that claim in O(1) (no DB round-trip per request).
3. **Future RLS** — authenticated sessions set `app.current_user_id` and `app.current_user_role` via `SET LOCAL` alongside existing `app.current_tenant`. Resource-level policies (vacancies, candidates) can be added in later migrations without changing the Python session lifecycle.

Permission changes in the DB take effect on the next login or refresh (existing access tokens keep their claim until expiry).

### RLS in Alembic

Tenant isolation (`ENABLE`/`FORCE ROW LEVEL SECURITY` + policies) lives in Alembic migrations — never applied by hand after deploy. Policies use:

```sql
tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid
```

so a missing/empty GUC fails closed (no rows) without raising on `''::uuid`. Runtime sessions `SET LOCAL ROLE hirerank_app` (NOBYPASSRLS) so FORCE RLS applies even when the login role is a superuser.

Policy definitions are also registered with [alembic_utils](https://github.com/olirice/alembic_utils) (`app/db/rls_policies.py`) so `alembic revision --autogenerate` can detect policy drift. Register with `entity_types=[PGPolicy]` only — otherwise alembic_utils emits DropOps for every unregistered GRANT/extension. `ENABLE`/`FORCE` remain hand-written SQL (not covered by `PGPolicy`).

## Hidden multi-tenancy

Core / Open Source deploys one enterprise per instance. `tenant_id` remains on rows and in JWT for schema compatibility; the app always binds to `TENANT_ID` from env (seeded default tenant). PostgreSQL RLS enforces `tenant_id = current_setting('app.current_tenant')`.

## Auth tokens & session store

Access and refresh JWTs carry `sub`, `role`, `tenant_id`, `jti`, `type`. Access tokens also carry `permissions` (list of strings). **Browser transport** is HttpOnly Secure cookies (`access_token` / `refresh_token`) plus a readable `csrf_token` for double-submit CSRF on mutating requests. JSON body for `/auth/login|register|refresh` returns `AuthSession` (`token_type=cookie`, `expires_in`) — **no usable access JWT in body**. Dual-mode: `Authorization: Bearer` still works for scripts/Swagger (`POST /login/access-token` returns `TokenPair`).

Google/LinkedIn OAuth verify identity only (`oauth_identity.provider` + immutable `provider_subject`). Role / tenant / `is_active` always come from PostgreSQL. IdP refresh tokens (if any) are stored encrypted — never in the session JWT.

Refresh jtis and access blacklists live in a pluggable `TokenStore`:

| Mode | Env | Use when |
|------|-----|----------|
| Memory | `TOKEN_STORE=memory` (Core default) | Single FastAPI replica; self-host zero-ops |
| Redis | `TOKEN_STORE=redis` | Multiple replicas, Enterprise, or SaaS |

Contract (both implementations):

- `store_refresh` / `get_refresh_user` / `revoke_refresh` (optional grace for parallel mobile refresh)
- `blacklist_access` / `is_access_blacklisted` (TTL tied to JWT `exp`)
- `revoke_tenant` — wipe `tenant:{id}:*` (SaaS company lockout)

Redis key shape: `tenant:{tenant_id}:{refresh|grace|blacklist}:{jti}`. Memory uses the same tenant scoping so switching stores does not change call sites.

Deploy guidance: [SELF-HOSTED.md](SELF-HOSTED.md). Product editions: [README](../README.md#core-enterprise--saas).

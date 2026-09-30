# HireRank — RBAC

Roles and permission matrix for the self-hosted (Core) ATS.

## Roles

| Role | Description |
|------|-------------|
| `superuser` | Application owner; all current and future permissions; exclusive developer mode and role preview |
| `administrator` | Admin panel and user management; full vacancy CRUD; resume upload |
| `hr` | Candidate intake; vacancy CRUD; resume upload |
| `manager` | Read vacancies and scoped candidate records |
| `recruiter` | Resume upload; read all enterprise vacancies |
| `candidate` | Resume upload; read vacancies; own candidate profile |

`superuser` is assigned only to the configured `FIRST_SUPERUSER` by initialization after migrations. Existing administrators remain administrators. Neither privileged role is available through public registration. Administrators cannot create, promote, edit, deactivate or delete a superuser. Only a superuser can grant that role. Management accounts cannot disable, demote or delete themselves.

Registerable roles: `candidate`, `hr`, `manager`, `recruiter`.

## Permission matrix (MVP)

Stored in PostgreSQL tables `role`, `permission`, and `role_permission` (M2M). Seeded by Alembic; admins can change grants without redeploying application code.

| Permission | superuser | administrator | hr | manager | recruiter | candidate |
|------------|:---------:|:-------------:|:--:|:-------:|:---------:|:---------:|
| `developer.access` | yes | no | no | no | no | no |
| `admin.panel` | yes | yes | no | no | no | no |
| `users.manage` | yes | yes | no | no | no | no |
| `vacancy.create` | yes | yes | yes | no | no | no |
| `vacancy.update` | yes | yes | yes | no | no | no |
| `vacancy.delete` | yes | yes | yes | no | no | no |
| `vacancy.read` | yes | yes | yes | yes | yes | yes |
| `resume.upload` | yes | yes | yes | no | yes | yes |
| `candidate.read` | yes | yes (all) | yes (all) | scoped | no | own |
| `candidate.create` | yes | yes | yes | no | no | no |
| `candidate.update` | yes | yes | yes | no | no | own (ABAC) |
| `candidate.delete` | yes | yes | no | no | no | no |
| `application.assign` | yes | yes | yes | no | no | no |
| `application.read` | yes | yes | yes | yes | no | no |
| `application.apply` | yes | no | no | no | no | own open vacancy |

### Developer mode and administration controls

`GET /users/me/developer-access` checks the active database user role and rejects every role except `superuser` with 403. The frontend waits for session loading and this endpoint before enabling developer data or restoring a saved preview role. Changing browser storage cannot authorize a non-owner. Preview roles affect only local test data and do not change the authenticated API identity. Development routes are gated by the preview role.

The administration checkbox is available to administrators and superusers (including their developer previews), starts off, and resets when the identity, preview role or data mode changes. Without it, management buttons for vacancies, candidates and users are hidden; reads remain available. HR, manager, recruiter and candidate keep their existing matrix. This checkbox controls the interface; server authorization always uses the authenticated user and permissions independently.

Superuser permission loading includes every permission in the database, and server permission checks accept the active owner for future permissions as well. Tenant RLS still applies.

Manager scope and candidate “own” checks are enforced on domain endpoints
(ABAC), not only by the static matrix. HR can attach candidates to vacancies in
the MVP.

### Hybrid enforcement

1. **Persistence** — role ↔ permission links live in Postgres.
2. **Performance** — at login / refresh, permissions are loaded once and signed into the access JWT `permissions` claim. FastAPI `require_permission()` checks that claim in O(1) (no DB round-trip per request).
3. **Future RLS** — authenticated sessions set `app.current_user_id` and `app.current_user_role` via `SET LOCAL` alongside existing `app.current_tenant`. Resource-level policies on ATS entities (`vacancy`, `candidate`, `application`, `pipeline_stage`, `interview`, `scorecard` — see [ATS_SCHEMA.md](ATS_SCHEMA.md)) can be added in later migrations without changing the Python session lifecycle. Tenant isolation FORCE RLS on those tables is already in place.

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

**Consent (RK §1.4 / GDPR Arts. 6–7):** registration and OAuth start require a separated `consent` object (`account_processing` required; `talent_pool` / `cross_border` optional, empty by default). Grants persist in `user_consent` with **`expires_at` TTL** (not indefinite). Login uses implicit consent under «Войти» linking to **Условия использования** and **Политика сбора и обработки персональных данных**. `POST /auth/check-email` drives universal login→register. `GET|PATCH /auth/consent` reads/updates; `POST /auth/accept-legal` accepts `LEGAL_POLICY_VERSION` (+ optional consent refresh); `POST /auth/forget-me` revokes consents, anonymizes the auth identity, and clears the session (GDPR Art. 17 / RK §3.3). Register body uses `extra=forbid` so IIN / passport / `tenant_id` cannot be injected (RK §1.5 minimization). OAuth scopes: `openid email` only.

Auth audit actions include `auth.login.success|failure`, `auth.register`, `auth.logout`, `auth.refresh`, `auth.consent.update`, `auth.legal.accept`, `auth.forget_me` with IP (X-Forwarded-For aware) + User-Agent + timestamp. Login soft rate-limit returns 429.

Google/LinkedIn OAuth verify identity only (`oauth_identity.provider` + immutable `provider_subject`). Role / tenant / `is_active` always come from PostgreSQL. IdP refresh tokens (if any) are stored encrypted — never in the session JWT. OAuth start is **POST** with the same consent payload before IdP redirect.

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

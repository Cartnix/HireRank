# HireRank — Cookie session + hybrid OAuth (issue #31)

Behavioral SoT: [use-cases/](use-cases/). Auth roles/permissions: [RBAC.md](RBAC.md). API: [openapi/](openapi/).

## Transport

| Channel | Mechanism |
|---------|-----------|
| Browser SPA/SSR | HttpOnly `access_token` + `refresh_token` cookies; readable `csrf_token`; `credentials: include` |
| CSRF | Double-submit: `X-CSRF-Token` must match `csrf_token` when access cookie is present (mutating methods) |
| Scripts / Swagger | `POST /login/access-token` → JSON `TokenPair` + optional Bearer dual-read |
| Social | `GET /auth/oauth/{google\|linkedin}/start` → IdP → `/auth/callback/{provider}` → same cookies |

JWT claims stay lean (`sub`, `role`, `tenant_id`, `jti`, `type`, `permissions`). Postgres remains SoT for role/`is_active`/tenant. Google/LinkedIn prove identity only; map via `oauth_identity(provider, provider_subject)`.

Local HTTP: `COOKIE_SECURE=false`. Production: Secure + prefer `__Host-` names via `AUTH_COOKIE_HOST_PREFIX`. CORS: explicit origins + `allow_credentials=True` (never `*`).

## Compliance (issue #31 DoD)

### Cookie / session
- [x] Access/refresh HttpOnly; Secure from settings; SameSite=lax
- [x] CSRF readable cookie + `X-CSRF-Token` on cookie-authenticated mutations
- [x] CORS credentials + explicit origin allowlist
- [x] No usable access JWT in `/auth/login|register|refresh` JSON body
- [x] Lean JWT claims (no IdP tokens / ATS blobs in cookie)

### Hybrid auth
- [x] Local password and Google/LinkedIn end in the same HireRank cookie session
- [x] OAuth via `httpx` code exchange only; first-party PyJWT session
- [x] Bearer / `OAuth2PasswordRequestForm` dual path retained
- [x] Password hashing remains off the event loop (`pwdlib` / threadpool patterns unchanged)

### ATS identity SoT
- [x] Role/tenant/`is_active` from Postgres
- [x] Immutable `(provider, provider_subject)` identity key
- [x] Core: new social users default `candidate` on `TENANT_ID`
- [x] `require_permission` / RLS GUCs unchanged after decode
- [x] Logout clears cookies + blacklist/revoke

### Provider hygiene
- [x] Minimal OIDC scopes; IdP refresh encrypted at rest when stored
- [x] OAuth tests mocked with `respx` (no live IdP in CI)

### FE / product
- [x] Supabase removed; `credentials: "include"` + CSRF header
- [x] Auth UX: email/password + Google + LinkedIn; session via `/auth/me`
- [x] OpenAPI / ARCHITECTURE / RBAC / SELF-HOSTED updated

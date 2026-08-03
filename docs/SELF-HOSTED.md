# HireRank — Self-hosted (Core)

This repository is the **Core** product: one company per deployment, Open Source friendly, zero-ops defaults.

## What you get out of the box

- Full ATS domain API (auth, users, vacancies, candidates — as shipped)
- PostgreSQL with RLS bound to a single `TENANT_ID`
- JWT access + refresh with optional Redis-backed token store
- Default **in-memory** token store (`TOKEN_STORE=memory`) — no Redis required for auth sessions

## Recommended defaults (single replica)

| Concern | Core default | When to switch |
|---------|--------------|----------------|
| Auth sessions (`TOKEN_STORE`) | `memory` | `redis` if you run **>1** FastAPI replica behind a load balancer |
| Background jobs | FastAPI `BackgroundTasks` / in-process | Celery when jobs must survive restarts or run on workers |
| File storage | Local / volume | S3-compatible object storage for HA and shared uploads |
| Database | Single PostgreSQL | Same DB; scale app replicas only after Redis for tokens |

**Rule of thumb:** one company, one Compose stack, one backend replica → keep `TOKEN_STORE=memory`. Multiple backend pods sharing one company → set `TOKEN_STORE=redis` and point `REDIS_*` at your Redis.

## Auth token store

Both backends implement the same repository contract (`TokenStore` in `backend/app/core/token_store.py`):

| | Memory | Redis |
|-|--------|-------|
| Scaling | Single FastAPI process only | Shared across replicas |
| Survive restart | No (users re-login) | Yes (TTL keys) |
| Ops | Zero | Needs Redis |
| TTL cleanup | Lazy purge in process | Redis `EXPIRE` |
| Tenant keys | Composite `tenant_id:jti` in memory | `tenant:{id}:refresh\|grace\|blacklist:{jti}` |

Switch via `.env`:

```bash
TOKEN_STORE=memory   # Core default
# TOKEN_STORE=redis
# REDIS_HOST=redis
# REDIS_PASSWORD=...
```

Keys always include `tenant_id` so the same code is safe when the deployment later becomes multi-tenant SaaS (bulk revoke: `revoke_tenant(tenant_id)` → delete `tenant:{id}:*`).

## Hidden multi-tenancy

Core still stores `tenant_id` on rows and in JWT claims. The instance is pinned to `TENANT_ID` from the environment. Clients never pick a tenant; register/login always bind to that singleton. See [RBAC.md](RBAC.md).

## Enterprise / SaaS (same Core, different config)

| Edition | Who runs it | Typical config |
|---------|-------------|----------------|
| **Core** (this repo) | Self-host SMB / developers | `TOKEN_STORE=memory`, single replica |
| **Enterprise** (self-host at scale) | Bank / corp Kubernetes | `TOKEN_STORE=redis`, N replicas, corporate Redis; sell-on: SSO/SAML, audit |
| **SaaS** (your cloud) | HireRank cloud | Always `redis`, multi-tenant keys, hard isolation |

Product comparison: [README.md](../README.md#core-enterprise--saas).

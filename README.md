# HireRank

**HireRank** is an ATS for HR teams. The MVP provides vacancy CRUD, HTML
resume intake, candidate-to-vacancy attachment, and a manual candidate
pipeline. LLM recommendations are post-MVP.
**North star:** [docs/use-cases/](docs/use-cases/) + strict privacy and
personal-data requirements in [docs/laws/](docs/laws/).

```text
Vacancy → HTML resume form → candidate attached to vacancy → HR status update
```

> The MVP does not require an LLM, MCP, n8n, Telegram, or WhatsApp. Post-MVP,
> an HR-defined prompt may produce explainable recommendations that HR confirms
> before the candidate status changes ([UC-08](docs/use-cases/UC-08-automation-hitl-loop.md)).

| Plane | Role |
|-------|------|
| **HireRank** | Domain ATS, storage, and administration |
| **ATS MVP** | Vacancies, resumes, candidates, statuses, and access control |
| **Post-MVP** | Prompt-based LLM recommendations confirmed by HR |

## Core, Enterprise & SaaS

This repository is **Core** (Open Source self-host). Enterprise and SaaS reuse the same auth abstractions and swap infrastructure via config — not forks.

| | **Core** (this repo) | **Enterprise** (self-host at scale) | **SaaS** (your cloud) |
|--|----------------------|-------------------------------------|------------------------|
| Who | SMB, developers, one company | Large corp / bank in own K8s | Many companies on HireRank cloud |
| Tenancy | Hidden: one `TENANT_ID` per instance | Same Core schema; scale replicas | True multi-tenant; keys & RLS per company |
| Auth sessions | `TOKEN_STORE=memory` (default) | `TOKEN_STORE=redis` + corporate Redis | Always Redis, tenant-prefixed keys |
| When memory is OK | Single FastAPI replica | Never if N>1 replicas | Never |
| Background work | In-process / `BackgroundTasks` | Celery (or equivalent workers) | Celery / managed queues |
| File storage | Local volume | Shared FS or S3 | S3 (or compatible) |
| Extra product | — | SSO/SAML, audit (commercial) | Billing, provisioning, lockout |

**Auth sessions:** one company + one backend process → memory is fine. Several FastAPI copies behind a balancer → Redis, or refresh/logout desync. SaaS always Redis with keys like `tenant:{tenant_id}:refresh:{jti}` so one company can be locked out without touching others.

See [RBAC.md](docs/RBAC.md) for access and session behavior.

## Docs

| Doc | Purpose |
|-----|---------|
| **[use-cases/](docs/use-cases/)** | **Behavioral Source of Truth** (MVP north star) |
| **[ATS_COMPLIANCE_RK.md](docs/laws/ATS_COMPLIANCE_RK.md)** | **RK compliance — strict** |
| **[GDPR.md](docs/laws/GDPR.md)** | **EU / West privacy — strict** |
| [ROADMAP.md](docs/ROADMAP.md) | Delivery phases and current focus |
| [RBAC.md](docs/RBAC.md) | Roles, JWT, token store |
| [openapi/](docs/openapi/) | REST API contract |

## Stack

| Area | Tech |
|------|------|
| HireRank | Next.js, FastAPI, PostgreSQL, Redis (optional for Core auth), S3 |
| Edge / ops | Traefik, Cloudflare, Compose |

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

Core auth defaults to `TOKEN_STORE=memory`. Set `TOKEN_STORE=redis` when you scale backend replicas.

## MVP

Phase 1: working ATS without LLM. Phase 2: LLM recommendations for HR.
See [ROADMAP.md](docs/ROADMAP.md).

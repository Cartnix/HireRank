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
| **HireRank** | Domain ATS + storage + Admin |
| **ATS MVP** | Vacancies, resumes, candidates, statuses, and access control |
| **Future LLM** | Prompt-based analysis and HR-confirmed recommendations |
| **Future delivery** | Web first; Telegram or WhatsApp only after the core workflow |

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

See [SELF-HOSTED.md](docs/SELF-HOSTED.md) and [RBAC.md](docs/RBAC.md).

## Docs

| Doc | Purpose |
|-----|---------|
| **[use-cases/](docs/use-cases/)** | **Behavioral Source of Truth** (MVP north star) |
| **[ATS_COMPLIANCE_RK.md](docs/ATS_COMPLIANCE_RK.md)** | **RK compliance — strict** |
| **[GDPR.md](docs/GDPR.md)** | **EU / West privacy — strict** |
| [PASSPORT.md](docs/PASSPORT.md) | Product vision & moat |
| [PRODUCT.md](docs/PRODUCT.md) | UVP, JTBD, anti-patterns |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | HireRank + Automation + MCP + n8n planes |
| [SELF-HOSTED.md](docs/SELF-HOSTED.md) | Core deploy defaults & token store |
| [RBAC.md](docs/RBAC.md) | Roles, JWT, token store |
| [AUTOMATION.md](docs/AUTOMATION.md) | Implements UC-08 (detail) |
| [MEMORY.md](docs/MEMORY.md) | Option-choice history + run memory |
| [COMPLIANCE_AUDIT_ISSUE_33.md](docs/COMPLIANCE_AUDIT_ISSUE_33.md) | GDPR + RK ATS compliance audit with must-fix and MVP waiver statuses |
| [SOT_COMPLIANCE_AUDIT_ISSUE_34.md](docs/SOT_COMPLIANCE_AUDIT_ISSUE_34.md) | UC-to-OpenAPI-to-backend traceability audit for issue #34 |
| [ROADMAP.md](docs/ROADMAP.md) | Delivery phases |
| [FEAUTERS.md](docs/FEAUTERS.md) | Feature catalog (must match use-cases) |
| [openapi/](docs/openapi/) | REST API contract |

## Stack

| Area | Tech |
|------|------|
| HireRank | Next.js, FastAPI, PostgreSQL, Redis (optional for Core auth), S3, Celery |
| Automation | Ollama + event worker / agent run orchestration |
| Execution | FastMCP |
| Delivery | n8n (Telegram, email, webhooks) |
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

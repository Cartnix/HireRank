# HireRank

**HireRank** is an on-premise ATS with **AIDE** (AI Decision Engine) — the organization’s nervous hiring system, not a resume calculator.

```text
HireRank intake → AIDE (scenarios) → Telegram HITL → FastMCP (`tenant_id`) → Precedent Memory
```

> AIDE only **suggests**. A human picks a scenario in Telegram; MCP executes that choice and writes the Outcome. AI never auto-hires or auto-rejects.

| Plane | Role |
|-------|------|
| **HireRank** | Domain ATS + storage + Admin |
| **AIDE** | Vacancies + precedents → 2–3 scenarios ([AIDE.md](docs/AIDE.md)) |
| **FastMCP** | Selected action only, under `tenant_id` |
| **n8n** | Telegram / email delivery (not the decision engine) |

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
| [PASSPORT.md](docs/PASSPORT.md) | Product vision & goals |
| [PRODUCT.md](docs/PRODUCT.md) | UVP, JTBD, anti-patterns |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | HireRank + AIDE + MCP + n8n planes |
| [SELF-HOSTED.md](docs/SELF-HOSTED.md) | Core deploy defaults & token store |
| [RBAC.md](docs/RBAC.md) | Roles, JWT, token store |
| [AIDE.md](docs/AIDE.md) | Decision engine lifecycle + strict gate |
| [ROADMAP.md](docs/ROADMAP.md) | Delivery phases |
| [FEAUTERS.md](docs/FEAUTERS.md) | Feature catalog |
| [use-cases/](docs/use-cases/) | Behavioral specs |
| [openapi/](docs/openapi/) | REST API contract |
| [GDPR.md](docs/GDPR.md) | Privacy & sovereignty |

## Stack

| Area | Tech |
|------|------|
| HireRank | Next.js, FastAPI, PostgreSQL, Redis (optional for Core auth), S3, Celery |
| AIDE | Ollama + scenario orchestration |
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

Phase 1: human ATS loop (tenant pool, vacancies, assignment). Phase 2: AIDE + Telegram HITL + MCP + Precedent Memory. See [ROADMAP.md](docs/ROADMAP.md).

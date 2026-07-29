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

## Docs

| Doc | Purpose |
|-----|---------|
| [PASSPORT.md](docs/PASSPORT.md) | Product vision & goals |
| [PRODUCT.md](docs/PRODUCT.md) | UVP, JTBD, anti-patterns |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | HireRank + AIDE + MCP + n8n planes |
| [AIDE.md](docs/AIDE.md) | Decision engine lifecycle + strict gate |
| [ROADMAP.md](docs/ROADMAP.md) | Delivery phases |
| [FEATURESmd](docs/FEATURESmd) | Feature catalog |
| [use-cases/](docs/use-cases/) | Behavioral specs |
| [openapi/](docs/openapi/) | REST API contract |
| [GDPR.md](docs/GDPR.md) | Privacy & sovereignty |

## Stack

| Area | Tech |
|------|------|
| HireRank | Next.js, FastAPI, PostgreSQL, Redis, S3, Celery |
| AIDE | Ollama + scenario orchestration |
| Execution | FastMCP |
| Delivery | n8n (Telegram, email, webhooks) |
| Edge / ops | Traefik, Cloudflare, Compose |

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

## MVP

Phase 1: human ATS loop (tenant pool, vacancies, assignment). Phase 2: AIDE + Telegram HITL + MCP + Precedent Memory. See [ROADMAP.md](docs/ROADMAP.md).

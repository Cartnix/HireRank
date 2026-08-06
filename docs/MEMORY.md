# HireRank Memory

**Behavioral SoT for when Memory is written/read in the Automation loop:** [use-cases/UC-08-automation-hitl-loop.md](use-cases/UC-08-automation-hitl-loop.md).
**Compliance (strict):** [ATS_COMPLIANCE_RK.md](ATS_COMPLIANCE_RK.md) (RK — primary), [GDPR.md](GDPR.md) (EU / West).
Planes: [ARCHITECTURE.md](ARCHITECTURE.md). Automation detail: [AUTOMATION.md](AUTOMATION.md) (implements UC-08).

Formerly split as *Precedent / Case / Outcome Memory* — one name: **Memory** (this file).

## What it is

**Memory** is the tenant’s durable record that powers bureaucracy Automation: documented here as [`MEMORY.md`](MEMORY.md). Runtime storage shape (tables, files, retrieval) is decided later.

It holds at least:

1. **Decision history (Outcome)** — after a human picks a HITL option: which option, which MCP tool ran, rationale/comment, ids. **Outcome → Memory** (key write after HITL). This is the history of Automation option choices.
2. **Other run memory** — inputs summary, proposed options, failures, notes that should survive the ephemeral worker. Schema TBD.

Together with events + HITL + MCP, Memory is part of the product **moat** (see [use-cases/README.md](use-cases/README.md)).

Not this doc: JWT `TOKEN_STORE=memory` — see [RBAC.md](RBAC.md) / [SELF-HOSTED.md](SELF-HOSTED.md).

## Outcome vs Memory

| Term | Meaning |
|------|---------|
| **Outcome** | One resolved HITL choice (option → MCP). Lives **in Memory**. |
| **Memory** | Store / asset: option-choice history + optional other run memory. Canon: this file. |

## Rules (MVP)

- Scoped by `tenant_id`; never cross-tenant.
- Written after human pick + MCP success (UC-08); no Outcomes without HITL.
- Readable as context for later Automation runs (including future event types).
- Export / erasure: [GDPR.md](GDPR.md).

## Status

Stub. Storage and smart recall — TBD. Must not contradict UC-08.

## See also

- [use-cases/README.md](use-cases/README.md) — SoT index + moat
- [AUTOMATION.md](AUTOMATION.md) — event → options → HITL → MCP → Memory
- OpenAPI: `/automations/outcomes`, `/automations/precedents` (API names may lag; product name is Memory)

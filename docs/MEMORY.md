# HireRank Memory

Canon for tenant **Memory**: history of Automation runs and HITL decisions. Planes: [ARCHITECTURE.md](ARCHITECTURE.md). Behavior: [use-cases/UC-08-automation-hitl-loop.md](use-cases/UC-08-automation-hitl-loop.md). Automation: [AUTOMATION.md](AUTOMATION.md).

Formerly split in docs as *Precedent Memory*, *Case Memory*, *Outcome Memory* — one name now: **Memory** (this file).

## What it is

**Memory** is the tenant’s durable record of Automation. It is documented here as [`MEMORY.md`](MEMORY.md); runtime storage shape (tables, files, retrieval) is decided later.

It holds at least:

1. **Decision history (Outcome)** — after a human picks a HITL option: which option, which MCP tool ran, rationale/comment, `tenant_id` / candidate / package ids. **Outcome → Memory** (this is the key write after HITL).
2. **Other run memory** — context from Automation agent runs that should survive the ephemeral worker (inputs summary, proposed options, failures, notes). Exact schema TBD.

Not this doc: JWT `TOKEN_STORE=memory` (in-process auth sessions) — see [RBAC.md](RBAC.md) / [SELF-HOSTED.md](SELF-HOSTED.md).

## Outcome vs Memory

| Term | Meaning |
|------|---------|
| **Outcome** | One resolved HITL choice (option selected → MCP executed). Lives **in Memory**. |
| **Memory** | The store / asset: decision history + optional other run memory. Canon: this file. |

When docs say “write Outcome”, they mean **append that decision into Memory** ([MEMORY.md](MEMORY.md)).

## Rules (MVP)

- Scoped by `tenant_id`; never cross-tenant.
- Written after human pick + MCP success (UC-08); Automation must not invent Outcomes without HITL.
- Readable as context for later Automation runs (how “smart” retrieval works — later).
- Export / erasure follow [GDPR.md](GDPR.md) as a tenant asset.

## Status

Stub. Storage format, indexing, and “smart” recall across runs — **TBD**. Product language in passport/architecture already points here.

## See also

- [AUTOMATION.md](AUTOMATION.md) — event → options → HITL → MCP → Memory
- [FEAUTERS.md](FEAUTERS.md) — F-020 / F-021
- OpenAPI: `/automations/outcomes`, `/automations/precedents` (API names may lag; product name is Memory)

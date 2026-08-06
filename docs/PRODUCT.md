# HireRank — Product

Vision: [PASSPORT.md](PASSPORT.md). **Behavioral Source of Truth:** [use-cases/](use-cases/) (Automation HITL: [UC-08](use-cases/UC-08-automation-hitl-loop.md)).
**Compliance (strict):** [ATS_COMPLIANCE_RK.md](ATS_COMPLIANCE_RK.md) (RK — primary), [GDPR.md](GDPR.md) (EU / West).

## What it is

**HireRank** (HIRERANK) is an on-premise ATS with **HireRank Automation**: AI Automation **events** with **HITL**, executed via **MCP tools**, with **[Memory](MEMORY.md)** storing option-choice history — for hiring **bureaucracy**, not a resume calculator.

MVP: `resume.uploaded` → options → Telegram HITL → FastMCP under `tenant_id` → Outcome into Memory. Further events reuse the same loop ([UC-08](use-cases/UC-08-automation-hitl-loop.md)).

## Job-to-be-done

| Stakeholder | Job |
|-------------|-----|
| TA / HR | Absorb flood intake into a tenant pool without losing candidates in mail/Excel |
| Hiring manager | Get 2–3 concrete bureaucracy next-steps in Telegram and pick one with a button |
| CHRO / CISO | Keep personal data and process logic inside the perimeter; prove meaningful human oversight |
| Organization | Preserve hiring bureaucracy practice in [Memory](MEMORY.md) as a `tenant_id`-scoped asset |

## Unique value (five theses)

1. **Data never leaves your perimeter** — on-prem; personal data and Memory stay in the loop.
2. **Automation co-pilot for bureaucracy, not black box** — MCP options; human button; MCP writes only the selection.
3. **[Memory](MEMORY.md) = org asset** — Outcomes (option choices) and run memory survive turnover.
4. **Built for the flood, not seats** — intake events + Telegram HITL.
5. **Selective MCP execution** — only the human-chosen option; event set is extensible.

## Moat (what compounds)

**Moat:** AI Automation events with HITL via MCP tools, with [MEMORY.md](MEMORY.md) history of option choices — for bureaucracy; extensible beyond `resume.uploaded`.

- Events → HITL → MCP → Memory (per tenant)
- HITL Telegram corpus (human-labeled buttons)
- On-prem custody
- Process switching cost (nervous system, not CSV export)

What is **not** moat: pretty chat UI, generic scoring criteria, “we also do Telegram.”

## Anti-patterns (do not position as the product)

| Pattern | Why rejected |
|---------|----------------|
| AI scoring as hero (`autoScoreOnApply`, silent rank-graves) | Soft-reject without audit; not org bureaucracy logic |
| Chatbot as pipeline owner | Conversation ≠ process |
| Black-box auto hire/reject | Violates trust, GDPR Art. 22, EU AI Act posture |
| Keyword stuffing matchers | Evidence + Memory, not denser score |
| Web-only weak HITL | Primary surface is Telegram/email agent |

**Strict rule:** [UC-08](use-cases/UC-08-automation-hitl-loop.md) DoD — Memory path, ≥2 HITL options, human before MCP, Outcome in Memory, no silent score.

## See also

- [use-cases/](use-cases/) — **behavioral SoT** (MVP north star)
- [ATS_COMPLIANCE_RK.md](ATS_COMPLIANCE_RK.md) — RK compliance (strict)
- [GDPR.md](GDPR.md) — EU / West privacy (strict)
- [ARCHITECTURE.md](ARCHITECTURE.md) — planes
- [AUTOMATION.md](AUTOMATION.md) — implements UC-08
- [MEMORY.md](MEMORY.md) — option-choice history
- [ROADMAP.md](ROADMAP.md) — delivery

# HireRank — Product

Canonical vision: [PASSPORT.md](PASSPORT.md).

## What it is

**HireRank** (HIRERANK) is an on-premise ATS with **HireRank Automation** (*ATS AI-native Automation*): the organization's nervous hiring system, not a resume calculator.

On `resume.uploaded`, Automation runs a short-lived agent, offers 2–3 MCP-backed action options in Telegram (Human-in-the-Loop captcha), executes only the selected action through MCP under `tenant_id`, and accumulates **[Memory](MEMORY.md)** — Outcomes (option-choice history) and other run memory — a digital asset that does not leave with HR turnover.

## Job-to-be-done

| Stakeholder | Job |
|-------------|-----|
| TA / HR | Absorb flood intake into a tenant pool without losing candidates in mail/Excel |
| Hiring manager | Get 2–3 concrete next-step options in Telegram and pick one with a button |
| CHRO / CISO | Keep personal data and decision logic inside the perimeter; prove meaningful human oversight |
| Organization | Preserve hiring practice as a `tenant_id`-scoped asset in [Memory](MEMORY.md) |

## Unique value (five theses)

1. **Data never leaves your perimeter** — on-prem; personal data and [Memory](MEMORY.md) stay in the loop.
2. **Automation co-pilot, not black box** — prepares options; a human presses a button; MCP writes only the selected action.
3. **[Memory](MEMORY.md) = org asset** — Outcomes and run memory survive turnover.
4. **Built for the flood, not seats** — intake + Telegram; pricing not per-seat theater.
5. **Selective MCP execution** — only the human-chosen option runs; AI never auto-hires or auto-rejects.

## Moat (what compounds)

- [Memory](MEMORY.md) per tenant (decision history + other run memory)
- Tenant decision graph (context → proposed actions → chosen outcome)
- HITL Telegram corpus (human-labeled buttons)
- On-prem custody
- Process switching cost (nervous system, not CSV export)

What is **not** moat: pretty chat UI, generic scoring criteria, “we also do Telegram.”

## Anti-patterns (do not position as the product)

| Pattern | Why rejected |
|---------|----------------|
| AI scoring as hero (`autoScoreOnApply`, silent rank-graves) | Soft-reject without audit; not org logic |
| Chatbot as pipeline owner | Conversation ≠ process |
| Black-box auto hire/reject | Violates trust, GDPR Art. 22, EU AI Act posture |
| Keyword stuffing matchers | Evidence + [Memory](MEMORY.md), not denser score |
| Web-only weak HITL | Primary surface is Telegram/email agent |

**Strict rule:** “we have AI” is false without (1) [Memory](MEMORY.md) context or a path to it, (2) Telegram HITL with ≥2 options, (3) execution only after a human, (4) Outcome recorded in [Memory](MEMORY.md).

## See also

- [ARCHITECTURE.md](ARCHITECTURE.md) — planes
- [AUTOMATION.md](AUTOMATION.md) — Automation lifecycle
- [MEMORY.md](MEMORY.md) — Outcomes + run memory
- [ROADMAP.md](ROADMAP.md) — delivery

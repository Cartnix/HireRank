# HireRank — Product

Canonical vision: [PASSPORT.md](PASSPORT.md).

## What it is

**HireRank** (HIRERANK) is an on-premise ATS with **AIDE** (AI Decision Engine): the organization's nervous hiring system, not a resume calculator.

AIDE orchestrates intake, offers 2–3 action scenarios in Telegram (Human-in-the-Loop captcha), executes only the selected action through MCP under `tenant_id`, and accumulates **Outcome / Precedent / Case Memory** — a digital asset that does not leave with HR turnover.

## Job-to-be-done

| Stakeholder | Job |
|-------------|-----|
| TA / HR | Absorb flood intake into a tenant pool without losing candidates in mail/Excel |
| Hiring manager | Get 2–3 concrete next-step scenarios in Telegram and pick one with a button |
| CHRO / CISO | Keep personal data and decision logic inside the perimeter; prove meaningful human oversight |
| Organization | Preserve hiring practice as a `tenant_id`-scoped asset |

## Unique value (five theses)

1. **Data never leaves your perimeter** — on-prem; personal data and precedents stay in the loop.
2. **AIDE co-pilot, not black box** — prepares options; a human presses a button; MCP writes only the selected action.
3. **Outcome Memory = org asset** — best-employee practice survives turnover.
4. **Built for the flood, not seats** — intake + Telegram; pricing not per-seat theater.
5. **Selective MCP execution** — only the human-chosen scenario runs; AI never auto-hires or auto-rejects.

## Moat (what compounds)

- Outcome / Precedent Memory per tenant
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
| Keyword stuffing matchers | Evidence + precedents, not denser score |
| Web-only weak HITL | Primary surface is Telegram/email agent |

**Strict rule:** “we have AI” is false without (1) precedent context or a path to it, (2) Telegram HITL with ≥2 scenarios, (3) execution only after a human, (4) Outcome record.

## See also

- [ARCHITECTURE.md](ARCHITECTURE.md) — planes
- [AIDE.md](AIDE.md) — engine lifecycle
- [ROADMAP.md](ROADMAP.md) — delivery

# UC-08 Automation HITL loop

Purpose:
Automate hiring **bureaucracy** via event-driven AI Automation with Human-in-the-Loop — not a decision engine and not a score calculator. A domain event starts a short-lived agent run; the LLM proposes MCP-backed process steps; a human picks one; FastMCP executes only that tool; the choice is stored in [Memory](../MEMORY.md).

Actor:
Automation worker, Manager (HITL), FastMCP, n8n (delivery)

Preconditions:
- A matching domain event is published (MVP: `resume.uploaded` from UC-01 or UC-02)
- Tenant resolved as `tenant_id`
- Automation definition for this trigger loaded (prompt + model + allowed MCP tools + tenant scope)
- Open vacancies and/or [Memory](../MEMORY.md) readable for the tenant
- Telegram and SMTP delivery available via n8n

Flow (MVP: `resume.uploaded`):
1. Broker delivers the event to the Automation worker (short-lived agent run — not a permanent decision daemon).
2. Worker loads the Automation definition for the trigger.
3. Worker builds context: resume JSON, open vacancies, tenant [Memory](../MEMORY.md) (prior option-choice history), event payload, and allowed MCP tool schemas.
4. Local self-hosted LLM returns **2–3** action options; each option names an MCP tool, arguments, and a short rationale. Typical bureaucracy steps: invite to interview, assign / propose a manager, administrative paperwork, archive/forward.
5. Decision package is stored as pending HITL; candidate may move to `Pending HITL`.
6. n8n / SMTP notifies managers that work entered the pool (awareness; not the decision).
7. n8n delivers Telegram message with option buttons (HITL captcha): candidate, resume summary, options A/B/C.
8. Manager picks exactly one button.
9. FastMCP executes **only** the selected MCP tool under `tenant_id`.
10. DB is updated; **Outcome** (history of the option choice) is written to [Memory](../MEMORY.md); the agent run ends.
11. Notifications reflect the resolved decision.

Notes:
- MVP trigger is `resume.uploaded`. The same event → HITL → MCP → Memory contract applies to **future domain events** (e.g. `vacancy.*`, `assignment.*`) without changing this use-case’s bans or DoD shape — add triggers via new/extended Automation definitions and, when needed, new use-cases that publish those events.
- This file is the **behavioral Source of Truth** for Automation HITL. [AUTOMATION.md](../AUTOMATION.md) and [MEMORY.md](../MEMORY.md) implement and document it; they must not contradict UC-08.
- **Compliance (strict):** must not violate [ATS_COMPLIANCE_RK.md](../ATS_COMPLIANCE_RK.md) (RK — primary) or [GDPR.md](../GDPR.md) (EU / West). North star stack: [use-cases/README.md](README.md).

Ban:
- Automation must not auto-hire or auto-reject.
- Execution without a human pick is forbidden.
- n8n must not invent or execute domain actions — delivery plane only.

DoD (strict gate — owned by this use-case):
1. [Memory](../MEMORY.md) context present, or explicit path to accumulate option-choice history.
2. Telegram HITL with ≥2 MCP-backed options (bureaucracy / process steps).
3. Execution only after human selection.
4. Outcome recorded in tenant [Memory](../MEMORY.md).
5. No silent ranking/score as the product decision artifact.

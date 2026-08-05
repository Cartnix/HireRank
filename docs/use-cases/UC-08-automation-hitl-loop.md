# UC-08 Automation HITL loop

Actor:
Automation worker, Manager (HITL), FastMCP, n8n (delivery)

Preconditions:
- Event `resume.uploaded` published (UC-01 or UC-02)
- Tenant resolved as `tenant_id`
- Automation definition for this trigger loaded (prompt + model + allowed MCP tools + tenant scope)
- Open vacancies and/or [Memory](../MEMORY.md) readable for the tenant
- Telegram and SMTP delivery available via n8n

Flow:
1. Broker delivers `resume.uploaded` to the Automation worker (short-lived agent run — not a permanent decision daemon).
2. Worker loads the Automation definition for the trigger.
3. Worker builds context: resume JSON, open vacancies, tenant [Memory](../MEMORY.md), event payload, and allowed MCP tool schemas.
4. Local self-hosted LLM returns **2–3** action options; each option names an MCP tool, arguments, and a short rationale (e.g. invite to interview, propose manager assignment, administrative/bureaucracy step).
5. Decision package is stored as pending HITL; candidate may move to `Pending HITL`.
6. n8n / SMTP notifies managers that a new resume entered the pool (awareness; not the decision).
7. n8n delivers Telegram message with option buttons (HITL captcha): candidate, resume summary, options A/B/C.
8. Manager picks exactly one button.
9. FastMCP executes **only** the selected MCP tool under `tenant_id`.
10. DB is updated; **Outcome** (history of the option choice) is written to [Memory](../MEMORY.md); the agent run ends.
11. Notifications reflect the resolved decision.

Ban:
- Automation must not auto-hire or auto-reject.
- Execution without a human pick is forbidden.
- n8n must not invent or execute domain actions — delivery plane only.

DoD (strict gate from PASSPORT / AUTOMATION.md / [MEMORY.md](../MEMORY.md)):
1. [Memory](../MEMORY.md) context present, or explicit path to accumulate it.
2. Telegram HITL with ≥2 MCP-backed options.
3. Execution only after human selection.
4. Outcome recorded in tenant [Memory](../MEMORY.md).
5. No silent ranking/score as the product decision artifact.

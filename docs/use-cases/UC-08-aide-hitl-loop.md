# UC-08 AIDE HITL loop

Actor:
AIDE, Manager (HITL), FastMCP

Preconditions:
- Candidate intake event published (UC-01 or UC-02)
- Tenant resolved as `tenant_id`
- Open vacancies and/or Precedent Memory readable for the tenant
- Telegram delivery available via n8n

Flow:
1. Broker delivers intake event to AIDE.
2. AIDE reads open vacancies and tenant Precedent Memory.
3. AIDE generates **2–3** action scenarios with rationale (local LLM / Ollama).
4. Decision package is stored as pending HITL; candidate may move to `Pending HITL`.
5. n8n delivers Telegram message with scenario buttons (HITL captcha).
6. Manager picks exactly one button.
7. FastMCP executes **only** the selected action under `tenant_id` (e.g. assign, interview, archive/forward).
8. DB is updated; Outcome is written to Precedent Memory.
9. Notifications reflect resolved decision.

Ban:
- AIDE must not auto-hire or auto-reject.
- Execution without a human pick is forbidden.

DoD (strict gate from PASSPORT / AIDE.md):
1. Precedent context present, or explicit path to accumulate it.
2. Telegram HITL with ≥2 scenarios.
3. Execution only after human selection.
4. Outcome recorded in tenant Precedent Memory.
5. No silent ranking/score as the product decision artifact.

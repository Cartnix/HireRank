# HireRank use-cases — behavioral Source of Truth

## North star (Source of Truth stack)

HireRank’s **north star** is this stack — obeyed **strictly**, in this order of product focus:

| Priority | Doc | Role |
|----------|-----|------|
| **1 — MVP target** | **[This folder](README.md)** (`use-cases/`) | Behavioral Source of Truth. What we ship for MVP must hit these use-cases first. |
| **2 — Law (RK first)** | **[ATS_COMPLIANCE_RK.md](../ATS_COMPLIANCE_RK.md)** | Republic of Kazakhstan personal-data / ATS compliance (localization, consent, minimization, …). **Non-negotiable.** |
| **3 — Law (EU / West)** | **[GDPR.md](../GDPR.md)** | GDPR / Art. 22 HITL / sovereignty posture for Western and cross-border expectations. **Non-negotiable.** |

If a use-case would violate [ATS_COMPLIANCE_RK.md](../ATS_COMPLIANCE_RK.md) or [GDPR.md](../GDPR.md), **change the use-case** (or the feature) — never ship illegal behavior for MVP convenience.

If [PASSPORT.md](../PASSPORT.md), [FEAUTERS.md](../FEAUTERS.md), [AUTOMATION.md](../AUTOMATION.md), OpenAPI, or any other doc conflicts with a **use-case**, **fix the other doc** — unless the conflict is with RK/GDPR compliance, in which case fix the use-case and the other doc together.

Vision and pitch live in PASSPORT; planes in ARCHITECTURE; API shapes in OpenAPI — they **cite** use-cases and must not invent behavior. They must also stay compliant with ATS_COMPLIANCE_RK + GDPR.

## Moat (product differentiation)

AI Automation **events** with **HITL**, executed via **MCP tools**, with **[MEMORY.md](../MEMORY.md)** storing the history of Automation option choices — for **bureaucracy** (hiring process steps: interview, assign, admin paperwork, …). The same event → HITL → MCP → Memory loop extends to further domain events beyond MVP `resume.uploaded`.

Not moat alone: scoring, chatbot, pretty UI, “we also do Telegram.”

Behavior for that loop: **[UC-08](UC-08-automation-hitl-loop.md)**. Implementation detail (not SoT): [AUTOMATION.md](../AUTOMATION.md). HITL / no auto-disposition also satisfies GDPR Art. 22 posture ([GDPR.md](../GDPR.md)).

## Index

| UC | Purpose |
|----|---------|
| [UC-01](UC-01-candidate-registration.md) | Candidate self-registration + questionnaire → `resume.uploaded` |
| [UC-02](UC-02-hr-candidate-intake.md) | HR creates candidate → `resume.uploaded` |
| [UC-03](UC-03-vacancy-management.md) | Administrator vacancy CRUD |
| [UC-04](UC-04-candidate-assignment.md) | Manual admin assignment (MCP path via UC-08 also valid) |
| [UC-05](UC-05-manager-vacancies-and-assignments.md) | Manager read-only web; HITL decisions in Telegram (UC-08) |
| [UC-06](UC-06-admin-panel-access.md) | Admin panel access |
| [UC-07](UC-07-enterprise-isolation.md) | Tenant isolation including Memory |
| [UC-08](UC-08-automation-hitl-loop.md) | Automation HITL loop: event → options → human → MCP → Memory |

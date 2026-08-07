# HireRank — Roadmap

Aligned with [PASSPORT.md](PASSPORT.md). **Behavioral SoT:** [use-cases/](use-cases/). **Compliance (strict):** [ATS_COMPLIANCE_RK.md](ATS_COMPLIANCE_RK.md) (RK — primary), [GDPR.md](GDPR.md). No Decision Maps phase.

## Phase 1 — Tenant ATS base

Human ATS loop inside the perimeter:

- Auth, RBAC (administrator, hr, manager, recruiter, candidate)
- Candidate registration + JSON questionnaire → pool `Unassigned`
- Vacancy CRUD, assignment, statuses, notifications, dashboards
- Strict `tenant_id` isolation
- Local compose bring-up (FastAPI, Next.js, PostgreSQL, Redis, S3)

Acceptance: flood intake works without Automation HITL; managers see assigned candidates in-app. UC-01…UC-07 as applicable.

## Phase 2 — Automation HITL loop

Full [UC-08](use-cases/UC-08-automation-hitl-loop.md) cycle (bureaucracy Automation moat):

- Event broker on `resume.uploaded` (intake / HR upload); design for extensible events
- Automation: domain payload + vacancies + [Memory](MEMORY.md) + MCP schemas → 2–3 bureaucracy options
- n8n SMTP awareness + Telegram HITL
- FastMCP executes only the selected tool under `tenant_id`
- Outcome (option-choice history) → Memory
- API: packages, HITL accept, outcomes (`/automations/*`)

Acceptance: UC-08 DoD satisfied end-to-end; no auto hire/reject.

## Phase 3 — Corpus and ops hardening

- Richer Memory retrieval; more domain event triggers
- HITL corpus analytics
- Retention / erasure / export of Memory ([GDPR.md](GDPR.md))
- Fail-soft parse flags, multi-channel HITL
- Audit and ops hardening for government / enterprise

## Explicitly out of scope (product positioning)

- Decision Maps / UDP as a separate config product
- Scoring / chatbot as the hero “AI” feature
- Black-box auto-disposition

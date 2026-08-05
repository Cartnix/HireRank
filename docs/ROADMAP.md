# HireRank — Roadmap

Aligned with [PASSPORT.md](PASSPORT.md). No Decision Maps phase.

## Phase 1 — Tenant ATS base

Human ATS loop inside the perimeter:

- Auth, RBAC (administrator, hr, manager, recruiter, candidate)
- Candidate registration + JSON questionnaire → pool `Unassigned`
- Vacancy CRUD, assignment, statuses, notifications, dashboards
- Strict `tenant_id` isolation
- Local compose bring-up (FastAPI, Next.js, PostgreSQL, Redis, S3)

Acceptance: flood intake works without Automation HITL; managers see assigned candidates in-app.

## Phase 2 — Automation HITL loop

Full PASSPORT cycle:

- Event broker on `resume.uploaded` (intake / HR upload)
- Automation: resume JSON + vacancies + [Memory](MEMORY.md) + MCP schemas → 2–3 options (local LLM / Ollama)
- n8n SMTP awareness + Telegram HITL delivery
- FastMCP executes only the selected action under `tenant_id`
- **Outcome** (option-choice history) writeback to [Memory](MEMORY.md); other run memory TBD
- API: packages, HITL accept, outcomes/precedents (`/automations/*`)

Acceptance: strict gate in [AUTOMATION.md](AUTOMATION.md) is satisfied end-to-end; no auto hire/reject.

## Phase 3 — Corpus and ops hardening

- Richer [Memory](MEMORY.md) retrieval and department graphs
- HITL corpus analytics (chosen options, comments)
- Retention / erasure / export of tenant [Memory](MEMORY.md) ([GDPR.md](GDPR.md))
- Fail-soft parse flags, multi-channel HITL (email backup)
- Audit and ops hardening for government / enterprise deployers

## Explicitly out of scope (product positioning)

- Decision Maps / UDP as a separate config product
- Scoring / chatbot as the hero “AI” feature
- Black-box auto-disposition

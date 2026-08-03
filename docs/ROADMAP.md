# HireRank — Roadmap

Aligned with [PASSPORT.md](PASSPORT.md). No Decision Maps phase.

## Phase 1 — Tenant ATS base

Human ATS loop inside the perimeter:

- Auth, RBAC (administrator, hr, manager, recruiter, candidate)
- Candidate registration + JSON questionnaire → pool `Unassigned`
- Vacancy CRUD, assignment, statuses, notifications, dashboards
- Strict `tenant_id` isolation
- Local compose bring-up (FastAPI, Next.js, PostgreSQL, Redis, S3)

Acceptance: flood intake works without AIDE; managers see assigned candidates in-app.

## Phase 2 — AIDE HITL loop

Full PASSPORT cycle:

- Event broker on intake / HR upload
- AIDE: vacancies + Precedent Memory → 2–3 scenarios (Ollama)
- Telegram HITL via n8n delivery
- FastMCP executes only the selected action under `tenant_id`
- Outcome writeback to Precedent Memory
- API: scenarios, HITL accept, outcomes/precedents

Acceptance: strict gate in [AIDE.md](AIDE.md) is satisfied end-to-end; no auto hire/reject.

## Phase 3 — Corpus and ops hardening

- Richer Precedent Memory retrieval and department graphs
- HITL corpus analytics (chosen scenarios, comments)
- Retention / erasure / export of tenant memory ([GDPR.md](GDPR.md))
- Fail-soft parse flags, multi-channel HITL (email backup)
- Audit and ops hardening for government / enterprise deployers

## Explicitly out of scope (product positioning)

- Decision Maps / UDP as a separate config product
- Scoring / chatbot as the hero “AI” feature
- Black-box auto-disposition

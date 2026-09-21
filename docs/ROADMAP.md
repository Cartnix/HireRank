# HireRank - Roadmap

See [PRODUCT.md](PRODUCT.md) for the product definition and [use-cases/](use-cases/)
for the behavioral source of truth. Compliance requirements in
[laws/ATS_COMPLIANCE_RK.md](laws/ATS_COMPLIANCE_RK.md) and [laws/GDPR.md](laws/GDPR.md)
apply to every phase.

## Current focus

**Phase 1, Milestone 4: resume intake and vacancy attachment.**

Recently completed:

- authentication, cookie sessions, and OAuth foundation;
- RBAC and tenant isolation with PostgreSQL RLS;
- vacancy CRUD and candidate CRUD API;
- candidate assignment and dashboard API;
- consent, legal acceptance, and auth audit foundation.

Current work:

- replace JSON-only intake language with an HTML resume form;
- store a resume reference or uploaded file;
- attach a candidate to a selected vacancy;
- expose the candidate pipeline and statuses in the web app.

Not current work: LLM, MCP, n8n, Telegram, WhatsApp, Memory, or a ranking
engine. Those belong after the working ATS MVP.

## Phase 1 - MVP: working ATS without LLM

### Milestone 1 - Foundation

- [x] Local Compose development stack starts.
- [x] FastAPI, Next.js, PostgreSQL, and migrations are wired.
- [x] Authentication and browser session work.
- [x] Consent and legal acceptance are represented.

### Milestone 2 - Access control and isolation

- [x] Roles and permissions are defined.
- [x] Tenant scope is applied to ATS data.
- [x] PostgreSQL RLS is enabled and tested.
- [x] Candidate and HR access rules are documented.

### Milestone 3 - Vacancy and candidate CRUD

- [x] Create, read, update, and delete vacancies.
- [x] Create and read candidate records.
- [x] Store candidate status and vacancy relationships.
- [x] Provide basic dashboard data.

### Milestone 4 - Resume intake and vacancy attachment

- [ ] Build the HTML resume form.
- [ ] Validate and persist structured resume data.
- [ ] Upload or reference the resume file.
- [ ] Attach a resume/candidate to an open vacancy.
- [ ] Show the candidate in the vacancy pipeline.
- [ ] Add manual status changes and audit events.

### Milestone 5 - MVP acceptance

- [ ] Operator can create a vacancy.
- [ ] Candidate or operator can submit a resume through the HTML form.
- [ ] HR can attach the candidate to a vacancy.
- [ ] HR can view and update the candidate status.
- [ ] No LLM or external messaging service is needed for the core flow.

## Phase 2 - Post-MVP LLM recommendations

### Milestone 6 - Evaluation model

- [ ] Define vacancy-specific HR prompt and criteria.
- [ ] Define tenant-scoped candidate evaluation history.
- [ ] Define evidence, rationale, and audit fields.

### Milestone 7 - LLM analysis

- [ ] Analyze an attached resume against a vacancy prompt.
- [ ] Return up to three recommendations, for example `advance`,
  `interview`, or `reject`.
- [ ] Keep the final status change behind explicit HR confirmation.
- [ ] Add privacy, retention, and model-processing controls.

### Milestone 8 - Delivery channels

- [ ] Show recommendations and rationale in the web app.
- [ ] Add Telegram delivery and confirmation.
- [ ] Evaluate WhatsApp integration separately.

## Phase 3 - Scale and operations

### Milestone 9 - Production hardening

- [ ] Resume parsing failure states and manual correction.
- [ ] Retention, erasure, and export workflows.
- [ ] Candidate-data access audit coverage.
- [ ] Operational monitoring and deployment documentation.

## Explicit non-goals

- MCP and event-driven bureaucracy automation as the MVP core.
- n8n as a business-logic or database-mutation layer.
- Fully automatic hire/reject without HR confirmation.
- Separate Decision Maps or UDP product.


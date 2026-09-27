# HireRank — Roadmap

See PRODUCT.md for the product definition and use-cases/ for the behavioral source of truth. Compliance requirements in laws/ATS\_COMPLIANCE\_RK.md and laws/GDPR.md apply to every phase.

This roadmap defines implementation order and acceptance evidence. A completed foundation item does not by itself mean that the end-to-end HR Copilot flow is complete.

## Core product principle

**First build a reliable ATS. Then add HR Copilot intelligence and controlled execution.**

The core flow is:

`candidate intake → ATS pool → vacancy context → analysis → HR review → explicit HR approval → controlled action → audit`

LLM, MCP, messaging, memory and automation are **post-MVP capabilities**. They must not replace the reliable ATS or the explicit HR decision.

## Current focus

**Phase 1 — MVP: reliable ATS candidate pool and vacancy flow.**

### Already present

- [x] Next.js/FastAPI/PostgreSQL development stack and migrations.
- [x] Authentication, browser sessions and OAuth foundation.
- [x] Tenant-scoped ATS database and PostgreSQL RLS.
- [x] RBAC foundation and tenant isolation.
- [x] Vacancy and candidate CRUD.
- [x] Candidate assignment and basic dashboard API.
- [x] Consent, legal acceptance and auth audit foundation.

### Current work

- [ ] End-to-end HTML resume intake.
- [ ] Structured resume data persistence.
- [ ] Resume file/reference storage.
- [ ] Candidate attachment to a vacancy.
- [ ] Candidate pipeline and manual statuses in the web app.
- [ ] End-to-end ATS acceptance flow.

Not current work: LLM, MCP, n8n, Telegram, WhatsApp or Memory.

---

# Phase 1 — MVP: working ATS without LLM

## Milestone 1 — Foundation

- [x] Local Compose development stack starts.
- [x] FastAPI, Next.js, PostgreSQL and migrations are wired.
- [x] Authentication and browser session work.
- [x] Consent and legal acceptance are represented.

## Milestone 2 — Access control and isolation

- [x] Roles and permissions are defined.
- [x] Tenant scope is applied to ATS data.
- [x] PostgreSQL RLS is enabled and tested.
- [ ] Tenant/RBAC tests cover candidate, recruiter, manager, HR and admin access.
- [ ] Candidate and HR access rules are documented.

## Milestone 3 — Vacancy and candidate CRUD

- [x] Create, read, update and delete vacancies.
- [x] Create and read candidate records.
- [x] Store candidate status and vacancy relationships.
- [x] Provide basic dashboard data.

## Milestone 4 — Resume intake and vacancy attachment

- [ ] Build the HTML resume form for candidate/recruiter intake.
- [ ] Verify consent before processing candidate data.
- [ ] Validate and persist structured resume data.
- [ ] Upload or reference the protected resume file.
- [ ] Create an unprocessed candidate without silently assigning a preferred vacancy.
- [ ] Attach a candidate to an open vacancy.
- [ ] Show the candidate in the vacancy pipeline.
- [ ] Add manual status changes.
- [ ] Add audit events for submission, access and status changes.
- [ ] Provide tenant-scoped intake notification where required.

## Milestone 5 — MVP acceptance

- [ ] recruiter can create a vacancy.
- [ ] Candidate or recruiter can submit a resume through the HTML form.
- [ ] Candidate appears in the HR tenant pool.
- [ ] HR can attach the candidate to a vacancy.
- [ ] HR can view and update candidate status.
- [ ] Candidate can see only their own profile/data.
- [ ] Unauthorized and cross-tenant reads fail.
- [ ] The complete ATS flow works without an LLM or external messaging service.

**Acceptance:** one test resume can go from intake → ATS pool → vacancy → HR status change, with tenant isolation and audit coverage.

---

# Phase 2 — HR Copilot: LLM recommendations

## Milestone 6 — Evaluation model

- [ ] Define vacancy-specific HR prompt and evaluation criteria.
- [ ] Define green/red flags and allowed recommendations/actions.
- [ ] Define tenant-scoped candidate evaluation history.
- [ ] Define evidence, rationale and audit fields.
- [ ] Version prompts and criteria so changes affect subsequent analyses.

## Milestone 7 — LLM analysis

- [ ] New-resume event triggers a tenant-scoped analysis job.
- [ ] Analysis uses the relevant vacancy context.
- [ ] Add an idempotency key to prevent duplicate processing.
- [ ] Process untrusted resume data only through an approved/in-perimeter model path.
- [ ] Validate structured model output.
- [ ] Return up to three recommendations, for example `advance`, `interview` or `reject`.
- [ ] Every recommendation contains rationale/evidence and evaluation context.
- [ ] Log model, prompt version and failures.
- [ ] Model outage or missing vacancy leaves the candidate available for manual HR review.
- [ ] HR sees recommendations as drafts in the web dashboard.

**Important:** an LLM recommendation does **not** change candidate status, send communication or execute an external action.

**Acceptance:** a golden resume/vacancy input produces a reviewable structured draft; no model output can directly mutate the hiring state.

## Milestone 8 — HR approval and controlled execution

- [ ] HR selects an allowed recommendation or manual action.
- [ ] HR explicitly confirms the action in the ATS.
- [ ] Server rechecks HR identity, role, tenant, current candidate state and approval.
- [ ] Only after successful server-side validation can a narrowly scoped MCP/tool adapter execute.
- [ ] Persist proposal → HR decision → tool result/outcome.
- [ ] Persist candidate status and full audit trail.
- [ ] Handle failures and retries without double execution.
- [ ] Manager cannot approve or override the HR decision.
- [ ] Candidate communication follows the approved business path.

**Acceptance:** positive E2E trace:

`intake → analysis → recommendation → HR approval → execution → audit`

plus negative tests for:

- no HR approval;
- manager attempting approval;
- cross-tenant candidate ID;
- stale approval;
- failed tool call;
- duplicate/retried tool call.

The manual HR path must continue working when the model is unavailable.

---

# Phase 3 — Delivery channels and optional memory

## Milestone 9 — Delivery channels

- [ ] Show recommendations and rationale in the web app.
- [ ] Add Telegram delivery and confirmation.
- [ ] Evaluate WhatsApp separately.
- [ ] Keep hiring decisions inside the approved HR flow.
- [ ] External messaging cannot independently approve or reject candidates.

## Milestone 10 — Confirmed memory

- [ ] HR can opt in/out of Markdown memory.
- [ ] HR can decline, manually write or request a draft explanation.
- [ ] Generated explanations require HR verification before storage.
- [ ] Memory records include evidence, options, HR choice and verified reason.
- [ ] Memory is tenant-scoped and auditable.
- [ ] Memory respects retention and erasure requirements.
- [ ] Disabled memory is absent from AI input.
- [ ] A generated or declined reason never silently enters memory.

**Acceptance:** memory is an explicit, verified HR artifact—not an uncontrolled side effect of model execution.

---

# Phase 4 — Production hardening and scale

## Milestone 11 — Production operations

- [ ] Resume parsing failure states and manual correction.
- [ ] Retention, erasure and export workflows.
- [ ] Complete candidate-data access audit coverage.
- [ ] Monitoring and operational alerting.
- [ ] Resumable error/retry handling.
- [ ] Production deployment documentation.
- [ ] Security and tenant-isolation regression tests.

## Later options

After the core web flow is proven:

- Telegram/WhatsApp expansion.
- Broader analytics.
- External job boards.
- Advanced resume parsing.
- Additional MCP adapters.
- Additional automation integrations.

---

# Explicit non-goals

- MCP as the core of the MVP.
- n8n as a business-logic or database-mutation layer.
- LLM before the working ATS exists.
- Fully automatic hire/reject.
- Automatic candidate communication without HR confirmation.
- Manager-controlled hiring decisions outside the HR approval flow.
- Separate Decision Maps or UDP product.
- Chatbot or messaging channel owning the hiring decision.

## Delivery order

**ATS foundation → reliable candidate pool → vacancy pipeline → LLM recommendations → explicit HR approval → controlled execution → delivery/memory → production scale.**
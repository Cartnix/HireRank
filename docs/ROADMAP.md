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

### MVP integration audit remediation (2026-09-30)

Tracking: [integration audit](MVP_INTEGRATION_AUDIT.md), [changelog](../changelog.md).
This connects the existing ATS implementation to the existing web design; it does
not declare resume storage, pipeline mutations or full MVP acceptance complete.

- [x] Replace browser-local vacancy/candidate/career data with tenant-scoped API reads.
- [x] Wire vacancy CRUD, HR candidate intake, questionnaire updates and manual assignment.
- [x] Wire candidate own HTML questionnaire and vacancy application.
- [x] Read role-shaped dashboard aggregates and shared database-derived overview analytics.
- [x] Align OpenAPI DTOs, canonical paths, pagination and presentation defaults.
- [x] Expose server permissions for UI affordances; retain server-side enforcement.
- [x] Restore HR manual assignment permission through an Alembic migration (UC-04).
- [x] Reject manual assignment to draft/closed vacancies on the server.
- [x] Open unassigned candidate profiles without requiring a vacancy.
- [x] Preserve existing UI blocks and label demo fields/features individually.
- [x] Add regression checks for API wiring, pagination, RBAC and tenant isolation.
- [ ] Protected resume upload/download: replace presign.local stub and verify real bytes.
- [ ] Validate structured resume and legally sufficient candidate processing consent on the server.
- [ ] Add tenant-scoped manual candidate/application status and stage mutations with audit.
- [ ] Expose application stage/state for pipeline rendering; distinguish application from HR assignment.
- [ ] Add candidate-history/notes and notification list/read APIs before replacing their demo blocks.
- [x] Owner/admin user CRUD, protected owner role and opt-in administration UI; verify real sessions and server authorization.
- [ ] Complete remaining admin UI coverage and OAuth candidate-profile provisioning checks.
- [ ] Persist the currently demo vacancy conditions (location, employment, salary, experience, recruiter) through reviewed schema/migrations.
- [ ] Prove complete M5 acceptance with storage, manual statuses and full access/submission audit.

Existing tokens must be refreshed or the user must sign in again after the new
HR permission migration; permissions in an issued access JWT do not change in place.
No API failure may enable a seed-data fallback. LLM/MCP/memory remain post-MVP.
### Candidate workspace and Copilot configuration — implemented (2026-09-30)

Evidence: [candidate/Copilot checklist](verification/CANDIDATE_COPILOT.md),
[ATS schema and storage matrix](ATS_SCHEMA.md), [changelog](../changelog.md).

- [x] Synchronize questionnaire, vacancy and analysis from one selected candidate; exclude stale analysis after vacancy reassignment.
- [x] Add profile/Copilot/vacancy quick navigation and keep candidate selection available in the ordinary ATS profile view.
- [x] Reveal the candidate edit form and persist candidate location independently of vacancy location.
- [x] Use page scrolling and responsive stacked/three-column inspectors; supersede the earlier resizable, independently scrolling panels.
- [x] Expose HR/admin/owner Copilot configuration in ordinary and dev workspaces: prompt, flags, permitted recommendations and optional memory.md text.
- [x] Persist versioned tenant-scoped ordinary configuration with FORCE RLS; apply migration to both local databases.
- [x] Persist deterministic dev analysis, feedback, notifications, audit, Markdown memory and mock action runs in the separate dev database.
- [x] Apply saved flags/actions/memory to new test resume intake and block accidental live ATS/configuration calls while Dev mode is active.
- [x] Keep authoritative configuration out of browser storage; update generated API contracts and ATS matrix.
- [x] Pass 42 backend and 17 frontend tests, TypeScript, changed-file ESLint, Ruff and whitespace checks; local Copilot route returns HTTP 200.
- [ ] Verify the changed desktop/mobile interactions in a working browser. Current Chrome launch fails because `libnspr4.so` is missing.
- [ ] Connect production LLM analysis and server-validated MCP execution; persisted settings alone do not complete these milestones.

The prior UX/browser checks below describe earlier implementations. This update
supersedes their panel sizing/scrolling behavior and temporary dev-result storage;
it does not reuse those visual checks as evidence for the current layout.

### Superuser data tools and role previews — completed (2026-09-30)

Evidence: [administration checklist](verification/DEV_MODE_ADMINISTRATION.md),
[browser checklist](verification/UX_PANELS.md), [RBAC matrix](RBAC.md),
[dev database guide](DEV_DATABASE.md).

- [x] Add owner-only DEV settings, with backend authorization independent of the role being previewed.
- [x] Generate configurable dev ATS data (20 candidates / 20 vacancies by default), including stages, assignments and interviews.
- [x] Confirm optional dev-only clearing; preserve dev identities and existing real records.
- [x] Persist dev users, candidates, vacancies and prompts in PostgreSQL; reject concurrent stale snapshots.
- [x] Copy canonical ATS data directly from dev into the real tenant in one transaction after explicit confirmation, with new linked IDs, test markers and import audit.
- [x] Exclude dev accounts, credentials and candidate account links from imports; reject dev mutations in production.
- [x] Separate role preview from data selection; default to real data and enforce the selected real-data matrix grants on the server without changing actor/tenant identity.
- [x] Retain opt-in administration for owner/admin views in both modes; hide unavailable tabs and prevent enabling dev data before successful loading.
- [x] Fix full-card navigation and readable validation errors; synchronize vacancy context with the selected candidate.
- [x] Open inspectors at maximum width while preserving the list; add month selection/navigation to the calendar.
- [x] Regenerate contracts and update matrices, changelog and verification checklists.
- [x] Pass 35 backend tests in two temporary databases, 11 frontend tests, TypeScript, changed-file ESLint, Ruff and whitespace checks; verify owner UI and mobile layout in agent-browser.

The role preview preserves the owner's user ID: candidate “own” records in real
mode can be empty if the owner has no linked candidate profile. Copilot/MCP
simulation results and memory now persist in the dev database (see the update above). Import provides ATS records for
pre-release integration checks; production MCP execution and remaining M4/M5
acceptance tasks stay open.

### Owner-only developer mode and administration — completed (2026-09-30)

Evidence: [dev database guide](DEV_DATABASE.md), [dev database verification](verification/DEV_DATABASE.md),
[administration verification](verification/DEV_MODE_ADMINISTRATION.md), [permission matrix](RBAC.md).
This supersedes the unrestricted demo switch and earlier mocked-session browser check below.

- [x] Separate `superuser` from administrator; reserve developer access and previewing any role for the owner.
- [x] Apply owner-role migration and initialize the configured owner without promoting ordinary administrators.
- [x] Serve one shared dataset from a separate PostgreSQL dev database through a superuser-only API endpoint; reject other roles and production access.
- [x] Add owner/admin administration controls, off by default, resetting on role/session/data-mode changes and reload.
- [x] Hide unavailable vacancy/candidate/user create/edit/delete controls and close already exposed management forms/menus when administration is off.
- [x] Provide owner/admin user administration through the API; prohibit administrator promotion to or modification of superuser.
- [x] Fix consent/OAuth cascade on user deletion and add a database regression test.
- [x] Load the shared preview records from PostgreSQL and keep test data out of browser storage; entity edits now persist through the owner data tools above, while the later candidate workspace update also persists Copilot/MCP simulation results.
- [x] Verify the real superuser session, protected data loading, same records across role previews, ordinary-role denials and empty localStorage.
- [x] Verify repeatable database seeding, Alembic drift rejection, registration, legal consent, browser rendering and cleanup; run 45 backend and 6 frontend tests.
- [x] Update generated API contracts, RBAC/product docs, changelog and database setup/verification checklists.

These checks close this administration/dev-mode scope, not the remaining M4/M5
resume storage, manual status, audit or missing read-API requirements.

### Responsive inspectors and HR workspace UX — completed (2026-09-30)

Evidence: [browser verification checklist](verification/UX_PANELS.md), [changelog](../changelog.md).
Frontend UX scope; server authorization and outstanding ATS/AI milestones remain unchanged.

- [x] Share a sticky, resizable inspector across demo candidate profiles, HR Copilot and vacancy details.
- [x] Scroll panel content independently; resize with pointer or keyboard and keep new/expanded panels visible.
- [x] Review vacancy context beside Copilot or a candidate without switching sections.
- [x] Keep the vacancy list and details on the same screen; retain candidate navigation.
- [x] Redesign vacancy/user cards and align CRUD controls; add avatars and a readable sidebar role/profile.
- [x] Hide navigation sections unavailable to the selected role/data source; retain server data/action checks.
- [x] Replace “Soon” placeholders with Dev mode settings/support prototypes; label temporary settings and disconnected support delivery.
- [x] Improve light/dark theme contrast and vacancy empty states.
- [x] Verify desktop/mobile layouts, pointer/keyboard resizing, independent scrolling, all six role menus and both themes through agent-browser.
- [x] Pass TypeScript, ESLint, production build and whitespace checks; record browser evidence without changing server data.

These items complete the inspector/navigation/demo design work. They do not complete
production settings persistence, support delivery, real CRUD acceptance or LLM/MCP execution.

### Role demo layout — completed (2026-09-30)

Local frontend demo; these items do not cover the server stages of AI/MCP and MVP acceptance.

- [x] Distribute the demo across existing role sections with the “Demo” prefix, without duplicates in Copilot.
- [x] Move role selection to the main menu; the later owner tools separate it from dev data, with no browser-persisted preview session.
- [x] Fix one organization and migrate the old local data of the second tenant.
- [x] Leave only the settings for the instruction, allowed recommendations, and memory in Copilot.
- [x] Add search, filters for skills/stages/vacancies, and sorting of candidates by score/name/date.
- [x] Open the questionnaire and Copilot independently on the right; add animations and reduced motion.
- [x] Implement local CRUD for vacancies for HR/administrator with protection of assignments when deleting.
- [x] Limit the demo pool, actions, and notifications by roles and fixed scope.
- [x] Move the journal to a separate section for administrators only and block direct URLs for other roles.
- [x] Save HR confirmation of recommendations, verified memory, and manager approval.
- [x] Add a skills filter and sorting to the regular candidate list.
- [x] Check the scenarios via agent-browser with a test session, including CRUD, reload, and role restrictions.
- [x] Fix the typography of the panels and the mobile menu; check the screen at 390 px without horizontal overflow.

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
- [x] Candidate, HR, administrator and owner access rules are documented in ATS/RBAC matrices.

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

- [ ] Vacancy creation and the complete acceptance flow follow the permission matrix (superuser/administrator/HR write; recruiter reads and submits resumes).
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
- [x] Define tenant-scoped green/red flags and allowed recommendations in persisted HR configuration; production execution remains pending.
- [ ] Define tenant-scoped candidate evaluation history.
- [ ] Define evidence, rationale and audit fields.
- [x] Version tenant prompts/criteria and apply them to subsequent deterministic dev analyses; production analysis integration remains pending.

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
### MVP overview and planning (shared dev / production contract)

- [x] Restore overview: candidate history, source pie chart, pipeline bars, top candidates and upcoming interviews. Both modes render `DashboardAnalytics` from the same aggregation service; only DB and preview identity differ.
- [x] Seed canonical dev candidates from the original dashboard, applications, stages, interviews and human scorecards. No mock-data fallback on API errors.
- [x] Publish `/dashboard/analytics` and superuser-only `/developer/analytics?role=…`; scope aggregates to tenant and candidate/manager visibility.
- [x] Interview planning API: list, create, reschedule and delete; save validated human scorecards (1–5). Existing Interview/Scorecard tables are shared by dev and production and migrated through the same Alembic chain.
- [x] Calendar reads canonical meetings with real dates, month/week/day navigation and multiple meetings per day.
- [ ] Calendar planning UI: CRUD controls, interviewer selection and feedback editing. API persistence is available; wire the full calendar workflow next.

Metric definitions: pipeline counts each visible candidate once (active application stage or candidate status); sources use questionnaire.acquisition_source (falling back to questionnaire.source); daily history uses candidate.created_at (UTC, last 30 days); top candidates use the mean of stored human scorecards, not a fabricated AI score; average time to hire uses application.created_at → updated_at for hired applications and is unavailable until a hire exists. Upcoming interviews include active applications only. Development seed dates are relative to bootstrap time so example history and meetings remain visible.

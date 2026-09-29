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
- [x] Read role-shaped dashboard aggregates; label unsupported analytics as demo.
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
- [ ] Complete admin UI coverage and OAuth candidate-profile provisioning checks.
- [ ] Persist the currently demo vacancy conditions (location, employment, salary, experience, recruiter) through reviewed schema/migrations.
- [ ] Prove complete M5 acceptance with storage, manual statuses and full access/submission audit.

Existing tokens must be refreshed or the user must sign in again after the new
HR permission migration; permissions in an issued access JWT do not change in place.
No API failure may enable a seed-data fallback. LLM/MCP/memory remain post-MVP.

### Компоновка ролевого демо — завершено (2026-09-30)

Локальная frontend-демка; эти пункты не закрывают серверные этапы AI/MCP и приёмку MVP.

- [x] Распределить демо по существующим разделам ролей с префиксом «Демо», без дублей в Copilot.
- [x] Перенести выбор роли в общее меню и сохранять его после перезагрузки.
- [x] Зафиксировать одну организацию и мигрировать старые локальные данные второго тенанта.
- [x] Оставить в Copilot только настройки инструкции, разрешённых рекомендаций и памяти.
- [x] Добавить поиск, фильтры навыков/этапов/вакансий и сортировку кандидатов по баллам/имени/дате.
- [x] Открывать анкету и Copilot независимо справа; добавить анимации и reduced motion.
- [x] Реализовать локальный CRUD вакансий для HR/администратора с защитой назначений при удалении.
- [x] Ограничить демо-пул, действия и уведомления по ролям и фиксированному scope.
- [x] Вынести журнал в отдельный раздел только администратора и закрыть прямой URL другим ролям.
- [x] Сохранить HR-подтверждение рекомендаций, проверенную память и согласование менеджера.
- [x] Добавить фильтр навыков и сортировку в обычный список кандидатов.
- [x] Проверить сценарии через agent-browser с тестовой сессией, включая CRUD, перезагрузку и ограничения ролей.
- [x] Исправить типографику панелей и мобильное меню; проверить экран 390 px без горизонтального переполнения.

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
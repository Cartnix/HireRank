# Changelog

## 2026-09-30 — Server-side dev dataset and registration roles

- [x] Created a dedicated `hirerank_dev` PostgreSQL database in local Docker Compose; production and primary application data remain separate.
- [x] Seeded one shared set of development users, vacancies, candidates, stages and an application using the normal SQLModel entities and Alembic migration chain.
- [x] Added the single `GET /api/v1/developer/dataset` endpoint. It checks the active superuser from the primary database, disables caching and returns no credentials. Other roles, invalid sessions and production are denied.
- [x] Wired local startup to migrate and idempotently refresh the dev database; the endpoint refuses a stale Alembic revision.
- [x] Removed client-side example records and browser persistence. Previews now load through the protected endpoint; UI edits remain in memory until page reload.
- [x] Enabled administrator registration while keeping superuser assignment owner-only.
- [x] Simplified registration to the single required processing consent; login consent text is explicit.
- [x] Updated API contracts, RBAC/product docs and the integration audit.
- [x] Verified isolated API/RBAC/auth/legal tests (45 passed), frontend tests (6 passed), TypeScript, ESLint, Ruff and a real browser session; superuser and HR preview the same records and localStorage stays empty.

Setup and schema-refresh steps: [dev database guide](docs/DEV_DATABASE.md). Evidence: [verification checklist](docs/verification/DEV_DATABASE.md).

## 2026-09-30 — Superuser developer access and administration controls

- [x] Added the owner role `superuser` above administrator, with all current/future permissions and exclusive developer access. Public registration excludes privileged roles; administrators cannot grant or manage superuser accounts.
- [x] Applied migration `d5e6f7a8b9c0` to the local Compose database and initialized the configured `FIRST_SUPERUSER`. Existing administrators were not promoted.
- [x] Developer mode waits for the real session and protected `/users/me/developer-access` response; localStorage cannot authorize ordinary users. Reloading demo detail pages no longer sends demo IDs to the production API.
- [x] Added the owner/admin administration checkbox, off by default. Role/identity/data-mode changes and reload reset it. Unavailable create/edit/delete controls are hidden, including open forms and the vacancy action menu.
- [x] Added user CRUD in API mode and local previews. Fixed deletion after legal acceptance: consent/OAuth relationships use existing database cascades instead of ORM NULL updates.
- [x] Vacancies in developer mode share the production list, detail and create form; local status edits and user edits persist. Owner Copilot actions are attributed to `superuser` in the local audit.
- [x] Updated ATS/RBAC matrices and generated backend/frontend contracts.
- [x] Verified with agent-browser using real owner/admin/HR/manager/recruiter/candidate sessions: owner 200, all other developer requests 403, administrator owner-management attempts 403, role scopes, CRUD, reload and mobile 390px.
- [x] Removed five temporary real users and the temporary vacancy through the UI, restored demo storage, cleared temporary credentials and closed the browser.
- [x] Regression validation: 47 targeted backend tests on an isolated test database, 12 frontend tests, TypeScript, ESLint, Ruff and whitespace checks.

Evidence and acceptance checklist: [developer/administration verification](docs/verification/DEV_MODE_ADMINISTRATION.md).
The earlier demo-layout check used a test session; this entry verifies real server authorization.
The checkbox changes UI controls, not server grants. AI/MCP/memory remain frontend previews;
full resume storage, manual application statuses and M4/M5 acceptance are not declared complete.

## 2026-09-30 — Demo layout by role

- [x] The demo is distributed across the dashboard, candidates, and vacancies without duplication in Copilot.
- [x] A common demo role switcher in the menu; the role and data are saved after a reboot.
- [x] One fixed tenant; old data from the second tenant is deleted upon loading.
- [x] In Copilot, only the prompt, recommendation, and memory settings are retained.
- [x] Filters for skills/stages/vacancies have been added to the candidates, along with sorting by score, name, and date.
- [x] The questionnaire and HR Copilot open independently on the right, with animation and reduced motion support.
- [x] Local CRUD for vacancies is available to HR/administrator; deleting a vacancy with assigned candidates is prohibited.
- [x] Cabinets and notifications take the role into account; the manager sees the assigned ones, the candidate sees their own profile, and the recruiter sees the resume submission.
- [x] The log is displayed separately and is available only to the administrator, including a direct URL.
- [x] HR confirmation, verified memory, and approval of manager’s offers are retained.
- [x] Skill filter and sorting are also added to the regular candidate list.
- [x] Agent-browser check: roles, filters, panels, settings, intake → HR → memory, CRUD and reload; header sizes and mobile menu fixed (390 px without overflow).

Browser check uses the test response `/auth/me`; local demo checked, not server-side authorization. AI/MCP and memory remain demo.

## 2026-09-30 — ATS MVP frontend layout ↔ backend

Branch: `audit/mvp-frontend-backend'. Basis: [audit](docs/MVP_INTEGRATION_AUDIT.md),
UC-01–07 and Phase 1 [roadmap](docs/ROADMAP.md).

Job, candidate, and career pages now use FastAPI instead
of browser-based Copilot JSON. Creation, reading, editing, deletion, and assignment
are performed through supported APIs with cookies/CSRF. The layout and existing
blocks have been saved; necessary actions and small demo tags have been added.

### Behavior

- Jobs: real list/detail, creation, editing of basic fields and
  status, deletion with server errors processing. Conditions that are not in the API
are saved in the form, signed, and unavailable for input; wrapper does not accept
  they are like supposedly stored data.
- Candidates: real pool/detail, HR HTML intake with resume text/reference,
  editing of the questionnaire, separate confirmation of appointment to an open
vacancy, deletion if eligible. The preference is saved separately;
  A new candidate is not automatically appointed. The profile is available without a vacancy.
- Candidate: own HTML profile, link to your profile, open vacancies
  and the response via the applications API. The repeated response is displayed as error 409.
- Dashboard: The available aggregates by role are connected. The number is signed for the manager
  as "Designated Candidates". Uncovered metrics, graphs, and dynamics are clearly demos;
  backend stub values are not represented as measured data.
- Access: The UI obtains permissions from UserPublic and restricts actions.
  Authorization, ownership, tenant scope, and the final decision remain on the server.
  Dashboard is waiting for a session; the auth status is now common to menus, forms, and pages.
- Contracts: DTOs from the generated OpenAPI, canonical URLs, all
list pages for current local filters/summaries, details by ID, secure defaults
  questionnaires and nullable fields. Unknown saved fields of the questionnaire are not lost during
adaptation. The API error never enables the seed fallback.
- Demo: signed by Copilot/AI, notifications, interview/calendar, AI match, history,
  notes, file storage, and unsupported fields. Agent doesn't apply anymore
  to the missing `/api/chat'; the demo response explicitly states that the model is not connected.

### Backend and documentation

The new migration `c4d5e6f7a8b9` adds HR `application.assign' as required
UC-04/RBAC. Previously, migration was not granted this right. Migration has been applied to a separate
test database and a local Compose backend. For an already granted access JWT, you need
to re-enter or refresh to get a new right.

Manual assignment to a draft/closed vacancy is now declined from 409 until the change
Candidate/Application. The manager does not get the right of appointment.

A separate remediation checklist with completed connections
and remaining backend tasks has been added to the roadmap. The PRODUCT has clarified the boundary of the current MVP,
fixed old anchors and links to missing documents. A
section of the layout result has been added to the audit. OpenAPI/schema artifacts and frontend api.d.ts
have been regenerated. Fixed form blocking with empty optional select,
Next.js PageProps calendar pages and typing errors of auxiliary auth/UI
components that prevented checks.

### Checks and restrictions

- Backend: 56 passed — ATS API, tenant isolation, dashboard analytics and auth profile.
  The checks were performed in a separate database `hirerank_mvp_audit_test', without clearing the working database.
- Frontend: 6 passed — `npm run test:ats' (pagination, nullable questionnaire,
canonical mutation paths, unsupported fields, 409 propagation, HTML select and CSRF).
- TypeScript, ESLint, and Ruff pass; OpenAPI types are generated repeatably.
- Production build `npm run build -- --webpack` is running. The usual Turbopack build
  in the verification environment, it is blocked when opening the CSS worker port (`EPERM`);
  The bundler configuration of the project has not been changed.
- Browser: the vacancy was created via the UI and confirmed by the API; HR intake saved the text
  and preference with unassigned/null assignment; the unassigned card has opened;
  HR confirmed the appointment; the link and resume were preserved after the reload. Candidate
  I saved my own HTML profile, received only my own entry, someone else's card.
  returned 404, repeated response — 409. Browser runtime errors are missing.
  The temporary servers and browser session have been stopped.

The full MVP acceptance has not been closed yet. Protected file storage, manual
pipeline status/stage change, resume/consent server domain validation, full
candidate access/submission/status audit, admin UI and missing read APIs
they remain in the roadmap. The check mark in the HTML questionnaire is recorded in the questionnaire, but this
is not declared a full-fledged legal consent lifecycle implementation.
AI/MCP/memory remain post-MVPs. The design, tabs, and demo blocks have not been removed.

### The final checklist of the completed

- [x] The work is done in a separate branch.
- [x] Jobs and careers are connected to the real API.
- [x] Vacancy create/read/update/delete uses the correct paths and DTOs.
- [x] The candidate pool and details are connected to the API, including all pages.
- [x] HR intake saves HTML data and reference without false file upload.
- [x] The candidate's own questionnaire and responses are connected to the backend.
- [x] Editing the questionnaire and deleting the candidate are available according to the permissions.
- [x] The preference is separate from the confirmed appointment.
- [x] HR assignment permission has been restored with a new migration.
- [x] Appointment to an undisclosed vacancy is prohibited by the server.
- [x] The unassigned candidate opens in the profile card.
- [x] Dashboard uses available real metrics with correct signatures.
- [x] Mockups and unsaved items are signed locally.
- [x] The existing design, forms and sections are preserved.
- [x] OpenAPI/schema/types are synchronized.
- [x] Regression checks added and passed.
- [x] Production build has been verified via Webpack without changing the project configuration.
- [x] The basic layout scenario has been tested in a browser with reload and negative access.
- [x] The roadmap and the audit result have been updated; unclosed MVP tasks are listed separately.
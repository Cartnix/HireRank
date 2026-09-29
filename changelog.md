# Changelog

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
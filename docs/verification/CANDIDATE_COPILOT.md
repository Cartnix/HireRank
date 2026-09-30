# Candidate workspace and HR Copilot — verification checklist

Date: 2026-09-30. Scope: synchronized inspectors, questionnaire editing/location,
Copilot configuration, dev-result persistence and environment boundaries.

## Implemented behavior

- [x] One selected candidate drives profile, vacancy and evaluation; evaluation lookup checks candidate, tenant and linked vacancy.
- [x] Candidate selection changes every inspector; reassignment excludes analysis from the previous vacancy.
- [x] Profiles opened from vacancies include Copilot access and linked vacancy context; ordinary ATS profiles retain a candidate selector.
- [x] Quick links navigate between profile, Copilot and vacancy; narrow layouts stack inspectors, widths from 1800 px use three inspector columns.
- [x] Inspectors use ordinary page scrolling without nested scroll capture or automatic panel-scroll jumps.
- [x] Candidate edit action opens the form and scrolls it into view; switching candidates closes the previous edit form.
- [x] Intake/edit forms save candidate location; dashboard adapters use candidate location rather than vacancy location.
- [x] HR/admin/owner have a Copilot settings route in ordinary and dev modes: prompt, green/red flags, allowed recommendations, memory opt-in and optional Markdown text/file import.
- [x] Server configuration survives browser clearing; no authoritative configuration is stored in localStorage or cookies.

These are implementation checks. Browser interaction acceptance remains open below.

## Persistence and authorization evidence

- [x] `GET/PUT /copilot/settings` stores versioned configuration in `copilot_settings`, scoped by tenant with ENABLE/FORCE RLS.
- [x] HR settings survive PUT/GET; responses disable caching, stale writes return 409.
- [x] Candidate/recruiter/manager settings requests return 403.
- [x] Tenant schema guard includes the new settings table.
- [x] Dev snapshot writes persist evaluations, feedback, notifications, audit, confirmed Markdown memory and mock action runs in the separate database.
- [x] Dev memory PUT/GET reload regression passes; stale dataset revisions remain rejected.
- [x] New deterministic intake uses configured flags, permitted actions and enabled Markdown memory; disabled memory is excluded.
- [x] Dev mode frontend guard blocks direct live users/candidates/vacancies/interviews/copilot calls while permitting owner-only developer dataset requests.
- [x] Dev tools reject ordinary roles and production operation; authenticated identity remains the real owner, not a preview role or a browser value.
- [x] Explicit dev-to-live import keeps its separate confirmation flow; no data is imported by toggling Dev mode.
- [x] Migration `f7a8b9c0d1e2` passed on temporary databases and was applied to both local application and existing dev databases.
- [x] Backend/frontend OpenAPI schemas and generated TypeScript contracts were refreshed.

## Executed checks

- [x] **42 backend tests passed** via the developer-tools verification script using two new temporary PostgreSQL databases; both were removed after the run.
- [x] **17 frontend tests passed**, covering context synchronization, deterministic engine, role access, ATS adapters, CSRF and dev request isolation.
- [x] TypeScript `tsc --noEmit`, ESLint on changed frontend files, Ruff on changed backend files, and `git diff --check` passed.
- [x] Local Next.js server started on `127.0.0.1:3010`; `/dashboard/copilot` returned HTTP 200. The temporary server was stopped after the check.

Backend command, from `backend/`:

```sh
.venv/bin/python -m scripts.verify_developer_tools
```

Frontend commands, from `frontend/`:

```sh
./node_modules/.bin/tsx --test \
  features/hr-copilot/model/candidateContext.test.ts \
  features/hr-copilot/model/engine.test.ts \
  features/demo/access.test.ts \
  shared/api/ats.test.ts shared/api/client.test.ts
./node_modules/.bin/tsc --noEmit
```

## Browser acceptance still required

Agent-browser was attempted, but Chrome exited before launch because
`libnspr4.so` was unavailable. HTTP 200 does not prove authenticated rendering,
scrolling or responsive behavior. Earlier screenshots in UX_PANELS.md describe
the previous inspector implementation and are not evidence for this layout.

- [ ] Select two candidates and confirm all three inspectors update together.
- [ ] Open a candidate from a vacancy and follow profile/Copilot/vacancy links.
- [ ] Edit and save location, then reload and confirm the correct candidate changed.
- [ ] Scroll up/down with the pointer over the full profile.
- [ ] Verify desktop, intermediate and mobile widths, quick links and absence of horizontal overflow.
- [ ] Save settings/memory.md through the actual UI and verify reload in each data mode.
- [ ] Run a production frontend build for this change; previous build results are historical.

## Remaining product scope

- [ ] Production LLM analysis jobs, model credentials, approved model routing and output validation.
- [ ] Production evaluation history and server-validated HR approval/MCP execution with retry/idempotency protection.
- [ ] Production confirmed decision-memory lifecycle, retention/erasure and complete audit.
- [ ] Protected resume file bytes, remaining manual pipeline/status APIs and full M4/M5 ATS acceptance.

Ordinary Copilot configuration is durable; production AI execution is not connected.
Dev results remain deterministic simulations even though they now survive reload.
Imported memory.md is stored as configuration text, not as a server filesystem file.

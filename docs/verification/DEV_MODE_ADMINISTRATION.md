# Developer mode and administration — verification checklist

Date: 2026-09-30. Scope: owner-only developer access, role previews,
administration controls, user CRUD and shared vacancy UI.

## Environment and migration

- [x] Local Compose PostgreSQL, FastAPI (`localhost:8000`) and Next.js (`localhost:3000`) are running.
- [x] Applied `alembic upgrade head` to the local application database: `c4d5e6f7a8b9` → `d5e6f7a8b9c0`.
- [x] Ran `python -m app.initial_data`: only the configured `FIRST_SUPERUSER` account was promoted to `superuser`.
- [x] Checked persisted role grants: superuser 15, administrator 13, HR 10, manager 3, recruiter 2, candidate 4.
- [x] Updated the separate `hirerank_mvp_audit_test` database before running destructive test fixtures there. Regression tests did not use the application database.

## Real browser sessions and API authorization

Used **agent-browser** with the real login form, HttpOnly cookies and the running
API/PostgreSQL. No mocked `/auth/me` response, forged session, or intercepted API
response was used. Five temporary accounts were created through the owner's user
management form. Required legal acceptance was completed through the UI for those
accounts. Negative mutation probes included the valid CSRF token, so their 403s
verify authorization rather than a missing CSRF header.

| Authenticated role | Developer access endpoint | Developer control / role picker | Direct development URL | User-management API |
| --- | --- | --- | --- | --- |
| superuser | 200 | visible | available in dev mode | allowed |
| administrator | 403 | absent | denied | allowed below owner |
| HR | 403 | absent | denied | 403 |
| manager | 403 | absent | denied | 403 |
| recruiter | 403 | absent | denied | 403 |
| candidate | 403 | absent | denied | 403 |

- [x] Setting `hirerank-demo-enabled=true` and `hirerank-demo-role=superuser` in localStorage did not authorize any ordinary role.
- [x] Administrator could not PATCH/deactivate or DELETE the owner: 403.
- [x] Administrator could not promote itself or create a superuser: 403.
- [x] Administrator's user form excluded the superuser role; owner rows exposed no edit/delete controls.
- [x] HR retained its vacancy writes without receiving an administration switch.
- [x] Manager, recruiter and candidate had no vacancy creation control.

## Administration and CRUD

- [x] Superuser and administrator start with management controls hidden.
- [x] Enabling administration reveals permitted user/vacancy controls.
- [x] Disabling administration hides an already open user form and vacancy edit/delete menu.
- [x] Reload, role change, identity change and switching between API/dev data do not retain elevated UI state.
- [x] Created five users through the real UI; API reads and reload confirmed persistence.
- [x] Updated a real user's name through the UI.
- [x] Created a temporary real vacancy with the shared form; reload confirmed persistence; changing its status persisted `closed` in the API.
- [x] Deleted the temporary real vacancy through the UI; subsequent GET returned 404.
- [x] Deleted all five temporary users through the UI; subsequent GETs returned 404.
- [x] Deletion worked after legal acceptance. Fixed ORM nullification of `user_consent.user_id` by delegating consent/OAuth deletion to their existing database cascades; added a regression covering both relationships.

## Local developer previews

- [x] Previewed all six roles under the real owner session.
- [x] Owner/admin/HR could read the demo candidate pool; manager saw only the fixed assigned scope; candidate saw only their own profile; recruiter saw intake without pool access.
- [x] Manager/recruiter/candidate direct audit URLs were rejected.
- [x] Local vacancy title/status edits survived reload, and administration reset to off.
- [x] Local user create/update/delete and reload used the API-shaped user fields.
- [x] Administrator preview could not manage the local owner row.
- [x] Reloading `/dashboard/jobs/v-design` waited for developer authorization and issued **no real vacancy API request** with the demo ID.
- [x] The shared vacancy list/detail/create form is used by both API and developer data.

## Browser presentation and errors

- [x] Desktop pages render meaningful content without a Next.js error overlay.
- [x] Candidate and vacancy screens fit a 390 × 844 viewport without horizontal overflow; mobile menu exposes the owner preview switch.
- [x] Final browser error list was empty; the final console contained only React DevTools/HMR informational output.
- [x] Fixed controls that previously remained visible but disabled: vacancy creation, candidate intake and the vacancy action menu now disappear when unavailable.

Captured screenshots in the local verification artifacts:
`/tmp/hirerank-dev-vacancy-final.png`, `/tmp/hirerank-dev-mobile-final.png`,
`/tmp/hirerank-dev-jobs-mobile-final.png`,
`/tmp/hirerank-owner-dashboard-final.png`,
`/tmp/hirerank-administrator-users.png` and
`/tmp/hirerank-owner-users-management.png`.
These temporary artifacts are not required to reproduce the checks.

## Regression checks

- [x] Backend: 47 targeted tests on the separate test database (owner access, users, consent/OAuth cascade, database grants, manager UI permissions).
- [x] Frontend: 12 tests (demo access, owner action attribution, ATS adapters/pagination/writes, CSRF).
- [x] TypeScript `tsc --noEmit`, ESLint on changed frontend files, Ruff on changed backend files, and `git diff --check`.

Backend command, from `backend/`:

```sh
POSTGRES_SERVER=localhost POSTGRES_DB=hirerank_mvp_audit_test \
  .venv/bin/pytest tests/core/test_superuser_access.py \
  tests/api/routes/test_users.py \
  tests/api/routes/test_auth.py::test_rbac_permissions_matrix_from_db \
  tests/api/routes/test_ats_api.py::test_me_exposes_permissions_for_ui_without_granting_manager_writes -q
```

Frontend command, from `frontend/`:

```sh
npx tsx --test features/demo/access.test.ts \
  features/hr-copilot/model/engine.test.ts shared/api/ats.test.ts shared/api/client.test.ts
```

## Cleanup and remaining scope

- [x] Confirmed zero `owner-e2e-*` users and zero `Owner E2E vacancy *` rows in the application database.
- [x] The original four application users remain (owner, HR, manager, candidate).
- [x] Restored the browser's original demo data, cleared temporary credentials, returned to API/read-only mode and closed agent-browser.
- [ ] Full M4/M5 ATS acceptance: protected resume bytes, manual candidate/application status APIs, complete access/submission audit and missing notification/history APIs remain separate roadmap items.
- [ ] LLM/MCP/memory persistence and production execution remain post-MVP; these checks cover their local frontend previews only.

The administration checkbox controls UI affordances. Backend permissions and
PostgreSQL tenant RLS remain authoritative; a checkbox or preview role is not an
API credential and does not change the authenticated identity.

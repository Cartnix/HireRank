# HireRank SoT Compliance Audit

Issue: [#34](https://github.com/Cartnix/HireRank/issues/34)

## Purpose

This audit verifies that the current repository state stays aligned with the behavioral Source of Truth in `docs/use-cases/README.md`.

The audit covers:

- use-cases `UC-01` through `UC-08`
- OpenAPI files under `docs/openapi/`
- implemented FastAPI routes under `backend/app/api/routes/`

Status labels used below:

- `implemented`: backed by FastAPI route(s) and aligned to the use-case
- `partial`: some supporting behavior exists, but the documented use-case is not fully implemented
- `spec-only`: described in OpenAPI/docs, but no FastAPI route currently implements it
- `undocumented`: implemented behavior exists, but it is not part of the approved use-cases

## Current backend route surface

The current FastAPI router mounts only the following modules:

- `backend/app/api/routes/auth.py`
- `backend/app/api/routes/login.py`
- `backend/app/api/routes/users.py`
- `backend/app/api/routes/utils.py`
- `backend/app/api/routes/vacancies.py`
- `backend/app/api/routes/candidates.py`
- `backend/app/api/routes/dashboard.py`
- `backend/app/api/routes/private.py` in local environment only

Legacy template `items` routes were removed with issue #24 (ATS schema). ATS HTTP CRUD landed in issue #30.

See `backend/app/api/main.py`.

## Schema status (issue #24) + API (issue #30)

Postgres ATS domain tables exist with FORCE RLS: `vacancy`, `pipeline_stage`, `candidate`, `application`, `interview`, `scorecard`. See [ATS_SCHEMA.md](../ATS_SCHEMA.md). HTTP CRUD for vacancies/candidates/assign/dashboard shipped in #30; interview/scorecard HTTP and automation broker remain deferred.

## UC Traceability Matrix

| Use case | SoT file | OpenAPI contract | Current backend coverage | Status | Notes |
|---|---|---|---|---|---|
| `UC-01` Candidate self-registration + questionnaire -> `resume.uploaded` | `docs/use-cases/UC-01-candidate-registration.md` | `docs/openapi/paths/auth.yaml`, `docs/openapi/paths/candidates.yaml` | Auth + questionnaire/candidate APIs (`PUT /candidates/{id}/questionnaire`, stub event) | `partial` | Candidate self-serve questionnaire path exists (#30); full UC-01 pool UX still evolving |
| `UC-02` HR creates candidate -> `resume.uploaded` | `docs/use-cases/UC-02-hr-candidate-intake.md` | `docs/openapi/paths/candidates.yaml` | `POST /candidates` (+ questionnaire) in FastAPI | `partial` | Intake + `resume.uploaded` stub shipped (#30); queue broker deferred |
| `UC-03` Administrator vacancy CRUD | `docs/use-cases/UC-03-vacancy-management.md` | `docs/openapi/paths/vacancies.yaml` | `/vacancies` CRUD + default pipeline stages | `implemented` | Admin-only writes enforced via RBAC (#30) |
| `UC-04` Manual admin assignment; MCP path via UC-08 also valid | `docs/use-cases/UC-04-candidate-assignment.md` | `docs/openapi/paths/candidates.yaml`, `docs/openapi/paths/automation.yaml` | `POST /candidates/{id}/assign` | `partial` | Manual assign shipped (#30); MCP/automation path still spec-only |
| `UC-05` Manager read-only vacancies and assignments view | `docs/use-cases/UC-05-manager-vacancies-and-assignments.md` | `docs/openapi/paths/candidates.yaml`, `docs/openapi/paths/vacancies.yaml`, `docs/openapi/paths/dashboard.yaml`, `docs/openapi/paths/notifications.yaml`, `docs/openapi/paths/automation.yaml` | Manager-scoped list + `GET /dashboard` | `partial` | Read paths shipped (#30); notifications/automation still spec-only |
| `UC-06` Administrator-only admin panel access | `docs/use-cases/UC-06-admin-panel-access.md` | `docs/openapi/paths/admin.yaml`, `docs/openapi/paths/users.yaml` | `/users`, `/users/{id}`, `/users/me` exist; `/admin/users*` does not | `partial` | Admin user access partially exists through `/users*`, but dedicated admin panel routes from OpenAPI are not implemented |
| `UC-07` Tenant isolation including Memory | `docs/use-cases/UC-07-enterprise-isolation.md` | Cross-cutting across `docs/openapi/openapi.yaml` and domain path files | RLS + dual-role API tests for ATS routes | `partial` | ATS API isolation covered (#30); Memory still deferred |
| `UC-08` Automation HITL loop: event -> options -> human -> MCP -> Memory | `docs/use-cases/UC-08-automation-hitl-loop.md` | `docs/openapi/paths/automation.yaml` plus `resume.uploaded` side effects from candidate flows | No `/automations/*` FastAPI routes | `spec-only` | Automation contract exists in docs only; no FastAPI accept/outcome/precedent endpoints are implemented |

## Implemented Endpoint Inventory

This section maps every currently implemented backend endpoint either to a use-case or to an audit finding.

### Aligned or partially aligned

| Endpoint | Source file | Closest use-case | Audit note |
|---|---|---|---|
| `POST /auth/register` | `backend/app/api/routes/auth.py` | `UC-01` | Supports account creation, but not the full questionnaire and `resume.uploaded` flow |
| `POST /auth/login` | `backend/app/api/routes/auth.py` | Supporting behavior for `UC-01`..`UC-08` | Auth foundation, not a standalone ATS use-case |
| `POST /auth/logout` | `backend/app/api/routes/auth.py` | Supporting behavior for `UC-01`..`UC-08` | Auth/session infrastructure |
| `GET /auth/me` | `backend/app/api/routes/auth.py` | Supporting behavior for `UC-01`..`UC-08` | Auth/profile infrastructure |
| `POST /auth/refresh` | `backend/app/api/routes/auth.py` | Supporting behavior for `UC-01`..`UC-08` | Auth/session infrastructure |
| `GET /users/` | `backend/app/api/routes/users.py` | `UC-06` | Partial match for administrator access |
| `POST /users/` | `backend/app/api/routes/users.py` | `UC-06` | Admin user management behavior exists in code, but is not reflected in the current OpenAPI admin path set |
| `GET /users/me` | `backend/app/api/routes/users.py` | Supporting behavior for `UC-01`..`UC-08` | Profile infrastructure |
| `PATCH /users/me` | `backend/app/api/routes/users.py` | Supporting behavior for `UC-01` / `UC-06` | Profile editing infrastructure |
| `PATCH /users/me/password` | `backend/app/api/routes/users.py` | Supporting behavior for `UC-01`..`UC-08` | Account maintenance |
| `DELETE /users/me` | `backend/app/api/routes/users.py` | Supporting behavior for `UC-01` / compliance-related lifecycle | Account deletion exists, but no matching use-case text explicitly covers it |
| `GET /users/{user_id}` | `backend/app/api/routes/users.py` | `UC-06` | Partial match for administrator access |
| `PATCH /users/{user_id}` | `backend/app/api/routes/users.py` | `UC-06` | Admin user management behavior exists in code, but not in `docs/openapi/paths/admin.yaml` |
| `DELETE /users/{user_id}` | `backend/app/api/routes/users.py` | `UC-06` | Admin user management behavior exists in code, but not in `docs/openapi/paths/admin.yaml` |

### Implemented but undocumented or outside approved use-cases

| Endpoint | Source file | Audit classification | Why it is flagged |
|---|---|---|---|
| `POST /login/access-token` | `backend/app/api/routes/login.py` | `undocumented` | Legacy Swagger-compatible login path not present in product OpenAPI |
| `POST /login/test-token` | `backend/app/api/routes/login.py` | `undocumented` | Debug-style token echo endpoint not covered by approved use-cases |
| `POST /password-recovery/{email}` | `backend/app/api/routes/login.py` | `undocumented` | Password recovery behavior is not represented in SoT use-cases |
| `POST /reset-password/` | `backend/app/api/routes/login.py` | `undocumented` | Password reset flow is not represented in SoT use-cases |
| `POST /password-recovery-html-content/{email}` | `backend/app/api/routes/login.py` | `undocumented` | Superuser utility endpoint not covered by approved use-cases |
| `POST /utils/test-email/` | `backend/app/api/routes/utils.py` | `undocumented` | Operational test endpoint, not a product use-case |
| `GET /utils/health-check/` | `backend/app/api/routes/utils.py` | `undocumented` | Operational health endpoint, not part of the approved behavioral SoT |
| `POST /private/users/` | `backend/app/api/routes/private.py` | `undocumented` | Local-only bootstrap route outside approved use-cases |

## Key Findings

1. Auth/RBAC/RLS foundations plus ATS schema (#24) and vacancy/candidate/assign/dashboard HTTP (#30) are in place. Remaining gaps are automation/HITL (`UC-08`), notifications, interview/scorecard HTTP, and Memory.
2. `UC-03` admin-only vacancy writes are enforced in RBAC seed + API (`docs/RBAC.md`); older OpenAPI intro text may still say HR handles vacancy CRUD and should be corrected when OpenAPI is next edited.
3. `UC-06` is only partially reflected:
   - the backend already supports create/update/delete operations on `/users*`
   - `docs/openapi/paths/admin.yaml` documents read-only admin panel routes
4. Several implemented routes are operational, template, or legacy paths that are not part of the approved product SoT and should remain explicitly flagged until they are either documented as supporting infrastructure or removed.
5. The role `recruiter` appears in auth/RBAC/OpenAPI documentation, but there is no dedicated use-case that defines recruiter behavior.

## Follow-up Expectations

This audit is complete when:

- this document is committed as the repository traceability artifact for issue `#34`
- secondary docs are corrected only where they directly contradict the approved use-cases
- one consolidated follow-up issue captures implementation and documentation gaps discovered here

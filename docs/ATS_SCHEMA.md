# HireRank ATS database schema

Persistence substrate for the ATS MVP. Behavioral Source of Truth remains
[use-cases/](use-cases/). This document describes storage and relationships; it
must not invent product behavior.

**Compliance:** [ATS_COMPLIANCE_RK.md](laws/ATS_COMPLIANCE_RK.md) (RK — primary), [GDPR.md](laws/GDPR.md) (EU / West). Architecture: [ARCHITECTURE.md](ARCHITECTURE.md). RBAC/RLS: [RBAC.md](RBAC.md).

## Tables (SoT names × normalized core)


| Table            | Role                                                                             |
| ---------------- | -------------------------------------------------------------------------------- |
| `vacancy`        | OpenAPI/UC vacancy                                                               |
| `pipeline_stage` | Per-vacancy hiring stages (`UNIQUE (vacancy_id, sort_order)`)                    |
| `candidate`      | Pool profile: structured resume data, `resume_url`, and status enum              |
| `application`    | Join vacancy↔candidate (`UNIQUE (vacancy_id, candidate_id)`); `current_stage_id` |
| `interview`      | Scheduled interview on an application                                            |
| `copilot_settings` | Tenant-scoped prompt, flags, allowed recommendations and optional Markdown memory (JSONB, versioned) |
| `scorecard`      | **Human** interview feedback (`rating` 1–5 + notes) — not AI auto-scoring        |


OpenAPI `assigned_vacancy_id` is an **API projection** of the active `application` row — not a DB column.

### Evaluation boundary

`scorecard` stores human interview notes after a human interview. Any future
LLM evaluation is a separate post-MVP record and cannot silently change a
candidate status.

## RLS

Every ATS table has `tenant_id`, `ENABLE` + `FORCE ROW LEVEL SECURITY`, and `tenant_isolation_policy` using:

```sql
tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid
```

Runtime: `SET LOCAL ROLE hirerank_app` (NOBYPASSRLS) + transaction-local GUC via `get_db()` (`[backend/app/api/deps.py](../backend/app/api/deps.py)`). Policies registered in `[backend/app/db/rls_policies.py](../backend/app/db/rls_policies.py)`.

`resume_url` is an opaque object key / internal id — not a public cloud URL. File access must go through an RLS-gated gateway that issues short-lived presigned URLs (future).

## Table → use-case map


| UC    | Persistence usage                                                                          |
| ----- | -------------------------------------------------------------------------------------------------- |
| UC-01 | Create/update candidate and resume record with status `unassigned`                       |
| UC-02 | Create candidate and resume record under HR/recruiter access                               |
| UC-03 | Vacancy CRUD; seed default `pipeline_stage` rows                                          |
| UC-04 | Insert `application` linking candidate to vacancy; update candidate status                |
| UC-05 | Tenant-scoped read of vacancies, applications, and candidates                             |
| UC-06 | Administrator access to users and ATS administration                                     |
| UC-07 | FORCE RLS on all ATS tables; empty GUC fails closed                                      |
| UC-08 | Future evaluation draft and confirmed HR action; not required by the MVP                 |




## MVP flow: resume intake → vacancy pipeline

```text
UC-01/02 submit HTML resume form → INSERT candidate (unassigned, resume_url)
  → HR/recruiter selects vacancy
  → INSERT application (candidate, vacancy, current_stage)
  → HR updates candidate status in the pipeline
```

Pool intake: candidates with no active `application` and `status=unassigned`
until an HR/recruiter attaches them to a vacancy.

## Non-goals of the schema issue

The database schema is separate from HTTP. Resume file storage, candidate
evaluation records, and interview/scorecard HTTP remain separate follow-up work.

## TDD security coverage (Defense-in-Depth)

Behavioral SoT stays in [use-cases/](use-cases/). Security tests attack boundaries; they do not invent product behavior.

### Have now (DB / RLS layer — issue #24)


| Vector                          | Defended by                                   | Tests                                                                        |
| ------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| Vacancy IDOR (guess UUID)       | FORCE RLS + GUC                               | `test_vacancy_idor_*`, `test_core_tenant_cannot_read_*`                      |
| Same email across tenants       | `UNIQUE (tenant_id, email)`                   | `test_candidate_email_unique_is_tenant_scoped_*`                             |
| Duplicate email within tenant   | same unique                                   | `test_candidate_duplicate_email_within_tenant_*`                             |
| Cross-tenant `current_stage_id` | composite FK `(tenant_id, current_stage_id)`  | `test_application_cannot_point_at_foreign_pipeline_stage`                    |
| Scorecard / interview FK poison | composite FK `(tenant_id, interview_id)` etc. | `test_scorecard_cannot_attach_*`, `test_interview_cannot_attach_*`           |
| Forged `tenant_id` on INSERT    | RLS `WITH CHECK`                              | `test_insert_with_forged_tenant_id_*`                                        |
| Attacker DELETE any ATS row     | RLS `USING`                                   | `test_attacker_cannot_delete_*`                                              |
| Empty GUC fail-closed           | `NULLIF` policies                             | `test_empty_tenant_guc_*`                                                    |
| Superuser pitfall               | `SET LOCAL ROLE hirerank_app`                 | `test_rls_session_runtime_role_*`, `test_hirerank_app_role_has_no_bypassrls` |
| Schema CI guard                 | information_schema                            | `test_tenant_schema_guard.py`                                                |


Dual-role pattern: seed Tenant Alpha (Core) + Tenant Omega (attacker); assert authorized read succeeds and attacker read/mutate fails.

### HTTP API coverage (issue #30)


| Vector                                           | Expected API outcome   | Status                                       |
| ------------------------------------------------ | ---------------------- | -------------------------------------------- |
| `GET /vacancies/{id}` IDOR / foreign seed        | 404                    | Covered — `tests/api/routes/test_ats_api.py` |
| `GET /candidates/{id}` foreign seed              | 404                    | Covered                                      |
| `POST /candidates` duplicate email (same tenant) | 409                    | Covered                                      |
| Questionnaire email collision on PUT             | 409                    | Covered                                      |
| Forged `tenant_id` in body                       | 422                    | Covered (candidates + vacancies)             |
| HR vacancy POST/PATCH/DELETE                     | 2xx (UC-03)            | Covered                                      |
| Manager assign                                   | 403                    | Covered                                      |
| Admin assign + manager list                      | 200                    | Covered                                      |
| Resume URL after RLS row visible                 | 200 stub / 404 foreign | Covered                                      |
| `page_size > 100`                                | 422                    | Covered                                      |
| Wrong-vacancy stage (API helper)                 | 400                    | Covered — `validate_stage_for_vacancy`       |
| Dashboard flood                                  | 429 (sliding window)   | Covered — `enforce_dashboard_rate_limit`     |


Routes: `/api/v1/vacancies`, `/api/v1/candidates` (+ assign, questionnaire,
resume-url), `/api/v1/dashboard`. Resume upload and HTML intake remain part of
the current MVP roadmap.

### checklist mapping


| Rule                                        | HireRank                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1. Only `SET LOCAL` / transaction-local GUC | `set_config(..., true)` + `SET LOCAL ROLE` in `deps.apply_rls_context` (`app.current_tenant`) |
| 2. `tenant_id` in every FK / unique         | Composite FKs + `UNIQUE (tenant_id, email)` + `UNIQUE (tenant_id, id)`                        |
| 3. Negative dual-role tests                 | DB attack matrix + HTTP mirrors in `test_ats_api.py`                                          |
| Extra: pagination + rate limit              | Lists `le=100`; dashboard rate-limited                                                        |
| Extra: API stage check                      | `validate_stage_for_vacancy` (complements composite FK)                                       |
| Reject                                      | Strip RLS from `candidate` (conflicts UC-07)                                                  |

## Owner role and administration matrix

`role.name = 'superuser'` identifies the application owner above `administrator`.
The `user.role` foreign key references this role; public signup excludes both
privileged roles. Migration `d5e6f7a8b9c0` creates the role and exclusive
`developer.access` permission, with grants to every existing permission. The
configured `FIRST_SUPERUSER` account is promoted during application initialization;
other administrators are not promoted. See [the complete permission matrix](RBAC.md).

| Operation | superuser | administrator | HR | manager | recruiter | candidate |
| --- | --- | --- | --- | --- | --- | --- |
| Developer test data / preview any role | yes | no | no | no | no | no |
| User create / read / update / delete | all | below owner | no | no | no | own account |
| Grant / edit / remove superuser | yes | no | no | no | no | no |
| Vacancy create / update / status / delete | yes | yes | yes | no | no | no |
| Candidate create / update | yes | yes | yes | no | intake only | own questionnaire |
| Candidate delete | yes | yes | no | no | no | no |
| Candidate read | all | all | all | assigned scope | no pool | own |
| Assign candidate to vacancy | yes | yes | yes | no | no | no |
| Apply to an open vacancy | yes | no | no | no | no | own |
| Copilot configuration (prompt, flags, actions, optional memory.md) | yes | yes | yes | no | no | no |
| Development audit | yes | preview only | no | no | no | no |

The frontend administration checkbox reveals management controls for owner/admin;
server RBAC and tenant RLS remain authoritative. No role-preview value is sent as
an API credential. Demo user rows use the API field names (`id`, `tenant_id`,
`email`, `role`, `is_active`, `first_name`, `last_name`). Vacancy lists, detail
cards and create forms share production components. Copilot evaluations and recommendations use a deterministic dev engine;
local resume file bytes are not uploaded. Dev evaluations and Markdown memory
are persisted in the isolated development database;
internal demo models are adapted to shared display models, not sent to API writes.


## Copilot configuration and synchronized candidate context

`GET/PUT /api/v1/copilot/settings` is available to HR, administrator and owner
in the ordinary workspace. `copilot_settings.tenant_id` is both primary key and
FK to `tenant`; FORCE RLS isolates settings by organization. Configuration contains
`text`, `greenFlags`, `redFlags`, `allowedActions`, `useMemory`, `memoryMarkdown`
and `version`. Stale writes return 409. These permissions control proposed actions;
execution still requires HR confirmation. Production AI execution is not connected
by this change; the interface states that limitation.

Candidate `questionnaire.location` stores the candidate's city/location, independently
of vacancy location. Intake and edit forms preserve this field.

Candidate selection is the single context for questionnaire, linked vacancy and
Copilot analysis. The displayed evaluation must match candidate and linked vacancy.
At narrower widths inspectors stack with ordinary page scrolling; at wide widths
three inspectors share the right-hand workspace. Candidate profiles link to Copilot,
and Copilot links to its settings.

### Environment storage matrix

| Data / action | Ordinary workspace | Dev mode |
| --- | --- | --- |
| Users, vacancies, candidate edits/deletion | Primary ATS database, ordinary RBAC/RLS | Canonical ATS tables in separate dev database via owner-only dataset API |
| Copilot prompt, flags, actions, optional memory.md | `copilot_settings`, tenant RLS | `development_dataset.config.prompts` in dev database |
| Evaluation, feedback, notifications, audit, confirmed Markdown memory, mock actions | Production AI execution remains pending | Persisted in `development_dataset.config`, deterministic test engine |
| Resume location | `candidate.questionnaire.location` | Same questionnaire field, dev database |
| Browser storage | No authoritative prompt or personal data in localStorage/cookies | No authoritative dataset in localStorage/cookies |

Dev mode blocks direct frontend requests to live users/candidates/vacancies/interviews
and Copilot configuration routes. Authentication still uses the real owner identity;
test data and memory are never used as authentication credentials. Backend dev tools
require a separate enabled development database and remain disabled in production.
Explicit import into the primary database is a distinct owner action requiring the
existing `IMPORT TO REAL DATABASE` confirmation; toggling Dev mode never imports data.

Server persistence makes settings survive browser clearing and work across sessions.
Cookies are reserved for the session and CSRF. Browser drafts would be readable by
scripts on the origin and shared by users of the same browser, so no persistent
browser prompt cache is introduced. Use the server configuration as the authority.

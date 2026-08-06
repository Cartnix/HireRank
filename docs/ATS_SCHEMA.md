# HireRank ATS database schema

Persistence substrate for MVP ATS domain tables (issue #24). Behavioral Source of Truth remains [use-cases/](use-cases/). This document maps tables onto UC-01…08 — it must not invent behavior.

**Compliance:** [ATS_COMPLIANCE_RK.md](laws/ATS_COMPLIANCE_RK.md) (RK — primary), [GDPR.md](laws/GDPR.md) (EU / West). Architecture: [ARCHITECTURE.md](ARCHITECTURE.md). RBAC/RLS: [RBAC.md](RBAC.md).

## Tables (SoT names × normalized core)

| Table | Role |
|-------|------|
| `vacancy` | OpenAPI/UC vacancy|
| `pipeline_stage` | Per-vacancy hiring stages (`UNIQUE (vacancy_id, sort_order)`) |
| `candidate` | Pool profile: `questionnaire` JSONB, `resume_url`, SoT status enum |
| `application` | Join vacancy↔candidate (`UNIQUE (vacancy_id, candidate_id)`); `current_stage_id` |
| `interview` | Scheduled interview on an application |
| `scorecard` | **Human** interview feedback (`rating` 1–5 + notes) — not AI auto-scoring |

OpenAPI `assigned_vacancy_id` is an **API projection** of the active `application` row — not a DB column.

### Scorecard ≠ product scoring

PRODUCT / UC-08 ban silent rank and auto hire/reject. `scorecard` stores interviewer notes after a human interview. Automation never dispositions a candidate from score alone.

## RLS

Every ATS table has `tenant_id`, `ENABLE` + `FORCE ROW LEVEL SECURITY`, and `tenant_isolation_policy` using:

```sql
tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid
```

Runtime: `SET LOCAL ROLE hirerank_app` (NOBYPASSRLS) + transaction-local GUC via `get_db()` ([`backend/app/api/deps.py`](../backend/app/api/deps.py)). Policies registered in [`backend/app/db/rls_policies.py`](../backend/app/db/rls_policies.py).

`resume_url` is an opaque object key / internal id — not a public cloud URL. File access must go through an RLS-gated gateway that issues short-lived presigned URLs (future).

## Table → use-case map

| UC | Persistence usage (CRUD/MCP later) |
|----|-------------------------------------|
| UC-01 | `INSERT candidate` (`unassigned`, questionnaire, `resume_url`) → event `resume.uploaded` |
| UC-02 | Same insert under HR |
| UC-03 | Vacancy CRUD; seed default `pipeline_stage` rows |
| UC-04 | `INSERT application` + `candidate.status=assigned` |
| UC-05 | Tenant-scoped SELECT of vacancies/applications/candidates |
| UC-06 | Admin over users + vacancies/applications |
| UC-07 | FORCE RLS on all six tables; empty GUC fails closed |
| UC-08 | MCP after HITL may advance stage, insert `interview`, archive application — never auto-hire/reject |

## Example: resume upload → bureaucracy HITL

```text
UC-01/02 submit → INSERT candidate (unassigned, resume_url)
  → publish resume.uploaded
  → Automation (UC-08) reads open vacancies + Memory under tenant_id
  → Telegram HITL: 2–3 MCP options (no auto hire)
  → human picks e.g. invite_interview
  → FastMCP: INSERT application (current_stage=Interview),
             INSERT interview, UPDATE candidate status
  → Outcome → Memory (later storage)
```

Pool / flood intake: candidates with no active `application` and `status=unassigned` until UC-04 or MCP assign.

## Non-goals of the schema issue

HTTP CRUD, Automation worker, Memory tables, S3 gateway, AI scoring pipelines — separate issues.

## TDD security coverage (Defense-in-Depth)

Behavioral SoT stays in [use-cases/](use-cases/). Security tests attack boundaries; they do not invent product behavior.

### Have now (DB / RLS layer — issue #24)

| Vector | Defended by | Tests |
|--------|-------------|-------|
| Vacancy IDOR (guess UUID) | FORCE RLS + GUC | `test_vacancy_idor_*`, `test_core_tenant_cannot_read_*` |
| Same email across tenants | `UNIQUE (tenant_id, email)` | `test_candidate_email_unique_is_tenant_scoped_*` |
| Duplicate email within tenant | same unique | `test_candidate_duplicate_email_within_tenant_*` |
| Cross-tenant `current_stage_id` | composite FK `(tenant_id, current_stage_id)` | `test_application_cannot_point_at_foreign_pipeline_stage` |
| Scorecard / interview FK poison | composite FK `(tenant_id, interview_id)` etc. | `test_scorecard_cannot_attach_*`, `test_interview_cannot_attach_*` |
| Forged `tenant_id` on INSERT | RLS `WITH CHECK` | `test_insert_with_forged_tenant_id_*` |
| Attacker DELETE any ATS row | RLS `USING` | `test_attacker_cannot_delete_*` |
| Empty GUC fail-closed | `NULLIF` policies | `test_empty_tenant_guc_*` |
| Superuser pitfall | `SET LOCAL ROLE hirerank_app` | `test_rls_session_runtime_role_*`, `test_hirerank_app_role_has_no_bypassrls` |
| Schema CI guard | information_schema | `test_tenant_schema_guard.py` |

Dual-role pattern: seed Tenant Alpha (Core) + Tenant Omega (attacker); assert authorized read succeeds and attacker read/mutate fails.

### Missing until ATS HTTP CRUD ships

| Vector | Expected API outcome | Status |
|--------|----------------------|--------|
| `GET /vacancies/{id}` IDOR | 404 for Omega | No routes yet |
| `POST /candidates` same email as Alpha | 200 for Omega | No routes yet |
| `PATCH /applications/{id}` foreign stage | 400/404 | No routes yet |
| `POST /scorecards` foreign `interview_id` | 404/400/409 | No routes yet |

When those routes land, mirror each DB case with httpx **authorized 200** + **attacker 404/403** (Dual-Role Execution Matrix). Do not mock Postgres — RLS must run under `hirerank_app`.

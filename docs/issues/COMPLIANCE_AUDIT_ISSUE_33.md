# HireRank Compliance Audit

Issue: [#33](https://github.com/Cartnix/HireRank/issues/33)

## Purpose

This audit reviews the current codebase against:

- `docs/GDPR.md`
- `docs/ATS_COMPLIANCE_RK.md`

The goal is to classify every reviewed requirement as one of:

- `implemented`
- `partial`
- `must-fix`
- `MVP waiver`
- `unclear`

`must-fix` means the repository already exposes behavior that conflicts with the compliance source of truth and should be corrected before claiming the current MVP surface is compliant.

`MVP waiver` means the requirement applies to a candidate-domain or automation capability that is documented but not yet implemented in runtime code, so the gap must stay explicitly tracked and must not be silently treated as complete.

## Current runtime scope

The current implemented application surface is still narrow:

- frontend: landing + auth modal only
- backend: `auth`, `login`, `users`, `utils`, `items`, `private`
- no implemented candidate routes
- no implemented vacancy routes
- no implemented automation worker or `/automations/*` API

As a result, many compliance obligations for candidate processing are still design-level or OpenAPI-level only.

## Requirement Matrix

| Requirement | Compliance source | Current evidence | Status | Classification | Notes |
|---|---|---|---|---|---|
| Granular consent UI with separate unchecked boxes | `docs/laws/ATS_COMPLIANCE_RK.md` §1.4 | `AuthModal` + `ConsentGrant` on `/auth/register` and OAuth POST start; `user_consent` table | Implemented | `implemented` | Empty-by-default checkboxes; `account_processing` required |
| No IIN / ID scans during initial apply | `docs/laws/ATS_COMPLIANCE_RK.md` §1.5 | `UserRegister` `extra=forbid` rejects `iin` and other unknown PD fields | Implemented | `implemented` | Auth register path hardened; candidate apply forms still future |
| “Forget Me” / consent withdrawal workflow | `docs/laws/GDPR.md` §3, RK §3.3 | `POST /auth/forget-me` anonymizes auth identity, revokes consents, clears session | Partial | `implemented` | Auth-scoped erasure done; candidate-profile purge remains MVP when candidate domain ships |
| Personal-data masking in list views with audited reveal | `docs/ATS_COMPLIANCE_RK.md` §3.1 | No candidate pool/dashboard/list UI in frontend; no masking serializers or reveal endpoints in backend | Missing | `MVP waiver` | Required for future list views, but those views are not implemented yet |
| Retention hooks / renewal / hard-delete or anonymize | `docs/GDPR.md` §3-4, `docs/ATS_COMPLIANCE_RK.md` §3.2-3.4 | No retention config, cron, anonymization hooks, or candidate lifecycle jobs in backend | Missing | `MVP waiver` | Candidate domain is not implemented yet, so this remains backlog rather than a contradiction in the current runtime |
| Import without consent restrictions | `docs/ATS_COMPLIANCE_RK.md` §2.1 | No import flow, no `pending_consent` status, no expiry cleanup logic | Missing | `MVP waiver` | The import capability does not exist yet; the gap must remain tracked before any sourcing/import feature ships |
| No raw CV transmission to foreign LLM providers | `docs/GDPR.md` §5, `docs/ATS_COMPLIANCE_RK.md` §2.3 | No foreign LLM client in runtime code; local Ollama posture documented; automation worker not implemented | Implemented by absence | `implemented` | The repo currently avoids foreign LLM calls because no such integration exists in runtime code |
| Audit logging for personal-data reveal / access / export / assignment | `docs/ATS_COMPLIANCE_RK.md` §1.3 | Append-only audit foundation exists for auth events; no candidate PD access events wired into production routes | Partial | `MVP waiver` | Foundation is implemented, but candidate-domain audit coverage is still absent because candidate-domain routes are absent |
| Logs avoid direct PII leakage | `docs/GDPR.md` §5 | Audit metadata allowlist and email hashing exist in backend audit layer | Partial | `implemented` | Auth/audit foundations show the intended PII-safe direction, though broader candidate-domain coverage is still missing |
| Human-in-the-loop instead of solely automated hire/reject | `docs/GDPR.md` §2, `docs/ATS_COMPLIANCE_RK.md` §2.4 | No runtime auto-hire/auto-reject logic; UC-08 and architecture docs ban autonomous disposition | Implemented by absence | `implemented` | The automation runtime is not built yet, and current docs consistently ban silent auto-disposition |

## Findings by Severity

### Must-fix

None remaining on the **auth** surface after consent / forget-me / IIN-forbid / privacy page.

### MVP waivers

1. Candidate-domain controls are largely not implemented yet: masking, candidate-profile erasure beyond auth identity, retention hooks, import-with-consent.
2. Candidate PD audit events are not wired because the candidate domain itself is not wired.

### Implemented or acceptable in current runtime

1. Granular registration/OAuth consent + `user_consent` persistence.
2. `POST /auth/forget-me` auth-identity erasure.
3. Register `extra=forbid` (blocks IIN / tenant injection).
4. Privacy page + footer links (no `#` placeholders).
5. No foreign LLM or raw CV exfiltration path exists in runtime code today.
6. No auto-hire or auto-reject path exists in runtime code today.
7. Auth-oriented append-only audit infrastructure is already in place.

## Evidence Summary

### Frontend

- `frontend/widgets/authModal/ui/AuthModal.tsx`
- `frontend/features/auth/model/FormSchema.ts`
- `frontend/widgets/Footer.tsx`

### Backend

- `backend/app/api/main.py`
- `backend/app/api/routes/auth.py`
- `backend/app/api/routes/login.py`
- `backend/app/api/routes/users.py`
- `backend/app/audit/service.py`
- `backend/app/audit/schemas.py`
- `backend/app/alembic/versions/e5f6a7b8c9d0_audit_log_schema.py`

### Documentation / OpenAPI

- `docs/GDPR.md`
- `docs/ATS_COMPLIANCE_RK.md`
- `docs/openapi/schemas/candidate.yaml`
- `docs/use-cases/UC-08-automation-hitl-loop.md`

## Recommended Follow-up

Track the non-runtime compliance obligations in one consolidated follow-up issue:

- add granular consent fields and copy to the registration/apply flow
- define candidate-domain consent records and revoke/erase APIs
- add masking + reveal auditing for list/detail views
- define retention/anonymization/backup-erasure hooks
- define consent-gated import workflow before any sourcing/import feature ships
- extend audit actions from auth-only events to candidate PD access events

## Closing position for issue #33

Issue `#33` can be closed as an **audit artifact** once:

- this document is committed to the repository
- the current must-fix registration consent gap is tracked explicitly
- the remaining non-runtime gaps are captured as MVP waivers with follow-up tracking

It should not be interpreted as “all compliance implementation is finished.” It means the codebase has been audited and every listed requirement now has an explicit status.

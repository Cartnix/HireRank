# HireRank — Privacy, sovereignty & human oversight

**Compliance Source of Truth (EU / West)** — obeyed **strictly** with [ATS_COMPLIANCE_RK.md](ATS_COMPLIANCE_RK.md) (RK — primary) and [use-cases/](use-cases/) (MVP behavioral north star). See [use-cases/README.md](use-cases/README.md).

Vision: [PASSPORT.md](PASSPORT.md). Architecture: [ARCHITECTURE.md](ARCHITECTURE.md). Memory: [MEMORY.md](MEMORY.md).

HireRank is positioned as **on-prem / in-perimeter** ATS + HireRank Automation (events + HITL + MCP + Memory for bureaucracy). Personal data, [Memory](MEMORY.md), and decision audit stay under the controller’s custody — not a multi-tenant cloud LLM black box.

## 1. Data sovereignty & isolation (`tenant_id`)

A cross-tenant leak is a severe breach. Absolute isolation is required.

* **Database isolation:** PostgreSQL Row-Level Security (RLS) as a baseline on shared schemas — inject `tenant_id = current_setting('app.current_tenant')` at the engine level (fail-closed via `NULLIF(..., '')::uuid` in policies).
* **Enterprise / government tier:** Database-per-tenant where the deployer requires independent audit boundaries.
* **Object storage:** Do not mix resumes across tenants in one unmanaged folder; separate buckets or strict prefix + IAM/ACL per `tenant_id`.
* **MCP:** mutations only under the authenticated `tenant_id`; refuse cross-tenant tools.

## 2. Meaningful human involvement (GDPR Art. 22, EU AI Act)

Recruitment AI is high-risk context (EU AI Act Annex III §4 screening/evaluation posture).

* Automation **suggests** 2–3 MCP-backed bureaucracy options; a human presses a Telegram button; FastMCP executes **only** the selected action ([UC-08](use-cases/UC-08-automation-hitl-loop.md)).
* **Ban:** automatic hire/reject without human selection.
* Audit trail: proposed options → chosen button → MCP action → **Outcome** (option-choice history) in [Memory](MEMORY.md).

This is the product’s primary compliance control for “solely automated” decision risk.

## 3. Right to erasure & backups (Art. 17)

* Soft-delete may exist as a short trash window; cron hard-deletes after the window.
* Prefer **crypto-shredding** for tenant-scoped candidate encryption keys (Vault or on-prem KMS) so backups become unreadable without rebuilding petabyte archives.
* [Memory](MEMORY.md) (Outcomes and other run memory) tied to a candidate must be covered by the same erasure or anonymization policy as the controller defines.

## 4. Retention & minimization (Art. 5)

* Tenant-configurable retention (e.g. delete inactive candidate profiles after N months).
* Consent / retention-renewal workflows where law or policy requires.
* Do not treat “keep forever for AI training” as default — [Memory](MEMORY.md) is a **tenant asset**, not a vendor training dump.

## 5. Logs, search, and exfil paths

* Search indexes: index-per-tenant or document-level security by `tenant_id`.
* Application logs strip PII (names, emails, phones, resume text); log IDs only.
* Local LLM (Ollama) stays in-perimeter; no silent shipping of resumes to third-party SaaS for scoring.

## 6. Contracts & deployer responsibilities

* DPA / processing terms for B2B deployers; on-prem install keeps the controller hosting the processing.
* Support data residency chosen by the deployer (EU/EEA or national perimeter), not forced into a vendor cloud region by default.
* Export of [Memory](MEMORY.md) and candidate data must be available to the tenant on exit (switching cost is process continuity, not hostage data).

## Summary

| Control | HireRank expectation |
|---------|----------------------|
| Hosting | On-prem / customer perimeter |
| Isolation | `tenant_id` + RLS / optional DB-per-tenant |
| AI decisions | HITL only; no black-box auto-disposition |
| Memory | Tenant-owned [MEMORY.md](MEMORY.md) (Outcomes + run memory) |
| Erasure | Hard delete + crypto-shred on backups |

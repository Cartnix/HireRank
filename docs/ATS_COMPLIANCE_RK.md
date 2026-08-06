# Compliance and Best Practices for ATS in the Republic of Kazakhstan (2026)

**Compliance Source of Truth (RK — primary)** — obeyed **strictly** with [GDPR.md](GDPR.md) (EU / West) and [use-cases/](use-cases/) (MVP behavioral north star). See [use-cases/README.md](use-cases/README.md). If a use-case or feature conflicts with this document, **fix the product** — do not weaken RK requirements for MVP speed.

Developing or adapting an Applicant Tracking System (ATS) for Kazakhstan in **2026–2030** requires hard compliance with the Law of the Republic of Kazakhstan “On Personal Data and their Protection,” including tightening by the Ministry of Digital Development (MDDIAI / ICRIAP RK). State focus in this period: **cross-border transfer**, **total action logging**, and **automated consent withdrawal**.

This document is the product/architecture checklist for HireRank (Core on-prem first; Enterprise/SaaS later). It is not a substitute for local IT-legal counsel or the MDDIAI personal-data violators register.

**HireRank alignment:** on-prem / in-perimeter custody, local LLM (Ollama) for Automation options, human HITL before MCP ([UC-08](use-cases/UC-08-automation-hitl-loop.md)), tenant RLS, and append-only audit — are designed to support these rules, not replace them.

---



## 1. Core infrastructure mandates (strictly required)



### 1.1 Physical server localization (Art. 12 RK PD Law)

- **Rule:** Collection, accumulation, and storage of RK citizens’ personal data (PD) must happen on **physical servers inside Kazakhstan**.
- **Avoid:** Primary candidate DB / CV object storage solely on foreign clouds (AWS, Azure, GCP) without an RK golden record.
- **Do:**
  - Host main database and resume files with local providers (e.g. Cloud.kz, PS.kz, Kaztelecom).
  - **Hybrid:** golden record stays in RK; abroad only depersonalized IDs (UUIDs) or dynamically anonymized/encrypted payloads — never full names, contacts, IIN, or raw CVs as the system of record.
- **Core (this repo):** self-host assumes customer perimeter in RK for RK citizens’ PD. Document deploy locality for Enterprise sales.



### 1.2 Encryption

- **At rest:** AES-256 (or equivalent) for DB, resume files (PDF/DOCX), and sensitive logs.
- **In transit:** TLS 1.3 for all API and UI connections.



### 1.3 Immutable access logging (audit trail)

Regulators demand: “Who looked at citizen X’s data, and when?”

- Implement a **read-only, non-modifiable** (append-only) audit log.
- Log at least: `[Timestamp] [User_ID] [Action] [Candidate_ID] [tenant_id]`, including:
  - open CV / profile;
  - reveal or copy phone / email;
  - download resume;
  - export list (e.g. Excel);
  - share / assign to hiring manager;
  - delete / anonymize;
  - HITL option accept / MCP execution (tie to [Memory](MEMORY.md) Outcomes where applicable).
- HireRank already ships auth-oriented audit foundations; **candidate PD access** must meet this bar for RK audit readiness.



### 1.4 Granular (separated) consent

- Bundled “By registering you agree to everything” is **illegal**.
- Independent checkboxes, **empty by default** (no pre-ticks):
  - [ ] Process my PD to consider me for vacancy `[Vacancy name]` *(required for that application)*.
  - [ ] Keep my PD in the company talent pool / personnel reserve for N months/years *(optional)*.
  - [ ] Cross-border transfer of my PD to `[list of countries]` *(optional; required if foreign HR or foreign processors apply)*.
- Candidate may accept vacancy review and refuse talent-pool storage.



### 1.5 Data minimization (IIN and ID scans)

- **Forbidden** on initial application: requiring IIN, ID/passport scans, diploma scans, certificates as a gate to apply.
- IIN / identity documents only at **final offer** or **Security Service (SB)** verification stage — when purpose justifies it.



### 1.6 Government consent-control integration (Enterprise horizon 2026–2030)

- Integration with the state **personal-data consent control** service (citizens see which companies hold their PD via eGov.kz) becomes an **Enterprise expectation**.
- Core MVP: design consent records and withdrawal APIs so a later connector can sync; do not invent opaque consent stores that block that path.

---



## 2. Sourcing pitfalls (where products break)



### 2.1 Cold sourcing / import without consent (hh.kz, LinkedIn)

- **Trap:** Recruiter parses a profile via ATS extension into the company DB → company becomes PD operator **without** subject consent.
- **Required flow:**
  1. Imported profile → status `Pending consent` / `Awaiting consent` (not usable for hiring automation until confirmed).
  2. Immediate SMS and/or email with link: confirm consent to process the profile.
  3. If **no confirmation within 3 business days** (product default; some guidance cites 24–48h for first ping — still delete by day 3) → **hard-delete** the profile (not soft-archive).
- Do **not** leave imported PD in the DB “forever just in case.”



### 2.2 Cross-border transfer (international companies)

- **Trap:** HR in London/Moscow viewing an Almaty candidate in the ATS **is** cross-border transfer.
- **Risk:** Transfer forbidden if the recipient country / processor lacks adequate PD protection, or without explicit consent naming destinations.
- **Do:** Consent text must include cross-border clause with **specific countries**; enforce access controls and logging; prefer RK-hosted sessions for RK PD.



### 2.3 Blind foreign AI processing

- **Trap:** Sending raw resumes (names, emails, phones) to foreign LLMs (e.g. OpenAI API) for ranking/summary.
- **Risk:** Cross-border transfer to unverified third parties without explicit consent.
- **Do (HireRank default):**
  - Prefer **local, sandboxed LLM** (Ollama / in-perimeter) for Automation option generation ([AUTOMATION.md](AUTOMATION.md), [UC-08](use-cases/UC-08-automation-hitl-loop.md)).
  - If any foreign AI is ever used: strip identifiers first **and** obtain explicit consent covering that transfer; never silent exfil of CVs.



### 2.4 AI scoring and solely automated decisions

- Citizen has the right **not** to be subject to a decision based **solely** on automated processing.
- **Ban:** silent auto-reject / auto-hire / rank-grave as product outcome (aligns with [UC-08](use-cases/UC-08-automation-hitl-loop.md) and [GDPR.md](GDPR.md) Art. 22 posture).
- **Do:** Human confirms the action (Telegram HITL / recruiter button); log who confirmed and that AI only **suggested** options.

---



## 3. Data lifecycle and UI best practices



### 3.1 UI masking

- In pipeline / list views, mask phone, email, IIN (e.g. `+7 (701) ***-**-12`, `k****@domain.kz`).
- Full reveal only on explicit click → **write audit log entry**.



### 3.2 Retention and consent renewal

- No indefinite “keep forever for AI training.”
- Inactive candidate after configured period (e.g. **1–2 years**):
  1. Send consent-renewal request;
  2. If ignored → **hard-delete** or **irreversible anonymization** (strip FIO/contacts; keep dry stats only if legally justified, e.g. “Developer, 3y experience, declined”).
- Talent-pool consent must expire with the period stated in the checkbox.



### 3.3 Right to be forgotten / revoke consent

- Explicit **“Forget me” / revoke consent** in candidate cabinet (or equivalent form).
- On revoke: purge PD from active DB **and** backup rotations within the statutory window, or true crypto-shred / irreversible anonymization (see also [GDPR.md](GDPR.md) Art. 17 posture).
- Soft-delete alone is **not** enough for compliance.



### 3.4 Automated consent withdrawal path

- Design for automatic enforcement when consent expires or is revoked via portal/API (horizon: state consent services) — do not rely on manual HR cleanup only.

---



## 4. Product team cheat sheet


| ATS function         | Wrong (fines / blocks)                        | Right (RK best practice)                                                      |
| -------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Registration / apply | “By registering you agree to everything”      | Separate empty checkboxes: vacancy processing vs talent pool vs cross-border  |
| Resume import        | Parse from hh.kz / LinkedIn and keep forever  | Import → pending consent → notify → no reply in 3 business days → hard-delete |
| Storage              | Primary PD in AWS Frankfurt “because cheaper” | Golden record in RK; outside RK only non-PD cache / anonymized IDs            |
| Deletion             | Status “Archive” while PD remains             | Physical delete or full PD field nulling / crypto-shred                       |
| List UI              | Full phones/emails visible                    | Masked; unmask on click + audit log                                           |
| AI                   | Auto-reject on score / foreign LLM on raw CV  | Local LLM suggests options; human HITL; log confirmation                      |
| Retention            | Keep CVs indefinitely                         | Timer + renewal ping + delete/anonymize                                       |


---



## 5. HireRank deployment notes (Core vs multi-tenant)

- **Core (this repo):** one enterprise per instance (`TENANT_ID`); customer is expected to host in their perimeter — for RK citizens’ PD that perimeter should be **in RK**.
- **Enterprise / SaaS later:** each tenant’s PD isolation (RLS / DB-per-tenant) must still respect localization: RK tenants’ golden records in RK regions; no silent cross-tenant or cross-border leakage.
- Landing / Enterprise sales: a clear claim helps compliance review, e.g. *“Compliant with the RK Personal Data Law; servers for RK PD located in RK (Cloud.kz / PS.kz)”* — only if deploy truth matches.

---



## 6. ATS audit readiness checklist (RK)

- [ ] Golden-record DB and CV storage for RK citizens on servers **inside RK**.
- [ ] Hybrid abroad paths carry only anonymized IDs / stripped payloads, never raw PD as SoR.
- [ ] Consent checkboxes empty by default; vacancy / pool / cross-border separated.
- [ ] Cross-border consent lists concrete countries when foreign access or processors exist.
- [ ] Imported profiles: pending consent → notify → hard-delete within **3 business days** without confirm.
- [ ] IIN / ID scans blocked on public apply; allowed only at offer / SB stage.
- [ ] Immutable audit log for PD views, downloads, exports, shares, deletes, HITL accepts.
- [ ] List UI masks phone / email / IIN; reveal is logged.
- [ ] Retention policy + renewal ping; inactive delete or irreversible anonymize.
- [ ] Candidate “Forget me” / revoke consent purges PD from DB and backup strategy.
- [ ] No solely automated hire/reject; Automation = suggestions + human HITL ([UC-08](use-cases/UC-08-automation-hitl-loop.md)).
- [ ] Prefer in-perimeter LLM; no silent raw-CV send to foreign AI APIs.
- [ ] Enterprise roadmap: consent records compatible with state consent-control / eGov visibility.

---



## 7. Ongoing legal hygiene

- Reconcile regularly with MDDIAI personal-data violators register and updated ICRIAP guidance.
- Have local IT lawyers audit User Agreement / consent copy before Enterprise go-live.
- This file + [GDPR.md](GDPR.md) + [use-cases/](use-cases/) form the compliance north star; product docs must not invent weaker behavior.

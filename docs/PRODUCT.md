# HireRank — Product

Vision: [PASSPORT.md](PASSPORT.md). **Behavioral Source of Truth:** [use-cases/](use-cases/) (MVP: UC-01 through UC-07).
**Compliance (strict):** [ATS_COMPLIANCE_RK.md](laws/ATS_COMPLIANCE_RK.md) (RK — primary), [GDPR.md](laws/GDPR.md) (EU / West).

## What it is

**HireRank** is an ATS for HR teams. The MVP manages vacancies, collects
resumes through an HTML form, attaches candidates to vacancies, and tracks
their hiring status. LLM analysis and recommendations are post-MVP.

MVP flow: vacancy CRUD → HTML resume intake → candidate attached to vacancy →
manual HR status updates. Post-MVP flow: vacancy prompt → LLM analysis → HR
confirmation → status update ([UC-08](use-cases/UC-08-automation-hitl-loop.md)).

## Job-to-be-done

| Stakeholder | Job |
|-------------|-----|
| TA / HR | Absorb flood intake into a tenant pool without losing candidates in mail/Excel |
| Hiring manager | See candidates attached to a vacancy and process them in the ATS |
| CHRO / CISO | Keep personal data and process logic inside the perimeter; prove meaningful human oversight |
| Organization | Keep candidate records, resumes, vacancies, and decisions in one tenant-scoped system |

## Unique value (five theses)

1. **A working ATS first** — vacancies, resumes, candidate pipeline, and statuses.
2. **Human-controlled recommendations** — future LLM output supports HR and never silently changes status.
3. **Tenant-owned candidate data** — resumes and decisions remain isolated and auditable.
4. **Simple intake** — a candidate or operator can submit an HTML resume form.
5. **Delivery choice later** — web first, then Telegram or WhatsApp if useful.

## Product principles

The product should be useful before any AI integration. Candidate evaluation is
an HR workflow, not an autonomous decision engine. Future LLM output is a
draft recommendation with evidence; the final action belongs to HR.

## Anti-patterns (do not position as the product)

| Pattern | Why rejected |
|---------|----------------|
| LLM without a human confirmation | Candidate status must not change silently |
| Chatbot as pipeline owner | Conversation is not the ATS workflow |
| Raw resume sent to an uncontrolled model | Candidate data requires a documented processing boundary |
| Telegram/WhatsApp before web workflow | Delivery channels must not replace the core ATS |

**Strict rule:** [UC-08](use-cases/UC-08-automation-hitl-loop.md) is post-MVP;
the MVP must not depend on it.

## See also

- [use-cases/](use-cases/) — **behavioral SoT** (MVP north star)
- [ATS_COMPLIANCE_RK.md](laws/ATS_COMPLIANCE_RK.md) — RK compliance (strict)
- [GDPR.md](laws/GDPR.md) — EU / West privacy (strict)
- [ARCHITECTURE.md](ARCHITECTURE.md) — planes
- [AUTOMATION.md](AUTOMATION.md) — implements UC-08
- [MEMORY.md](MEMORY.md) — option-choice history
- [ROADMAP.md](ROADMAP.md) — delivery

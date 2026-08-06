# HIRERANK — Product Vision & Goals

Behavioral Source of Truth: [use-cases/](use-cases/) (Automation HITL: [UC-08](use-cases/UC-08-automation-hitl-loop.md)).
**Compliance (strict):** [ATS_COMPLIANCE_RK.md](ATS_COMPLIANCE_RK.md) (RK — primary), [GDPR.md](GDPR.md) (EU / West). See north star in [use-cases/README.md](use-cases/README.md).

## The ATS for High-Volume Applicant Flow

**HIRERANK** — On-Premise ATS with **HireRank Automation**: AI Automation **events** with **HITL**, executed via **MCP tools**, with **[Memory](MEMORY.md)** storing the history of option choices — for hiring **bureaucracy** (interview, assign, paperwork, …), not a resume calculator.

MVP event: `resume.uploaded`. The same loop extends to further domain events later ([UC-08](use-cases/UC-08-automation-hitl-loop.md)).

> **Pith (pitch):** HIRERANK turns management instructions into automatic *suggestions* for bureaucratic next steps: event → MCP-backed options → Telegram HITL → MCP under `tenant_id` → choice into Memory. The agency stops depending on key-HR turnover — the process asset stays with the tenant.

> Architecturally, **HIRERANK ≠ casual ATS AI** (scoring + chatbot). See [How Automation Differs](#how-automation-differs-from-ats-today).

---

## Problem Statement

Major tech, manufacturing, and government organizations face three parallel crises in 2026

**Operational:** the flow of resumes is growing faster than the TA staff. Candidates are "hanging" in the mail and Excel, managers don't see people in time, and statuses are lost. A classic ATS is a base + pipeline, not a flood intake with a pool and instant manager ping.

**Regulatory and trust:** cloud-based ATS (Greenhouse, Workday, and similar) plus SaaS-AI make the employer a controller without a personal data perimeter and without provable human oversight. Government agencies are especially afraid of the **black box** that decides who to hire and who to reject.

**Institutional:** The hiring logic lives in the heads of key HRs. Firing = losing the process. Manual scoring rules and SOPs in Word are not trained by real department decisions.

### Cloud-based ATS vulnerabilities (2026–2030)

1. **Jurisdiction and data sovereignty** — CLOUD Act vs GDPR Art. 48 / national personal-data laws (e.g. 152-FZ); the controller is responsible, TIA/DPIA are complicated.
2. **AI as high-risk (EU AI Act Annex III §4)** — screening/evaluating candidates; deployer-responsibilities by ~December 2027; the vendor often has a black box with no audit trail for the buyer.
3. **GDPR Art. 22** — automatic filtering without meaningful human involvement.
4. **Per-seat + vendor lock-in** — price from seats; models and history from the vendor.
5. **CISO / CHRO / government customer fears** — personal data in other people's LLMs; bias claims; no continuity of knowledge with HR turnover.

### Problems for candidates and recruiters

| Hole | Essence | HIRERANK response |
|------|------|----------------|
| Invisibility through rank | Soft-reject without audit | No silent rank-graves; queue + HITL buttons for bureaucracy steps |
| Keyword feeds AI-slop | Stuffing beats matcher | Evidence + tenant [Memory](MEMORY.md), not denser score |
| Parser breaks format | Candidate "missing" | Fail-soft parse + flag to human |
| Auto-disposition (HiredScore / *Mobley v. Workday*) | Filter to human eye | Automation **only suggests**; human clicks button |
| Black-box fit | No "why" | Telegram: Memory + 2–3 MCP options with rationale |
| AI in the recruiter's office | The manager doesn't see it | Telegram/email is the primary HITL surface |
| No orchestration | Resume base ≠ process | Automation events + HITL + MCP + Memory |

---

## Will There Be a Moat?

**Yes.** Moat is not “another LLM wrapper” or ATS UI.

**Moat statement:** AI Automation **events** with **HITL**, executed via **MCP tools**, with **[MEMORY.md](MEMORY.md)** storing the history of Automation option choices — for **bureaucracy**. The same event → HITL → MCP → Memory loop extends beyond MVP `resume.uploaded`.

| Layer | What compounds | Why hard to copy quickly |
|------|----------------|--------------------------|
| **Events + HITL + MCP** | Domain events → 2–3 MCP-backed bureaucracy options → human pick → FastMCP under `tenant_id` | Process wired to tenant tools and policy, not a generic chat |
| **[Memory](MEMORY.md)** | Option-choice history (Outcomes) + other run memory | Tenant practice corpus; leaves only with the client’s data |
| **HITL corpus** | Human-labeled buttons on Telegram | Continuous training signal without a separate label dataset |
| **On-prem custody** | Data and Memory inside the perimeter | Cloud SaaS cannot honestly match sovereignty |
| **Switching cost** | Nervous system: instructions → suggestions → MCP → Memory | Moving = losing the digital hiring-bureaucracy asset, not “export CSV” |

What **is not** moat alone: pretty chat UI, generic scoring criteria, or “we also do Telegram.”

Behavioral detail: [UC-08](use-cases/UC-08-automation-hitl-loop.md).

---

## How Automation Differs from ATS Today

HIRERANK Automation — **event-driven bureaucracy automation with HITL**, not a standing decision engine. Behavior SoT: [UC-08](use-cases/UC-08-automation-hitl-loop.md).

### What is in ATS AI (not a HIRERANK hero)

| Outline | Behavior | Principle |
|--------|-----------|---------|
| **AI Scoring** | Analyze / optionally `autoScoreOnApply` → scores | Application score in dashboard |
| **Chatbot** | Flag off by default; Q&A read-tools | Conversation, not pipeline owner |

### HireRank Automation (implements UC-08)

```mermaid
flowchart TB
  Event[Domain_event_MVP_resume_uploaded] --> Broker[Event_broker]
  Broker --> Run[Automation_agent_run]
  Run --> Vac[Read_open_vacancies]
  Run --> MemRead[Read_tenant_Memory]
  Run --> Tools[Load_MCP_tool_schemas]
  Run --> Gen[Generate_2_to_3_MCP_bureaucracy_options]
  Gen --> TG[Telegram_HITL_captcha]
  TG -->|manager_picks_button| MCP[MCP_Server_Action]
  MCP --> DB[DB_change_strict_tenant_id]
  MCP --> MemWrite[Write_Outcome_to_Memory]
  Run -.->|never| Box[Black_box_auto_hire_or_reject]
```

**Definition (aligned with UC-08):** On a matching event (MVP `resume.uploaded`), Automation builds context (resume/vacancies + Memory + MCP schemas), proposes **2–3 MCP-backed bureaucracy options**, delivers HITL via Telegram (and SMTP awareness), executes **only** the human-selected tool under `tenant_id`, and writes the **Outcome** into [Memory](MEMORY.md). Future events reuse the same contract.

| Measurement | any ATS AI | HIRERANK Automation |
|-----------|----------------------|---------------------|
| **Job-to-be-done** | Calculate fit | Bureaucracy: event → options → HITL → MCP → Memory |
| **Rules** | Admin criteria under JD | Outcomes in Memory + management instructions |
| **Artifact** | Score / breakdown | **2–3 option buttons** + Memory rationale |
| **HITL UX** | Weak web confirm | Telegram one-button captcha |
| **Execution** | Human clicks ATS | **MCP** after selection |
| **Training** | Static criteria | Memory per selection + comment |
| **Black box** | Risk `autoScoreOnApply` | **Ban:** AI does not make final decisions |
| **Moat** | Weak | Events + HITL + MCP + Memory for bureaucracy |

**Strict rule:** owned by [UC-08](use-cases/UC-08-automation-hitl-loop.md) DoD — Memory path, ≥2 HITL options, human before MCP, Outcome in Memory, no silent score.

---

## Unique Value Proposition (UVP)

1. **Data never leaves your perimeter** — On-Prem; personal data and Memory stay in the loop.
2. **Automation co-pilot for bureaucracy, not black box** — MCP options; human button; MCP writes only the selection.
3. **[Memory](MEMORY.md) = org asset** — option-choice history survives turnover.
4. **Built for the flood, not seats** — intake events + Telegram HITL.
5. **Selective MCP execution** — only the human-chosen option; extensible to more events.

---

## Doc index

| Doc | Purpose |
|-----|---------|
| **[use-cases/](use-cases/)** | **Behavioral Source of Truth** (UC-01…UC-08) — MVP north star |
| **[ATS_COMPLIANCE_RK.md](ATS_COMPLIANCE_RK.md)** | **RK law / ATS compliance — strict** |
| **[GDPR.md](GDPR.md)** | **EU / West privacy & Art. 22 HITL — strict** |
| [PRODUCT.md](PRODUCT.md) | Problem, UVP, JTBD, anti-patterns |
| [ARCHITECTURE.md](ARCHITECTURE.md) | HireRank / Automation / FastMCP / n8n planes |
| [AUTOMATION.md](AUTOMATION.md) | Implements UC-08 (detail, not SoT) |
| [MEMORY.md](MEMORY.md) | Option-choice history + other run memory |
| [ROADMAP.md](ROADMAP.md) | Delivery phases |
| [FEAUTERS.md](FEAUTERS.md) | Feature catalog (must match use-cases) |
| [openapi/](openapi/) | REST API contract |

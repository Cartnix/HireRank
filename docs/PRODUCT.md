# HireRank — product source of truth

**Business goal:** an accounting-office recruiter enters a paper resume once; HR receives a candidate with an AI-prepared first analysis instead of carrying the resume between offices and analyzing it from scratch. A candidate may also submit their own resume.

**Positioning:** **AI Agent HR Copilot with human-in-the-loop (HITL) and MCP**. New resume → AI proposes up to three explained next actions → HR reviews and explicitly confirms one → only then does an authorized tool execute it. The ATS is the tenant-scoped system of record and the place where HR makes the decision; chat is not the product.

## Source-of-truth order

1. This document defines the business goal, roles and product boundary.
2. [Use cases](use-cases/README.md) define observable behavior and acceptance. If an implementation or roadmap contradicts a use case, resolve the conflict here and in the use case before coding.
3. [Kazakhstan compliance](laws/ATS_COMPLIANCE_RK.md) is mandatory; [GDPR](laws/GDPR.md) applies where relevant. Neither product speed nor a demo weakens these constraints.
4. [Roadmap](ROADMAP.md), [architecture](ARCHITECTURE.md), [RBAC](RBAC.md), schemas, OpenAPI and the frontend demo describe delivery or implementation; they do not redefine the business goal.

## One end-to-end outcome

This is the target flow across phases. The current Phase 1 MVP is the manual ATS
flow in UC-01–07 and ROADMAP.md; automatic AI, MCP and confirmed memory follow it.

1. Authenticated recruiter or candidate submits structured data and a resume file/reference into the chosen tenant. Candidate starts **unprocessed**, even if they suggest a vacancy.
2. Intake emits a tenant-scoped event. HR and relevant managers see the new candidate; AI analysis starts automatically using the resume as **untrusted data**, vacancy context, the current HR prompt and optional, explicitly enabled memory. A missing vacancy/prompt or model failure leaves the candidate in the pool for manual HR handling.
3. A validated draft with **at most three** allowed actions shows a separate rationale and evidence for each, green/red flags, context and any uncertainty. Neither draft nor notification changes status or sends a candidate email.
4. HR opens the ATS, checks resume and manager feedback, selects a suggested action or a permitted manual action, and explicitly confirms it. Only after authorization, same-tenant validation and confirmation may an MCP/tool adapter perform the selected mutation. Record proposed options, HR choice, execution result and actor in an auditable history; retries must not duplicate the action.
5. HR may decline memory storage or verify a manually written/generated explanation before a structured Markdown record is saved. Memory is sent to future analysis only while HR's switch is on.

## Roles and ownership

| Actor | Responsibility |
|---|---|
| Candidate | Submit own resume, view current tenant's open vacancies and own profile; never see other candidates. |
| Accounting recruiter | Register a received resume once; no candidate disposition. This is a **target product role**; existing backend `recruiter` must not silently be treated as equivalent. |
| HR | Configure criteria and allowed actions; review AI and manager feedback; own all candidate decisions and approvals. |
| Manager | Read authorized tenant candidates, provide feedback and propose contact; cannot independently send conflicting mail or change hiring status. |
| Administrator | Tenant, access and technical administration; not an alternative approver for an AI hiring decision. |

**Success measures for a pilot:** time from intake to first HR decision, recruiter handoff steps avoided, percentage of new resumes with a reviewable AI draft, rate of evidence corrections by HR, and percentage of status mutations with a recorded HR approval. Measure against the current paper workflow; no savings or accuracy figures are asserted yet.

## Trace from business goal to acceptance

| Business need | Behavior | Delivery gate |
|---|---|---|
| Stop carrying the same paper resume between offices | [UC-01](use-cases/UC-01-candidate-registration.md), [UC-02](use-cases/UC-02-hr-candidate-intake.md) | [Resume intake / M4](ROADMAP.md#milestone-4--resume-intake-and-vacancy-attachment): one stored intake and visible HR pool. |
| HR receives a prepared candidate | [UC-08](use-cases/UC-08-automation-hitl-loop.md) | [LLM analysis / M7](ROADMAP.md#milestone-7--llm-analysis): automatic validated Top-3 or explicit manual fallback. |
| Avoid conflicting HR/manager actions | [UC-04](use-cases/UC-04-candidate-assignment.md), [UC-05](use-cases/UC-05-manager-vacancies-and-assignments.md), [UC-08](use-cases/UC-08-automation-hitl-loop.md) | [Approval / M8](ROADMAP.md#milestone-8--hr-approval-and-controlled-execution): HR approval precedes one authorized mutation. |
| Preserve accountable, optional learning | [UC-07](use-cases/UC-07-enterprise-isolation.md), [UC-08](use-cases/UC-08-automation-hitl-loop.md) | [Memory / M10](ROADMAP.md#milestone-10--confirmed-memory): auditable tenant scope and opt-in confirmed memory. |

## Boundaries

- **Core target:** web intake, ATS pool/vacancies, automatic explainable analysis, HR confirmation, approved tool action, tenant/RBAC enforcement, notifications and audit. The underlying ATS path must still work when AI fails.
- **Optional:** confirmed Markdown memory, candidate email only after HR approval, later delivery channels. Telegram/WhatsApp, ranking engines, autonomous rejection and third-party raw-resume processing are not required for this core flow.
- **Current implementation:** ATS auth, RLS and CRUD foundations exist; real resume upload, model execution, MCP transport and the end-to-end server gate remain work in progress. The separate Next.js Copilot demo uses browser-local JSON and mock MCP. Its role switch and tenant filter are **not security controls**. The ATS vacancy,
candidate and career pages now call the real API; browser-local Copilot data is
kept only in explicitly labelled demo features. See [roadmap](ROADMAP.md) for acceptance gates.

No model may autonomously change status, send mail, write memory, or call a mutating tool. A prompt or resume cannot override server-side authorization and the approval gate.

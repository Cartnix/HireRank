# HireRank use cases

## North star

HireRank is an ATS for HR teams. The MVP helps an operator manage vacancies,
collect resumes through an HTML form, attach candidates to vacancies, and move
them through a simple hiring pipeline. LLM recommendations are post-MVP.

## Source-of-truth order

| Priority | Document | Role |
|---|---|---|
| 1 - MVP | This folder | Behavioral source of truth for the working ATS |
| 2 - Law | [ATS_COMPLIANCE_RK.md](../laws/ATS_COMPLIANCE_RK.md) | Kazakhstan personal-data constraints |
| 3 - Law | [GDPR.md](../laws/GDPR.md) | EU privacy and human-oversight constraints |

Product, architecture, OpenAPI, and feature documents may explain these flows,
but must not invent behavior that is absent here.

## Product boundary

The MVP is useful without an LLM:

- vacancy CRUD;
- candidate/resume intake through an HTML form;
- attaching a resume to a vacancy;
- candidate status and pipeline management;
- role-based access and tenant isolation.

Post-MVP may add LLM analysis using an HR-defined prompt and recommendations.
The LLM recommends and explains; a human confirms the final action. Telegram,
WhatsApp, and web notifications are delivery channels, not the core domain.

## Index

| UC | Purpose |
|---|---|
| [UC-01](UC-01-candidate-registration.md) | Candidate submits an HTML resume form and enters the hiring pool |
| [UC-02](UC-02-hr-candidate-intake.md) | HR/operator submits a resume and attaches it to a vacancy |
| [UC-03](UC-03-vacancy-management.md) | Administrator and HR vacancy CRUD |
| [UC-04](UC-04-candidate-assignment.md) | HR/admin attaches a candidate to a vacancy and updates status |
| [UC-05](UC-05-manager-vacancies-and-assignments.md) | Manager reads vacancies and candidates in the web app |
| [UC-06](UC-06-admin-panel-access.md) | Admin panel access |
| [UC-07](UC-07-enterprise-isolation.md) | Tenant isolation for ATS data |

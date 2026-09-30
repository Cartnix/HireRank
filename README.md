# HireRank — ATS \+ AI HR Copilot

 **HireRank** — ATS \+ HR Copilot for enterprise HR teams.\
Base product — ATS, modified business outline — **HR Copilot**: the resume gets into the tenant pool, AI generates an explicable Top-3 draft, but any hiring action is performed **only after HR confirmation**.

```
Resume → Tenant Pool → AI Top-3 Draft → HR Confirmation → Tool/MCP Action → Audit
```

 ## Core capabilities

 - **Vacancies:** Create and manage HR/admin vacancies.
- **Candidate intake:** the candidate submits the resume himself or the HR/recruiter registers the received resume **once**.
- **Candidate pool:** The candidate belongs to tenant and is isolated by roles.
- **AI HR Copilot:** Automatic draft of up to 3 evidence-backed actions/recommendations.
- **Human-in-the-loop:** AI does not change hiring state and does not start actions without HR confirmation.
- **Manager workflow:** manager can view vacancies, offer feedback/contact, but does not replace HR approval.
- **Confirmed memory:** HR explicitly confirms and enables decision memory.
- **MCP / tools:** After HR confirmation, the permitted action can be performed by the tool/MCP.
- **Audit:** AI solutions, confirmations, and tool execution must be auditable.
- **Fallback:**ATS intake and manual HR work remain fully operational without AI.

 ## Core / Enterprise Self-Hosted / SaaS

 One code outline. Enterprise and SaaS are not separate forks.

 |  | **Core** | **Enterprise Self-Hosted** | **SaaS** |
| --- | --- | --- | --- |
| Deployment | Single instance | Customer K8s / scaling | HireRank cloud |
| Tenancy | One tenant / `TENANT_ID` | Tenant isolation | True multi-tenant |
| Auth sessions | Memory for example | Redis | Redis |
| Background jobs | In-process | Celery / workers | Celery / managed queues |
| Files | Local volume | Shared FS / S3 | S3 |
| Enterprise | — | SSO/SAML, audit, enterprise controls | Billing, provisioning, tenant controls |
| AI/MCP | Optional | Full HR Copilot stack | Full HR Copilot stack |

**Important for Enterprise:** With multiple backend replicas, an external session store (Redis) is needed; tenant data, AI memory, notifications, and execution context should not cross tenant boundary.

 ## Non-negotiable business rules

 1. **Tenant isolation** — candidate, AI, memory, notifications, and execution data remain inside tenant and role scope.
2. **AI does not accept the final hiring decision.**
3. **Any subsequent action is only after explicit HR confirmation.**
4. **Decision memory — only after explicit HR confirmation.**
5. **Intake ≠ disposition:** The new candidate has a business status of `New/Unprocessed`; technical `unassigned` does not mean that the candidate has been rejected or passed screening.
6. **AI unavailable ≠ ATS unavailable:** The manual process should continue to work.
7. **Compliance is required:** Kazakhstan personal-data/ATS requirements and GDPR are mandatory restrictions.
8. **Mock frontend is not considered a production implementation.**

 ## Stack

 - **Frontend:** Next.js
- **Backend:** FastAPI
- **DB:** PostgreSQL
- **Sessions / scale:** Redis
- **Storage:** S3-compatible
- **Workers:** Celery / equivalent
- **Edge:** Traefik, Cloudflare
- **AI integration:** LLM + MCP/tools with mandatory HITL

 ## Product outcome

 > **Resume entered once → tenant pool → AI produces up to three evidence-backed actions → HR confirms → approved tool/MCP execution → audit.**

 This is the main business contour **HR Copilot**; a regular ATS remains an independent working fallback contour.
Локальный Dev mode использует отдельную PostgreSQL БД и доступен только superuser: [настройка, миграции и единые тестовые данные](docs/DEV_DATABASE.md).

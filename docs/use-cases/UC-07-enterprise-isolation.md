# UC-07 Tenant isolation

Actor:
Administrator, HR Operator, Manager, Candidate

Preconditions:
- Authenticated (cookie or Bearer session)
- JWT contains `tenant_id`

Flow:
1. User sends a request to a tenant-scoped endpoint.
2. System resolves the tenant from JWT.
3. System filters all data by the same tenant.
4. Access to foreign tenant data is rejected.
5. Future LLM evaluation and notification data follow the same tenant boundary.

DoD:
- All tenant-scoped entities are filtered by `tenant_id`.
- A user cannot read or modify another tenant's data.
- Candidate cannot access vacancies from another tenant.
- Candidate resumes, vacancies, applications, and future evaluation records are tenant-scoped.
- Cross-tenant requests fail with `403` or `404` depending on the endpoint.

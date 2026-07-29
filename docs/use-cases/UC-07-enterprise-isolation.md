# UC-07 Tenant isolation

Actor:
Administrator, HR Operator, Manager, Candidate

Preconditions:
- Authenticated
- JWT contains `tenant_id`

Flow:
1. User sends a request to a tenant-scoped endpoint.
2. System resolves the tenant from JWT.
3. System filters all data by the same tenant.
4. Access to foreign tenant data is rejected.
5. MCP tools likewise refuse cross-tenant mutations.

DoD:
- All tenant-scoped entities are filtered by `tenant_id`.
- A user cannot read or modify another tenant's data.
- Candidate cannot access vacancies from another tenant.
- Precedent Memory and Outcomes are tenant-scoped.
- Cross-tenant requests fail with `403` or `404` depending on the endpoint.

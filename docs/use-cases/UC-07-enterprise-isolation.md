# UC-07 Enterprise isolation

Actor:
Administrator, HR Operator, Manager, Candidate

Preconditions:
- Authenticated
- JWT contains `enterprise_id`

Flow:
1. User sends a request to an enterprise-scoped endpoint.
2. System resolves the enterprise from JWT.
3. System filters all data by the same enterprise.
4. Access to foreign enterprise data is rejected.

DoD:
- All enterprise-scoped entities are filtered by `enterprise_id`.
- A user cannot read or modify another enterprise's data.
- Candidate cannot access vacancies from another enterprise.
- Cross-tenant requests fail with `403` or `404` depending on the endpoint.

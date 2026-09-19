# UC-01 Candidate registration

Actor:
Candidate

Preconditions:
- Authenticated (browser session via HttpOnly cookie JWT, or Bearer dual-mode)
- Tenant is resolved from JWT `tenant_id`

Flow:
1. Candidate opens the HTML resume form.
2. Candidate submits the form.
3. System validates and stores the resume data and file/reference.
4. Candidate record is created or updated.
5. Candidate enters the pool with status `Unassigned`.
6. Candidate may select an open vacancy when the flow permits it.

DoD:
- HTML resume form is accepted and stored as structured candidate data.
- Candidate is stored inside the current tenant only.
- Default status is `Unassigned`.
- No LLM or automatic hiring decision is required for the MVP.

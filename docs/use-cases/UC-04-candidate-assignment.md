# UC-04 Candidate assignment

Actor:
Administrator, HR operator

Preconditions:
- Authenticated
- Role is `administrator` or `hr`
- Candidate and vacancy belong to the same tenant

Flow:
1. Administrator selects a candidate.
2. Administrator selects a vacancy.
3. Administrator confirms the assignment.
4. System links the candidate to the vacancy.
5. Candidate status changes to `Assigned`.
6. Notification is created for the tenant.

Notes:
- LLM recommendations are not required for this MVP flow.

DoD:
- Assignment is allowed for Administrator or HR (manual path).
- Cross-tenant assignment is rejected.
- Candidate status becomes `Assigned`.
- Manager receives the updated assignment view.

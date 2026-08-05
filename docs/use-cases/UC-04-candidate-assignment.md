# UC-04 Candidate assignment

Actor:
Administrator

Preconditions:
- Authenticated
- Role is `administrator`
- Candidate and vacancy belong to the same tenant

Flow:
1. Administrator selects a candidate.
2. Administrator selects a vacancy.
3. Administrator confirms the assignment.
4. System links the candidate to the vacancy.
5. Candidate status changes to `Assigned`.
6. Notification is created for the tenant.

Notes:
- The same assignment result may be produced by MCP after a human-selected Automation option (UC-08). Manual admin assignment remains valid.

DoD:
- Assignment is allowed only for Administrator (manual path).
- Cross-tenant assignment is rejected.
- Candidate status becomes `Assigned`.
- Manager receives the updated assignment view.

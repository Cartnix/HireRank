# UC-04 Candidate assignment

Actor:
Administrator

Preconditions:
- Authenticated
- Role is `administrator`
- Candidate and vacancy belong to the same enterprise

Flow:
1. Administrator selects a candidate.
2. Administrator selects a vacancy.
3. Administrator confirms the assignment.
4. System links the candidate to the vacancy.
5. Candidate status changes to `Assigned`.
6. Notification is created for the enterprise.

DoD:
- Assignment is allowed only for Administrator.
- Cross-tenant assignment is rejected.
- Candidate status becomes `Assigned`.
- Manager receives the updated assignment view.

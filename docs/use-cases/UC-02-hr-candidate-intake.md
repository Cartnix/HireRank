# UC-02 HR candidate intake

Actor:
HR Operator

Preconditions:
- Authenticated
- Role is `hr_operator`
- Tenant is resolved from JWT `enterprise_id`

Flow:
1. HR Operator opens the candidate intake screen.
2. HR Operator submits a JSON questionnaire.
3. System validates the payload and enterprise scope.
4. Candidate profile is created.
5. Candidate is added to the enterprise pool.
6. AI ranking is requested.
7. Notification is created.

DoD:
- Only authenticated HR Operator can perform the flow.
- Payload is processed as JSON.
- Candidate belongs to the same enterprise.
- Ranking is recalculated after save.

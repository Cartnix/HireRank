# UC-02 HR candidate intake

Actor:
HR

Preconditions:
- Authenticated
- Role is `hr`
- Tenant is resolved from JWT `tenant_id` (Core: singleton TENANT_ID)

Flow:
1. HR opens the candidate intake screen.
2. HR submits a JSON questionnaire.
3. System validates the payload and tenant scope.
4. Candidate profile is created.
5. Candidate is added to the tenant pool.
6. Event `resume.uploaded` is published for Automation (behavioral SoT: [UC-08](UC-08-automation-hitl-loop.md)).
7. Notification is created.

DoD:
- Only authenticated HR can perform the flow.
- Payload is processed as JSON.
- Candidate belongs to the same tenant.
- `resume.uploaded` is published; Automation may propose HITL bureaucracy options (UC-08) — no auto-disposition; choices land in [Memory](../MEMORY.md).

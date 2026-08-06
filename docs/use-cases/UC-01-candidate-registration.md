# UC-01 Candidate registration

Actor:
Candidate

Preconditions:
- Authenticated
- Tenant is resolved from JWT `tenant_id`

Flow:
1. Candidate opens the intake form.
2. Candidate submits the JSON questionnaire from the frontend.
3. System validates the payload.
4. Candidate record is created or updated.
5. Status is set to `Unassigned`.
6. Event `resume.uploaded` is published for Automation (behavioral SoT: [UC-08](UC-08-automation-hitl-loop.md)).
7. Notification is created.

DoD:
- Questionnaire is accepted as JSON.
- Candidate is stored inside the current tenant only.
- Default status is `Unassigned`.
- No auto hire/reject and no silent rank-score as product outcome.
- `resume.uploaded` is available to Automation (UC-08); [Memory](../MEMORY.md) will hold option-choice history after HITL.
- Notification is created for the tenant.

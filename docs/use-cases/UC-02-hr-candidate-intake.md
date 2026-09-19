# UC-02 HR candidate intake

Actor:
HR

Preconditions:
- Authenticated
- Role is `hr`
- Tenant is resolved from JWT `tenant_id` (Core: singleton TENANT_ID)

Flow:
1. HR/operator opens the candidate intake screen.
2. HR/operator uploads or completes an HTML resume form.
3. System validates the payload and tenant scope.
4. Candidate profile and resume reference are created.
5. HR/operator selects a vacancy and attaches the candidate to it.
6. Candidate is added to the vacancy pipeline.

DoD:
- Only authenticated HR can perform the flow.
- HTML form data and the resume reference are stored.
- Candidate belongs to the same tenant.
- Candidate can be viewed and processed from the selected vacancy.
- No LLM integration is required for the MVP.

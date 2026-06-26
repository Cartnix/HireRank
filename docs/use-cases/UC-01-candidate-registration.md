# UC-01 Candidate registration

Actor:
Candidate

Preconditions:
- Authenticated
- Tenant is resolved from JWT `enterprise_id`

Flow:
1. Candidate opens the intake form.
2. Candidate submits the JSON questionnaire from the frontend.
3. System validates the payload.
4. Candidate record is created or updated.
5. Status is set to `Unassigned`.
6. AI ranking is requested for the enterprise.
7. Notification is created.

DoD:
- Questionnaire is accepted as JSON.
- Candidate is stored inside the current enterprise only.
- Default status is `Unassigned`.
- Ranking score is calculated in range `0-10`.
- Notification is created for the enterprise.

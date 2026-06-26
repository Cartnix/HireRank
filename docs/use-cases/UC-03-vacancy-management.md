# UC-03 Vacancy management

Actor:
Administrator

Preconditions:
- Authenticated
- Role is `administrator`
- Tenant is resolved from JWT `enterprise_id`

Flow:
1. Administrator opens the vacancy management screen.
2. Administrator creates, updates, or deletes a vacancy.
3. System validates the payload.
4. Vacancy is stored under the current enterprise.
5. Notification is created when relevant.

DoD:
- Vacancy CRUD is available only to Administrator.
- Vacancy data is limited to the current enterprise.
- Manager, HR Operator, and Candidate cannot access vacancy CRUD.

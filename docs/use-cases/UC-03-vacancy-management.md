# UC-03 Vacancy management

Actor:
Administrator, HR Operator

Preconditions:
- Authenticated
- Role is `administrator` or `hr`
- Tenant is resolved from JWT `tenant_id`

Flow:
1. Administrator or HR opens the vacancy management screen.
2. They create, update, or delete a vacancy.
3. System validates the payload.
4. Vacancy is stored under the current tenant.
5. Notification is created when relevant.

DoD:
- Vacancy CRUD is available to Administrator and HR.
- Vacancy data is limited to the current tenant.
- Manager, Recruiter, and Candidate cannot access vacancy CRUD.

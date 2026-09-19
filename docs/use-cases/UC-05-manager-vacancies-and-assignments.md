# UC-05 Manager vacancies and assignments view

Actor:
Manager

Preconditions:
- Authenticated
- Role is `manager`
- Tenant is resolved from JWT `tenant_id`

Flow:
1. Manager opens the vacancies list.
2. Manager opens the assigned candidates view.
3. System returns only data from the same tenant.
4. Manager reviews assigned candidates and vacancy coverage.
5. Manager sees the current candidate status and resume information in the web app.

DoD:
- Manager has read-only access in the web ATS.
- Manager cannot create, edit, or delete vacancies.
- Manager cannot change vacancy ownership or access another tenant.
- Manager cannot access another tenant.
- Notifications are outside the MVP decision flow.

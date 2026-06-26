# UC-05 Manager vacancies and assignments view

Actor:
Manager

Preconditions:
- Authenticated
- Role is `manager`
- Tenant is resolved from JWT `enterprise_id`

Flow:
1. Manager opens the vacancies list.
2. Manager opens the assigned candidates view.
3. System returns only data from the same enterprise.
4. Manager reviews assigned candidates and vacancy coverage.
5. Manager receives notifications in-app and by email.

DoD:
- Manager has read-only access.
- Manager cannot create, edit, or delete vacancies.
- Manager cannot assign candidates.
- Manager cannot access another enterprise.
- Manager notifications are available via SMTP/Outlook.

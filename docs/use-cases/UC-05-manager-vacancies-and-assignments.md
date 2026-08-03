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
5. Manager receives notifications in-app and by email; primary action surface for AIDE decisions is Telegram (UC-08).

DoD:
- Manager has read-only access in the web ATS.
- Manager cannot create, edit, or delete vacancies.
- Manager cannot assign candidates via web ATS (decisions go through Telegram HITL when AIDE is active).
- Manager cannot access another tenant.
- Delivery channels: in-app, email, Telegram for HITL.

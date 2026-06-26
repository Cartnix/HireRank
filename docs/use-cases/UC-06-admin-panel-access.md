# UC-06 Admin panel access

Actor:
Administrator

Preconditions:
- Authenticated
- Role is `administrator`

Flow:
1. User opens the admin panel route.
2. System checks the role from JWT claims.
3. Administrator gets access.
4. Other roles are rejected with `403`.

DoD:
- Only Administrator can reach admin panel endpoints.
- HR Operator, Manager, and Candidate are blocked.
- Admin panel operates only on the current enterprise.

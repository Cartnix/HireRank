# Role dashboards demo

Enable **Демо проекта** in the dashboard sidebar. The demo role selector applies to all dashboard sections and never changes the authenticated account or backend permissions. Disable demo to return to server ATS data.

There is one fixed organization. Existing browser storage is migrated by removing legacy second-tenant records. Demo mutations persist in localStorage; resume files retain only their names.

- `/dashboard`: role summary and links.
- `/dashboard/candidates`: HR/admin pool, manager's candidates assigned to Product Designer, candidate's own Aliya profile, or recruiter resume intake. Includes search, skill/stage/vacancy filters and score/name/date sorting. Scores are deterministic word matches, not model confidence. Profile and Copilot panels open and close independently and respect reduced motion. Only HR confirms AI recommendations and saves checked reasons to memory. Managers can submit feedback for HR review.
- `/dashboard/jobs`: all roles read vacancies; HR/admin create, edit, open/close and delete them. Vacancies with assigned candidates cannot be deleted.
- `/dashboard/copilot`: only Copilot prompt, allowed recommendations and memory toggle; HR/admin access.
- `/dashboard/audit`: administrator-only demo journal and reset.

Candidate identity (`c-aliya`) and manager scope (`v-design`) are fixed demo fixtures. Recruiters cannot read the candidate pool. Notifications are filtered by role and manager scope. This is a local role preview, not an authorization boundary; live ATS uses server RBAC and ABAC from `docs/RBAC.md`.

Contracts and deterministic evaluation engine remain in `frontend/features/hr-copilot/model`. The frontend does not call a real model or MCP and does not send email. Native backend ATS screens remain available when demo is disabled; Copilot settings and its audit are labelled demo pending backend integration.

# Role dashboards demo

Under an authenticated owner session, enable **Dev mode** in the dashboard sidebar. The demo role selector applies to all dashboard sections and never changes the authenticated account or backend permissions. Disable demo to return to server ATS data.

There is one fixed organization. Existing browser storage is migrated by removing legacy second-tenant records. Dev mutations and deterministic analysis/memory persist in the separate PostgreSQL development dataset; browser storage is not authoritative. Resume files retain only their names, not uploaded bytes.

- `/dashboard`: role summary and links.
- `/dashboard/candidates`: HR/admin pool, manager's candidates assigned to Product Designer, candidate's own Aliya profile, or recruiter resume intake. Includes search, skill/stage/vacancy filters and score/name/date sorting. Scores are deterministic word matches, not model confidence. Profile, vacancy and Copilot inspectors share one selected candidate. They use page scrolling, stack at narrower widths and offer quick navigation. Only HR confirms AI recommendations and saves checked reasons to memory. Managers can submit feedback for HR review.
- `/dashboard/jobs`: all roles read vacancies; HR/admin create, edit, open/close and delete them. Vacancies with assigned candidates cannot be deleted.
- `/dashboard/copilot`: Copilot prompt, green/red flags, allowed recommendations, memory toggle and optional memory.md text; HR/admin/owner access. Settings are also available outside Dev mode through a tenant-isolated API.
- `/dashboard/audit`: administrator-only demo journal and reset.

Candidate identity (`c-aliya`) and manager scope (`v-design`) are fixed demo fixtures. Recruiters cannot read the candidate pool. Notifications are filtered by role and manager scope. This is a local role preview, not an authorization boundary; live ATS uses server RBAC and ABAC from `docs/RBAC.md`.

Contracts and deterministic evaluation engine remain in `frontend/features/hr-copilot/model`. The frontend does not call a real model or MCP and does not send email. Native backend ATS screens remain available when demo is disabled; Ordinary Copilot settings persist on the server; production model/MCP execution is still pending. Dev audit/results/memory persist only in the isolated development dataset. See [verification](verification/CANDIDATE_COPILOT.md).

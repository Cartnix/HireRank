# HireRank — RBAC

Roles and permission matrix for the self-hosted (Core) ATS.

## Roles

| Role | Description |
|------|-------------|
| `administrator` | Admin panel and user management; full vacancy CRUD; resume upload |
| `hr` | Vacancy CRUD; candidate intake; resume upload |
| `manager` | Read vacancies; scoped candidate read (assigned + pending HITL); HITL decisions via Telegram |
| `recruiter` | Resume upload; read all enterprise vacancies |
| `candidate` | Resume upload; read vacancies; own candidate profile |

`administrator` is created via seed / admin tooling, not public registration.

Registerable roles: `candidate`, `hr`, `manager`, `recruiter`.

## Permission matrix (MVP)

| Permission | administrator | hr | manager | recruiter | candidate |
|------------|:-------------:|:--:|:-------:|:---------:|:---------:|
| `admin.panel` | yes | no | no | no | no |
| `users.manage` | yes | no | no | no | no |
| `vacancy.create` | yes | yes | no | no | no |
| `vacancy.update` | yes | yes | no | no | no |
| `vacancy.delete` | yes | yes | no | no | no |
| `vacancy.read` | yes | yes | yes | yes | yes |
| `resume.upload` | yes | yes | no | yes | yes |
| `candidate.read` | yes (all) | yes (all) | scoped | no | own |

Manager scope and candidate “own” checks are enforced on domain endpoints (ABAC), not only by the static matrix.

## Hidden multi-tenancy

Core / Open Source deploys one enterprise per instance. `tenant_id` remains on rows and in JWT for schema compatibility; the app always binds to `TENANT_ID` from env (seeded default tenant). PostgreSQL RLS enforces `tenant_id = current_setting('app.current_tenant')`.

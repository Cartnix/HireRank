# Future / unimplemented OpenAPI

Specs here describe product surfaces that are **not** mounted in FastAPI yet.
They are kept for UC / SoT planning and must **not** be referenced from
[`../openapi.yaml`](../openapi.yaml) or FE `openapi-typescript` generation.

| Area | Paths | Schemas |
|------|-------|---------|
| Notifications | `paths/notifications.yaml` | `schemas/notification.yaml` |
| Admin panel (`/admin/*`) | `paths/admin.yaml` | (uses User schemas) |
| Automations / HITL / Memory | `paths/automation.yaml` | `schemas/automation.yaml` |

When an area ships, move its files back under `docs/openapi/paths|schemas/` and
re-add `$ref`s in `openapi.yaml`, then run `npm run generate:api-types` in `frontend/`.

# OpenAPI (implemented)

- **Contract (FE + docs):** [`openapi.yaml`](./openapi.yaml) — only routes that exist in FastAPI.
- **Future drafts:** [`future/`](./future/README.md) — not codegen’d.
- **Generate TypeScript:** from `frontend/`:

```bash
npm run generate:api-types
```

Writes `frontend/shared/api/schema.d.ts` via `openapi-typescript`.
Import granular path/schema types in feature modules; do not dump overrides into one hand-written mega-types file.

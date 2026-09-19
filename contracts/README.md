# Generated contracts

This directory contains generated contract artifacts. Do not edit generated
files by hand.

## Export

From `frontend/` run:

```bash
npm run contracts:export
```

For CI or a local drift check:

```bash
npm run contracts:check
```

The command performs three steps:

1. imports the FastAPI application and writes `backend/openapi.json`;
2. extracts FastAPI component schemas to `backend/schemas.json`;
3. converts frontend Zod schemas to `frontend/schemas.json`;
4. generates TypeScript API types in `frontend/api.d.ts` and copies the same
   generated file to `frontend/shared/api/schema.d.ts` for application imports.

FastAPI is the only source for HTTP OpenAPI. TypeScript/Zod is the source for
frontend-only form validation schemas. `openapi-typescript` generates the
frontend API types from the backend export; it does not create a second API
contract. CI fails when committed generated artifacts drift from source.

Orval or Hey API are intentionally not used yet: the frontend currently has a
small custom `fetch` client and no TanStack Query hook layer. Add a generated
client only when that client abstraction is actually adopted.
# Generated contracts

This directory contains generated contract artifacts. Do not edit generated
files by hand.

## Export

From `frontend/` run:

```bash
npm run contracts:export
```

The command performs three steps:

1. imports the FastAPI application and writes `backend/openapi.json`;
2. extracts FastAPI component schemas to `backend/schemas.json`;
3. converts frontend Zod schemas to `frontend/schemas.json`;
4. generates TypeScript API types in `frontend/api.d.ts` and copies the same
   generated file to `frontend/shared/api/schema.d.ts` for application imports.

FastAPI is the source for HTTP OpenAPI. TypeScript/Zod is the source for
frontend-only form validation schemas. Comparing these exports is a separate
step and must not be replaced with a hand-maintained OpenAPI file.
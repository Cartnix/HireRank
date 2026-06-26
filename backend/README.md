# Backend

FastAPI backend scaffold for HireAI.

## Structure

- `app/api/v1/routers` - HTTP layer grouped by domain.
- `app/core` - settings, tenancy, security, shared exceptions.
- `app/db` - SQLAlchemy base and session factory.
- `app/models` - ORM entities.
- `app/schemas` - Pydantic DTOs.
- `app/services` - use cases and business rules.
- `app/repositories` - persistence access layer.
- `app/integrations/ai` - local ranking integration.
- `app/tasks` - background jobs.

## Supabase Setup

The backend expects Supabase for authentication and PostgreSQL storage.

Required environment variables:

- `DATABASE_URL` or `SUPABASE_DATABASE_URL` - Supabase Postgres connection string.
- `SUPABASE_JWT_SECRET` - JWT secret used to validate Supabase access tokens.
- `SUPABASE_URL` - Supabase project URL.
- `SUPABASE_ANON_KEY` - public client key, if the backend needs to echo Supabase config.
- `SUPABASE_SERVICE_ROLE_KEY` - service role key for privileged server-side operations.

Optional auth overrides:

- `SUPABASE_JWT_AUDIENCE` - defaults to `authenticated`.
- `SUPABASE_JWT_ISSUER` - set when you want issuer validation enabled explicitly.

## Run

```bash
python main.py
```
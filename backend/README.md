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

## Run

```bash
python main.py
```
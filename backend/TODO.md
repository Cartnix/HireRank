## Backend optimization

- [ ] Refactor SQLModel models typing to SQLAlchemy 2.0 style
  - Create separate branch: `refactor/sqlalchemy-2-typing`
  - Investigate migration from SQLModel `Field` definitions to SQLAlchemy 2.0 `Mapped` / `mapped_column`
  - Improve mypy strict compatibility
  - Remove unnecessary `type: ignore`
  - Review nullable fields (`datetime | None`, relationships, etc.)
  - Check Alembic migrations compatibility
  - Run full backend tests after migration

# next
Ещё одна проблема у тебя есть

В override:

frontend:
  build:
    args:
      - NEXT_PUBLIC_API_URL=http://localhost:8000

А в основном compose:

NEXT_PUBLIC_API_URL=https://api.${DOMAIN}

В CI получается:

frontend build -> localhost:8000

Но это не причина unhealthy, просто потом могут падать frontend-тесты.

# next

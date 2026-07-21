## Backend optimization

- [ ] Refactor SQLModel models typing to SQLAlchemy 2.0 style
  - Create separate branch: `refactor/sqlalchemy-2-typing`
  - Investigate migration from SQLModel `Field` definitions to SQLAlchemy 2.0 `Mapped` / `mapped_column`
  - Improve mypy strict compatibility
  - Remove unnecessary `type: ignore`
  - Review nullable fields (`datetime | None`, relationships, etc.)
  - Check Alembic migrations compatibility
  - Run full backend tests after migration

"""CI schema guardrails: tenant-owned tables must carry tenant_id + FORCE RLS.

Fails the build if a developer adds an ATS domain table without isolation
columns/policies.
"""

from __future__ import annotations

from sqlalchemy import text

from tests.conftest import session_context

# Explicit registry — expand when new tenant-scoped domain tables ship.
REQUIRED_TENANT_TABLES = (
    "user",
    "vacancy",
    "pipeline_stage",
    "candidate",
    "application",
    "interview",
    "scorecard",
)


async def test_required_tenant_tables_have_tenant_id_column() -> None:
    async with session_context() as session:
        rows = (
            await session.execute(
                text(
                    """
                SELECT table_name, column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = ANY(:tables)
                  AND column_name = 'tenant_id'
                """
                ),
                {"tables": list(REQUIRED_TENANT_TABLES)},
            )
        ).all()
    present = {table for table, _col in rows}
    missing = set(REQUIRED_TENANT_TABLES) - present
    assert not missing, (
        f"tenant-scoped tables missing tenant_id column: {sorted(missing)}"
    )


async def test_required_tenant_tables_force_rls() -> None:
    async with session_context() as session:
        rows = (
            await session.execute(
                text(
                    """
                SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public'
                  AND c.relname = ANY(:tables)
                """
                ),
                {"tables": list(REQUIRED_TENANT_TABLES)},
            )
        ).all()
    by_name = {name: (rls, force) for name, rls, force in rows}
    for table in REQUIRED_TENANT_TABLES:
        assert table in by_name, f"missing table {table}"
        assert by_name[table] == (True, True), (
            f"{table} must ENABLE + FORCE ROW LEVEL SECURITY"
        )


async def test_no_orphan_public_table_named_like_ats_without_tenant_id() -> None:
    """Heuristic: *candidate* / *vacancy* / *interview* / *scorecard* / *application*
    / *pipeline* public base tables must expose tenant_id (catches forgotten columns).
    """
    async with session_context() as session:
        suspects = (
            (
                await session.execute(
                    text(
                        """
                SELECT t.table_name
                FROM information_schema.tables t
                WHERE t.table_schema = 'public'
                  AND t.table_type = 'BASE TABLE'
                  AND (
                    t.table_name LIKE '%candidate%'
                    OR t.table_name LIKE '%vacancy%'
                    OR t.table_name LIKE '%interview%'
                    OR t.table_name LIKE '%scorecard%'
                    OR t.table_name LIKE '%application%'
                    OR t.table_name LIKE '%pipeline%'
                  )
                  AND NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns c
                    WHERE c.table_schema = t.table_schema
                      AND c.table_name = t.table_name
                      AND c.column_name = 'tenant_id'
                  )
                """
                    )
                )
            )
            .scalars()
            .all()
        )
    assert suspects == [], (
        f"ATS-like tables without tenant_id (add column + FORCE RLS): {suspects}"
    )

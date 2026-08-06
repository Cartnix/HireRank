"""TDD: ATS domain schema (issue #24) — tables, FKs, uniques, indexes.

Red until Alembic creates vacancy/pipeline_stage/candidate/application/
interview/scorecard and drops legacy item.
"""

from __future__ import annotations

from sqlalchemy import text

from tests.conftest import session_context

ATS_TABLES = (
    "vacancy",
    "pipeline_stage",
    "candidate",
    "application",
    "interview",
    "scorecard",
)


async def test_ats_tables_exist_and_item_is_gone() -> None:
    async with session_context() as session:
        rows = (
            (
                await session.execute(
                    text(
                        """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = ANY(:names)
                """
                    ),
                    {"names": list(ATS_TABLES) + ["item"]},
                )
            )
            .scalars()
            .all()
        )
    present = set(rows)
    assert set(ATS_TABLES).issubset(present)
    assert "item" not in present


async def test_ats_foreign_keys() -> None:
    expected = {
        ("vacancy", "tenant_id", "tenant", "id"),
        ("vacancy", "created_by", "user", "id"),
        ("pipeline_stage", "tenant_id", "tenant", "id"),
        ("pipeline_stage", "vacancy_id", "vacancy", "id"),
        ("candidate", "tenant_id", "tenant", "id"),
        ("candidate", "user_id", "user", "id"),
        ("application", "tenant_id", "tenant", "id"),
        ("application", "vacancy_id", "vacancy", "id"),
        ("application", "candidate_id", "candidate", "id"),
        ("application", "current_stage_id", "pipeline_stage", "id"),
        ("interview", "tenant_id", "tenant", "id"),
        ("interview", "application_id", "application", "id"),
        ("interview", "interviewer_id", "user", "id"),
        ("scorecard", "tenant_id", "tenant", "id"),
        ("scorecard", "interview_id", "interview", "id"),
    }
    async with session_context() as session:
        rows = (
            await session.execute(
                text(
                    """
                SELECT
                    tc.table_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table,
                    ccu.column_name AS foreign_column
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                 AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                 AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_schema = 'public'
                  AND tc.table_name = ANY(:tables)
                """
                ),
                {"tables": list(ATS_TABLES)},
            )
        ).all()
    found = {(t, c, ft, fc) for t, c, ft, fc in rows}
    missing = expected - found
    assert not missing, f"Missing FKs: {missing}"


async def test_ats_unique_constraints() -> None:
    async with session_context() as session:
        rows = (
            await session.execute(
                text(
                    """
                SELECT
                    t.relname AS table_name,
                    i.relname AS index_name,
                    array_agg(a.attname ORDER BY x.n) AS columns
                FROM pg_class t
                JOIN pg_index ix ON t.oid = ix.indrelid
                JOIN pg_class i ON i.oid = ix.indexrelid
                JOIN pg_namespace n ON n.oid = t.relnamespace
                CROSS JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS x(attnum, n)
                JOIN pg_attribute a
                  ON a.attrelid = t.oid AND a.attnum = x.attnum
                WHERE n.nspname = 'public'
                  AND ix.indisunique
                  AND t.relname = ANY(:tables)
                GROUP BY t.relname, i.relname
                """
                ),
                {"tables": list(ATS_TABLES)},
            )
        ).all()
    by_cols = {(table, tuple(cols)) for table, _idx, cols in rows}
    assert ("candidate", ("tenant_id", "email")) in by_cols
    assert ("application", ("vacancy_id", "candidate_id")) in by_cols
    assert ("pipeline_stage", ("vacancy_id", "sort_order")) in by_cols


async def test_ats_composite_indexes() -> None:
    async with session_context() as session:
        index_defs = (
            await session.execute(
                text(
                    """
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND tablename = ANY(:tables)
                """
                ),
                {"tables": list(ATS_TABLES)},
            )
        ).all()
    defs = " | ".join(f"{name}:{defn}" for name, defn in index_defs)
    assert "vacancy" in defs and "tenant_id" in defs
    assert "pipeline_stage" in defs
    assert "candidate" in defs
    assert "application" in defs and "vacancy_id" in defs
    assert "interview" in defs and "application_id" in defs
    assert "scorecard" in defs and "interview_id" in defs


async def test_ats_composite_tenant_foreign_keys() -> None:
    """Cross-tenant FK poisoning defense: (tenant_id, child_fk) → parent(tenant_id, id)."""
    expected_frags = {
        "FOREIGN KEY (tenant_id, vacancy_id) REFERENCES vacancy(tenant_id, id)",
        "FOREIGN KEY (tenant_id, candidate_id) REFERENCES candidate(tenant_id, id)",
        "FOREIGN KEY (tenant_id, current_stage_id) REFERENCES pipeline_stage(tenant_id, id)",
        "FOREIGN KEY (tenant_id, application_id) REFERENCES application(tenant_id, id)",
        "FOREIGN KEY (tenant_id, interview_id) REFERENCES interview(tenant_id, id)",
    }
    async with session_context() as session:
        defs = (
            (
                await session.execute(
                    text(
                        """
                SELECT pg_get_constraintdef(oid)
                FROM pg_constraint
                WHERE contype = 'f'
                  AND conname LIKE 'fk_%_tenant'
                """
                    )
                )
            )
            .scalars()
            .all()
        )
    joined = " | ".join(defs)
    missing = [frag for frag in expected_frags if frag not in joined]
    assert not missing, f"Missing composite tenant FKs: {missing}; have: {defs}"

    async with session_context() as session:
        cons = (
            await session.execute(
                text(
                    """
                SELECT conname, pg_get_constraintdef(oid)
                FROM pg_constraint
                WHERE conrelid = 'public.scorecard'::regclass
                  AND contype = 'c'
                """
                )
            )
        ).all()
    assert cons, "scorecard must have a CHECK constraint on rating"
    joined = " ".join(defn for _, defn in cons).lower()
    assert "rating" in joined
    assert "1" in joined and "5" in joined

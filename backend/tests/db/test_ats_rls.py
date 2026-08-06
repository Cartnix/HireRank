"""TDD: ATS FORCE RLS isolation (issue #24).

Philosophy: break-ins under hirerank_app + app.current_tenant — not happy-path.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import text
from sqlalchemy.engine import CursorResult
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash
from app.models import Tenant, User, UserRole
from tests.conftest import bypass_rls_session, session_context
from tests.utils.utils import random_email, random_lower_string

FOREIGN_TENANT_ID = uuid.UUID("11111111-1111-4111-8111-111111111111")

ATS_TABLES = (
    "vacancy",
    "pipeline_stage",
    "candidate",
    "application",
    "interview",
    "scorecard",
)


async def _ensure_foreign_tenant(session: AsyncSession) -> Tenant:
    tenant = await session.get(Tenant, FOREIGN_TENANT_ID)
    if tenant:
        return tenant
    tenant = Tenant(
        id=FOREIGN_TENANT_ID,
        slug=f"foreign-{FOREIGN_TENANT_ID.hex[:8]}",
        name="Foreign Tenant B",
    )
    session.add(tenant)
    await session.commit()
    await session.refresh(tenant)
    return tenant


async def _seed_foreign_ats_graph(session: AsyncSession) -> dict[str, uuid.UUID]:
    """Insert a full ATS row graph for Tenant B (bypass RLS)."""
    await _ensure_foreign_tenant(session)
    interviewer = User(
        email=random_email(),
        hashed_password=get_password_hash(random_lower_string()),
        role=UserRole.MANAGER,
        tenant_id=FOREIGN_TENANT_ID,
        first_name="Foreign",
        last_name="Manager",
        is_active=True,
    )
    session.add(interviewer)
    await session.flush()

    vacancy_id = uuid.uuid4()
    stage_id = uuid.uuid4()
    candidate_id = uuid.uuid4()
    application_id = uuid.uuid4()
    interview_id = uuid.uuid4()
    scorecard_id = uuid.uuid4()

    await session.execute(
        text(
            """
            INSERT INTO vacancy (
                id, tenant_id, title, status, created_by, created_at, updated_at,
                requirements
            ) VALUES (
                :id, :tenant_id, 'Foreign Role', 'open', :created_by,
                now(), now(), '[]'::jsonb
            )
            """
        ),
        {
            "id": vacancy_id,
            "tenant_id": FOREIGN_TENANT_ID,
            "created_by": interviewer.id,
        },
    )
    await session.execute(
        text(
            """
            INSERT INTO pipeline_stage (
                id, tenant_id, vacancy_id, stage_name, sort_order
            ) VALUES (:id, :tenant_id, :vacancy_id, 'Applied', 0)
            """
        ),
        {
            "id": stage_id,
            "tenant_id": FOREIGN_TENANT_ID,
            "vacancy_id": vacancy_id,
        },
    )
    await session.execute(
        text(
            """
            INSERT INTO candidate (
                id, tenant_id, email, status, questionnaire, created_at, updated_at
            ) VALUES (
                :id, :tenant_id, :email, 'unassigned', '{}'::jsonb, now(), now()
            )
            """
        ),
        {
            "id": candidate_id,
            "tenant_id": FOREIGN_TENANT_ID,
            "email": random_email(),
        },
    )
    await session.execute(
        text(
            """
            INSERT INTO application (
                id, tenant_id, vacancy_id, candidate_id, current_stage_id,
                status, created_at, updated_at
            ) VALUES (
                :id, :tenant_id, :vacancy_id, :candidate_id, :stage_id,
                'active', now(), now()
            )
            """
        ),
        {
            "id": application_id,
            "tenant_id": FOREIGN_TENANT_ID,
            "vacancy_id": vacancy_id,
            "candidate_id": candidate_id,
            "stage_id": stage_id,
        },
    )
    await session.execute(
        text(
            """
            INSERT INTO interview (
                id, tenant_id, application_id, interviewer_id,
                scheduled_at, duration_minutes
            ) VALUES (
                :id, :tenant_id, :application_id, :interviewer_id,
                :scheduled_at, 45
            )
            """
        ),
        {
            "id": interview_id,
            "tenant_id": FOREIGN_TENANT_ID,
            "application_id": application_id,
            "interviewer_id": interviewer.id,
            "scheduled_at": datetime.now(UTC) + timedelta(days=1),
        },
    )
    await session.execute(
        text(
            """
            INSERT INTO scorecard (
                id, tenant_id, interview_id, rating, notes, submitted_at
            ) VALUES (
                :id, :tenant_id, :interview_id, 4, 'solid', now()
            )
            """
        ),
        {
            "id": scorecard_id,
            "tenant_id": FOREIGN_TENANT_ID,
            "interview_id": interview_id,
        },
    )
    await session.commit()
    return {
        "vacancy": vacancy_id,
        "pipeline_stage": stage_id,
        "candidate": candidate_id,
        "application": application_id,
        "interview": interview_id,
        "scorecard": scorecard_id,
    }


async def test_rls_force_enabled_on_all_ats_tables() -> None:
    async with session_context() as session:
        rows = (
            await session.execute(
                text(
                    """
                SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' AND c.relname = ANY(:tables)
                ORDER BY c.relname
                """
                ),
                {"tables": list(ATS_TABLES)},
            )
        ).all()
    by_name = {name: (rls, force) for name, rls, force in rows}
    for table in ATS_TABLES:
        assert by_name[table] == (True, True), f"{table} must ENABLE+FORCE RLS"


async def test_ats_rls_policies_use_nullif_uuid_cast() -> None:
    async with session_context() as session:
        quals = (
            await session.execute(
                text(
                    """
                SELECT tablename, qual
                FROM pg_policies
                WHERE schemaname = 'public'
                  AND policyname = 'tenant_isolation_policy'
                  AND tablename = ANY(:tables)
                """
                ),
                {"tables": list(ATS_TABLES)},
            )
        ).all()
    assert len(quals) == len(ATS_TABLES)
    for _table, qual in quals:
        assert qual is not None
        assert "NULLIF" in qual
        assert "app.current_tenant" in qual


async def test_core_tenant_cannot_read_foreign_ats_rows() -> None:
    async with bypass_rls_session() as seed:
        ids = await _seed_foreign_ats_graph(seed)

    for table in ATS_TABLES:
        async with session_context() as session:
            await session.execute(text("BEGIN"))
            await session.execute(text("SET row_security = on"))
            await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
            await session.execute(
                text("SELECT set_config('app.current_tenant', :tenant, true)"),
                {"tenant": str(settings.TENANT_ID)},
            )
            found = (
                await session.execute(
                    text(f"SELECT id FROM {table} WHERE id = :id"),  # noqa: S608
                    {"id": ids[table]},
                )
            ).scalar_one_or_none()
            await session.execute(text("ROLLBACK"))
        assert found is None, f"Core tenant leaked {table} row from Tenant B"


async def test_foreign_tenant_guc_sees_only_own_ats_rows() -> None:
    async with bypass_rls_session() as seed:
        ids = await _seed_foreign_ats_graph(seed)

    for table in ATS_TABLES:
        async with session_context() as session:
            await session.execute(text("BEGIN"))
            await session.execute(text("SET row_security = on"))
            await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
            await session.execute(
                text("SELECT set_config('app.current_tenant', :tenant, true)"),
                {"tenant": str(FOREIGN_TENANT_ID)},
            )
            found = (
                await session.execute(
                    text(f"SELECT id FROM {table} WHERE id = :id"),  # noqa: S608
                    {"id": ids[table]},
                )
            ).scalar_one_or_none()
            await session.execute(text("ROLLBACK"))
        assert found == ids[table]


async def test_empty_tenant_guc_hides_all_ats_rows() -> None:
    async with bypass_rls_session() as seed:
        await _seed_foreign_ats_graph(seed)

    async with session_context() as session:
        await session.execute(text("SET row_security = on"))
        await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        await session.execute(text("SELECT set_config('app.current_tenant', '', true)"))
        for table in ATS_TABLES:
            ids = (
                (
                    await session.execute(text(f"SELECT id FROM {table}"))  # noqa: S608
                )
                .scalars()
                .all()
            )
            assert ids == [], f"empty GUC must hide {table}"


async def test_cannot_update_or_delete_foreign_ats_rows() -> None:
    async with bypass_rls_session() as seed:
        ids = await _seed_foreign_ats_graph(seed)

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await session.execute(text("SET row_security = on"))
        await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        await session.execute(
            text("SELECT set_config('app.current_tenant', :tenant, true)"),
            {"tenant": str(settings.TENANT_ID)},
        )
        update_result = await session.execute(
            text("UPDATE vacancy SET title = 'hacked' WHERE id = :id"),
            {"id": ids["vacancy"]},
        )
        assert isinstance(update_result, CursorResult)
        updated = update_result.rowcount
        delete_result = await session.execute(
            text("DELETE FROM candidate WHERE id = :id"),
            {"id": ids["candidate"]},
        )
        assert isinstance(delete_result, CursorResult)
        deleted = delete_result.rowcount
        await session.execute(text("ROLLBACK"))
    assert updated == 0
    assert deleted == 0


async def test_hirerank_app_role_has_no_bypassrls() -> None:
    async with session_context() as session:
        await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        app_bypass = (
            await session.execute(
                text("SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user")
            )
        ).scalar_one()
    assert app_bypass is False

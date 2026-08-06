"""Defense-in-Depth TDD: ATS attack vector matrix (DB layer, issue #24).

HTTP CRUD for vacancy/candidate/application/scorecard is not shipped yet.
These cases attack the same vectors at the Postgres RLS + constraint tier —
the layer API handlers will rely on. Dual-role: authorized tenant vs attacker.

When ATS routes land, mirror each case with httpx 200 vs 404/403 variants.
"""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.engine import CursorResult
from sqlalchemy.exc import DBAPIError, IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from tests.conftest import bypass_rls_session, session_context
from tests.db.ats_fixtures import FOREIGN_TENANT_ID, seed_ats_graph
from tests.utils.utils import random_email

ATS_TABLES = (
    "vacancy",
    "pipeline_stage",
    "candidate",
    "application",
    "interview",
    "scorecard",
)


async def _bind_tenant(session: AsyncSession, tenant_id: uuid.UUID) -> None:
    await session.execute(text("SET row_security = on"))
    await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
    await session.execute(
        text("SELECT set_config('app.current_tenant', :tenant, true)"),
        {"tenant": str(tenant_id)},
    )


# --- Dual-role IDOR (Jobs/Vacancies) ---------------------------------------


async def test_vacancy_idor_authorized_sees_row_attacker_does_not() -> None:
    """ATTACK: Tenant B guesses Tenant A vacancy UUID (IDOR)."""
    async with bypass_rls_session() as seed:
        alpha = await seed_ats_graph(seed, tenant_id=settings.TENANT_ID)

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await _bind_tenant(session, settings.TENANT_ID)
        title = (
            await session.execute(
                text("SELECT title FROM vacancy WHERE id = :id"),
                {"id": alpha["vacancy"]},
            )
        ).scalar_one_or_none()
        await session.execute(text("ROLLBACK"))
    assert title == "Role"

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await _bind_tenant(session, FOREIGN_TENANT_ID)
        leaked = (
            await session.execute(
                text("SELECT title FROM vacancy WHERE id = :id"),
                {"id": alpha["vacancy"]},
            )
        ).scalar_one_or_none()
        await session.execute(text("ROLLBACK"))
    assert leaked is None


# --- Global uniqueness leak (Candidates email) -----------------------------


async def test_candidate_email_unique_is_tenant_scoped_not_global() -> None:
    """ATTACK/leak: same email in Tenant A must not block Tenant B create."""
    shared_email = random_email()
    async with bypass_rls_session() as seed:
        await seed_ats_graph(seed, tenant_id=settings.TENANT_ID, email=shared_email)
        await seed_ats_graph(seed, tenant_id=FOREIGN_TENANT_ID, email=shared_email)

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await _bind_tenant(session, settings.TENANT_ID)
        core_count = (
            await session.execute(
                text("SELECT count(*) FROM candidate WHERE email = :email"),
                {"email": shared_email},
            )
        ).scalar_one()
        await session.execute(text("ROLLBACK"))

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await _bind_tenant(session, FOREIGN_TENANT_ID)
        foreign_count = (
            await session.execute(
                text("SELECT count(*) FROM candidate WHERE email = :email"),
                {"email": shared_email},
            )
        ).scalar_one()
        await session.execute(text("ROLLBACK"))

    assert int(core_count) == 1
    assert int(foreign_count) == 1


async def test_candidate_duplicate_email_within_tenant_rejected() -> None:
    shared_email = random_email()
    async with bypass_rls_session() as seed:
        await seed_ats_graph(seed, tenant_id=settings.TENANT_ID, email=shared_email)
        with pytest.raises((IntegrityError, DBAPIError)):
            await seed.execute(
                text(
                    """
                    INSERT INTO candidate (
                        id, tenant_id, email, status, questionnaire,
                        created_at, updated_at
                    ) VALUES (
                        :id, :tenant_id, :email, 'unassigned', '{}'::jsonb,
                        now(), now()
                    )
                    """
                ),
                {
                    "id": uuid.uuid4(),
                    "tenant_id": settings.TENANT_ID,
                    "email": shared_email,
                },
            )
            await seed.commit()


# --- Application stage cross-tenant poisoning ------------------------------


async def test_application_cannot_point_at_foreign_pipeline_stage() -> None:
    """ATTACK: PATCH current_stage_id to Tenant A stage while acting as B."""
    async with bypass_rls_session() as seed:
        alpha = await seed_ats_graph(seed, tenant_id=settings.TENANT_ID)
        omega = await seed_ats_graph(seed, tenant_id=FOREIGN_TENANT_ID)

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await _bind_tenant(session, FOREIGN_TENANT_ID)
        with pytest.raises((IntegrityError, DBAPIError)):
            await session.execute(
                text(
                    """
                    UPDATE application
                    SET current_stage_id = :foreign_stage
                    WHERE id = :app_id
                    """
                ),
                {
                    "foreign_stage": alpha["pipeline_stage"],
                    "app_id": omega["application"],
                },
            )
            await session.commit()
        await session.execute(text("ROLLBACK"))


# --- Scorecard / interview FK tree injection -------------------------------


async def test_scorecard_cannot_attach_to_foreign_interview() -> None:
    """ATTACK: POST scorecard linking Tenant A interview_id from Tenant B."""
    async with bypass_rls_session() as seed:
        alpha = await seed_ats_graph(seed, tenant_id=settings.TENANT_ID)

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await _bind_tenant(session, FOREIGN_TENANT_ID)
        with pytest.raises((IntegrityError, DBAPIError)):
            await session.execute(
                text(
                    """
                    INSERT INTO scorecard (
                        id, tenant_id, interview_id, rating, notes, submitted_at
                    ) VALUES (
                        :id, :tenant_id, :interview_id, 5, 'poison', now()
                    )
                    """
                ),
                {
                    "id": uuid.uuid4(),
                    # Attacker tries to claim the row as own tenant while
                    # pointing at Alpha's interview (classic FK tree poison).
                    "tenant_id": FOREIGN_TENANT_ID,
                    "interview_id": alpha["interview"],
                },
            )
            await session.commit()
        await session.execute(text("ROLLBACK"))


async def test_interview_cannot_attach_to_foreign_application() -> None:
    async with bypass_rls_session() as seed:
        alpha = await seed_ats_graph(seed, tenant_id=settings.TENANT_ID)
        omega = await seed_ats_graph(seed, tenant_id=FOREIGN_TENANT_ID)

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await _bind_tenant(session, FOREIGN_TENANT_ID)
        with pytest.raises((IntegrityError, DBAPIError)):
            await session.execute(
                text(
                    """
                    INSERT INTO interview (
                        id, tenant_id, application_id, interviewer_id,
                        scheduled_at, duration_minutes
                    ) VALUES (
                        :id, :tenant_id, :application_id, :interviewer_id,
                        now() + interval '1 day', 45
                    )
                    """
                ),
                {
                    "id": uuid.uuid4(),
                    "tenant_id": FOREIGN_TENANT_ID,
                    "application_id": alpha["application"],
                    "interviewer_id": omega["user"],
                },
            )
            await session.commit()
        await session.execute(text("ROLLBACK"))


# --- WITH CHECK: forged tenant_id on INSERT --------------------------------


async def test_insert_with_forged_tenant_id_is_rejected_by_with_check() -> None:
    """Body/tenant spoof: GUC=Core but INSERT tenant_id=Attacker."""
    async with bypass_rls_session() as seed:
        user = (
            await seed.execute(
                text('SELECT id FROM "user" WHERE tenant_id = :tid LIMIT 1'),
                {"tid": settings.TENANT_ID},
            )
        ).scalar_one()

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await _bind_tenant(session, settings.TENANT_ID)
        with pytest.raises((IntegrityError, DBAPIError)):
            await session.execute(
                text(
                    """
                    INSERT INTO vacancy (
                        id, tenant_id, title, status, created_by,
                        created_at, updated_at, requirements
                    ) VALUES (
                        :id, :tenant_id, 'spoof', 'draft', :created_by,
                        now(), now(), '[]'::jsonb
                    )
                    """
                ),
                {
                    "id": uuid.uuid4(),
                    "tenant_id": FOREIGN_TENANT_ID,
                    "created_by": user,
                },
            )
            await session.commit()
        await session.execute(text("ROLLBACK"))


# --- Dual-role mutate matrix -----------------------------------------------


@pytest.mark.parametrize("table", ATS_TABLES)
async def test_attacker_cannot_delete_authorized_ats_row(table: str) -> None:
    async with bypass_rls_session() as seed:
        alpha = await seed_ats_graph(seed, tenant_id=settings.TENANT_ID)

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await _bind_tenant(session, FOREIGN_TENANT_ID)
        delete_result = await session.execute(
            text(f"DELETE FROM {table} WHERE id = :id"),  # noqa: S608
            {"id": alpha[table]},
        )
        assert isinstance(delete_result, CursorResult)
        deleted = delete_result.rowcount
        await session.execute(text("ROLLBACK"))
    assert deleted == 0


# --- Runtime role guardrail ------------------------------------------------


async def test_rls_session_runtime_role_is_hirerank_app() -> None:
    """Superuser pitfall: after SET LOCAL ROLE, current_user must be app role."""
    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await _bind_tenant(session, settings.TENANT_ID)
        role = (await session.execute(text("SELECT current_user"))).scalar_one()
        await session.execute(text("ROLLBACK"))
    assert role == settings.RLS_APP_ROLE
    assert role not in {"postgres", "hirerank"}

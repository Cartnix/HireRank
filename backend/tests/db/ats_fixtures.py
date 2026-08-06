"""Shared ATS seed helpers for dual-tenant TDD (authorized vs attacker)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash
from app.models import Tenant, User, UserRole
from tests.utils.utils import random_email, random_lower_string

FOREIGN_TENANT_ID = uuid.UUID("11111111-1111-4111-8111-111111111111")


async def ensure_tenant(
    session: AsyncSession, tenant_id: uuid.UUID, *, name: str
) -> Tenant:
    tenant = await session.get(Tenant, tenant_id)
    if tenant:
        return tenant
    tenant = Tenant(
        id=tenant_id,
        slug=f"t-{tenant_id.hex[:8]}",
        name=name,
    )
    session.add(tenant)
    await session.commit()
    await session.refresh(tenant)
    return tenant


async def ensure_user(
    session: AsyncSession,
    *,
    tenant_id: uuid.UUID,
    role: UserRole = UserRole.MANAGER,
) -> User:
    user = User(
        email=random_email(),
        hashed_password=get_password_hash(random_lower_string()),
        role=role,
        tenant_id=tenant_id,
        first_name="ATS",
        last_name="User",
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def seed_ats_graph(
    session: AsyncSession,
    *,
    tenant_id: uuid.UUID,
    email: str | None = None,
) -> dict[str, uuid.UUID]:
    """Full vacancy→scorecard graph for one tenant (caller must bypass RLS)."""
    await ensure_tenant(
        session,
        tenant_id,
        name="Core" if tenant_id == settings.TENANT_ID else "Attacker",
    )
    if tenant_id == settings.TENANT_ID:
        creator = (
            await session.exec(select(User).where(User.tenant_id == tenant_id))
        ).first()
        if creator is None:
            creator = await ensure_user(session, tenant_id=tenant_id)
    else:
        creator = await ensure_user(session, tenant_id=tenant_id)

    vacancy_id = uuid.uuid4()
    stage_id = uuid.uuid4()
    candidate_id = uuid.uuid4()
    application_id = uuid.uuid4()
    interview_id = uuid.uuid4()
    scorecard_id = uuid.uuid4()
    cand_email = email or random_email()

    await session.execute(
        text(
            """
            INSERT INTO vacancy (
                id, tenant_id, title, status, created_by, created_at, updated_at,
                requirements
            ) VALUES (
                :id, :tenant_id, 'Role', 'open', :created_by, now(), now(), '[]'::jsonb
            )
            """
        ),
        {"id": vacancy_id, "tenant_id": tenant_id, "created_by": creator.id},
    )
    await session.execute(
        text(
            """
            INSERT INTO pipeline_stage (
                id, tenant_id, vacancy_id, stage_name, sort_order
            ) VALUES (:id, :tenant_id, :vacancy_id, 'Applied', 0)
            """
        ),
        {"id": stage_id, "tenant_id": tenant_id, "vacancy_id": vacancy_id},
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
        {"id": candidate_id, "tenant_id": tenant_id, "email": cand_email},
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
            "tenant_id": tenant_id,
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
            "tenant_id": tenant_id,
            "application_id": application_id,
            "interviewer_id": creator.id,
            "scheduled_at": datetime.now(UTC) + timedelta(days=1),
        },
    )
    await session.execute(
        text(
            """
            INSERT INTO scorecard (
                id, tenant_id, interview_id, rating, notes, submitted_at
            ) VALUES (:id, :tenant_id, :interview_id, 4, 'ok', now())
            """
        ),
        {
            "id": scorecard_id,
            "tenant_id": tenant_id,
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
        "user": creator.id,
    }

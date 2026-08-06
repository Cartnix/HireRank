"""Vacancy service — CRUD + default pipeline stages (UC-03)."""

from __future__ import annotations

import math
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlmodel import col, func, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models import (
    Application,
    ApplicationStatus,
    PipelineStage,
    Vacancy,
    VacancyStatus,
)
from app.schemas.ats import (
    CreateVacancyRequest,
    Pagination,
    PipelineStagePublic,
    UpdateVacancyRequest,
    VacancyPublic,
)

DEFAULT_STAGES: tuple[str, ...] = ("Applied", "Screen", "Interview", "Offer")


def _now() -> datetime:
    return datetime.now(UTC)


async def _assigned_candidate_ids(
    session: AsyncSession, vacancy_id: uuid.UUID
) -> list[uuid.UUID]:
    rows = (
        await session.exec(
            select(Application.candidate_id).where(
                Application.vacancy_id == vacancy_id,
                Application.status == ApplicationStatus.ACTIVE,
            )
        )
    ).all()
    return list(rows)


async def to_public(session: AsyncSession, vacancy: Vacancy) -> VacancyPublic:
    stages = (
        await session.exec(
            select(PipelineStage)
            .where(PipelineStage.vacancy_id == vacancy.id)
            .order_by(col(PipelineStage.sort_order))
        )
    ).all()
    assigned = await _assigned_candidate_ids(session, vacancy.id)
    return VacancyPublic(
        id=vacancy.id,
        tenant_id=vacancy.tenant_id,
        title=vacancy.title,
        department=vacancy.department,
        description=vacancy.description,
        requirements=list(vacancy.requirements or []),
        status=vacancy.status,
        created_by=vacancy.created_by,
        created_at=vacancy.created_at,
        updated_at=vacancy.updated_at,
        assigned_candidate_ids=assigned,
        stages=[PipelineStagePublic.model_validate(s) for s in stages],
    )


async def create_vacancy(
    *,
    session: AsyncSession,
    body: CreateVacancyRequest,
    created_by: uuid.UUID,
) -> Vacancy:
    vacancy = Vacancy(
        tenant_id=settings.TENANT_ID,
        title=body.title,
        department=body.department,
        description=body.description,
        requirements=list(body.requirements),
        status=body.status,
        created_by=created_by,
        created_at=_now(),
        updated_at=_now(),
    )
    session.add(vacancy)
    await session.flush()
    for order, name in enumerate(DEFAULT_STAGES):
        session.add(
            PipelineStage(
                tenant_id=settings.TENANT_ID,
                vacancy_id=vacancy.id,
                stage_name=name,
                sort_order=order,
            )
        )
    await session.commit()
    await session.refresh(vacancy)
    return vacancy


async def get_vacancy(
    *, session: AsyncSession, vacancy_id: uuid.UUID
) -> Vacancy | None:
    return (await session.exec(select(Vacancy).where(Vacancy.id == vacancy_id))).first()


async def list_vacancies(
    *,
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    status_filter: VacancyStatus | None = None,
    search: str | None = None,
) -> tuple[list[Vacancy], Pagination]:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    count_stmt = select(func.count()).select_from(Vacancy)
    list_stmt = select(Vacancy).order_by(col(Vacancy.created_at).desc())
    if status_filter is not None:
        count_stmt = count_stmt.where(Vacancy.status == status_filter)
        list_stmt = list_stmt.where(Vacancy.status == status_filter)
    if search:
        pattern = f"%{search}%"
        search_filt = or_(
            col(Vacancy.title).ilike(pattern),
            col(Vacancy.department).ilike(pattern),
        )
        count_stmt = count_stmt.where(search_filt)
        list_stmt = list_stmt.where(search_filt)
    total = (await session.exec(count_stmt)).one()
    rows = (
        await session.exec(list_stmt.offset((page - 1) * page_size).limit(page_size))
    ).all()
    pagination = Pagination(
        page=page,
        page_size=page_size,
        total=int(total),
        total_pages=max(1, math.ceil(int(total) / page_size)) if total else 0,
    )
    return list(rows), pagination


async def update_vacancy(
    *,
    session: AsyncSession,
    vacancy: Vacancy,
    body: UpdateVacancyRequest,
) -> Vacancy:
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(vacancy, key, value)
    vacancy.updated_at = _now()
    session.add(vacancy)
    await session.commit()
    await session.refresh(vacancy)
    return vacancy


async def delete_vacancy(*, session: AsyncSession, vacancy: Vacancy) -> None:
    active = (
        await session.exec(
            select(func.count())
            .select_from(Application)
            .where(
                Application.vacancy_id == vacancy.id,
                Application.status == ApplicationStatus.ACTIVE,
            )
        )
    ).one()
    if int(active) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "VACANCY_HAS_CANDIDATES",
                "message": "Cannot delete vacancy with assigned candidates",
            },
        )
    await session.delete(vacancy)
    await session.commit()


async def first_stage(
    *, session: AsyncSession, vacancy_id: uuid.UUID
) -> PipelineStage | None:
    return (
        await session.exec(
            select(PipelineStage)
            .where(PipelineStage.vacancy_id == vacancy_id)
            .order_by(col(PipelineStage.sort_order))
            .limit(1)
        )
    ).first()


async def validate_stage_for_vacancy(
    *,
    session: AsyncSession,
    vacancy_id: uuid.UUID,
    stage_id: uuid.UUID,
) -> PipelineStage:
    """API-layer Stage Hijack defense (Attack 1) — complements composite FK."""
    stage = (
        await session.exec(
            select(PipelineStage).where(
                PipelineStage.id == stage_id,
                PipelineStage.vacancy_id == vacancy_id,
            )
        )
    ).first()
    if stage is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pipeline stage does not belong to the target vacancy",
        )
    return stage

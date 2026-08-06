"""Candidate intake, questionnaire, assign (UC-01/02/04)."""

from __future__ import annotations

import math
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlmodel import col, func, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.ats import events as ats_events
from app.ats import vacancies as vacancy_svc
from app.ats.resume import opaque_object_key
from app.core.config import settings
from app.models import (
    Application,
    ApplicationStatus,
    Candidate,
    CandidateStatus,
    User,
    UserRole,
    role_str,
)
from app.schemas.ats import (
    AssignCandidateRequest,
    CandidatePublic,
    CreateCandidateRequest,
    Pagination,
    UpdateQuestionnaireRequest,
)


def _now() -> datetime:
    return datetime.now(UTC)


def _email_from_questionnaire(questionnaire: dict[str, Any]) -> str | None:
    for key in ("email", "Email", "contact_email"):
        raw = questionnaire.get(key)
        if isinstance(raw, str) and raw.strip():
            return raw.strip().lower()
    return None


async def _ensure_unique_email(
    *,
    session: AsyncSession,
    email: str,
    exclude_candidate_id: uuid.UUID | None = None,
) -> None:
    """Tenant-scoped uniqueness (Attack 3) — mirrors UNIQUE (tenant_id, email)."""
    stmt = select(Candidate).where(
        Candidate.tenant_id == settings.TENANT_ID,
        Candidate.email == email,
    )
    if exclude_candidate_id is not None:
        stmt = stmt.where(Candidate.id != exclude_candidate_id)
    existing = (await session.exec(stmt)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Candidate with this email already exists in the tenant",
        )


async def active_assigned_vacancy_id(
    session: AsyncSession, candidate_id: uuid.UUID
) -> uuid.UUID | None:
    app = (
        await session.exec(
            select(Application)
            .where(
                Application.candidate_id == candidate_id,
                Application.status == ApplicationStatus.ACTIVE,
            )
            .order_by(col(Application.created_at).desc())
            .limit(1)
        )
    ).first()
    return app.vacancy_id if app else None


async def to_public(session: AsyncSession, candidate: Candidate) -> CandidatePublic:
    assigned = await active_assigned_vacancy_id(session, candidate.id)
    return CandidatePublic(
        id=candidate.id,
        tenant_id=candidate.tenant_id,
        user_id=candidate.user_id,
        email=candidate.email,
        status=candidate.status,
        questionnaire=dict(candidate.questionnaire or {}),
        resume_url=candidate.resume_url,
        active_package_id=candidate.active_package_id,
        assigned_vacancy_id=assigned,
        created_at=candidate.created_at,
        updated_at=candidate.updated_at,
    )


def can_view_candidate(*, viewer: User, candidate: Candidate) -> bool:
    role = role_str(viewer.role)
    if role in {
        UserRole.ADMINISTRATOR.value,
        UserRole.HR.value,
        UserRole.RECRUITER.value,
    }:
        return True
    if role == UserRole.MANAGER.value:
        # Scope enforced in list; single-get allows assigned/pending_hitl
        return candidate.status in {
            CandidateStatus.ASSIGNED,
            CandidateStatus.PENDING_HITL,
            CandidateStatus.ACTION_APPLIED,
        }
    if role == UserRole.CANDIDATE.value:
        return candidate.user_id == viewer.id
    return False


async def create_candidate(
    *,
    session: AsyncSession,
    body: CreateCandidateRequest,
    user_id: uuid.UUID | None = None,
    publish_event: bool = True,
) -> Candidate:
    email = body.email or _email_from_questionnaire(body.questionnaire)
    if email:
        await _ensure_unique_email(session=session, email=email)
    candidate = Candidate(
        tenant_id=settings.TENANT_ID,
        user_id=user_id,
        email=email,
        status=CandidateStatus.UNASSIGNED,
        questionnaire=dict(body.questionnaire),
        resume_url=body.resume_url,
        created_at=_now(),
        updated_at=_now(),
    )
    session.add(candidate)
    await session.flush()
    if not candidate.resume_url:
        candidate.resume_url = opaque_object_key(candidate_id=candidate.id)
        session.add(candidate)
    await session.commit()
    await session.refresh(candidate)
    if publish_event:
        ats_events.publish_resume_uploaded(
            candidate_id=candidate.id, tenant_id=candidate.tenant_id
        )
    return candidate


async def get_candidate(
    *, session: AsyncSession, candidate_id: uuid.UUID
) -> Candidate | None:
    return (
        await session.exec(select(Candidate).where(Candidate.id == candidate_id))
    ).first()


async def list_candidates(
    *,
    session: AsyncSession,
    viewer: User,
    page: int = 1,
    page_size: int = 20,
    status_filter: CandidateStatus | None = None,
    vacancy_id: uuid.UUID | None = None,
    search: str | None = None,
) -> tuple[list[Candidate], Pagination]:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    role = role_str(viewer.role)

    stmt = select(Candidate)
    count_stmt = select(func.count()).select_from(Candidate)

    if role == UserRole.CANDIDATE.value:
        stmt = stmt.where(Candidate.user_id == viewer.id)
        count_stmt = count_stmt.where(Candidate.user_id == viewer.id)
    elif role == UserRole.MANAGER.value:
        manager_scope = col(Candidate.status).in_(
            [
                CandidateStatus.ASSIGNED.value,
                CandidateStatus.PENDING_HITL.value,
                CandidateStatus.ACTION_APPLIED.value,
            ]
        )
        stmt = stmt.where(manager_scope)
        count_stmt = count_stmt.where(manager_scope)

    if status_filter is not None:
        stmt = stmt.where(Candidate.status == status_filter)
        count_stmt = count_stmt.where(Candidate.status == status_filter)

    if vacancy_id is not None:
        sub = select(Application.candidate_id).where(
            Application.vacancy_id == vacancy_id,
            Application.status == ApplicationStatus.ACTIVE,
        )
        stmt = stmt.where(col(Candidate.id).in_(sub))
        count_stmt = count_stmt.where(col(Candidate.id).in_(sub))

    if search:
        from sqlalchemy import String, cast

        pattern = f"%{search}%"
        search_filt = or_(
            col(Candidate.email).ilike(pattern),
            cast(Candidate.questionnaire, String).ilike(pattern),
        )
        stmt = stmt.where(search_filt)
        count_stmt = count_stmt.where(search_filt)

    total = (await session.exec(count_stmt)).one()
    rows = (
        await session.exec(
            stmt.order_by(col(Candidate.created_at).desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()
    pagination = Pagination(
        page=page,
        page_size=page_size,
        total=int(total),
        total_pages=max(1, math.ceil(int(total) / page_size)) if total else 0,
    )
    return list(rows), pagination


async def update_questionnaire(
    *,
    session: AsyncSession,
    candidate: Candidate,
    body: UpdateQuestionnaireRequest,
    publish_event: bool = False,
) -> Candidate:
    candidate.questionnaire = dict(body.questionnaire)
    email = _email_from_questionnaire(body.questionnaire)
    if email and email != (candidate.email or "").lower():
        await _ensure_unique_email(
            session=session, email=email, exclude_candidate_id=candidate.id
        )
        candidate.email = email
    candidate.updated_at = _now()
    session.add(candidate)
    await session.commit()
    await session.refresh(candidate)
    if publish_event:
        ats_events.publish_resume_uploaded(
            candidate_id=candidate.id, tenant_id=candidate.tenant_id
        )
    return candidate


async def delete_candidate(*, session: AsyncSession, candidate: Candidate) -> None:
    await session.delete(candidate)
    await session.commit()


async def assign_candidate(
    *,
    session: AsyncSession,
    candidate: Candidate,
    body: AssignCandidateRequest,
) -> Candidate:
    vacancy = await vacancy_svc.get_vacancy(session=session, vacancy_id=body.vacancy_id)
    if vacancy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vacancy not found"
        )
    stage = await vacancy_svc.first_stage(session=session, vacancy_id=vacancy.id)
    if stage is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vacancy has no pipeline stages",
        )
    # Defense-in-depth vs Stage Hijack even when stage is server-chosen
    await vacancy_svc.validate_stage_for_vacancy(
        session=session, vacancy_id=vacancy.id, stage_id=stage.id
    )
    existing = (
        await session.exec(
            select(Application).where(
                Application.vacancy_id == vacancy.id,
                Application.candidate_id == candidate.id,
            )
        )
    ).first()
    if existing and existing.status == ApplicationStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Candidate already assigned to this vacancy",
        )
    if existing:
        existing.status = ApplicationStatus.ACTIVE
        existing.current_stage_id = stage.id
        existing.updated_at = _now()
        session.add(existing)
    else:
        session.add(
            Application(
                tenant_id=settings.TENANT_ID,
                vacancy_id=vacancy.id,
                candidate_id=candidate.id,
                current_stage_id=stage.id,
                status=ApplicationStatus.ACTIVE,
                created_at=_now(),
                updated_at=_now(),
            )
        )
    candidate.status = CandidateStatus.ASSIGNED
    candidate.updated_at = _now()
    session.add(candidate)
    await session.commit()
    await session.refresh(candidate)
    return candidate

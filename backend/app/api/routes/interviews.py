"""MVP interview planning and human feedback CRUD, tenant-scoped through RLS."""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep, require_permission
from app.models import (
    Application,
    ApplicationStatus,
    Candidate,
    Interview,
    Scorecard,
    User,
    UserRole,
    role_str,
)
from app.schemas.analytics import InterviewInput, ScorecardInput

router = APIRouter(prefix="/interviews", tags=["Interviews"])


async def visible_interview(
    session: SessionDep, user: CurrentUser, interview_id: uuid.UUID
) -> Interview:
    interview = (
        await session.exec(
            select(Interview).where(
                Interview.id == interview_id, Interview.tenant_id == user.tenant_id
            )
        )
    ).first()
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@router.get("/", response_model=list[Interview])
async def list_interviews(
    session: SessionDep,
    user: CurrentUser,
    _: Any = Depends(require_permission("vacancy.read")),
) -> list[Interview]:
    statement = (
        select(Interview)
        .join(Application, Interview.application_id == Application.id)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .where(
            Interview.tenant_id == user.tenant_id,
            Application.tenant_id == user.tenant_id,
            Candidate.tenant_id == user.tenant_id,
        )
    )
    role = role_str(user.role)
    if role == UserRole.CANDIDATE.value:
        statement = statement.where(Candidate.user_id == user.id)
    elif role == UserRole.MANAGER.value:
        statement = statement.where(Application.status == ApplicationStatus.ACTIVE)
    return list((await session.exec(statement.order_by(Interview.scheduled_at))).all())


async def validate_links(
    session: SessionDep, user: CurrentUser, body: InterviewInput
) -> None:
    application = await session.get(Application, body.application_id)
    interviewer = await session.get(User, body.interviewer_id)
    if (
        not application
        or application.tenant_id != user.tenant_id
        or not interviewer
        or interviewer.tenant_id != user.tenant_id
    ):
        raise HTTPException(
            status_code=404, detail="Application or interviewer not found"
        )
    if body.scheduled_at.tzinfo is None:
        raise HTTPException(
            status_code=422, detail="scheduled_at must include timezone"
        )


@router.post("/", response_model=Interview, status_code=201)
async def create_interview(
    body: InterviewInput,
    session: SessionDep,
    user: CurrentUser,
    _: Any = Depends(require_permission("vacancy.update")),
) -> Interview:
    await validate_links(session, user, body)
    interview = Interview(tenant_id=user.tenant_id, **body.model_dump())
    session.add(interview)
    await session.commit()
    await session.refresh(interview)
    return interview


@router.put("/{interview_id}", response_model=Interview)
async def update_interview(
    interview_id: uuid.UUID,
    body: InterviewInput,
    session: SessionDep,
    user: CurrentUser,
    _: Any = Depends(require_permission("vacancy.update")),
) -> Interview:
    interview = await visible_interview(session, user, interview_id)
    await validate_links(session, user, body)
    interview.sqlmodel_update(body.model_dump())
    session.add(interview)
    await session.commit()
    await session.refresh(interview)
    return interview


@router.delete("/{interview_id}", status_code=204)
async def delete_interview(
    interview_id: uuid.UUID,
    session: SessionDep,
    user: CurrentUser,
    _: Any = Depends(require_permission("vacancy.update")),
) -> Response:
    interview = await visible_interview(session, user, interview_id)
    for score in (
        await session.exec(
            select(Scorecard).where(
                Scorecard.interview_id == interview_id,
                Scorecard.tenant_id == user.tenant_id,
            )
        )
    ).all():
        await session.delete(score)
    await session.delete(interview)
    await session.commit()
    return Response(status_code=204)


@router.post("/{interview_id}/scorecards", response_model=Scorecard, status_code=201)
async def create_scorecard(
    interview_id: uuid.UUID,
    body: ScorecardInput,
    session: SessionDep,
    user: CurrentUser,
    _: Any = Depends(require_permission("vacancy.update")),
) -> Scorecard:
    await visible_interview(session, user, interview_id)
    score = Scorecard(
        tenant_id=user.tenant_id, interview_id=interview_id, **body.model_dump()
    )
    session.add(score)
    await session.commit()
    await session.refresh(score)
    return score

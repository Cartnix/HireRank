"""Candidate intake, assign, questionnaire, resume URL (UC-01/02/04)."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from app.api.deps import CurrentUser, SessionDep, require_permission
from app.ats import candidates as candidate_svc
from app.ats.resume import build_presigned_resume_url
from app.auth.permissions import has_permission
from app.models import CandidateStatus, UserRole, role_str
from app.schemas.ats import (
    AssignCandidateRequest,
    CandidatePublic,
    CreateCandidateRequest,
    PagedCandidateResponse,
    ResumeUrlResponse,
    UpdateQuestionnaireRequest,
)

router = APIRouter(prefix="/candidates", tags=["Candidates"])


def _require_candidate_update(request: Request, current_user: CurrentUser) -> None:
    role = role_str(current_user.role)
    if role == UserRole.CANDIDATE.value:
        return
    perms = getattr(request.state, "permissions", None) or []
    if not has_permission(perms, "candidate.update"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")


@router.get("/", response_model=PagedCandidateResponse)
async def list_candidates(
    session: SessionDep,
    current_user: CurrentUser,
    _: Any = Depends(require_permission("candidate.read")),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: CandidateStatus | None = Query(None, alias="status"),
    vacancy_id: uuid.UUID | None = None,
    search: str | None = None,
) -> PagedCandidateResponse:
    rows, pagination = await candidate_svc.list_candidates(
        session=session,
        viewer=current_user,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
        vacancy_id=vacancy_id,
        search=search,
    )
    items = [await candidate_svc.to_public(session, c) for c in rows]
    return PagedCandidateResponse(items=items, pagination=pagination)


@router.post(
    "/",
    response_model=CandidatePublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("candidate.create"))],
)
async def create_candidate(
    *, session: SessionDep, body: CreateCandidateRequest
) -> CandidatePublic:
    candidate = await candidate_svc.create_candidate(session=session, body=body)
    return await candidate_svc.to_public(session, candidate)


@router.get("/{candidate_id}", response_model=CandidatePublic)
async def get_candidate(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    candidate_id: uuid.UUID,
    _: Any = Depends(require_permission("candidate.read")),
) -> CandidatePublic:
    candidate = await candidate_svc.get_candidate(
        session=session, candidate_id=candidate_id
    )
    if candidate is None or not candidate_svc.can_view_candidate(
        viewer=current_user, candidate=candidate
    ):
        raise HTTPException(status_code=404, detail="Candidate not found")
    return await candidate_svc.to_public(session, candidate)


@router.patch("/{candidate_id}", response_model=CandidatePublic)
async def update_candidate(
    *,
    request: Request,
    session: SessionDep,
    current_user: CurrentUser,
    candidate_id: uuid.UUID,
    body: UpdateQuestionnaireRequest,
) -> CandidatePublic:
    candidate = await candidate_svc.get_candidate(
        session=session, candidate_id=candidate_id
    )
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    role = role_str(current_user.role)
    if role == UserRole.CANDIDATE.value:
        if candidate.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Candidate not found")
    else:
        _require_candidate_update(request, current_user)
    candidate = await candidate_svc.update_questionnaire(
        session=session, candidate=candidate, body=body, publish_event=False
    )
    return await candidate_svc.to_public(session, candidate)


@router.delete(
    "/{candidate_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    dependencies=[Depends(require_permission("candidate.delete"))],
)
async def delete_candidate(*, session: SessionDep, candidate_id: uuid.UUID) -> Response:
    candidate = await candidate_svc.get_candidate(
        session=session, candidate_id=candidate_id
    )
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    await candidate_svc.delete_candidate(session=session, candidate=candidate)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{candidate_id}/assign",
    response_model=CandidatePublic,
    dependencies=[Depends(require_permission("application.assign"))],
)
async def assign_candidate(
    *,
    session: SessionDep,
    candidate_id: uuid.UUID,
    body: AssignCandidateRequest,
) -> CandidatePublic:
    candidate = await candidate_svc.get_candidate(
        session=session, candidate_id=candidate_id
    )
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    candidate = await candidate_svc.assign_candidate(
        session=session, candidate=candidate, body=body
    )
    return await candidate_svc.to_public(session, candidate)


@router.get("/{candidate_id}/questionnaire")
async def get_questionnaire(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    candidate_id: uuid.UUID,
    _: Any = Depends(require_permission("candidate.read")),
) -> dict[str, Any]:
    candidate = await candidate_svc.get_candidate(
        session=session, candidate_id=candidate_id
    )
    if candidate is None or not candidate_svc.can_view_candidate(
        viewer=current_user, candidate=candidate
    ):
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    return dict(candidate.questionnaire or {})


@router.put("/{candidate_id}/questionnaire", response_model=CandidatePublic)
async def put_questionnaire(
    *,
    request: Request,
    session: SessionDep,
    current_user: CurrentUser,
    candidate_id: uuid.UUID,
    body: UpdateQuestionnaireRequest,
) -> CandidatePublic:
    candidate = await candidate_svc.get_candidate(
        session=session, candidate_id=candidate_id
    )
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    role = role_str(current_user.role)
    if role == UserRole.CANDIDATE.value:
        if candidate.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Candidate not found")
        publish = True
    else:
        _require_candidate_update(request, current_user)
        publish = False
    candidate = await candidate_svc.update_questionnaire(
        session=session,
        candidate=candidate,
        body=body,
        publish_event=publish,
    )
    return await candidate_svc.to_public(session, candidate)


@router.get(
    "/{candidate_id}/resume-url",
    response_model=ResumeUrlResponse,
    dependencies=[Depends(require_permission("candidate.read"))],
)
async def get_resume_url(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    candidate_id: uuid.UUID,
) -> ResumeUrlResponse:
    candidate = await candidate_svc.get_candidate(
        session=session, candidate_id=candidate_id
    )
    if candidate is None or not candidate_svc.can_view_candidate(
        viewer=current_user, candidate=candidate
    ):
        raise HTTPException(status_code=404, detail="Candidate not found")
    if not candidate.resume_url:
        raise HTTPException(status_code=404, detail="Resume not found")
    return ResumeUrlResponse(url=build_presigned_resume_url(candidate), expires_in=900)

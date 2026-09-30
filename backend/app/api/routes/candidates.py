"""Candidate intake, assign, questionnaire, resume URL (UC-01/02/04)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
    Response,
    status,
)
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep, require_permission
from app.ats import candidates as candidate_svc
from app.ats.gemini_evaluation import evaluate_candidate_with_gemini
from app.ats.resume import build_presigned_resume_url
from app.auth.permissions import has_permission
from app.core.config import settings
from app.models import (
    Candidate,
    CandidateStatus,
    CopilotSettings,
    UserRole,
    Vacancy,
    role_str,
)
from app.schemas.ats import (
    AssignCandidateRequest,
    CandidateEvaluationRequest,
    CandidateEvaluationResponse,
    CandidatePublic,
    CreateCandidateRequest,
    PagedCandidateResponse,
    ResumeUrlResponse,
    UpdateQuestionnaireRequest,
)
from app.schemas.copilot import CopilotConfig

router = APIRouter(prefix="/candidates", tags=["Candidates"])


def _require_candidate_update(request: Request, current_user: CurrentUser) -> None:
    role = role_str(current_user.role)
    if current_user.is_superuser or role == UserRole.CANDIDATE.value:
        return
    perms = getattr(request.state, "permissions", None) or []
    if not has_permission(perms, "candidate.update"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")


def _preserve_gemini_attestation(
    candidate: Candidate, body: UpdateQuestionnaireRequest
) -> UpdateQuestionnaireRequest:
    questionnaire = dict(body.questionnaire)
    attestation = (candidate.questionnaire or {}).get("gemini_cross_border_attestation")
    questionnaire.pop("gemini_cross_border_attestation", None)
    if isinstance(attestation, dict):
        questionnaire["gemini_cross_border_attestation"] = attestation
    return body.model_copy(update={"questionnaire": questionnaire})


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
    *,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    current_user: CurrentUser,
    body: CreateCandidateRequest,
) -> CandidatePublic:
    questionnaire = dict(body.questionnaire)
    questionnaire.pop("gemini_cross_border_attestation", None)
    consent_country = ""
    if body.gemini_consent_attested:
        if role_str(current_user.role) not in {
            UserRole.HR.value,
            UserRole.ADMINISTRATOR.value,
            UserRole.SUPERUSER.value,
        }:
            raise HTTPException(
                status_code=403, detail="HR consent attestation required"
            )
        if questionnaire.get("processing_consent") is not True:
            raise HTTPException(
                status_code=400,
                detail="Personal data processing consent is required",
            )
        consent_country = settings.GEMINI_PROCESSING_COUNTRY.strip().upper()
        if not consent_country:
            raise HTTPException(
                status_code=503,
                detail="Gemini processing country must be configured before attestation",
            )
        questionnaire["gemini_cross_border_attestation"] = {
            "country": consent_country,
            "attested_at": datetime.now(UTC).isoformat(),
            "attested_by": str(current_user.id),
        }
    body = body.model_copy(update={"questionnaire": questionnaire})
    candidate = await candidate_svc.create_candidate(session=session, body=body)
    if consent_country:
        from app.audit.service import get_audit_service

        await get_audit_service().log(
            background_tasks=background_tasks,
            action="candidate.gemini_consent_attested",
            entity_type="candidate",
            entity_id=candidate.id,
            payload={"country": consent_country, "source": "hr_attestation"},
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
        )
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
    body = _preserve_gemini_attestation(candidate, body)
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
    body = _preserve_gemini_attestation(candidate, body)
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


@router.post(
    "/{candidate_id}/evaluate",
    response_model=CandidateEvaluationResponse,
    dependencies=[Depends(require_permission("candidate.read"))],
)
async def evaluate_candidate(
    *,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    current_user: CurrentUser,
    candidate_id: uuid.UUID,
    body: CandidateEvaluationRequest,
) -> CandidateEvaluationResponse:
    if role_str(current_user.role) not in {
        UserRole.HR.value,
        UserRole.ADMINISTRATOR.value,
        UserRole.SUPERUSER.value,
    }:
        raise HTTPException(status_code=403, detail="HR evaluation access required")

    candidate = await candidate_svc.get_candidate(
        session=session, candidate_id=candidate_id
    )
    if candidate is None or not candidate_svc.can_view_candidate(
        viewer=current_user, candidate=candidate
    ):
        raise HTTPException(status_code=404, detail="Candidate not found")

    country = settings.GEMINI_PROCESSING_COUNTRY.strip().upper()
    if not country:
        raise HTTPException(
            status_code=503,
            detail="Gemini processing country must be configured before evaluation",
        )
    has_user_consent = False
    if candidate.user_id is not None:
        from app.auth.consent import get_consent_grant

        consent = await get_consent_grant(session, user_id=candidate.user_id)
        has_user_consent = (
            consent.account_processing
            and consent.cross_border
            and country
            in {item.strip().upper() for item in consent.cross_border_countries}
        )
    questionnaire = candidate.questionnaire or {}
    attestation = questionnaire.get("gemini_cross_border_attestation")
    has_hr_attestation = (
        questionnaire.get("processing_consent") is True
        and isinstance(attestation, dict)
        and attestation.get("country", "").strip().upper() == country
        and bool(attestation.get("attested_at"))
        and bool(attestation.get("attested_by"))
    )
    if not has_user_consent and not has_hr_attestation:
        raise HTTPException(
            status_code=403,
            detail="Candidate consent or HR attestation for Gemini is required",
        )

    vacancy = (
        await session.exec(
            select(Vacancy).where(
                Vacancy.id == body.vacancy_id,
                Vacancy.tenant_id == current_user.tenant_id,
            )
        )
    ).first()
    if vacancy is None:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    copilot_record = (
        await session.exec(
            select(CopilotSettings).where(
                CopilotSettings.tenant_id == current_user.tenant_id
            )
        )
    ).first()
    copilot = CopilotConfig.model_validate(
        copilot_record.config if copilot_record else {}
    )
    result = await evaluate_candidate_with_gemini(candidate, vacancy, copilot)
    from app.audit.service import get_audit_service

    await get_audit_service().log(
        background_tasks=background_tasks,
        action="candidate.gemini_evaluation",
        entity_type="candidate",
        entity_id=candidate.id,
        payload={
            "vacancy_id": str(vacancy.id),
            "model": settings.GEMINI_MODEL,
            "copilot_version": copilot.version,
        },
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
    )
    return result

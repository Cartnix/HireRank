import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from alembic.config import Config
from alembic.script import ScriptDirectory
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Request,
    Response,
)
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import SessionDep, get_current_active_superuser
from app.ats.analytics import build_analytics
from app.ats.gemini_evaluation import evaluate_candidate_with_gemini
from app.core.config import settings
from app.dev.bootstrap import TENANT_ID
from app.dev.database import dev_engine, prepare_dev_session, require_dev_database
from app.models import (
    Application,
    ApplicationStatus,
    Candidate,
    DevelopmentDataset,
    Interview,
    PipelineStage,
    Tenant,
    User,
    UserRole,
    Vacancy,
)
from app.schemas.analytics import DashboardAnalytics, ScheduledInterview
from app.schemas.ats import CandidateEvaluationResponse
from app.schemas.copilot import CopilotConfig

router = APIRouter(
    prefix="/developer",
    tags=["developer"],
    dependencies=[Depends(get_current_active_superuser)],
)
logger = logging.getLogger(__name__)


@router.get("/access")
async def developer_access(session: SessionDep) -> dict:
    from app.crud import get_permissions_for_role

    return {
        "permissions": {
            role.value: await get_permissions_for_role(
                session=session, role_name=role.value
            )
            for role in UserRole
        }
    }


def check_dev_database() -> None:
    try:
        require_dev_database()
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


class GenerateRequest(BaseModel):
    candidates: int = Field(default=20, ge=1, le=500)
    vacancies: int = Field(default=20, ge=1, le=100)
    clear_existing: bool = False


class ImportRequest(BaseModel):
    confirmation: str


class DatasetWrite(BaseModel):
    revision: int = Field(ge=0)
    users: list[dict[str, Any]] = Field(max_length=1000)
    vacancies: list[dict[str, Any]] = Field(max_length=2000)
    candidates: list[dict[str, Any]] = Field(max_length=10000)
    prompts: list[dict[str, Any]] = Field(max_length=100)
    evaluations: list[dict[str, Any]] = Field(default_factory=list, max_length=10000)
    feedback: list[dict[str, Any]] = Field(default_factory=list, max_length=10000)
    notifications: list[dict[str, Any]] = Field(default_factory=list, max_length=10000)
    audit: list[dict[str, Any]] = Field(default_factory=list, max_length=20000)
    memory: list[dict[str, Any]] = Field(default_factory=list, max_length=10000)
    mcpRuns: list[dict[str, Any]] = Field(default_factory=list, max_length=10000)


class DeveloperCandidateStageRequest(BaseModel):
    candidate_id: str = Field(min_length=1, max_length=128)
    stage_name: str = Field(min_length=1, max_length=100)
    scheduled_at: datetime | None = None


class DemoCandidateForEvaluation(BaseModel):
    id: str = Field(min_length=1, max_length=128)
    tenantId: uuid.UUID
    name: str = Field(min_length=2, max_length=255)
    email: str = Field(max_length=255)
    phone: str = Field(max_length=64)
    experience: str = Field(max_length=6000)
    skills: str = Field(max_length=4000)
    resumeText: str = Field(max_length=18000)
    resumeRef: str = Field(max_length=1000)


class DemoVacancyForEvaluation(BaseModel):
    id: str = Field(min_length=1, max_length=128)
    tenantId: uuid.UUID
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=8000)
    requirements: list[str] = Field(default_factory=list, max_length=40)


class DemoGeminiEvaluationRequest(BaseModel):
    candidate: DemoCandidateForEvaluation
    vacancy: DemoVacancyForEvaluation
    copilot: CopilotConfig
    consent_attested: bool = False


@router.post("/evaluate", response_model=CandidateEvaluationResponse)
async def evaluate_demo_candidate(
    body: DemoGeminiEvaluationRequest,
    background_tasks: BackgroundTasks,
    actor: User = Depends(get_current_active_superuser),
) -> CandidateEvaluationResponse:
    check_dev_database()
    if not body.consent_attested:
        raise HTTPException(
            status_code=403,
            detail="Confirm the candidate's consent before sending demo data to Gemini",
        )
    if not settings.GEMINI_PROCESSING_COUNTRY.strip():
        raise HTTPException(
            status_code=503,
            detail="Gemini processing country is not configured",
        )
    if body.candidate.tenantId != TENANT_ID or body.vacancy.tenantId != TENANT_ID:
        raise HTTPException(status_code=404, detail="Developer dataset item not found")

    result = await evaluate_candidate_with_gemini(
        {
            "email": body.candidate.email,
            "questionnaire": {
                "name": body.candidate.name,
                "phone": body.candidate.phone,
                "experience": body.candidate.experience,
                "skills": body.candidate.skills,
                "resume_text": body.candidate.resumeText,
            },
        },
        {
            "title": body.vacancy.title,
            "description": body.vacancy.description,
            "requirements": body.vacancy.requirements,
        },
        body.copilot,
    )
    from app.audit.service import get_audit_service

    await get_audit_service().log(
        background_tasks=background_tasks,
        action="developer.gemini_evaluation",
        entity_type="developer_candidate",
        payload={
            "candidate_id": body.candidate.id,
            "vacancy_id": body.vacancy.id,
            "country": settings.GEMINI_PROCESSING_COUNTRY.upper(),
            "copilot_version": body.copilot.version,
            "consent_attested_at": datetime.now(UTC).isoformat(),
        },
        tenant_id=actor.tenant_id,
        user_id=actor.id,
    )
    return result


@router.put("/dataset", status_code=204)
async def write_dataset(body: DatasetWrite) -> None:
    from app.dev.operations import save_dataset

    check_dev_database()
    engine = dev_engine()
    try:
        async with AsyncSession(engine) as session:
            await ensure_dev_schema(session)
            await prepare_dev_session(session)
            # Serialize snapshots to prevent two browser sessions interleaving writes.
            await session.execute(text("SELECT pg_advisory_xact_lock(5508400)"))
            dataset = await session.get(DevelopmentDataset, 1)
            if dataset is None or dataset.config.get("revision", 0) != body.revision:
                raise HTTPException(
                    status_code=409,
                    detail="Dev данные изменены в другом окне. Обновите страницу.",
                )
            try:
                await save_dataset(session, body.model_dump())
            except (ValueError, KeyError) as error:
                raise HTTPException(status_code=400, detail=str(error)) from error
    finally:
        await engine.dispose()


@router.post("/generate")
async def generate_data(body: GenerateRequest) -> dict:
    from app.dev.operations import generate

    check_dev_database()
    engine = dev_engine()
    try:
        async with AsyncSession(engine) as session:
            await ensure_dev_schema(session)
            await prepare_dev_session(session)
            return await generate(
                session, body.candidates, body.vacancies, body.clear_existing
            )
    finally:
        await engine.dispose()


@router.post("/import")
async def import_data(
    body: ImportRequest,
    request: Request,
    session: SessionDep,
    actor: User = Depends(get_current_active_superuser),
) -> dict:
    from app.dev.operations import copy_to_live

    if body.confirmation != "IMPORT TO REAL DATABASE":
        raise HTTPException(
            status_code=400, detail="Explicit live database confirmation required"
        )
    check_dev_database()
    engine = dev_engine()
    try:
        async with AsyncSession(engine) as source:
            await ensure_dev_schema(source)
            await prepare_dev_session(source)
            result = await copy_to_live(source, session, actor)
            from app.audit.service import get_audit_service

            await get_audit_service().log(
                background_tasks=None,
                action="developer.import",
                entity_type="development_dataset",
                tenant_id=actor.tenant_id,
                user_id=actor.id,
                payload={"detail": result, "path": request.url.path},
                force_sync=True,
            )
            return result
    finally:
        await engine.dispose()


async def ensure_dev_schema(session: AsyncSession) -> None:
    if settings.ENVIRONMENT == "production":
        return
    heads = ScriptDirectory.from_config(Config("alembic.ini")).get_heads()
    current = (
        (await session.execute(text("SELECT version_num FROM alembic_version")))
        .scalars()
        .all()
    )
    if set(current) != set(heads):
        raise HTTPException(
            status_code=503,
            detail="Run python -m app.dev.bootstrap to synchronize dev migrations",
        )


@router.get("/dataset")
async def read_dataset(response: Response) -> dict[str, Any]:
    """One shared dataset. Identity/role is checked against the primary database."""
    try:
        require_dev_database()
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))
    response.headers["Cache-Control"] = "no-store, private"
    engine = dev_engine()
    try:
        async with AsyncSession(engine) as session:
            await ensure_dev_schema(session)
            await prepare_dev_session(session)
            users = (
                await session.exec(
                    select(User).where(User.tenant_id == TENANT_ID).order_by(User.email)
                )
            ).all()
            vacancies = (
                await session.exec(
                    select(Vacancy)
                    .where(Vacancy.tenant_id == TENANT_ID)
                    .order_by(Vacancy.title)
                )
            ).all()
            candidates = (
                await session.exec(
                    select(Candidate)
                    .where(Candidate.tenant_id == TENANT_ID)
                    .order_by(Candidate.email)
                )
            ).all()
            stages = (
                await session.exec(
                    select(PipelineStage)
                    .where(PipelineStage.tenant_id == TENANT_ID)
                    .order_by(PipelineStage.sort_order)
                )
            ).all()
            applications = (
                await session.exec(
                    select(Application).where(Application.tenant_id == TENANT_ID)
                )
            ).all()
            tenant = await session.get(Tenant, TENANT_ID)
            if tenant is None:
                raise HTTPException(
                    status_code=503, detail="Development tenant missing"
                )
            assigned = {a.candidate_id: a.vacancy_id for a in applications}
            active_applications = {
                application.candidate_id: application
                for application in applications
                if application.status == ApplicationStatus.ACTIVE
            }
            stages_by_id = {stage.id: stage for stage in stages}
            active_applications = {
                application.candidate_id: application
                for application in applications
                if application.status == ApplicationStatus.ACTIVE
            }
            stages_by_id = {stage.id: stage for stage in stages}
            dataset = await session.get(DevelopmentDataset, 1)
            if dataset is None:
                raise HTTPException(
                    status_code=503, detail="Development dataset not seeded"
                )
            fixture = dataset.config
            # Fixture aliases retain existing preview assignments; data comes from canonical ORM records.
            aliases = fixture["aliases"]
            result = {
                key: fixture.get(key, [])
                for key in (
                    "evaluations",
                    "feedback",
                    "notifications",
                    "audit",
                    "memory",
                    "mcpRuns",
                )
            }
            result.update(
                version=1,
                revision=fixture.get("revision", 0),
                tenants=[{"id": str(tenant.id), "name": tenant.name}],
                prompts=fixture["prompts"],
                users=[
                    {
                        "id": str(u.id),
                        "tenant_id": str(u.tenant_id),
                        "email": u.email,
                        "role": u.role,
                        "is_active": u.is_active,
                        "first_name": u.first_name,
                        "last_name": u.last_name,
                    }
                    for u in users
                ],
                vacancies=[
                    {
                        "id": aliases.get(str(v.id), str(v.id)),
                        "tenantId": str(v.tenant_id),
                        "title": v.title,
                        "department": v.department or "",
                        "description": v.description or "",
                        "location": "",
                        "open": v.status == "open",
                        "status": v.status,
                        "requirements": v.requirements,
                        "stages": [
                            {
                                "id": str(stage.id),
                                "stage_name": stage.stage_name,
                                "sort_order": stage.sort_order,
                            }
                            for stage in stages
                            if stage.vacancy_id == v.id
                        ],
                    }
                    for v in vacancies
                ],
                candidates=[
                    {
                        **c.questionnaire,
                        "id": c.questionnaire.get("dev_key", str(c.id)),
                        "tenantId": str(c.tenant_id),
                        "email": c.email,
                        "createdAt": c.created_at.isoformat() if c.created_at else "",
                        "status": c.questionnaire.get(
                            "status", "assigned" if c.status == "assigned" else "new"
                        ),
                        "vacancyId": aliases.get(
                            str(assigned[c.id]), str(assigned[c.id])
                        )
                        if c.id in assigned
                        else None,
                        "stageId": str(active_applications[c.id].current_stage_id)
                        if c.id in active_applications
                        else None,
                        "pipelineStage": stages_by_id[
                            active_applications[c.id].current_stage_id
                        ].stage_name
                        if c.id in active_applications
                        and active_applications[c.id].current_stage_id in stages_by_id
                        else None,
                        "resumeRef": c.resume_url or "",
                    }
                    for c in candidates
                ],
            )
            return result
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail="Development database unavailable; run dev bootstrap",
        ) from error
    finally:
        await engine.dispose()


async def development_analytics(
    role: UserRole, *, upcoming_limit: int | None = 10
) -> DashboardAnalytics:
    try:
        require_dev_database()
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))
    engine = dev_engine()
    try:
        async with AsyncSession(engine) as session:
            await ensure_dev_schema(session)
            await prepare_dev_session(session)
            user = (
                await session.exec(
                    select(User).where(User.tenant_id == TENANT_ID, User.role == role)
                )
            ).first()
            if user is None:
                logger.warning(
                    "Development analytics role is not seeded",
                    extra={"role": role.value},
                )
                raise HTTPException(
                    status_code=503, detail="Development role not seeded"
                )
            return await build_analytics(
                session=session, user=user, upcoming_limit=upcoming_limit
            )
    except HTTPException:
        raise
    except Exception as error:
        logger.exception(
            "Development analytics request failed",
            extra={"role": role.value},
        )
        raise HTTPException(
            status_code=503,
            detail="Development database unavailable; run dev bootstrap",
        ) from error
    finally:
        await engine.dispose()


@router.get("/analytics", response_model=DashboardAnalytics)
async def read_analytics(
    response: Response, role: UserRole = UserRole.SUPERUSER
) -> DashboardAnalytics:
    response.headers["Cache-Control"] = "no-store, private"
    return await development_analytics(role)


@router.get("/schedule", response_model=list[ScheduledInterview])
async def read_schedule(
    response: Response, role: UserRole = UserRole.SUPERUSER
) -> list[ScheduledInterview]:
    response.headers["Cache-Control"] = "no-store, private"
    overview = await development_analytics(role, upcoming_limit=None)
    return overview.upcoming_interviews


@router.post("/candidate-stage", status_code=204)
async def update_development_candidate_stage(
    body: DeveloperCandidateStageRequest,
) -> Response:
    try:
        require_dev_database()
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    engine = dev_engine()
    try:
        async with AsyncSession(engine) as session:
            await ensure_dev_schema(session)
            await prepare_dev_session(session)
            dataset = await session.get(DevelopmentDataset, 1)
            if dataset is None:
                raise HTTPException(
                    status_code=503, detail="Development dataset not seeded"
                )
            candidates = (
                await session.exec(
                    select(Candidate).where(Candidate.tenant_id == TENANT_ID)
                )
            ).all()
            candidate = next(
                (
                    item
                    for item in candidates
                    if item.questionnaire.get("dev_key", str(item.id))
                    == body.candidate_id
                ),
                None,
            )
            if candidate is None:
                raise HTTPException(status_code=404, detail="Candidate not found")
            application = (
                await session.exec(
                    select(Application).where(
                        Application.tenant_id == TENANT_ID,
                        Application.candidate_id == candidate.id,
                        Application.status == ApplicationStatus.ACTIVE,
                    )
                )
            ).first()
            if application is None:
                raise HTTPException(
                    status_code=409,
                    detail="Candidate has no active application",
                )
            stages = list(
                (
                    await session.exec(
                        select(PipelineStage)
                        .where(
                            PipelineStage.tenant_id == TENANT_ID,
                            PipelineStage.vacancy_id == application.vacancy_id,
                        )
                        .order_by(PipelineStage.sort_order)
                    )
                ).all()
            )
            if len(stages) == 1 and stages[0].stage_name == "Рассмотрение":
                default_names = (
                    "Новые",
                    "Скрининг",
                    "Рассмотрение",
                    "Собеседование",
                    "Оффер",
                    "Принят",
                )
                for order, stage_name in enumerate(default_names):
                    if stage_name == stages[0].stage_name:
                        stages[0].sort_order = 100 + order
                        session.add(stages[0])
                    else:
                        session.add(
                            PipelineStage(
                                tenant_id=TENANT_ID,
                                vacancy_id=application.vacancy_id,
                                stage_name=stage_name,
                                sort_order=100 + order,
                            )
                        )
                await session.flush()
                stages = list(
                    (
                        await session.exec(
                            select(PipelineStage)
                            .where(
                                PipelineStage.tenant_id == TENANT_ID,
                                PipelineStage.vacancy_id == application.vacancy_id,
                            )
                            .order_by(PipelineStage.sort_order)
                        )
                    ).all()
                )
                for order, item in enumerate(stages):
                    item.sort_order = order
                    session.add(item)
                await session.flush()
            stage = next(
                (item for item in stages if item.stage_name == body.stage_name),
                None,
            )
            if stage is None:
                raise HTTPException(status_code=404, detail="Pipeline stage not found")
            requires_interview = any(
                marker in stage.stage_name.casefold()
                for marker in ("интервью", "собесед")
            )
            if requires_interview:
                if body.scheduled_at is None or body.scheduled_at.tzinfo is None:
                    raise HTTPException(
                        status_code=422,
                        detail="Укажите дату и время собеседования",
                    )
                if body.scheduled_at <= datetime.now(UTC):
                    raise HTTPException(
                        status_code=422,
                        detail="Дата собеседования должна быть в будущем",
                    )
                interviewer = (
                    await session.exec(
                        select(User).where(
                            User.tenant_id == TENANT_ID,
                            User.role == UserRole.HR,
                        )
                    )
                ).first()
                if interviewer is None:
                    interviewer = (
                        await session.exec(
                            select(User).where(
                                User.tenant_id == TENANT_ID,
                                User.role == UserRole.SUPERUSER,
                            )
                        )
                    ).first()
                if interviewer is None:
                    raise HTTPException(
                        status_code=503,
                        detail="Development interviewer not configured",
                    )
                session.add(
                    Interview(
                        tenant_id=TENANT_ID,
                        application_id=application.id,
                        interviewer_id=interviewer.id,
                        scheduled_at=body.scheduled_at,
                    )
                )
            elif body.scheduled_at is not None:
                raise HTTPException(
                    status_code=422,
                    detail="Дата доступна только для этапа собеседования",
                )
            application.current_stage_id = stage.id
            application.updated_at = datetime.now(UTC)
            dataset.config = {
                **dataset.config,
                "revision": dataset.config.get("revision", 0) + 1,
            }
            session.add(application)
            session.add(dataset)
            await session.commit()
            return Response(status_code=204)
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Development candidate stage update failed")
        raise HTTPException(
            status_code=503,
            detail="Development database unavailable; run dev bootstrap",
        ) from error
    finally:
        await engine.dispose()

from typing import Any

from alembic.config import Config
from alembic.script import ScriptDirectory
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_active_superuser
from app.dev.bootstrap import TENANT_ID
from app.dev.database import dev_engine, require_dev_database
from app.models import (
    Application,
    Candidate,
    DevelopmentDataset,
    PipelineStage,
    Tenant,
    User,
    Vacancy,
)

router = APIRouter(
    prefix="/developer",
    tags=["developer"],
    dependencies=[Depends(get_current_active_superuser)],
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
            await session.execute(text("SET LOCAL row_security = off"))
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
            dataset = await session.get(DevelopmentDataset, 1)
            if dataset is None:
                raise HTTPException(
                    status_code=503, detail="Development dataset not seeded"
                )
            fixture = dataset.config
            # Fixture aliases retain existing preview assignments; data comes from canonical ORM records.
            aliases = fixture["aliases"]
            result = {
                key: []
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
                        "status": "assigned" if c.status == "assigned" else "new",
                        "vacancyId": aliases.get(
                            str(assigned[c.id]), str(assigned[c.id])
                        )
                        if c.id in assigned
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

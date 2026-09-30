"""Owner tools: canonical dev fixtures and transactional copy to the live tenant."""

import json
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.dev.bootstrap import FIXTURES, TENANT_ID
from app.models import (
    Application,
    Candidate,
    CandidateStatus,
    DevelopmentDataset,
    Interview,
    PipelineStage,
    Scorecard,
    User,
    UserRole,
    Vacancy,
    VacancyStatus,
)

DOMAIN = (Vacancy, PipelineStage, Candidate, Application, Interview, Scorecard)


async def clear_domain(session: AsyncSession) -> None:
    # Bulk deletes delegate dependent ATS rows to database cascades.
    await session.execute(delete(Candidate).where(Candidate.tenant_id == TENANT_ID))
    await session.execute(delete(Vacancy).where(Vacancy.tenant_id == TENANT_ID))
    await session.flush()


async def generate(
    session: AsyncSession, candidates: int, vacancies: int, clear: bool
) -> dict:
    await session.execute(text("SELECT pg_advisory_xact_lock(5508400)"))
    if clear:
        await clear_domain(session)
    fixture = json.loads(FIXTURES.read_text())
    actor = (
        await session.exec(
            select(User).where(User.tenant_id == TENANT_ID, User.role == "hr")
        )
    ).first()
    if actor is None:
        actor = (
            await session.exec(
                select(User).where(
                    User.tenant_id == TENANT_ID, User.role == "superuser"
                )
            )
        ).first()
    if actor is None:
        raise ValueError("Run dev bootstrap first")
    dataset = await session.get(DevelopmentDataset, 1)
    aliases = dict(dataset.config.get("aliases", {})) if dataset else {}
    candidate_user = (
        await session.exec(
            select(User).where(User.tenant_id == TENANT_ID, User.role == "candidate")
        )
    ).first()
    batch = uuid.uuid4().hex[:12]
    jobs = []
    stages = []
    for index in range(vacancies):
        template = fixture["vacancies"][index % len(fixture["vacancies"])]
        job = Vacancy(
            tenant_id=TENANT_ID,
            title=f"{template['title']} · Тест {index + 1} ({batch})",
            department=template["department"],
            description=template["description"],
            requirements=template.get("requirements", []),
            status=VacancyStatus.OPEN,
            created_by=actor.id,
        )
        session.add(job)
        jobs.append(job)
    await session.flush()
    if clear and jobs:
        aliases[str(jobs[0].id)] = "v-design"
    for job in jobs:
        stage = PipelineStage(
            tenant_id=TENANT_ID,
            vacancy_id=job.id,
            stage_name="Рассмотрение",
            sort_order=0,
        )
        session.add(stage)
        stages.append(stage)
    await session.flush()
    for index in range(candidates):
        template = fixture["candidates"][index % len(fixture["candidates"])]
        job = jobs[index % len(jobs)]
        key = "c-aliya" if clear and index == 0 else f"generated-{batch}-{index}"
        job_key = aliases.get(str(job.id), str(job.id))
        questionnaire = {
            **template,
            "id": key,
            "dev_key": key,
            "name": f"{template['name']} · Тест {index + 1}",
            "vacancyId": job_key,
            "requestedVacancyId": job_key,
            "source": "hr",
            "status": "assigned",
            "synthetic": True,
        }
        candidate = Candidate(
            tenant_id=TENANT_ID,
            user_id=candidate_user.id
            if clear and index == 0 and candidate_user
            else None,
            email=f"test-{batch}-{index}@example.com",
            status=CandidateStatus.ASSIGNED,
            questionnaire=questionnaire,
            resume_url=template["resumeRef"],
        )
        session.add(candidate)
        await session.flush()
        application = Application(
            tenant_id=TENANT_ID,
            vacancy_id=job.id,
            candidate_id=candidate.id,
            current_stage_id=stages[index % len(jobs)].id,
        )
        session.add(application)
        await session.flush()
        session.add(
            Interview(
                tenant_id=TENANT_ID,
                application_id=application.id,
                interviewer_id=actor.id,
                scheduled_at=datetime.now(UTC) + timedelta(days=index % 28 + 1),
            )
        )
    dataset = await session.get(DevelopmentDataset, 1)
    if dataset:
        dataset.config = {
            **dataset.config,
            "revision": dataset.config.get("revision", 0) + 1,
            "aliases": aliases,
        }
        session.add(dataset)
    await session.commit()
    return {"candidates": candidates, "vacancies": vacancies}


async def copy_to_live(source: AsyncSession, target: AsyncSession, actor: User) -> dict:
    """New IDs and tenant; no dev auth identities or credential copies."""
    await source.execute(text("SELECT pg_advisory_xact_lock(5508400)"))
    rows = {
        model: list(
            (await source.exec(select(model).where(model.tenant_id == TENANT_ID))).all()
        )
        for model in DOMAIN
    }
    mapping = {row.id: uuid.uuid4() for records in rows.values() for row in records}
    batch = uuid.uuid4().hex[:12]
    for model in DOMAIN:
        for row in rows[model]:
            values = row.model_dump()
            values.update(id=mapping[row.id], tenant_id=actor.tenant_id)
            if model is Vacancy:
                values["created_by"] = actor.id
                values["title"] = f"[TEST {batch}] {row.title}"[:255]
            elif model is Candidate:
                values.update(
                    user_id=None,
                    active_package_id=None,
                    email=f"test-{batch}-{row.id.hex}@example.com",
                )
                q = {
                    **row.questionnaire,
                    "synthetic": True,
                    "import_batch": batch,
                    "dev_source_id": str(row.id),
                }
                for key in ("vacancyId", "requestedVacancyId"):
                    q.pop(key, None)
                values["questionnaire"] = q
            elif model is Interview:
                values["interviewer_id"] = actor.id
            for key in (
                "vacancy_id",
                "candidate_id",
                "current_stage_id",
                "application_id",
                "interview_id",
            ):
                if key in values:
                    values[key] = mapping[values[key]]
            target.add(model(**values))
        await target.flush()
    await target.commit()
    return {
        "batch": batch,
        **{model.__tablename__: len(records) for model, records in rows.items()},
    }


async def save_dataset(session: AsyncSession, data: dict) -> None:
    """Persist editable preview entities into canonical dev tables."""
    from app.dev.bootstrap import record_id
    from app.models import DevelopmentDataset

    dataset = await session.get(DevelopmentDataset, 1)
    if dataset is None:
        raise ValueError("Development dataset not seeded")
    aliases = dict(dataset.config.get("aliases", {}))
    jobs = list(
        (
            await session.exec(select(Vacancy).where(Vacancy.tenant_id == TENANT_ID))
        ).all()
    )
    candidates = list(
        (
            await session.exec(
                select(Candidate).where(Candidate.tenant_id == TENANT_ID)
            )
        ).all()
    )
    users = list(
        (await session.exec(select(User).where(User.tenant_id == TENANT_ID))).all()
    )
    actor = next(
        (u for u in users if u.role == "hr"),
        next((u for u in users if u.role == "superuser"), None),
    )
    if actor is None:
        raise ValueError("Dev owner missing; run bootstrap")
    job_keys = {aliases.get(str(v.id), str(v.id)): v for v in jobs}
    candidate_keys = {c.questionnaire.get("dev_key", str(c.id)): c for c in candidates}
    incoming_jobs = {v["id"] for v in data["vacancies"]}
    incoming_candidates = {c["id"] for c in data["candidates"]}
    for key, row in candidate_keys.items():
        if key not in incoming_candidates:
            await session.execute(
                delete(Candidate).where(
                    Candidate.id == row.id, Candidate.tenant_id == TENANT_ID
                )
            )
    for key, row in job_keys.items():
        if key not in incoming_jobs:
            await session.execute(
                delete(Vacancy).where(
                    Vacancy.id == row.id, Vacancy.tenant_id == TENANT_ID
                )
            )
    await session.flush()
    for item in data["users"]:
        user_id = uuid.UUID(item["id"])
        row = next((u for u in users if u.id == user_id), None)
        if row is None:
            row = User(
                id=user_id,
                tenant_id=TENANT_ID,
                email=item["email"],
                role=item["role"],
                hashed_password=None,
            )
        for key in ("email", "role", "is_active", "first_name", "last_name"):
            setattr(row, key, UserRole(item[key]) if key == "role" else item.get(key))
        session.add(row)
    await session.flush()
    for item in data["vacancies"]:
        row = job_keys.get(item["id"])
        if row is None:
            row = Vacancy(
                id=record_id(item["id"]),
                tenant_id=TENANT_ID,
                created_by=actor.id,
                title=item["title"],
            )
            job_keys[item["id"]] = row
            aliases[str(row.id)] = item["id"]
        for key in ("title", "department", "description", "requirements"):
            setattr(row, key, item.get(key, [] if key == "requirements" else ""))
        row.status = VacancyStatus(
            item.get("status") or ("open" if item["open"] else "closed")
        )
        session.add(row)
        await session.flush()
        existing_stages = list(
            (
                await session.exec(
                    select(PipelineStage).where(PipelineStage.vacancy_id == row.id)
                )
            ).all()
        )
        for index, stage in enumerate(item.get("stages") or []):
            current = next(
                (s for s in existing_stages if str(s.id) == stage["id"]), None
            )
            if current is None:
                current = PipelineStage(
                    id=record_id(stage["id"]),
                    tenant_id=TENANT_ID,
                    vacancy_id=row.id,
                    stage_name=stage["stage_name"],
                    sort_order=len(existing_stages) + index,
                )
            else:
                current.stage_name = stage["stage_name"]
            session.add(current)
        if not existing_stages and not item.get("stages"):
            session.add(
                PipelineStage(
                    tenant_id=TENANT_ID,
                    vacancy_id=row.id,
                    stage_name="Рассмотрение",
                    sort_order=0,
                )
            )
    await session.flush()
    for item in data["candidates"]:
        row = candidate_keys.get(item["id"])
        if row is None:
            row = Candidate(id=record_id(item["id"]), tenant_id=TENANT_ID)
        row.email = item["email"]
        row.resume_url = item["resumeRef"]
        row.questionnaire = {**row.questionnaire, **item, "dev_key": item["id"]}
        row.status = (
            CandidateStatus.ASSIGNED
            if item.get("vacancyId")
            else CandidateStatus.UNASSIGNED
        )
        session.add(row)
        await session.flush()
        applications = list(
            (
                await session.exec(
                    select(Application).where(Application.candidate_id == row.id)
                )
            ).all()
        )
        wanted = job_keys.get(item.get("vacancyId"))
        for application in applications:
            if wanted is None or application.vacancy_id != wanted.id:
                await session.execute(
                    delete(Application).where(Application.id == application.id)
                )
        if wanted and not any(a.vacancy_id == wanted.id for a in applications):
            stage = (
                await session.exec(
                    select(PipelineStage)
                    .where(PipelineStage.vacancy_id == wanted.id)
                    .order_by(PipelineStage.sort_order)
                )
            ).first()
            session.add(
                Application(
                    tenant_id=TENANT_ID,
                    candidate_id=row.id,
                    vacancy_id=wanted.id,
                    current_stage_id=stage.id,
                )
            )
    # Keep actor identities referenced by ATS records; refuse dangling user deletion.
    incoming_users = {uuid.UUID(u["id"]) for u in data["users"]}
    for row in users:
        if row.id not in incoming_users:
            referenced = (
                await session.exec(
                    select(Vacancy.id).where(Vacancy.created_by == row.id)
                )
            ).first()
            interviewed = (
                await session.exec(
                    select(Interview.id).where(Interview.interviewer_id == row.id)
                )
            ).first()
            own_profile = (
                await session.exec(
                    select(Candidate.id).where(Candidate.user_id == row.id)
                )
            ).first()
            if referenced or interviewed or own_profile or row.role == "superuser":
                raise ValueError(
                    "Нельзя удалить владельца или пользователя со связанными вакансиями/интервью/анкетой"
                )
            await session.execute(
                delete(User).where(User.id == row.id, User.tenant_id == TENANT_ID)
            )
    dataset.config = {
        **dataset.config,
        "revision": data["revision"] + 1,
        "aliases": aliases,
        "prompts": data.get("prompts", dataset.config["prompts"]),
    }
    session.add(dataset)
    await session.commit()

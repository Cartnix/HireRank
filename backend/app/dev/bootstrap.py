"""Seed the isolated demo tenant in cloud or the separate local demo database."""

import asyncio
import json
import os
import subprocess
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path

import psycopg
from psycopg import sql
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.db import async_session_maker
from app.dev.database import (
    DEV_TENANT_ID,
    bind_demo_tenant,
    dev_engine,
    require_dev_database,
)
from app.models import (
    Application,
    ApplicationStatus,
    Candidate,
    CandidateStatus,
    DevelopmentDataset,
    Interview,
    PipelineStage,
    Scorecard,
    Tenant,
    User,
    UserRole,
    Vacancy,
    VacancyStatus,
)

FIXTURES = Path(__file__).with_name("fixtures.json")
TENANT_ID = DEV_TENANT_ID


def record_id(key: str, namespace: uuid.UUID = TENANT_ID) -> uuid.UUID:
    return uuid.uuid5(namespace, key)


@asynccontextmanager
async def _seed_session(
    session: AsyncSession | None,
) -> AsyncIterator[AsyncSession]:
    if session is not None:
        yield session
        return
    engine = dev_engine()
    try:
        async with AsyncSession(engine) as dev_session:
            yield dev_session
    finally:
        await engine.dispose()


async def seed(
    session: AsyncSession | None = None,
    *,
    tenant_id: uuid.UUID = TENANT_ID,
    actor_id: uuid.UUID | None = None,
    create_fixture_users: bool = False,
) -> None:
    if session is None and settings.ENVIRONMENT != "local":
        raise ValueError("A database session is required outside local development")
    is_separate_dev_database = session is None
    create_fixture_users = create_fixture_users or is_separate_dev_database
    fixture = json.loads(FIXTURES.read_text())
    async with _seed_session(session) as session:
        if is_separate_dev_database:
            await session.execute(text("SET LOCAL row_security = off"))
        else:
            await bind_demo_tenant(session)
        await session.execute(text("SELECT pg_advisory_xact_lock(5508400)"))
        if (
            not is_separate_dev_database
            and await session.get(DevelopmentDataset, 1) is not None
        ):
            return
        if create_fixture_users:
            await session.merge(
                Tenant(
                    id=tenant_id,
                    slug=f"demo-{tenant_id.hex[:12]}",
                    name=fixture["tenants"][0]["name"],
                )
            )
            await session.flush()
            for row in fixture["users"]:
                await session.merge(
                    User(
                        id=uuid.uuid5(tenant_id, row["id"])
                        if not is_separate_dev_database
                        else uuid.UUID(row["id"]),
                        tenant_id=tenant_id,
                        email=row["email"],
                        role=UserRole(row["role"]),
                        is_active=row["is_active"],
                        first_name=row["first_name"],
                        last_name=row["last_name"],
                        hashed_password=None,
                    )
                )
            await session.flush()
            fixture_user_ids = {
                row["role"]: (
                    uuid.UUID(row["id"])
                    if is_separate_dev_database
                    else uuid.uuid5(tenant_id, row["id"])
                )
                for row in fixture["users"]
            }
            actor = (
                uuid.UUID(next(u["id"] for u in fixture["users"] if u["role"] == "hr"))
                if is_separate_dev_database
                else fixture_user_ids["hr"]
            )
        else:
            if actor_id is None:
                raise ValueError("actor_id is required when seeding application data")
            actor = actor_id
        for row in fixture["vacancies"]:
            await session.merge(
                Vacancy(
                    id=record_id(row["id"], tenant_id),
                    tenant_id=tenant_id,
                    title=row["title"],
                    department=row["department"],
                    description=row["description"],
                    requirements=row.get("requirements", []),
                    status=VacancyStatus.OPEN if row["open"] else VacancyStatus.CLOSED,
                    created_by=actor,
                    created_at=datetime.now(UTC)
                    - timedelta(days=3 + fixture["vacancies"].index(row)),
                )
            )
        await session.flush()
        for row in fixture["vacancies"]:
            for index, name in enumerate(
                ["Отклик", "Рассмотрение", "Интервью"]
                + list(
                    dict.fromkeys(
                        c["stage"]
                        for c in fixture["candidates"]
                        if c.get("stage") and c["vacancyId"] == row["id"]
                    )
                )
            ):
                await session.merge(
                    PipelineStage(
                        id=record_id(f"{row['id']}-stage-{index}", tenant_id),
                        tenant_id=tenant_id,
                        vacancy_id=record_id(row["id"], tenant_id),
                        stage_name=name,
                        sort_order=index,
                    )
                )
        await session.flush()
        for row in fixture["candidates"]:
            await session.merge(
                Candidate(
                    id=record_id(row["id"], tenant_id),
                    tenant_id=tenant_id,
                    email=row["email"],
                    status=CandidateStatus.ACTION_APPLIED
                    if row.get("hired")
                    else CandidateStatus.ASSIGNED
                    if row["vacancyId"]
                    else CandidateStatus.UNASSIGNED,
                    resume_url=row["resumeRef"],
                    questionnaire={
                        **row,
                        "tenantId": str(tenant_id),
                        "dev_key": row["id"],
                    },
                    created_at=datetime.now(UTC)
                    - timedelta(days=2 + fixture["candidates"].index(row)),
                )
            )
        await session.flush()
        for row in fixture["candidates"]:
            if row["vacancyId"]:
                await session.merge(
                    Application(
                        id=record_id(f"{row['id']}-application", tenant_id),
                        tenant_id=tenant_id,
                        candidate_id=record_id(row["id"], tenant_id),
                        vacancy_id=record_id(row["vacancyId"], tenant_id),
                        status=ApplicationStatus.HIRED
                        if row.get("hired")
                        else ApplicationStatus.ACTIVE,
                        created_at=datetime.now(UTC)
                        - timedelta(days=25 if row.get("hired") else 5),
                        updated_at=datetime.now(UTC) - timedelta(days=7)
                        if row.get("hired")
                        else datetime.now(UTC),
                        current_stage_id=record_id(
                            f"{row['vacancyId']}-stage-{3 if row.get('stage') else 0}",
                            tenant_id,
                        ),
                    )
                )
        await session.flush()
        for row in fixture["candidates"]:
            if row.get("rating") or row.get("interviewHour"):
                interview_id = record_id(f"{row['id']}-interview", tenant_id)
                scheduled = datetime.now(UTC).replace(
                    hour=row.get("interviewHour") or 10,
                    minute=0,
                    second=0,
                    microsecond=0,
                )
                if row.get("rating"):
                    scheduled -= timedelta(days=1)
                elif scheduled < datetime.now(UTC):
                    scheduled += timedelta(days=1)
                await session.merge(
                    Interview(
                        id=interview_id,
                        tenant_id=tenant_id,
                        application_id=record_id(f"{row['id']}-application", tenant_id),
                        interviewer_id=actor,
                        scheduled_at=scheduled,
                    )
                )
                await session.flush()
                if row.get("rating"):
                    await session.merge(
                        Scorecard(
                            id=record_id(f"{row['id']}-score", tenant_id),
                            tenant_id=tenant_id,
                            interview_id=interview_id,
                            rating=row["rating"],
                            notes="Тестовая оценка интервьюера",
                        )
                    )
        if is_separate_dev_database:
            candidate_user = next(
                u for u in fixture["users"] if u["role"] == "candidate"
            )
            own = await session.get(
                Candidate, record_id(fixture["candidates"][0]["id"], tenant_id)
            )
            if own is None:
                raise RuntimeError("The candidate fixture was not created")
            own.user_id = uuid.UUID(candidate_user["id"])
            session.add(own)
        await session.merge(
            DevelopmentDataset(
                id=1,
                config={
                    "tenants": fixture["tenants"],
                    "prompts": fixture["prompts"],
                    "aliases": {
                        str(record_id(row["id"], tenant_id)): row["id"]
                        for row in fixture["vacancies"]
                    },
                },
            )
        )
        await session.commit()


async def seed_application_demo_data(
    session: AsyncSession, *, tenant_id: uuid.UUID
) -> None:
    await seed(session, tenant_id=tenant_id, create_fixture_users=True)


def main() -> None:
    if not settings.DEV_DATABASE_ENABLED:
        return
    if settings.ENVIRONMENT == "production":

        async def seed_shared_database() -> None:
            async with async_session_maker() as session:
                await seed(
                    session,
                    tenant_id=TENANT_ID,
                    create_fixture_users=True,
                )

        asyncio.run(seed_shared_database())
        return
    require_dev_database()
    with psycopg.connect(
        str(settings.SQLALCHEMY_DATABASE_URI).replace(
            "postgresql+psycopg:", "postgresql:"
        ),
        autocommit=True,
    ) as connection:
        exists = connection.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", (settings.POSTGRES_DEV_DB,)
        ).fetchone()
        if not exists:
            connection.execute(
                sql.SQL("CREATE DATABASE {}").format(
                    sql.Identifier(settings.POSTGRES_DEV_DB)
                )
            )
        connection.execute(
            sql.SQL("REVOKE CONNECT ON DATABASE {} FROM PUBLIC").format(
                sql.Identifier(settings.POSTGRES_DEV_DB)
            )
        )
    env = {
        **os.environ,
        "POSTGRES_DB": settings.POSTGRES_DEV_DB,
        "DEV_DATABASE_ENABLED": "false",
    }
    subprocess.run(["alembic", "upgrade", "head"], env=env, check=True)
    asyncio.run(seed())


if __name__ == "__main__":
    main()

"""Create a separate DB, migrate to head, refresh canonical seed records."""

import asyncio
import json
import os
import subprocess
import uuid
from pathlib import Path

import psycopg
from psycopg import sql
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.dev.database import dev_engine, require_dev_database
from app.models import (
    Application,
    Candidate,
    CandidateStatus,
    DevelopmentDataset,
    PipelineStage,
    Tenant,
    User,
    UserRole,
    Vacancy,
    VacancyStatus,
)

FIXTURES = Path(__file__).with_name("fixtures.json")
TENANT_ID = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")


def record_id(key: str) -> uuid.UUID:
    return uuid.uuid5(TENANT_ID, key)


async def seed() -> None:
    fixture = json.loads(FIXTURES.read_text())
    engine = dev_engine()
    try:
        async with AsyncSession(engine) as session:
            await session.execute(text("SET LOCAL row_security = off"))
            await session.merge(
                Tenant(
                    id=TENANT_ID, slug="development", name=fixture["tenants"][0]["name"]
                )
            )
            await session.flush()
            for row in fixture["users"]:
                await session.merge(
                    User(
                        id=uuid.UUID(row["id"]),
                        tenant_id=TENANT_ID,
                        email=row["email"],
                        role=UserRole(row["role"]),
                        is_active=row["is_active"],
                        first_name=row["first_name"],
                        last_name=row["last_name"],
                        hashed_password=None,
                    )
                )
            await session.flush()
            actor = uuid.UUID(
                next(u["id"] for u in fixture["users"] if u["role"] == "hr")
            )
            for row in fixture["vacancies"]:
                await session.merge(
                    Vacancy(
                        id=record_id(row["id"]),
                        tenant_id=TENANT_ID,
                        title=row["title"],
                        department=row["department"],
                        description=row["description"],
                        requirements=row.get("requirements", []),
                        status=VacancyStatus.OPEN
                        if row["open"]
                        else VacancyStatus.CLOSED,
                        created_by=actor,
                    )
                )
            await session.flush()
            for row in fixture["vacancies"]:
                for index, name in enumerate(["Отклик", "Рассмотрение", "Интервью"]):
                    await session.merge(
                        PipelineStage(
                            id=record_id(f"{row['id']}-stage-{index}"),
                            tenant_id=TENANT_ID,
                            vacancy_id=record_id(row["id"]),
                            stage_name=name,
                            sort_order=index,
                        )
                    )
            await session.flush()
            for row in fixture["candidates"]:
                await session.merge(
                    Candidate(
                        id=record_id(row["id"]),
                        tenant_id=TENANT_ID,
                        email=row["email"],
                        status=CandidateStatus.ASSIGNED
                        if row["vacancyId"]
                        else CandidateStatus.UNASSIGNED,
                        resume_url=row["resumeRef"],
                        questionnaire={**row, "dev_key": row["id"]},
                    )
                )
            await session.flush()
            for row in fixture["candidates"]:
                if row["vacancyId"]:
                    await session.merge(
                        Application(
                            id=record_id(f"{row['id']}-application"),
                            tenant_id=TENANT_ID,
                            candidate_id=record_id(row["id"]),
                            vacancy_id=record_id(row["vacancyId"]),
                            current_stage_id=record_id(f"{row['vacancyId']}-stage-0"),
                        )
                    )
            await session.merge(
                DevelopmentDataset(
                    id=1,
                    config={
                        "tenants": fixture["tenants"],
                        "prompts": fixture["prompts"],
                        "aliases": {
                            str(record_id(row["id"])): row["id"]
                            for row in fixture["vacancies"]
                        },
                    },
                )
            )
            await session.commit()
    finally:
        await engine.dispose()


def main() -> None:
    if not settings.DEV_DATABASE_ENABLED:
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

"""Tenant-scoped Copilot configuration. Dev previews use /developer/dataset."""

from fastapi import APIRouter, HTTPException, Response
from sqlalchemy import text

from app.api.deps import CurrentUser, SessionDep
from app.schemas.copilot import CopilotConfig

router = APIRouter(prefix="/copilot", tags=["Copilot"])


def authorize(user: CurrentUser) -> None:
    if user.role not in {"hr", "administrator", "superuser"}:
        raise HTTPException(
            status_code=403, detail="Настройки Copilot доступны HR и администратору"
        )


@router.get("/settings", response_model=CopilotConfig)
async def read_settings(
    session: SessionDep, current_user: CurrentUser, response: Response
) -> CopilotConfig:
    authorize(current_user)
    response.headers["Cache-Control"] = "no-store, private"
    config = (
        await session.execute(
            text("SELECT config FROM copilot_settings WHERE tenant_id = :tenant"),
            {"tenant": current_user.tenant_id},
        )
    ).scalar_one_or_none()
    return CopilotConfig.model_validate(config or {})


@router.put("/settings", response_model=CopilotConfig)
async def write_settings(
    body: CopilotConfig, session: SessionDep, current_user: CurrentUser
) -> CopilotConfig:
    import json

    authorize(current_user)
    # Tenant lock also serializes first-time creation; stale editors fail closed.
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:tenant, 0))"),
        {"tenant": str(current_user.tenant_id)},
    )
    previous = (
        await session.execute(
            text(
                "SELECT config FROM copilot_settings WHERE tenant_id = :tenant FOR UPDATE"
            ),
            {"tenant": current_user.tenant_id},
        )
    ).scalar_one_or_none()
    if body.version != (previous or {}).get("version", 1):
        raise HTTPException(
            status_code=409,
            detail="Настройки изменены в другом окне. Обновите страницу.",
        )
    saved = body.model_copy(update={"version": body.version + 1})
    await session.execute(
        text(
            "INSERT INTO copilot_settings (tenant_id, config) VALUES (:tenant, CAST(:config AS jsonb)) ON CONFLICT (tenant_id) DO UPDATE SET config = EXCLUDED.config"
        ),
        {"tenant": current_user.tenant_id, "config": json.dumps(saved.model_dump())},
    )
    await session.commit()
    return saved

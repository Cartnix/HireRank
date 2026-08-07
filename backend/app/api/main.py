from fastapi import APIRouter

from app.api.routes import (
    auth,
    candidates,
    dashboard,
    login,
    private,
    users,
    utils,
    vacancies,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(vacancies.router)
api_router.include_router(candidates.router)
api_router.include_router(dashboard.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)

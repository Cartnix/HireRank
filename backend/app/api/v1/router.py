"""Version 1 API router aggregation."""

from fastapi import APIRouter

from app.api.v1.routers import admin, auth, candidates, dashboard, notifications, users, vacancies


api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(candidates.router)
api_router.include_router(vacancies.router)
api_router.include_router(notifications.router)
api_router.include_router(dashboard.router)
api_router.include_router(admin.router)
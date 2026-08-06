"""Role-shaped dashboard aggregates (UC-05 / UC-06 read)."""

from __future__ import annotations

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.ats import candidates as candidate_svc
from app.models import (
    Candidate,
    CandidateStatus,
    User,
    UserRole,
    Vacancy,
    VacancyStatus,
    role_str,
)
from app.schemas.ats import (
    AdminDashboard,
    CandidateDashboard,
    HRDashboard,
    ManagerDashboard,
)


async def build_dashboard(
    *, session: AsyncSession, user: User
) -> AdminDashboard | HRDashboard | ManagerDashboard | CandidateDashboard:
    role = role_str(user.role)

    open_vacancies = (
        await session.exec(
            select(func.count())
            .select_from(Vacancy)
            .where(Vacancy.status == VacancyStatus.OPEN)
        )
    ).one()
    total_candidates = (
        await session.exec(select(func.count()).select_from(Candidate))
    ).one()
    unassigned = (
        await session.exec(
            select(func.count())
            .select_from(Candidate)
            .where(Candidate.status == CandidateStatus.UNASSIGNED)
        )
    ).one()
    pending_hitl = (
        await session.exec(
            select(func.count())
            .select_from(Candidate)
            .where(Candidate.status == CandidateStatus.PENDING_HITL)
        )
    ).one()
    assigned = (
        await session.exec(
            select(func.count())
            .select_from(Candidate)
            .where(Candidate.status == CandidateStatus.ASSIGNED)
        )
    ).one()
    total_vacancies = (
        await session.exec(select(func.count()).select_from(Vacancy))
    ).one()
    total_users = (await session.exec(select(func.count()).select_from(User))).one()

    if role == UserRole.ADMINISTRATOR.value:
        return AdminDashboard(
            total_candidates=int(total_candidates),
            unassigned_candidates=int(unassigned),
            pending_hitl=int(pending_hitl),
            total_vacancies=int(total_vacancies),
            open_vacancies=int(open_vacancies),
            total_users=int(total_users),
        )
    if role == UserRole.HR.value:
        return HRDashboard(
            total_candidates=int(total_candidates),
            open_vacancies=int(open_vacancies),
            candidates_created_by_me=0,
        )
    if role == UserRole.MANAGER.value:
        return ManagerDashboard(
            assigned_candidates=int(assigned),
            pending_hitl=int(pending_hitl),
            open_vacancies=int(open_vacancies),
        )

    # Candidate dashboard
    own = (
        await session.exec(select(Candidate).where(Candidate.user_id == user.id))
    ).first()
    assigned_vacancy = None
    status = CandidateStatus.UNASSIGNED
    questionnaire_filled = False
    if own:
        status = own.status
        questionnaire_filled = bool(own.questionnaire)
        vac_id = await candidate_svc.active_assigned_vacancy_id(session, own.id)
        if vac_id:
            vac = (
                await session.exec(select(Vacancy).where(Vacancy.id == vac_id))
            ).first()
            if vac:
                assigned_vacancy = {"id": str(vac.id), "title": vac.title}
    return CandidateDashboard(
        questionnaire_filled=questionnaire_filled,
        status=status,
        assigned_vacancy=assigned_vacancy,
    )

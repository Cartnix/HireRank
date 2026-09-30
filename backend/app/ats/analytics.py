"""One aggregation implementation; only the database/identity differs in dev."""

from collections import Counter, defaultdict
from datetime import UTC, datetime, timedelta

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    Application,
    ApplicationStatus,
    Candidate,
    Interview,
    PipelineStage,
    Scorecard,
    User,
    UserRole,
    Vacancy,
    VacancyStatus,
    role_str,
)
from app.schemas.analytics import (
    DashboardAnalytics,
    Distribution,
    RankedCandidate,
    ScheduledInterview,
    TrendPoint,
)


def utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def candidate_name(candidate: Candidate) -> str:
    q = candidate.questionnaire or {}
    return (
        (q.get("name") if isinstance(q.get("name"), str) else "")
        or " ".join(
            str(q.get(k) or "") for k in ("surname", "first_name", "patronymic")
        ).strip()
        or candidate.email
        or "Кандидат"
    )


async def build_analytics(
    *,
    session: AsyncSession,
    user: User,
    now: datetime | None = None,
    upcoming_limit: int | None = 10,
) -> DashboardAnalytics:
    now = utc(now or datetime.now(UTC))
    tenant = user.tenant_id
    role = role_str(user.role)
    candidates = list(
        (
            await session.exec(select(Candidate).where(Candidate.tenant_id == tenant))
        ).all()
    )
    applications = list(
        (
            await session.exec(
                select(Application).where(Application.tenant_id == tenant)
            )
        ).all()
    )
    if role == UserRole.CANDIDATE.value:
        candidates = [c for c in candidates if c.user_id == user.id]
    elif role == UserRole.MANAGER.value:
        assigned = {
            a.candidate_id for a in applications if a.status == ApplicationStatus.ACTIVE
        }
        candidates = [c for c in candidates if c.id in assigned]
    by_candidate = {c.id: c for c in candidates}
    applications = [a for a in applications if a.candidate_id in by_candidate]
    by_application = {a.id: a for a in applications}
    vacancies = {
        v.id: v
        for v in (
            await session.exec(select(Vacancy).where(Vacancy.tenant_id == tenant))
        ).all()
    }
    stages = {
        s.id: s
        for s in (
            await session.exec(
                select(PipelineStage).where(PipelineStage.tenant_id == tenant)
            )
        ).all()
    }
    interviews = [
        i
        for i in (
            await session.exec(select(Interview).where(Interview.tenant_id == tenant))
        ).all()
        if i.application_id in by_application
    ]
    by_interview = {i.id: i for i in interviews}
    ratings: dict = defaultdict(list)
    for score in (
        await session.exec(select(Scorecard).where(Scorecard.tenant_id == tenant))
    ).all():
        if score.interview_id in by_interview:
            application = by_application[
                by_interview[score.interview_id].application_id
            ]
            ratings[application.candidate_id].append(score.rating)
    active = {
        a.candidate_id: a for a in applications if a.status == ApplicationStatus.ACTIVE
    }
    pipeline: Counter = Counter()
    status_labels = {
        "unassigned": "Без назначения",
        "assigned": "Назначен",
        "pending_hitl": "На рассмотрении",
        "action_applied": "Обработан",
    }
    for c in candidates:
        application = active.get(c.id)
        stage = stages.get(application.current_stage_id) if application else None
        pipeline[
            stage.stage_name
            if stage
            else status_labels.get(str(c.status), str(c.status))
        ] += 1

    def source_name(candidate: Candidate) -> str:
        raw = candidate.questionnaire.get(
            "acquisition_source"
        ) or candidate.questionnaire.get("source")
        if not isinstance(raw, str) or not raw.strip():
            return "Не указан"
        return {"candidate": "Прямой отклик", "recruiter": "Рекрутер", "hr": "HR"}.get(
            raw, raw
        )

    sources = Counter(source_name(candidate) for candidate in candidates)
    daily = Counter(
        utc(c.created_at).date().isoformat() for c in candidates if c.created_at
    )
    trend = [
        TrendPoint(
            date=(now.date() - timedelta(days=offset)).isoformat(),
            value=daily[(now.date() - timedelta(days=offset)).isoformat()],
        )
        for offset in range(29, -1, -1)
    ]
    top = []
    for candidate_id, scores in ratings.items():
        if candidate_id not in active:
            continue
        c = by_candidate[candidate_id]
        a = active.get(candidate_id) or next(
            a for a in applications if a.candidate_id == candidate_id
        )
        v, s = vacancies.get(a.vacancy_id), stages.get(a.current_stage_id)
        top.append(
            RankedCandidate(
                id=c.id,
                email=c.email,
                name=candidate_name(c),
                position=v.title if v else "",
                stage=s.stage_name if s else "",
                rating=round(sum(scores) / len(scores), 2),
            )
        )
    top.sort(key=lambda c: (-c.rating, c.name, str(c.id)))
    upcoming = []
    for i in sorted(interviews, key=lambda i: utc(i.scheduled_at)):
        a = by_application[i.application_id]
        if utc(i.scheduled_at) < now or a.status != ApplicationStatus.ACTIVE:
            continue
        c, v, s = (
            by_candidate[a.candidate_id],
            vacancies.get(a.vacancy_id),
            stages.get(a.current_stage_id),
        )
        upcoming.append(
            ScheduledInterview(
                id=i.id,
                candidate_id=c.id,
                candidate_name=candidate_name(c),
                position=v.title if v else "",
                stage=s.stage_name if s else "",
                scheduled_at=i.scheduled_at,
                duration_minutes=i.duration_minutes,
            )
        )
    hire_days = [
        max(0, (utc(a.updated_at) - utc(a.created_at)).total_seconds() / 86400)
        for a in applications
        if a.status == ApplicationStatus.HIRED and a.updated_at and a.created_at
    ]

    def daily_trend(values: list[datetime]) -> list[TrendPoint]:
        counts = Counter(utc(value).date().isoformat() for value in values)
        return [
            TrendPoint(date=point.date, value=counts[point.date]) for point in trend
        ]

    hire_daily: dict[str, list[float]] = defaultdict(list)
    for application in applications:
        if (
            application.status == ApplicationStatus.HIRED
            and application.updated_at
            and application.created_at
        ):
            hire_daily[utc(application.updated_at).date().isoformat()].append(
                max(
                    0,
                    (
                        utc(application.updated_at) - utc(application.created_at)
                    ).total_seconds()
                    / 86400,
                )
            )

    return DashboardAnalytics(
        active_jobs=sum(v.status == VacancyStatus.OPEN for v in vacancies.values()),
        total_candidates=len(candidates),
        todays_interviews=sum(
            utc(i.scheduled_at).date() == now.date()
            and by_application[i.application_id].status == ApplicationStatus.ACTIVE
            for i in interviews
        ),
        avg_time_to_hire=round(sum(hire_days) / len(hire_days), 1)
        if hire_days
        else None,
        pipeline=[Distribution(stage=k, count=v) for k, v in sorted(pipeline.items())],
        sources=[Distribution(stage=k, count=v) for k, v in sorted(sources.items())],
        candidate_trend=trend,
        vacancy_trend=daily_trend(
            [v.created_at for v in vacancies.values() if v.created_at]
        ),
        interview_trend=daily_trend(
            [
                i.scheduled_at
                for i in interviews
                if by_application[i.application_id].status == ApplicationStatus.ACTIVE
            ]
        ),
        hire_trend=[
            TrendPoint(
                date=point.date,
                value=round(
                    sum(hire_daily[point.date]) / len(hire_daily[point.date]), 1
                )
                if hire_daily[point.date]
                else 0,
            )
            for point in trend
        ],
        top_candidates=top[:5],
        upcoming_interviews=upcoming
        if upcoming_limit is None
        else upcoming[:upcoming_limit],
    )

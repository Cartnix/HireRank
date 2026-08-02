from sqlalchemy import text
from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import Tenant, User, UserCreate, UserRole

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


def ensure_default_tenant(session: Session) -> Tenant:
    tenant = session.get(Tenant, settings.TENANT_ID)
    if tenant:
        return tenant
    by_slug = session.exec(
        select(Tenant).where(Tenant.slug == settings.TENANT_SLUG)
    ).first()
    if by_slug:
        return by_slug
    tenant = Tenant(
        id=settings.TENANT_ID,
        slug=settings.TENANT_SLUG,
        name=settings.TENANT_NAME,
    )
    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    return tenant


def init_db(session: Session) -> None:
    # Seed bypasses RLS (FORCE applies even to table owner)
    session.execute(text("SET row_security = off"))
    ensure_default_tenant(session)
    user = session.exec(
        select(User).where(
            User.email == settings.FIRST_SUPERUSER,
            User.tenant_id == settings.TENANT_ID,
        )
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            role=UserRole.ADMINISTRATOR,
            tenant_id=settings.TENANT_ID,
            first_name="Admin",
            last_name="User",
        )
        crud.create_user(session=session, user_create=user_in)

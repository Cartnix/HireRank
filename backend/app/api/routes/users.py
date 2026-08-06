import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlmodel import col, func, select

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    require_permission,
)
from app.auth.consent import build_user_public, record_consents, stamp_legal_acceptance
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import (
    Message,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UserRole,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
    role_str,
)
from app.utils import generate_new_account_email, send_email

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    dependencies=[Depends(require_permission("users.manage"))],
    response_model=UsersPublic,
)
async def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    count_statement = select(func.count()).select_from(User)
    count = (await session.exec(count_statement)).one()

    statement = (
        select(User).order_by(desc(col(User.created_at))).offset(skip).limit(limit)
    )
    users = (await session.exec(statement)).all()

    return UsersPublic(data=users, count=count)


@router.post(
    "/",
    dependencies=[Depends(require_permission("users.manage"))],
    response_model=UserPublic,
)
async def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    user = await crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    # Hidden multi-tenancy: never trust client-supplied tenant_id (write-exploit guard)
    user_in = UserCreate(
        **user_in.model_dump(exclude={"tenant_id"}),
        tenant_id=settings.TENANT_ID,
    )
    user = await crud.create_user(session=session, user_create=user_in)
    if settings.emails_enabled and user_in.email and user_in.password:
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email, password=user_in.password
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return user


@router.patch("/me", response_model=UserPublic)
async def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    if user_in.email:
        existing_user = await crud.get_user_by_email(
            session=session, email=user_in.email
        )
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.patch("/me/password", response_model=Message)
async def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=400, detail="Password login is not available for this account"
        )
    verified, _ = verify_password(body.current_password, current_user.hashed_password)
    if not verified:
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    await session.commit()
    return Message(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    return current_user


@router.delete("/me", response_model=Message)
async def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    if role_str(current_user.role) == UserRole.ADMINISTRATOR.value:
        raise HTTPException(
            status_code=403,
            detail="Administrators are not allowed to delete themselves",
        )
    await session.delete(current_user)
    await session.commit()
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic, deprecated=True)
async def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    """Deprecated: use POST /auth/register."""
    if user_in.role not in (
        UserRole.CANDIDATE,
        UserRole.HR,
        UserRole.MANAGER,
        UserRole.RECRUITER,
    ):
        raise HTTPException(status_code=400, detail="Role is not allowed")
    user = await crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user_create = UserCreate(
        email=user_in.email,
        password=user_in.password,
        role=user_in.role,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        tenant_id=settings.TENANT_ID,
    )
    user = await crud.create_user(session=session, user_create=user_create)
    stamp_legal_acceptance(user)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    await record_consents(session=session, user=user, consent=user_in.consent)
    return await build_user_public(session, user)


@router.get("/{user_id}", response_model=UserPublic)
async def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    user = await session.get(User, user_id)
    if user == current_user:
        return user
    if role_str(current_user.role) != UserRole.ADMINISTRATOR.value:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(require_permission("users.manage"))],
    response_model=UserPublic,
)
async def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    db_user = await session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user_in.email:
        existing_user = await crud.get_user_by_email(
            session=session, email=user_in.email
        )
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    db_user = await crud.update_user(session=session, db_user=db_user, user_in=user_in)
    return db_user


@router.delete(
    "/{user_id}",
    dependencies=[Depends(require_permission("users.manage"))],
)
async def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403,
            detail="Administrators are not allowed to delete themselves",
        )
    await session.delete(user)
    await session.commit()
    return Message(message="User deleted successfully")

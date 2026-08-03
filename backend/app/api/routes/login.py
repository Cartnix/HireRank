from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.api.routes.auth import _issue_token_pair
from app.audit.emit import email_hash_metadata, emit_auth_audit
from app.audit.schemas import AuditAction
from app.models import Message, NewPassword, TokenPair, UserPublic, UserUpdate
from app.utils import (
    generate_password_reset_token,
    generate_reset_password_email,
    send_email,
    verify_password_reset_token,
)

router = APIRouter(tags=["login"])


@router.post("/login/access-token", response_model=TokenPair)
def login_access_token(
    request: Request,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> TokenPair:
    """
    OAuth2 form-compatible login (Swagger). Prefer POST /auth/login (JSON).
    """
    user = crud.authenticate(
        session=session, email=form_data.username, password=form_data.password
    )
    if not user:
        emit_auth_audit(
            request=request,
            background_tasks=background_tasks,
            action=AuditAction.LOGIN_FAILURE,
            metadata=email_hash_metadata(form_data.username, reason="bad_credentials"),
            force_sync=True,
        )
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        emit_auth_audit(
            request=request,
            background_tasks=background_tasks,
            action=AuditAction.LOGIN_FAILURE,
            tenant_id=user.tenant_id,
            user_id=user.id,
            entity_id=user.id,
            metadata={"reason": "inactive_user"},
            force_sync=True,
        )
        raise HTTPException(status_code=400, detail="Inactive user")
    pair = _issue_token_pair(session, user)
    emit_auth_audit(
        request=request,
        background_tasks=background_tasks,
        action=AuditAction.LOGIN_SUCCESS,
        tenant_id=user.tenant_id,
        user_id=user.id,
        entity_id=user.id,
        metadata={"reason": "login"},
    )
    return pair


@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
    return current_user


@router.post("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep) -> Message:
    user = crud.get_user_by_email(session=session, email=email)
    if user:
        password_reset_token = generate_password_reset_token(email=email)
        email_data = generate_reset_password_email(
            email_to=user.email, email=email, token=password_reset_token
        )
        send_email(
            email_to=user.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return Message(
        message="If that email is registered, we sent a password recovery link"
    )


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    user_in_update = UserUpdate(password=body.new_password)
    crud.update_user(
        session=session,
        db_user=user,
        user_in=user_in_update,
    )
    return Message(message="Password updated successfully")


@router.post(
    "/password-recovery-html-content/{email}",
    dependencies=[Depends(get_current_active_superuser)],
    response_class=HTMLResponse,
)
def recover_password_html_content(email: str, session: SessionDep) -> Any:
    user = crud.get_user_by_email(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )

    return HTMLResponse(
        content=email_data.html_content, headers={"subject:": email_data.subject}
    )

from typing import Any

from fastapi.encoders import jsonable_encoder
from pwdlib.hashers.bcrypt import BcryptHasher

from app import crud
from app.core.config import settings
from app.core.security import verify_password
from app.models import User, UserCreate, UserRole, UserUpdate
from tests.utils.utils import random_email, random_lower_string


def test_create_user(db: Any) -> None:
    email = random_email()
    password = random_lower_string()
    user_in = UserCreate(email=email, password=password, tenant_id=settings.TENANT_ID)
    user = db.run(crud.create_user(session=db.session, user_create=user_in))
    assert user.email == email
    assert hasattr(user, "hashed_password")
    assert user.tenant_id == settings.TENANT_ID


def test_authenticate_user(db: Any) -> None:
    email = random_email()
    password = random_lower_string()
    user_in = UserCreate(email=email, password=password)
    user = db.run(crud.create_user(session=db.session, user_create=user_in))
    authenticated_user = db.run(
        crud.authenticate(session=db.session, email=email, password=password)
    )
    assert authenticated_user
    assert user.email == authenticated_user.email


def test_not_authenticate_user(db: Any) -> None:
    email = random_email()
    password = random_lower_string()
    user = db.run(crud.authenticate(session=db.session, email=email, password=password))
    assert user is None


def test_check_if_user_is_active(db: Any) -> None:
    email = random_email()
    password = random_lower_string()
    user_in = UserCreate(email=email, password=password)
    user = db.run(crud.create_user(session=db.session, user_create=user_in))
    assert user.is_active is True


def test_check_if_user_is_active_inactive(db: Any) -> None:
    email = random_email()
    password = random_lower_string()
    user_in = UserCreate(email=email, password=password, is_active=False)
    user = db.run(crud.create_user(session=db.session, user_create=user_in))
    assert user.is_active is False


def test_check_if_user_is_administrator(db: Any) -> None:
    email = random_email()
    password = random_lower_string()
    user_in = UserCreate(email=email, password=password, role=UserRole.ADMINISTRATOR)
    user = db.run(crud.create_user(session=db.session, user_create=user_in))
    assert user.is_superuser is True
    assert user.role == UserRole.ADMINISTRATOR


def test_check_if_user_is_superuser_normal_user(db: Any) -> None:
    username = random_email()
    password = random_lower_string()
    user_in = UserCreate(email=username, password=password)
    user = db.run(crud.create_user(session=db.session, user_create=user_in))
    assert user.is_superuser is False


def test_get_user(db: Any) -> None:
    password = random_lower_string()
    username = random_email()
    user_in = UserCreate(email=username, password=password, role=UserRole.ADMINISTRATOR)
    user = db.run(crud.create_user(session=db.session, user_create=user_in))
    user_2 = db.get(User, user.id)
    assert user_2
    assert user.email == user_2.email
    assert jsonable_encoder(user) == jsonable_encoder(user_2)


def test_update_user(db: Any) -> None:
    password = random_lower_string()
    email = random_email()
    user_in = UserCreate(email=email, password=password, role=UserRole.ADMINISTRATOR)
    user = db.run(crud.create_user(session=db.session, user_create=user_in))
    new_password = random_lower_string()
    user_in_update = UserUpdate(password=new_password, role=UserRole.ADMINISTRATOR)
    if user.id is not None:
        db.run(
            crud.update_user(session=db.session, db_user=user, user_in=user_in_update)
        )
    user_2 = db.get(User, user.id)
    assert user_2
    assert user.email == user_2.email
    verified, _ = verify_password(new_password, user_2.hashed_password)
    assert verified


def test_authenticate_user_with_bcrypt_upgrades_to_argon2(db: Any) -> None:
    email = random_email()
    password = random_lower_string()

    bcrypt_hasher = BcryptHasher()
    bcrypt_hash = bcrypt_hasher.hash(password)
    assert bcrypt_hash.startswith("$2")

    user = User(
        email=email,
        hashed_password=bcrypt_hash,
        tenant_id=settings.TENANT_ID,
        role=UserRole.CANDIDATE,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    assert user.hashed_password.startswith("$2")

    authenticated_user = db.run(
        crud.authenticate(session=db.session, email=email, password=password)
    )
    assert authenticated_user
    assert authenticated_user.email == email

    db.refresh(authenticated_user)

    assert authenticated_user.hashed_password.startswith("$argon2")

    verified, updated_hash = verify_password(
        password, authenticated_user.hashed_password
    )
    assert verified
    assert updated_hash is None

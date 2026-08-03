import jwt
from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.auth.permissions import has_permission
from app.core import security
from app.core.config import settings
from tests.utils.utils import random_email, random_lower_string


def test_auth_register_login_me_refresh_logout(client: TestClient) -> None:
    email = random_email()
    password = random_lower_string()

    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": email,
            "password": password,
            "role": "recruiter",
            "first_name": "Rec",
            "last_name": "Ruiter",
        },
    )
    assert r.status_code == 201
    pair = r.json()
    assert pair["token_type"] == "bearer"
    assert pair["access_token"]
    assert pair["refresh_token"]
    assert pair["expires_in"] > 0

    payload = jwt.decode(
        pair["access_token"],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )
    assert payload["role"] == "recruiter"
    assert payload["tenant_id"] == str(settings.TENANT_ID)
    assert payload["type"] == "access"
    assert payload["jti"]
    assert set(payload["permissions"]) == {"vacancy.read", "resume.upload"}

    headers = {"Authorization": f"Bearer {pair['access_token']}"}
    r = client.get(f"{settings.API_V1_STR}/auth/me", headers=headers)
    assert r.status_code == 200
    me = r.json()
    assert me["email"] == email
    assert me["role"] == "recruiter"
    assert me["tenant_id"] == str(settings.TENANT_ID)

    r = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 200
    refreshed = r.json()
    assert refreshed["access_token"]
    assert refreshed["refresh_token"] != pair["refresh_token"]
    refreshed_payload = jwt.decode(
        refreshed["access_token"],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )
    assert set(refreshed_payload["permissions"]) == {"vacancy.read", "resume.upload"}

    # Within grace window a twin refresh may still succeed; force-expire grace
    from app.core.token_store import get_token_store

    store = get_token_store()
    old_jti = jwt.decode(
        pair["refresh_token"],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )["jti"]
    store.force_expire_grace(old_jti, tenant_id=settings.TENANT_ID)

    r = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 401

    r = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": email, "password": password},
    )
    assert r.status_code == 200
    login_pair = r.json()

    r = client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {login_pair['access_token']}"},
        json={"refresh_token": login_pair["refresh_token"]},
    )
    assert r.status_code == 204

    r = client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {login_pair['access_token']}"},
    )
    assert r.status_code == 401


def test_auth_register_rejects_administrator(client: TestClient) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": random_email(),
            "password": random_lower_string(),
            "role": "administrator",
        },
    )
    assert r.status_code == 400


def test_auth_register_ignores_client_tenant(client: TestClient) -> None:
    email = random_email()
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": email,
            "password": random_lower_string(),
            "role": "candidate",
            "tenant_id": "11111111-1111-4111-8111-111111111111",
        },
    )
    # tenant_id is not in schema — ignored / validation may strip extra
    assert r.status_code == 201
    payload = jwt.decode(
        r.json()["access_token"],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )
    assert payload["tenant_id"] == str(settings.TENANT_ID)


def test_rbac_candidate_forbidden_on_users_manage(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/users/",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "Insufficient permissions"


def test_rbac_permissions_matrix_from_db(db: Session) -> None:
    admin = set(crud.get_permissions_for_role(session=db, role_name="administrator"))
    hr = set(crud.get_permissions_for_role(session=db, role_name="hr"))
    manager = set(crud.get_permissions_for_role(session=db, role_name="manager"))
    recruiter = set(crud.get_permissions_for_role(session=db, role_name="recruiter"))
    candidate = set(crud.get_permissions_for_role(session=db, role_name="candidate"))

    assert "admin.panel" in admin
    assert "users.manage" in admin
    assert "vacancy.create" in hr
    assert "vacancy.create" not in recruiter
    assert "resume.upload" in recruiter
    assert "vacancy.read" in manager
    assert "resume.upload" not in manager
    assert "users.manage" not in candidate
    assert "candidate.read" in candidate

    assert has_permission(admin, "admin.panel")
    assert not has_permission(candidate, "users.manage")

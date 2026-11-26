"""Authentication, cookie security, refresh rotation, and registration gate tests (RF088, RF090)."""

import pytest
from django.conf import settings
from rest_framework.test import APIClient

from apps.accounts.models import User


@pytest.mark.django_db
def test_login_sets_httponly_cookies_and_returns_profile(api_client: APIClient, user: User) -> None:
    response = api_client.post(
        "/api/v1/auth/login/",
        {"email": user.email, "password": "StrongPassword!123"},
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["email"] == user.email

    access_cookie = response.cookies[settings.AUTH_COOKIE_ACCESS]
    refresh_cookie = response.cookies[settings.AUTH_COOKIE_REFRESH]
    assert access_cookie["httponly"] is True
    assert refresh_cookie["httponly"] is True
    assert refresh_cookie["path"] == "/api/v1/auth/"


@pytest.mark.django_db
def test_login_invalid_credentials_returns_generic_401(api_client: APIClient, user: User) -> None:
    response = api_client.post(
        "/api/v1/auth/login/",
        {"email": user.email, "password": "WrongPassword!999"},
        format="json",
    )
    assert response.status_code == 401
    assert "error" in response.json()


@pytest.mark.django_db
def test_public_registration_blocked_by_default(api_client: APIClient) -> None:
    response = api_client.post(
        "/api/v1/auth/register/",
        {"email": "new@example.com", "password": "StrongPassword!789"},
        format="json",
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "permission_denied"


@pytest.mark.django_db
def test_refresh_rotates_and_blacklists_previous_token(api_client: APIClient, user: User) -> None:
    login_resp = api_client.post(
        "/api/v1/auth/login/",
        {"email": user.email, "password": "StrongPassword!123"},
        format="json",
    )
    old_refresh = login_resp.cookies[settings.AUTH_COOKIE_REFRESH].value

    refresh_resp = api_client.post("/api/v1/auth/refresh/")
    assert refresh_resp.status_code == 200
    new_refresh = refresh_resp.cookies[settings.AUTH_COOKIE_REFRESH].value
    assert new_refresh != old_refresh

    # Reusing the old refresh token must fail
    api_client.cookies[settings.AUTH_COOKIE_REFRESH] = old_refresh
    reuse_resp = api_client.post("/api/v1/auth/refresh/")
    assert reuse_resp.status_code == 401


@pytest.mark.django_db
def test_me_requires_authentication(api_client: APIClient) -> None:
    response = api_client.get("/api/v1/auth/me/")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "not_authenticated"


@pytest.mark.django_db
def test_logout_clears_cookies(auth_client: APIClient) -> None:
    response = auth_client.post("/api/v1/auth/logout/")
    assert response.status_code == 204
    assert response.cookies[settings.AUTH_COOKIE_ACCESS].value == ""
    assert response.cookies[settings.AUTH_COOKIE_REFRESH].value == ""

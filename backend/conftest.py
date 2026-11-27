"""Global pytest fixtures and factories for Study Platform backend."""

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.accounts.models import User, UserProfile


@pytest.fixture(autouse=True)
def _isolated_throttle_cache() -> None:
    """Rate-limit counters live in the cache and must not leak between tests."""
    cache.clear()


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def user(db: None) -> User:
    account = User.objects.create_user(
        email="owner@example.com",
        password="StrongPassword!123",
    )
    UserProfile.objects.create(user=account, display_name="Owner User")
    return account


@pytest.fixture
def other_user(db: None) -> User:
    account = User.objects.create_user(
        email="other@example.com",
        password="StrongPassword!456",
    )
    UserProfile.objects.create(user=account, display_name="Other User")
    return account


@pytest.fixture
def auth_client(user: User) -> APIClient:
    client = APIClient(enforce_csrf_checks=True)
    csrf_resp = client.get("/api/v1/auth/csrf/")
    csrf_token = csrf_resp.json()["csrfToken"]
    login_resp = client.post(
        "/api/v1/auth/login/",
        {"email": user.email, "password": "StrongPassword!123"},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token,
    )
    assert login_resp.status_code == 200
    new_csrf = client.cookies.get("csrftoken")
    if new_csrf:
        client.credentials(HTTP_X_CSRFTOKEN=new_csrf.value)
    return client

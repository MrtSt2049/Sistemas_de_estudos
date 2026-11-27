"""Findings of the F5 security review (RNF003, RNF008)."""

import os
import subprocess
import sys
from pathlib import Path
from typing import Any

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from apps.accounts.models import User

BACKEND = Path(__file__).resolve().parent.parent
LOGIN = "/api/v1/auth/login/"


@pytest.mark.django_db
@pytest.mark.parametrize("url", [LOGIN, "/api/v1/auth/refresh/", "/api/v1/auth/register/"])
def test_anonymous_auth_posts_require_csrf_token(url: str, user: User) -> None:
    client = APIClient(enforce_csrf_checks=True)

    response = client.post(
        url, {"email": user.email, "password": "StrongPassword!123"}, format="json"
    )

    assert response.status_code == 403
    assert "sp_access" not in response.cookies


@pytest.mark.django_db
def test_login_throttle_ignores_spoofed_forwarded_for() -> None:
    client = APIClient()
    body = {"email": "x@example.com", "password": "wrong"}

    statuses = [
        client.post(LOGIN, body, format="json", HTTP_X_FORWARDED_FOR=f"10.0.0.{i}").status_code
        for i in range(8)
    ]

    assert 429 in statuses


@override_settings(CONTENT_SECURITY_POLICY="default-src 'self'")
def test_content_security_policy_header_when_configured(api_client: APIClient) -> None:
    assert api_client.get("/healthz")["Content-Security-Policy"] == "default-src 'self'"


def _production(code: str) -> "subprocess.CompletedProcess[str]":
    env = {
        **os.environ,
        "DJANGO_SETTINGS_MODULE": "config.settings.production",
        "DJANGO_SECRET_KEY": "k9!pR2#vXq7Lm4@Zt8^Wc1&Hs6*Bn3(Yd5)Fg0-Ju_Ae+Qo=Ni",
        "DJANGO_DEBUG": "false",
        "DJANGO_ALLOWED_HOSTS": "api.example.com,localhost",
        "DATABASE_URL": "postgresql://u:p@127.0.0.1:1/none",
        "CORS_ALLOWED_ORIGINS": "https://app.example.com",
        "CSRF_TRUSTED_ORIGINS": "https://app.example.com",
        "ALLOW_REGISTRATION": "false",
        "PYTHONUTF8": "1",
    }
    return subprocess.run(  # noqa: S603 - fixed command built by the test
        [sys.executable, "-c", code],
        cwd=BACKEND,
        env=env,
        capture_output=True,
        text=True,
        timeout=60,
    )


def test_production_passes_deploy_check() -> None:
    result = _production(
        "import django; django.setup(); from django.core.management import call_command;"
        "call_command('check', deploy=True, fail_level='WARNING')"
    )

    assert result.returncode == 0, result.stderr


def test_production_headers_docs_and_health_probe() -> None:
    code: Any = """
import django; django.setup()
from django.test import Client
secure = Client(HTTP_HOST='api.example.com', HTTP_X_FORWARDED_PROTO='https')
root = secure.get('/healthz')
for name in ('Strict-Transport-Security','X-Content-Type-Options','X-Frame-Options',
             'Content-Security-Policy','Referrer-Policy'):
    assert name in root.headers, name
assert root.headers['X-Frame-Options'] == 'DENY'
assert secure.get('/api/docs/').status_code == 404
assert secure.get('/api/schema/').status_code == 404
# O HEALTHCHECK do contêiner chama por HTTP: não pode ser redirecionado.
plain = Client(HTTP_HOST='localhost')
assert plain.get('/healthz').status_code == 200
assert plain.get('/api/v1/auth/me/').status_code == 301
"""
    result = _production(code)

    assert result.returncode == 0, result.stderr[-2000:]

"""Tests for /healthz, /readyz, and X-Request-ID correlation (RNF029)."""

import pytest
from django.db import OperationalError, connection
from rest_framework.test import APIClient


def test_healthz_returns_ok(api_client: APIClient) -> None:
    response = api_client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert "X-Request-ID" in response


@pytest.mark.django_db
def test_readyz_checks_database(api_client: APIClient) -> None:
    response = api_client.get("/readyz")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


def test_readyz_returns_503_when_database_is_unreachable(
    api_client: APIClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def broken_cursor() -> None:
        raise OperationalError("database unreachable")

    monkeypatch.setattr(connection, "cursor", broken_cursor)

    response = api_client.get("/readyz")

    assert response.status_code == 503
    assert response.json() == {"status": "unavailable"}

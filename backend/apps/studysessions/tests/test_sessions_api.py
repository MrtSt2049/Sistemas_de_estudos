from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from django.db import IntegrityError, transaction
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core import clock
from apps.curriculum.models import Topic
from apps.disciplines.models import Discipline
from apps.studysessions.models import StudySession

pytestmark = pytest.mark.django_db
URL = "/api/v1/study-sessions/"
START = datetime(2026, 11, 27, 13, 0, tzinfo=UTC)


class FakeClock:
    def __init__(self) -> None:
        self.current = START

    def __call__(self) -> datetime:
        return self.current

    def advance(self, **delta: float) -> None:
        self.current += timedelta(**delta)


@pytest.fixture
def fake_clock(auth_client: APIClient) -> Iterator[FakeClock]:
    """Installed after login so the JWT is issued with the real time."""
    fake = FakeClock()
    clock.set_clock(fake)
    yield fake
    clock.set_clock(None)


@pytest.fixture
def topic(user: User) -> Topic:
    discipline = Discipline.objects.create(owner=user, name="Combinatória", kind="olympiad")
    return Topic.objects.create(owner=user, discipline=discipline, title="Pombos")


def start(client: APIClient, **data: Any) -> Any:
    return client.post(f"{URL}start/", {"activity_kind": "exercises", **data}, format="json")


def manual(client: APIClient, begin: str, end: str, **data: Any) -> Any:
    body = {"activity_kind": "reading", "started_at": begin, "ended_at": end, **data}
    return client.post(URL, body, format="json")


def test_start_uses_server_time_and_ignores_client_time(
    auth_client: APIClient, fake_clock: FakeClock
) -> None:
    response = start(auth_client, started_at="2000-01-01T00:00:00Z")

    assert response.status_code == 201
    assert response.json()["started_at"] == "2026-11-27T13:00:00Z"
    assert response.json()["ended_at"] is None


def test_second_active_session_conflicts(auth_client: APIClient, fake_clock: FakeClock) -> None:
    assert start(auth_client).status_code == 201

    response = start(auth_client)

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "active_session_exists"


def test_database_enforces_a_single_active_session(user: User) -> None:
    StudySession.objects.create(owner=user, activity_kind="class", started_at=START)

    with pytest.raises(IntegrityError), transaction.atomic():
        StudySession.objects.create(owner=user, activity_kind="class", started_at=START)


def test_each_user_has_its_own_active_session(
    auth_client: APIClient, other_user: User, fake_clock: FakeClock
) -> None:
    StudySession.objects.create(owner=other_user, activity_kind="class", started_at=START)

    assert auth_client.get(f"{URL}active/").status_code == 204
    assert start(auth_client).status_code == 201


def test_active_session_survives_reload_with_elapsed_time(
    auth_client: APIClient, fake_clock: FakeClock
) -> None:
    session_id = start(auth_client).json()["id"]
    fake_clock.advance(minutes=7)

    response = auth_client.get(f"{URL}active/")

    assert response.status_code == 200
    assert response.json()["id"] == session_id
    assert response.json()["elapsed_seconds"] == 420


def test_finish_computes_duration_and_marks_topic(
    auth_client: APIClient, fake_clock: FakeClock, topic: Topic
) -> None:
    started = start(auth_client, topic=str(topic.pk)).json()
    assert started["discipline"] == str(topic.discipline_id)
    fake_clock.advance(minutes=50, seconds=30)

    response = auth_client.post(
        f"{URL}active/finish/", {"focus_rating": 4, "notes": "ok"}, format="json"
    )

    assert response.status_code == 200
    assert response.json()["duration_seconds"] == 3030
    topic.refresh_from_db()
    assert topic.last_studied_at == fake_clock.current


def test_finish_without_active_session_is_not_found(auth_client: APIClient) -> None:
    assert auth_client.post(f"{URL}active/finish/", {}, format="json").status_code == 404


@pytest.mark.parametrize("rating", [0, 6])
def test_rating_range(auth_client: APIClient, fake_clock: FakeClock, rating: int) -> None:
    start(auth_client)

    response = auth_client.post(f"{URL}active/finish/", {"focus_rating": rating}, format="json")

    assert response.status_code == 400


def test_manual_session_in_utc(auth_client: APIClient, fake_clock: FakeClock) -> None:
    response = manual(auth_client, "2026-11-26T09:00:00-03:00", "2026-11-26T10:30:00-03:00")

    assert response.status_code == 201
    assert response.json()["started_at"] == "2026-11-26T12:00:00Z"
    assert response.json()["duration_seconds"] == 5400
    assert response.json()["is_manual"] is True


@pytest.mark.parametrize(
    ("begin", "end", "code"),
    [
        ("2026-11-26T10:00:00Z", "2026-11-26T09:00:00Z", "invalid_interval"),
        ("2026-11-26T10:00:00Z", "2026-11-26T10:00:00Z", "invalid_interval"),
        ("2026-11-26T10:00:00Z", "2026-11-28T11:00:00Z", "invalid_interval"),
        ("2026-11-28T10:00:00Z", "2026-11-28T11:00:00Z", "session_in_future"),
    ],
)
def test_invalid_manual_interval(
    auth_client: APIClient, fake_clock: FakeClock, begin: str, end: str, code: str
) -> None:
    response = manual(auth_client, begin, end)

    assert response.status_code == 400
    assert response.json()["error"]["code"] == code


def test_overlapping_sessions_conflict(auth_client: APIClient, fake_clock: FakeClock) -> None:
    manual(auth_client, "2026-11-26T10:00:00Z", "2026-11-26T11:00:00Z")

    overlap = manual(auth_client, "2026-11-26T10:30:00Z", "2026-11-26T11:30:00Z")
    adjacent = manual(auth_client, "2026-11-26T11:00:00Z", "2026-11-26T12:00:00Z")

    assert overlap.status_code == 409
    assert adjacent.status_code == 201


def test_manual_session_cannot_overlap_the_running_one(
    auth_client: APIClient, fake_clock: FakeClock
) -> None:
    start(auth_client)
    fake_clock.advance(hours=1)

    response = manual(auth_client, "2026-11-27T13:30:00Z", "2026-11-27T13:45:00Z")

    assert response.status_code == 409


def test_isolation(auth_client: APIClient, other_user: User, fake_clock: FakeClock) -> None:
    discipline = Discipline.objects.create(owner=other_user, name="x", kind="olympiad")
    foreign = StudySession.objects.create(owner=other_user, activity_kind="class", started_at=START)

    assert start(auth_client, discipline=str(discipline.pk)).status_code == 400
    assert auth_client.get(URL).json()["count"] == 0
    assert auth_client.get(f"{URL}{foreign.pk}/").status_code == 404
    assert auth_client.delete(f"{URL}{foreign.pk}/").status_code == 404
    assert auth_client.post(f"{URL}active/finish/", {}, format="json").status_code == 404

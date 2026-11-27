import io
import json
import zipfile
from datetime import UTC, date, datetime

import pytest
from django.apps import apps
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.models import OwnedModel, Tag
from apps.disciplines.models import Discipline
from apps.exercises.models import Attempt, Exercise, ExerciseSource
from apps.exports import ics
from apps.goals.models import Goal, PeriodicReview
from apps.planning.models import CalendarEvent

pytestmark = pytest.mark.django_db
BASE = "/api/v1/export/"
MATH = r"Prove que $\sum_{k=1}^{n} k = \frac{n(n+1)}{2}$."


def populate(owner: User, marker: str) -> Exercise:
    discipline = Discipline.objects.create(owner=owner, name=f"D-{marker}", kind="olympiad")
    source = ExerciseSource.objects.create(owner=owner, name=f"F-{marker}")
    exercise = Exercise.objects.create(
        owner=owner,
        discipline=discipline,
        source=source,
        title=f"../../{marker}/..\\evil: *?",
        statement_md=MATH,
    )
    exercise.tags.add(Tag.objects.create(owner=owner, name=marker, slug=marker))
    Attempt.objects.create(owner=owner, exercise=exercise, result="partial", notes_md=marker)
    PeriodicReview.objects.create(
        owner=owner,
        kind="weekly",
        period_start=date(2026, 11, 23),
        period_end=date(2026, 11, 29),
        planned_text=f"plano-{marker}",
    )
    CalendarEvent.objects.create(
        owner=owner,
        title=f"Aula; {marker}, teste",
        kind="class",
        starts_at=datetime(2026, 11, 23, 22, 0, tzinfo=UTC),
        ends_at=datetime(2026, 11, 24, 0, 0, tzinfo=UTC),
        recurrence_interval_weeks=2,
        recurrence_until=date(2026, 12, 21),
        description="linha 1\nlinha 2",
    )
    Goal.objects.create(
        owner=owner,
        title=f"Meta {marker}",
        scope="weekly",
        period_start=date(2026, 11, 23),
        period_end=date(2026, 11, 29),
        metric="study_minutes",
        target_value=60,
    )
    return exercise


@pytest.fixture
def two_users(user: User, other_user: User) -> None:
    populate(user, "minha")
    populate(other_user, "alheia")


def test_json_covers_every_owned_model(auth_client: APIClient, two_users: None) -> None:
    body = json.loads(auth_client.get(f"{BASE}json/").content)

    expected = {m._meta.label_lower for m in apps.get_models() if issubclass(m, OwnedModel)}
    assert set(body["data"]) == expected


def test_json_has_only_own_data_and_no_secrets(
    auth_client: APIClient, user: User, other_user: User, two_users: None
) -> None:
    response = auth_client.get(f"{BASE}json/")
    text = response.content.decode()
    body = json.loads(text)

    assert response["Content-Disposition"].startswith("attachment;")
    assert body["account"]["email"] == user.email
    assert "alheia" not in text
    assert other_user.email not in text
    assert user.password not in text
    assert "password" not in text
    for label, rows in body["data"].items():
        assert all(row["fields"]["owner"] == str(user.pk) for row in rows), label
    exercise = body["data"]["exercises.exercise"][0]["fields"]
    assert exercise["statement_md"] == MATH
    assert len(exercise["tags"]) == 1


def test_markdown_keeps_math_and_has_safe_paths(auth_client: APIClient, two_users: None) -> None:
    response = auth_client.get(f"{BASE}markdown/")

    archive = zipfile.ZipFile(io.BytesIO(response.content))
    names = archive.namelist()
    for name in names:
        assert ".." not in name
        assert not name.startswith(("/", "\\"))
        assert "\\" not in name
        assert name.count("/") <= 1
    exercise_file = next(n for n in names if n.startswith("exercicios/"))
    content = archive.read(exercise_file).decode()
    assert MATH in content
    everything = "".join(archive.read(n).decode() for n in names)
    assert "plano-minha" in everything
    assert "alheia" not in everything


def test_ics_structure(auth_client: APIClient, two_users: None) -> None:
    response = auth_client.get(f"{BASE}ics/")
    raw = response.content
    text = raw.decode()

    assert response["Content-Type"].startswith("text/calendar")
    assert text.startswith("BEGIN:VCALENDAR\r\n")
    assert text.endswith("END:VCALENDAR\r\n")
    assert "\n" not in text.replace("\r\n", "")
    assert all(len(line) <= 75 for line in raw.split(b"\r\n"))
    unfolded = text.replace("\r\n ", "")
    assert "BEGIN:VTIMEZONE\r\nTZID:America/Sao_Paulo" in unfolded
    assert "TZOFFSETTO:-0300" in unfolded
    assert "DTSTART;TZID=America/Sao_Paulo:20261123T190000" in unfolded
    assert "RRULE:FREQ=WEEKLY;INTERVAL=2;UNTIL=" in unfolded
    assert r"SUMMARY:Aula\; minha\, teste" in unfolded
    assert r"DESCRIPTION:linha 1\nlinha 2" in unfolded
    assert "DTSTART;VALUE=DATE:20261129" in unfolded  # prazo da meta
    assert "alheia" not in unfolded
    for name in ("VEVENT", "VTIMEZONE", "VCALENDAR"):
        assert unfolded.count(f"BEGIN:{name}") == unfolded.count(f"END:{name}")


def test_vtimezone_includes_dst_transitions() -> None:
    lines = ics.timezone_lines("America/New_York", 2026, 2026)

    assert lines.count("BEGIN:DAYLIGHT") == 1
    assert "DTSTART:20260308T020000" in lines
    assert "DTSTART:20261101T020000" in lines


@pytest.mark.parametrize("kind", ["json", "markdown", "ics"])
def test_export_requires_authentication(api_client: APIClient, kind: str) -> None:
    assert api_client.get(f"{BASE}{kind}/").status_code == 401

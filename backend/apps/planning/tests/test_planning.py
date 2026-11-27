"""CSV fixtures use the real headers with synthetic rows (the repository is public)."""

from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import pytest
from django.core.management import CommandError, call_command
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.disciplines.models import Discipline
from apps.goals.models import Goal
from apps.planning.models import CalendarEvent, WeeklyPlanProfile
from apps.planning.occurrences import weekly_occurrences

pytestmark = pytest.mark.django_db
EVENTS = "/api/v1/events/"
CALENDAR = "/api/v1/calendar/"
PROFILES = "/api/v1/week-profiles/"
BLOCKS = "/api/v1/week-blocks/"
HEADER = (
    "Semana,Início,Fim,Fase,Foco OBMU da semana,h OBMU,h Maratona,h OctoBit/MEJ,"
    "h Físico,Checkpoint,Feito?\n"
)
ROWS = (
    "1,2026-10-12,2026-10-18,F0 Reset,Foco um,8,4,6,6,,não\n"
    '2,2026-10-19,2026-10-25,F0 Reset,"Foco, dois",8,0,6,6.5,CHECKPOINT teste,não\n'
)


def write_csv(tmp_path: Path, body: str = ROWS, header: str = HEADER) -> Path:
    path = tmp_path / "calendario.csv"
    path.write_text(header + body, encoding="utf-8-sig")
    return path


def seed(path: Path, user: User) -> None:
    call_command("seed_calendar", file=str(path), email=user.email)


def create_event(client: APIClient, **data: Any) -> Any:
    body = {
        "title": "Aula",
        "kind": "class",
        "starts_at": "2026-11-23T19:00:00-03:00",
        "ends_at": "2026-11-23T21:00:00-03:00",
        **data,
    }
    return client.post(EVENTS, body, format="json")


def titles(client: APIClient, start: str, end: str) -> list[str]:
    response = client.get(f"{CALENDAR}?start={start}&end={end}")
    assert response.status_code == 200, response.json()
    return [item["title"] for item in response.json()]


def test_import_creates_events_checkpoints_and_goals_once(tmp_path: Path, user: User) -> None:
    path = write_csv(tmp_path)

    seed(path, user)
    seed(path, user)

    assert CalendarEvent.objects.count() == 3  # 2 semanas + 1 checkpoint
    assert Goal.objects.count() == 3  # Maratona com 0 h não vira meta
    goal = Goal.objects.get(import_key="master:goal:obmu:1")
    assert goal.discipline is not None
    assert (goal.target_value, goal.discipline.name) == (480, "OBMU")
    week = CalendarEvent.objects.get(import_key="master:week:1")
    assert week.all_day
    zone = ZoneInfo("America/Sao_Paulo")
    assert week.starts_at == datetime(2026, 10, 12, tzinfo=zone)
    assert week.ends_at == datetime(2026, 10, 19, tzinfo=zone)


def test_reimport_updates_data_without_reopening_goals(tmp_path: Path, user: User) -> None:
    seed(write_csv(tmp_path), user)
    Goal.objects.filter(import_key="master:goal:obmu:1").update(status="done")

    seed(write_csv(tmp_path, ROWS.replace(",8,4,6,6,,não", ",10,4,6,6,,sim")), user)

    goal = Goal.objects.get(import_key="master:goal:obmu:1")
    assert (goal.target_value, goal.status) == (600, "done")
    assert CalendarEvent.objects.count() == 3


def test_bad_rows_are_all_reported_and_nothing_is_written(tmp_path: Path, user: User) -> None:
    body = (
        "1,2026-10-12,2026-10-18,F0,f,8,4,6,6,,não\n"
        "x,2026-10-12,2026-10-18,F0,f,8,4,6,6,,não\n"
        "3,12/10/2026,2026-10-18,F0,f,8,4,6,6,,não\n"
        "4,2026-10-12,2026-10-11,F0,f,8,4,6,6,,não\n"
        "5,2026-10-12,2026-10-18,F0,f,muitas,4,6,6,,não\n"
        "1,2026-10-12,2026-10-18,F0,f,8,4,6,6,,não\n"
    )

    with pytest.raises(CommandError) as raised:
        seed(write_csv(tmp_path, body), user)

    for line in range(3, 8):
        assert f"Linha {line}" in str(raised.value)
    assert not CalendarEvent.objects.exists()
    assert not Discipline.objects.exists()


def test_missing_columns(tmp_path: Path, user: User) -> None:
    with pytest.raises(CommandError, match="Colunas ausentes"):
        seed(write_csv(tmp_path, "1\n", header="Semana\n"), user)


def test_recurrence_keeps_wall_clock_across_offset_changes() -> None:
    zone = ZoneInfo("America/New_York")  # muda de horário em 01/11/2026
    start = datetime(2026, 10, 26, 19, 0, tzinfo=zone)
    occurrences = list(
        weekly_occurrences(
            starts_at=start,
            ends_at=start.replace(hour=21),
            zone=zone,
            interval_weeks=1,
            until=date(2026, 11, 9),
            window_start=datetime(2026, 10, 1, tzinfo=UTC),
            window_end=datetime(2026, 12, 1, tzinfo=UTC),
        )
    )

    assert [(s.day, s.hour) for s, _ in occurrences] == [(26, 19), (2, 19), (9, 19)]


def test_weekly_recurrence_in_calendar(auth_client: APIClient) -> None:
    response = create_event(auth_client, recurrence_interval_weeks=2, recurrence_until="2026-12-21")
    assert response.status_code == 201, response.json()

    body = auth_client.get(f"{CALENDAR}?start=2026-12-01&end=2026-12-31").json()

    assert [item["starts_at"][:10] for item in body] == ["2026-12-07", "2026-12-21"]
    assert all(item["recurring"] for item in body)


def test_event_crossing_midnight_shows_on_both_days(auth_client: APIClient) -> None:
    create_event(
        auth_client,
        starts_at="2026-11-27T23:00:00-03:00",
        ends_at="2026-11-28T01:00:00-03:00",
    )

    assert titles(auth_client, "2026-11-27", "2026-11-27") == ["Aula"]
    assert titles(auth_client, "2026-11-28", "2026-11-28") == ["Aula"]
    assert titles(auth_client, "2026-11-29", "2026-11-29") == []


def test_all_day_event_is_normalised_and_stable_on_edit(auth_client: APIClient) -> None:
    created = create_event(
        auth_client,
        all_day=True,
        starts_at="2026-11-27T15:00:00-03:00",
        ends_at="2026-11-27T15:00:00-03:00",
    ).json()

    edited = auth_client.patch(f"{EVENTS}{created['id']}/", {"title": "X"}, format="json").json()

    assert (edited["starts_at"], edited["ends_at"]) == (created["starts_at"], created["ends_at"])
    assert titles(auth_client, "2026-11-27", "2026-11-27") == ["X"]
    assert titles(auth_client, "2026-11-28", "2026-11-28") == []


@pytest.mark.parametrize(
    "data",
    [
        {"ends_at": "2026-11-23T18:00:00-03:00"},
        {"ends_at": "2026-11-23T19:00:00-03:00"},
        {"recurrence_interval_weeks": 1},
        {"recurrence_until": "2026-12-01"},
        {"recurrence_interval_weeks": 1, "recurrence_until": "2026-11-01"},
        {"kind": "invalid"},
    ],
)
def test_invalid_events(auth_client: APIClient, data: dict[str, Any]) -> None:
    assert create_event(auth_client, **data).status_code == 400


def test_goal_deadlines_are_derived_not_copied(auth_client: APIClient, user: User) -> None:
    goal = Goal.objects.create(
        owner=user,
        title="Meta",
        scope="custom",
        period_start=date(2026, 11, 1),
        period_end=date(2026, 11, 10),
        metric="study_minutes",
        target_value=1,
    )
    assert titles(auth_client, "2026-11-10", "2026-11-10") == ["Prazo da meta: Meta"]

    goal.period_end = date(2026, 11, 12)
    goal.save()

    assert titles(auth_client, "2026-11-10", "2026-11-10") == []
    assert titles(auth_client, "2026-11-12", "2026-11-12") == ["Prazo da meta: Meta"]
    assert not CalendarEvent.objects.exists()


@pytest.mark.parametrize(
    "query",
    ["", "start=2026-01-01&end=2025-01-01", "start=2026-01-01&end=2026-12-31"],
)
def test_calendar_range_is_validated(auth_client: APIClient, query: str) -> None:
    assert auth_client.get(f"{CALENDAR}?{query}").status_code == 400


def test_only_one_active_profile_and_apply_does_not_duplicate(
    auth_client: APIClient,
) -> None:
    first = auth_client.post(PROFILES, {"name": "Regular"}, format="json").json()
    second = auth_client.post(PROFILES, {"name": "Intensiva"}, format="json").json()
    auth_client.post(f"{PROFILES}{first['id']}/activate/")
    auth_client.post(f"{PROFILES}{second['id']}/activate/")
    assert list(
        WeeklyPlanProfile.objects.filter(is_active=True).values_list("name", flat=True)
    ) == ["Intensiva"]

    block = {
        "profile": second["id"],
        "weekday": 2,
        "start_time": "19:00",
        "end_time": "21:00",
        "label": "OBMU",
        "activity_kind": "exercises",
    }
    assert auth_client.post(BLOCKS, block, format="json").status_code == 201
    bad = auth_client.post(BLOCKS, {**block, "end_time": "18:00"}, format="json")
    assert bad.status_code == 400

    url = f"{PROFILES}{second['id']}/apply/"
    week = {"week_start": "2026-11-23"}
    assert auth_client.post(url, week, format="json").json() == {"created": 1}
    assert auth_client.post(url, week, format="json").json() == {"created": 0}
    event = CalendarEvent.objects.get()
    assert event.starts_at == datetime(2026, 11, 25, 22, 0, tzinfo=UTC)


def test_isolation(auth_client: APIClient, other_user: User) -> None:
    foreign = CalendarEvent.objects.create(
        owner=other_user,
        title="segredo",
        kind="personal",
        starts_at=datetime(2026, 11, 23, 12, tzinfo=UTC),
        ends_at=datetime(2026, 11, 23, 13, tzinfo=UTC),
    )
    profile = WeeklyPlanProfile.objects.create(owner=other_user, name="alheio")

    assert titles(auth_client, "2026-11-23", "2026-11-23") == []
    assert auth_client.get(f"{EVENTS}{foreign.pk}/").status_code == 404
    assert auth_client.delete(f"{EVENTS}{foreign.pk}/").status_code == 404
    apply = auth_client.post(
        f"{PROFILES}{profile.pk}/apply/", {"week_start": "2026-11-23"}, format="json"
    )
    assert apply.status_code == 404
    block = {
        "profile": str(profile.pk),
        "weekday": 1,
        "start_time": "10:00",
        "end_time": "11:00",
        "label": "x",
        "activity_kind": "class",
    }
    assert auth_client.post(BLOCKS, block, format="json").status_code == 400

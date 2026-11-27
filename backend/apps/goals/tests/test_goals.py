from datetime import UTC, date, datetime, timedelta
from typing import Any

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.cp.models import CpRatingChange
from apps.disciplines.models import Discipline
from apps.exercises.models import Attempt, Exercise, ExerciseSource
from apps.goals import services
from apps.goals.models import Goal, PeriodicReview
from apps.reviews.models import ReviewItem, ReviewLog
from apps.studysessions.models import StudySession

pytestmark = pytest.mark.django_db
GOALS = "/api/v1/goals/"
DRAFT = "/api/v1/periodic-reviews/draft/"
# Semana de segunda 23/11 a domingo 29/11/2026, em America/Sao_Paulo (UTC-3).
INSIDE = datetime(2026, 11, 25, 15, 0, tzinfo=UTC)
SUNDAY_NIGHT = datetime(2026, 11, 30, 2, 30, tzinfo=UTC)  # domingo 23:30 local
NEXT_MONDAY = datetime(2026, 11, 30, 3, 30, tzinfo=UTC)  # segunda 00:30 local
BEFORE = datetime(2026, 11, 23, 2, 30, tzinfo=UTC)  # domingo anterior 23:30 local


@pytest.fixture
def data(user: User) -> dict[str, Any]:
    math = Discipline.objects.create(owner=user, name="OBMU", kind="olympiad")
    other = Discipline.objects.create(owner=user, name="Outra", kind="olympiad")
    source = ExerciseSource.objects.create(owner=user, name="OBMU")
    first, second, third = (
        Exercise.objects.create(owner=user, discipline=d, source=source, title=t)
        for d, t in ((math, "a"), (math, "b"), (other, "c"))
    )

    def session(start: datetime, minutes: int, discipline: Discipline) -> None:
        StudySession.objects.create(
            owner=user,
            activity_kind="exercises",
            discipline=discipline,
            started_at=start,
            ended_at=start + timedelta(minutes=minutes),
        )

    session(INSIDE, 60, math)
    session(SUNDAY_NIGHT, 15, other)
    session(BEFORE, 500, math)
    session(NEXT_MONDAY, 500, math)

    def attempt(exercise: Exercise, result: str, at: datetime) -> None:
        Attempt.objects.create(owner=user, exercise=exercise, result=result, attempted_at=at)

    attempt(first, "not_solved", INSIDE)
    attempt(first, "solved_alone", INSIDE + timedelta(hours=1))
    attempt(second, "partial", INSIDE)
    attempt(third, "solved_alone", SUNDAY_NIGHT)
    attempt(second, "solved_alone", NEXT_MONDAY)

    item = ReviewItem.objects.create(owner=user, exercise=second, due_on=date(2026, 12, 1))
    for key, at in enumerate((INSIDE, NEXT_MONDAY)):
        ReviewLog.objects.create(
            owner=user,
            item=item,
            rating="good",
            reviewed_at=at,
            idempotency_key=f"00000000-0000-0000-0000-00000000000{key}",
            step_after=1,
            due_on_after=date(2026, 12, 1),
        )
    CpRatingChange.objects.create(
        owner=user,
        contest_id=1,
        contest_name="r",
        rank=1,
        old_rating=0,
        new_rating=1200,
        happened_at=INSIDE,
    )
    return {"math": math, "other": other}


def goal(user: User, metric: str, **extra: Any) -> Goal:
    return Goal.objects.create(
        owner=user,
        title=metric,
        scope="weekly",
        period_start=date(2026, 11, 23),
        period_end=date(2026, 11, 29),
        metric=metric,
        target_value=10,
        **extra,
    )


@pytest.mark.parametrize(
    ("metric", "expected", "expected_math"),
    [
        ("study_minutes", 75, 60),
        ("sessions_count", 2, 1),
        ("exercises_attempted", 3, 2),
        ("exercises_solved", 2, 1),
        ("reviews_done", 1, 1),
    ],
)
def test_progress_uses_user_days_and_discipline(
    user: User, data: dict[str, Any], metric: str, expected: int, expected_math: int
) -> None:
    assert services.goal_progress(goal(user, metric)) == expected
    assert services.goal_progress(goal(user, metric, discipline=data["math"])) == expected_math


def test_contest_progress(user: User, data: dict[str, Any]) -> None:
    assert services.goal_progress(goal(user, "cp_contests")) == 1


def test_unfinished_session_does_not_count(user: User) -> None:
    StudySession.objects.create(owner=user, activity_kind="class", started_at=INSIDE)

    assert services.goal_progress(goal(user, "study_minutes")) == 0


def test_goal_api_returns_computed_progress(auth_client: APIClient, data: dict[str, Any]) -> None:
    body = {
        "title": "Horas",
        "scope": "weekly",
        "period_start": "2026-11-23",
        "period_end": "2026-11-29",
        "metric": "study_minutes",
        "target_value": 120,
        "current_value": 999,
    }

    response = auth_client.post(GOALS, body, format="json")

    assert response.status_code == 201, response.json()
    assert response.json()["current_value"] == 75


@pytest.mark.parametrize(
    "change",
    [
        {"period_end": "2026-11-01"},
        {"target_value": 0},
        {"metric": "manual"},
        {"metric": "cp_contests", "discipline": "math"},
    ],
)
def test_invalid_goal(auth_client: APIClient, data: dict[str, Any], change: dict[str, Any]) -> None:
    body: dict[str, Any] = {
        "title": "x",
        "scope": "weekly",
        "period_start": "2026-11-23",
        "period_end": "2026-11-29",
        "metric": "study_minutes",
        "target_value": 10,
        **change,
    }
    if body.get("discipline") == "math":
        body["discipline"] = str(data["math"].pk)

    assert auth_client.post(GOALS, body, format="json").status_code == 400


@pytest.mark.parametrize(
    ("week_starts_on", "day", "expected"),
    [
        (0, date(2026, 11, 29), (date(2026, 11, 23), date(2026, 11, 29))),
        (0, date(2026, 11, 23), (date(2026, 11, 23), date(2026, 11, 29))),
        (6, date(2026, 11, 29), (date(2026, 11, 29), date(2026, 12, 5))),
    ],
)
def test_week_bounds_follow_the_profile(
    user: User, week_starts_on: int, day: date, expected: tuple[date, date]
) -> None:
    user.profile.week_starts_on = week_starts_on
    user.profile.save()

    assert services.period_bounds(owner=user, kind="weekly", day=day) == expected


def test_month_bounds(user: User) -> None:
    bounds = services.period_bounds(owner=user, kind="monthly", day=date(2028, 2, 10))

    assert bounds == (date(2028, 2, 1), date(2028, 2, 29))


def test_sunday_review_is_prefilled_with_real_numbers(
    auth_client: APIClient, user: User, data: dict[str, Any]
) -> None:
    goal(user, "study_minutes")

    body = auth_client.get(f"{DRAFT}?kind=weekly&date=2026-11-29").json()

    assert (body["period_start"], body["period_end"]) == ("2026-11-23", "2026-11-29")
    assert body["numbers"] == {
        "study_minutes": 75,
        "sessions_count": 2,
        "exercises_attempted": 3,
        "exercises_solved": 2,
        "reviews_done": 1,
        "cp_contests": 1,
    }
    assert body["goals"][0]["current_value"] == body["numbers"]["study_minutes"]
    assert body["review"] is None


def test_saving_twice_keeps_one_review_per_period(auth_client: APIClient) -> None:
    first = {"kind": "weekly", "date": "2026-11-25", "planned_text": "A"}
    second = {"kind": "weekly", "date": "2026-11-29", "obstacles_text": "B"}

    assert auth_client.post(DRAFT, first, format="json").status_code == 200
    response = auth_client.post(DRAFT, second, format="json")

    assert PeriodicReview.objects.count() == 1
    assert response.json()["planned_text"] == "A"
    assert response.json()["obstacles_text"] == "B"


def test_isolation(auth_client: APIClient, other_user: User) -> None:
    foreign = goal(other_user, "study_minutes")
    theirs = Discipline.objects.create(owner=other_user, name="x", kind="olympiad")
    PeriodicReview.objects.create(
        owner=other_user,
        kind="weekly",
        period_start=date(2026, 11, 23),
        period_end=date(2026, 11, 29),
        planned_text="segredo",
    )

    assert auth_client.get(GOALS).json()["count"] == 0
    assert auth_client.get(f"{GOALS}{foreign.pk}/").status_code == 404
    draft = auth_client.get(f"{DRAFT}?date=2026-11-25").json()
    assert draft["review"] is None
    assert draft["goals"] == []
    body = {
        "title": "x",
        "scope": "weekly",
        "period_start": "2026-11-23",
        "period_end": "2026-11-29",
        "metric": "study_minutes",
        "target_value": 10,
        "discipline": str(theirs.pk),
    }
    assert auth_client.post(GOALS, body, format="json").status_code == 400

import uuid
from collections.abc import Iterator
from datetime import UTC, date, datetime, timedelta
from typing import Any

import pytest
from django.db import IntegrityError, transaction
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core import clock
from apps.curriculum.models import Topic
from apps.disciplines.models import Discipline
from apps.exercises import services as exercise_services
from apps.exercises.models import Attempt, Exercise, ExerciseSource
from apps.reviews import scheduling
from apps.reviews.models import ReviewItem, ReviewLog

pytestmark = pytest.mark.django_db
URL = "/api/v1/reviews/"
# 2026-11-28 01:00 UTC ainda é 27/11 às 22:00 em America/Sao_Paulo.
LATE_NIGHT = datetime(2026, 11, 28, 1, 0, tzinfo=UTC)
LADDER = [3, 7, 21]


@pytest.fixture
def now(auth_client: APIClient) -> Iterator[list[datetime]]:
    holder = [LATE_NIGHT]
    clock.set_clock(lambda: holder[0])
    yield holder
    clock.set_clock(None)


def make_exercise(owner: User, title: str = "P1") -> Exercise:
    discipline, _ = Discipline.objects.get_or_create(owner=owner, name="OBMU", kind="olympiad")
    source, _ = ExerciseSource.objects.get_or_create(owner=owner, name="OBMU")
    return Exercise.objects.create(owner=owner, discipline=discipline, source=source, title=title)


def attempt(client: APIClient, exercise: Exercise, result: str) -> Any:
    response = client.post(
        f"/api/v1/exercises/{exercise.pk}/attempts/", {"result": result}, format="json"
    )
    assert response.status_code == 201, response.json()
    return response


def answer(client: APIClient, item_id: Any, rating: str, key: str | None = None) -> Any:
    body = {"rating": rating, "idempotency_key": key or str(uuid.uuid4())}
    return client.post(f"{URL}{item_id}/answer/", body, format="json")


@pytest.mark.parametrize(
    ("step", "rating", "expected"),
    [
        (0, "good", 1),
        (1, "good", 2),
        (2, "good", 2),
        (0, "easy", 2),
        (1, "easy", 2),
        (1, "hard", 1),
        (2, "again", 0),
    ],
)
def test_next_step(step: int, rating: str, expected: int) -> None:
    assert scheduling.next_step(step, rating, len(LADDER)) == expected


@pytest.mark.parametrize(("step", "days"), [(0, 3), (1, 7), (2, 21), (9, 21)])
def test_due_date_follows_the_ladder(step: int, days: int) -> None:
    today = date(2026, 11, 27)

    assert scheduling.due_date(today, LADDER, step) == today + timedelta(days=days)


def test_default_ladder_is_3_7_21(user: User) -> None:
    assert user.profile.review_intervals_days == LADDER


@pytest.mark.parametrize("result", ["not_solved", "partial", "solved_with_hint"])
def test_attempt_without_solving_alone_schedules_in_users_day(
    auth_client: APIClient, user: User, now: list[datetime], result: str
) -> None:
    exercise = make_exercise(user)

    attempt(auth_client, exercise, result)

    item = ReviewItem.objects.get()
    assert (item.exercise_id, item.step, item.due_on) == (exercise.pk, 0, date(2026, 11, 30))


def test_solving_alone_schedules_nothing(auth_client: APIClient, user: User) -> None:
    attempt(auth_client, make_exercise(user), "solved_alone")

    assert not ReviewItem.objects.exists()


def test_new_failure_resets_the_same_item(
    auth_client: APIClient, user: User, now: list[datetime]
) -> None:
    exercise = make_exercise(user)
    attempt(auth_client, exercise, "not_solved")
    ReviewItem.objects.update(step=2, due_on=date(2027, 1, 1))

    attempt(auth_client, exercise, "partial")

    item = ReviewItem.objects.get()
    assert (item.step, item.due_on) == (0, date(2026, 11, 30))


def test_attempt_and_review_item_are_atomic(user: User, monkeypatch: pytest.MonkeyPatch) -> None:
    def broken(_: Attempt) -> None:
        raise RuntimeError("falha no agendamento")

    monkeypatch.setattr(exercise_services, "attempt_recorded_hooks", [broken])
    exercise = make_exercise(user)

    with pytest.raises(RuntimeError):
        exercise_services.record_attempt(
            owner=user, exercise=exercise, data={"result": "not_solved"}
        )

    assert not Attempt.objects.exists()
    exercise.refresh_from_db()
    assert exercise.state == "new"


def test_queue_only_has_due_items_ordered_by_date(
    auth_client: APIClient, user: User, now: list[datetime]
) -> None:
    today = date(2026, 11, 27)
    for title, offset in (("hoje", 0), ("atrasado", -4), ("amanhã", 1)):
        ReviewItem.objects.create(
            owner=user, exercise=make_exercise(user, title), due_on=today + timedelta(days=offset)
        )

    body = auth_client.get(f"{URL}queue/").json()

    assert body["today"] == "2026-11-27"
    assert body["count"] == 2
    assert [r["title"] for r in body["results"]] == ["atrasado", "hoje"]


def test_item_becomes_due_when_the_users_day_turns(
    auth_client: APIClient, user: User, now: list[datetime]
) -> None:
    ReviewItem.objects.create(owner=user, exercise=make_exercise(user), due_on=date(2026, 11, 28))

    now[0] = datetime(2026, 11, 28, 2, 59, tzinfo=UTC)  # 27/11 23:59 em São Paulo
    assert auth_client.get(f"{URL}queue/").json()["count"] == 0
    now[0] = datetime(2026, 11, 28, 3, 0, tzinfo=UTC)  # 28/11 00:00
    assert auth_client.get(f"{URL}queue/").json()["count"] == 1


def test_answer_advances_and_is_idempotent(
    auth_client: APIClient, user: User, now: list[datetime]
) -> None:
    item = ReviewItem.objects.create(
        owner=user, exercise=make_exercise(user), due_on=date(2026, 11, 27)
    )
    key = str(uuid.uuid4())

    first = answer(auth_client, item.pk, "good", key)
    replay = answer(auth_client, item.pk, "good", key)

    assert first.status_code == 200
    assert replay.status_code == 200
    assert first.json() == replay.json()
    assert first.json()["due_on"] == "2026-12-04"
    item.refresh_from_db()
    assert item.step == 1
    assert ReviewLog.objects.count() == 1


def test_answering_an_item_that_is_not_due_conflicts(
    auth_client: APIClient, user: User, now: list[datetime]
) -> None:
    item = ReviewItem.objects.create(
        owner=user, exercise=make_exercise(user), due_on=date(2026, 12, 1)
    )

    response = answer(auth_client, item.pk, "good")

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "review_not_due"
    assert not ReviewLog.objects.exists()


@pytest.mark.parametrize("body", [{}, {"rating": "great"}, {"rating": "good"}])
def test_invalid_answer(auth_client: APIClient, user: User, body: dict[str, str]) -> None:
    item = ReviewItem.objects.create(
        owner=user, exercise=make_exercise(user), due_on=date(2020, 1, 1)
    )

    assert auth_client.post(f"{URL}{item.pk}/answer/", body, format="json").status_code == 400


def test_schedule_on_demand_is_idempotent(
    auth_client: APIClient, user: User, now: list[datetime]
) -> None:
    exercise = make_exercise(user)
    body = {"exercise": str(exercise.pk)}

    first = auth_client.post(f"{URL}schedule/", body, format="json")
    second = auth_client.post(f"{URL}schedule/", body, format="json")

    assert (first.status_code, second.status_code) == (201, 200)
    assert ReviewItem.objects.count() == 1


@pytest.mark.parametrize("with_both", [True, False])
def test_database_requires_exactly_one_target(user: User, with_both: bool) -> None:
    exercise = make_exercise(user)
    topic = Topic.objects.create(owner=user, discipline=exercise.discipline, title="t")
    targets = {"exercise": exercise, "topic": topic} if with_both else {}

    with pytest.raises(IntegrityError), transaction.atomic():
        ReviewItem.objects.create(owner=user, due_on=date(2026, 1, 1), **targets)


def test_schedule_needs_exactly_one_target(auth_client: APIClient) -> None:
    assert auth_client.post(f"{URL}schedule/", {}, format="json").status_code == 400


def test_isolation(auth_client: APIClient, other_user: User) -> None:
    exercise = make_exercise(other_user)
    foreign = ReviewItem.objects.create(
        owner=other_user, exercise=exercise, due_on=date(2020, 1, 1)
    )

    assert auth_client.get(f"{URL}queue/").json()["count"] == 0
    assert answer(auth_client, foreign.pk, "good").status_code == 404
    assert auth_client.delete(f"{URL}{foreign.pk}/").status_code == 404
    scheduled = auth_client.post(f"{URL}schedule/", {"exercise": str(exercise.pk)}, format="json")
    assert scheduled.status_code == 400


def test_queue_has_constant_query_count(
    auth_client: APIClient, user: User, django_assert_max_num_queries: Any
) -> None:
    for index in range(6):
        ReviewItem.objects.create(
            owner=user, exercise=make_exercise(user, f"p{index}"), due_on=date(2020, 1, 1)
        )

    with django_assert_max_num_queries(5):
        assert auth_client.get(f"{URL}queue/").json()["count"] == 6

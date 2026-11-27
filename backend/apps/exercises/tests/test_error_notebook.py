from typing import Any

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.disciplines.models import Discipline
from apps.exercises.models import Attempt, ErrorType, Exercise, ExerciseSource

pytestmark = pytest.mark.django_db
URL = "/api/v1/attempts/"


def build(owner: User, name: str) -> tuple[Exercise, ErrorType]:
    discipline = Discipline.objects.create(owner=owner, name=name, kind="olympiad")
    source, _ = ExerciseSource.objects.get_or_create(owner=owner, name="OBMU")
    exercise = Exercise.objects.create(
        owner=owner, discipline=discipline, source=source, title=f"Problema {name}"
    )
    error, _ = ErrorType.objects.get_or_create(owner=owner, name=f"Erro {name}")
    return exercise, error


def attempt(exercise: Exercise, error: ErrorType | None = None, **extra: Any) -> Attempt:
    return Attempt.objects.create(
        owner=exercise.owner,
        exercise=exercise,
        result="not_solved",
        dominant_error=error,
        **extra,
    )


def ids(response: Any) -> set[str]:
    assert response.status_code == 200, response.json()
    return {item["id"] for item in response.json()["results"]}


def test_notebook_lists_only_attempts_with_dominant_error(
    auth_client: APIClient, user: User
) -> None:
    exercise, error = build(user, "A")
    with_error = attempt(exercise, error)
    attempt(exercise)

    assert ids(auth_client.get(f"{URL}?has_error=true")) == {str(with_error.pk)}


def test_filters_by_discipline_error_type_and_rewritten(auth_client: APIClient, user: User) -> None:
    exercise_a, error_a = build(user, "A")
    exercise_b, error_b = build(user, "B")
    first = attempt(exercise_a, error_a)
    second = attempt(exercise_b, error_b, rewritten=True)

    base = f"{URL}?has_error=true"
    assert ids(auth_client.get(f"{base}&discipline={exercise_a.discipline_id}")) == {str(first.pk)}
    assert ids(auth_client.get(f"{base}&dominant_error={error_b.pk}")) == {str(second.pk)}
    assert ids(auth_client.get(f"{base}&rewritten=false")) == {str(first.pk)}


def test_list_exposes_data_to_resume_without_n_plus_one(
    auth_client: APIClient, user: User, django_assert_max_num_queries: Any
) -> None:
    exercise, error = build(user, "A")
    for _ in range(6):
        attempt(exercise, error)

    with django_assert_max_num_queries(5):
        item = auth_client.get(f"{URL}?has_error=true").json()["results"][0]

    assert item["exercise"] == str(exercise.pk)
    assert item["exercise_title"] == "Problema A"
    assert item["dominant_error_name"] == "Erro A"


def test_updates_key_technique_and_rewritten_but_not_result(
    auth_client: APIClient, user: User
) -> None:
    exercise, error = build(user, "A")
    item = attempt(exercise, error)

    response = auth_client.patch(
        f"{URL}{item.pk}/",
        {"key_technique": "Invariante", "rewritten": True, "result": "solved_alone"},
        format="json",
    )

    assert response.status_code == 200
    item.refresh_from_db()
    assert (item.key_technique, item.rewritten, item.result) == ("Invariante", True, "not_solved")


def test_isolation(auth_client: APIClient, user: User, other_user: User) -> None:
    mine, _ = build(user, "A")
    theirs, their_error = build(other_user, "Z")
    foreign = attempt(theirs, their_error)
    own = attempt(mine)

    assert ids(auth_client.get(f"{URL}?has_error=true")) == set()
    assert ids(auth_client.get(f"{URL}?discipline={theirs.discipline_id}")) == set()
    assert auth_client.get(f"{URL}{foreign.pk}/").status_code == 404
    assert auth_client.patch(f"{URL}{foreign.pk}/", {"rewritten": True}).status_code == 404
    bad = auth_client.patch(
        f"{URL}{own.pk}/", {"dominant_error": str(their_error.pk)}, format="json"
    )
    assert bad.status_code == 400

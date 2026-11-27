from typing import Any

import pytest
from django.db import DatabaseError
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.curriculum.models import Topic
from apps.disciplines.models import Discipline
from apps.exercises import services
from apps.exercises.models import Attempt, ErrorType, Exercise, ExerciseSource
from apps.studysessions.models import StudySession

pytestmark = pytest.mark.django_db
EXERCISES = "/api/v1/exercises/"
SOURCES = "/api/v1/exercise-sources/"
ERROR_TYPES = "/api/v1/error-types/"
ATTEMPTS = "/api/v1/attempts/"


@pytest.fixture
def discipline(user: User) -> Discipline:
    return Discipline.objects.create(owner=user, name="Combinatória", kind="olympiad")


@pytest.fixture
def source(user: User) -> ExerciseSource:
    return ExerciseSource.objects.create(owner=user, name="OBMU", kind="olympiad")


@pytest.fixture
def exercise(user: User, discipline: Discipline, source: ExerciseSource) -> Exercise:
    return Exercise.objects.create(
        owner=user, discipline=discipline, source=source, title="Casa dos pombos"
    )


def payload(discipline: Discipline, source: ExerciseSource, **extra: Any) -> dict[str, Any]:
    return {"discipline": str(discipline.pk), "source": str(source.pk), "title": "P1", **extra}


def record(client: APIClient, exercise: Exercise, **data: Any) -> Any:
    return client.post(f"{EXERCISES}{exercise.pk}/attempts/", data, format="json")


def test_default_error_types_are_created_once(auth_client: APIClient, user: User) -> None:
    first = auth_client.get(ERROR_TYPES).json()
    second = auth_client.get(ERROR_TYPES).json()

    assert first["count"] == second["count"] == 5
    assert ErrorType.objects.filter(owner=user, is_default=True).count() == 5


def test_renaming_a_default_type_does_not_recreate_it(auth_client: APIClient) -> None:
    item = auth_client.get(ERROR_TYPES).json()["results"][0]
    auth_client.patch(f"{ERROR_TYPES}{item['id']}/", {"name": "Renomeado"}, format="json")

    assert auth_client.get(ERROR_TYPES).json()["count"] == 5


def test_source_name_is_unique_ignoring_case(
    auth_client: APIClient, source: ExerciseSource
) -> None:
    response = auth_client.post(SOURCES, {"name": "obmu", "kind": "book"}, format="json")

    assert response.status_code == 409


def test_source_and_error_type_in_use_cannot_be_deleted(
    auth_client: APIClient, exercise: Exercise, user: User
) -> None:
    error_type = ErrorType.objects.create(owner=user, name="Conceitual")
    record(auth_client, exercise, result="not_solved", dominant_error=str(error_type.pk))

    assert auth_client.delete(f"{SOURCES}{exercise.source_id}/").status_code == 409
    assert auth_client.delete(f"{ERROR_TYPES}{error_type.pk}/").status_code == 409


def test_discipline_with_exercises_cannot_be_deleted(
    auth_client: APIClient, exercise: Exercise
) -> None:
    response = auth_client.delete(f"/api/v1/disciplines/{exercise.discipline_id}/")

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "discipline_has_dependents"


def test_deleting_the_account_removes_everything(exercise: Exercise, user: User) -> None:
    user.delete()

    assert not Exercise.objects.exists()
    assert not ExerciseSource.objects.exists()


def test_create_exercise_with_new_state(
    auth_client: APIClient, discipline: Discipline, source: ExerciseSource
) -> None:
    response = auth_client.post(
        EXERCISES, payload(discipline, source, difficulty=3, state="solved"), format="json"
    )

    assert response.status_code == 201
    assert response.json()["state"] == "new"


def test_source_plus_reference_is_unique(
    auth_client: APIClient, discipline: Discipline, source: ExerciseSource
) -> None:
    data = payload(discipline, source, external_ref="2023-P2")
    assert auth_client.post(EXERCISES, data, format="json").status_code == 201

    response = auth_client.post(EXERCISES, data, format="json")

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "exercise_ref_taken"


def test_blank_references_do_not_collide(
    auth_client: APIClient, discipline: Discipline, source: ExerciseSource
) -> None:
    for _ in range(2):
        data = payload(discipline, source, external_ref="")
        assert auth_client.post(EXERCISES, data, format="json").status_code == 201


def test_topic_must_belong_to_the_discipline(
    auth_client: APIClient, discipline: Discipline, source: ExerciseSource, user: User
) -> None:
    other = Discipline.objects.create(owner=user, name="Álgebra", kind="olympiad")
    topic = Topic.objects.create(owner=user, discipline=other, title="t")

    response = auth_client.post(
        EXERCISES, payload(discipline, source, topic=str(topic.pk)), format="json"
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "topic_discipline_mismatch"


@pytest.mark.parametrize("difficulty", [0, 6])
def test_difficulty_range(
    auth_client: APIClient, discipline: Discipline, source: ExerciseSource, difficulty: int
) -> None:
    response = auth_client.post(
        EXERCISES, payload(discipline, source, difficulty=difficulty), format="json"
    )

    assert response.status_code == 400


@pytest.mark.parametrize(
    "markdown",
    ["<script>alert(1)</script>", "<b onmouseover='x()'>oi</b>", "<iframe src=x></iframe>"],
)
def test_raw_html_is_rejected(
    auth_client: APIClient, discipline: Discipline, source: ExerciseSource, markdown: str
) -> None:
    response = auth_client.post(
        EXERCISES, payload(discipline, source, statement_md=markdown), format="json"
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "unsafe_markdown"


@pytest.mark.parametrize(
    "markdown",
    [
        "Prove que $a<b$ e $c>d$.",
        "$$\n x < y > z \n$$",
        "```cpp\nvector<int> v; map<string, int> m;\n```",
        "use `pair<int, int>` aqui",
        "veja <https://obm.org.br>",
        "se a < b e c > d",
    ],
)
def test_math_and_code_are_accepted(
    auth_client: APIClient, discipline: Discipline, source: ExerciseSource, markdown: str
) -> None:
    response = auth_client.post(
        EXERCISES, payload(discipline, source, statement_md=markdown), format="json"
    )

    assert response.status_code == 201, response.json()


@pytest.mark.parametrize(
    ("results", "expected"),
    [
        ([], "new"),
        (["not_solved"], "in_progress"),
        (["partial", "solved_with_hint"], "in_progress"),
        (["not_solved", "solved_alone"], "solved"),
        (["solved_alone", "not_solved"], "solved"),
    ],
)
def test_state_is_derived_from_attempt_results(results: list[str], expected: str) -> None:
    assert services.derive_state(results) == expected


def test_recording_attempt_updates_state(auth_client: APIClient, exercise: Exercise) -> None:
    first = record(auth_client, exercise, result="partial", duration_seconds=600)
    second = record(auth_client, exercise, result="solved_alone")

    assert first.status_code == 201
    assert first.json()["exercise_state"] == "in_progress"
    assert second.json()["exercise_state"] == "solved"


def test_attempt_is_rolled_back_when_state_update_fails(
    exercise: Exercise, user: User, monkeypatch: pytest.MonkeyPatch
) -> None:
    def boom(*args: Any, **kwargs: Any) -> None:
        raise DatabaseError("falha simulada")

    monkeypatch.setattr(services, "refresh_exercise_state", boom)

    with pytest.raises(DatabaseError):
        services.record_attempt(owner=user, exercise=exercise, data={"result": "not_solved"})

    assert not Attempt.objects.exists()


def test_deleting_the_only_attempt_resets_state(auth_client: APIClient, exercise: Exercise) -> None:
    attempt_id = record(auth_client, exercise, result="solved_alone").json()["attempt"]["id"]

    assert auth_client.delete(f"{ATTEMPTS}{attempt_id}/").status_code == 204
    exercise.refresh_from_db()
    assert exercise.state == "new"


@pytest.mark.parametrize(
    "data",
    [
        {},
        {"result": "solved_alone", "duration_seconds": -1},
        {"result": "solved_alone", "hint_level": 4},
    ],
)
def test_invalid_attempt_is_rejected(
    auth_client: APIClient, exercise: Exercise, data: dict[str, Any]
) -> None:
    assert record(auth_client, exercise, **data).status_code == 400


def test_filters_combine_and_list_has_no_n_plus_one(
    auth_client: APIClient,
    user: User,
    discipline: Discipline,
    source: ExerciseSource,
    django_assert_max_num_queries: Any,
) -> None:
    for index in range(8):
        Exercise.objects.create(
            owner=user,
            discipline=discipline,
            source=source,
            title=f"Grafos {index}",
            difficulty=index % 2 + 1,
        )

    with django_assert_max_num_queries(6):
        query = f"difficulty=2&state=new&search=grafos&source={source.pk}"
        response = auth_client.get(f"{EXERCISES}?{query}")

    assert response.json()["count"] == 4


def test_foreign_relations_are_rejected_and_objects_invisible(
    auth_client: APIClient,
    other_user: User,
    discipline: Discipline,
    source: ExerciseSource,
    exercise: Exercise,
) -> None:
    theirs = Discipline.objects.create(owner=other_user, name="x", kind="olympiad")
    their_source = ExerciseSource.objects.create(owner=other_user, name="y", kind="book")
    their_exercise = Exercise.objects.create(
        owner=other_user, discipline=theirs, source=their_source, title="segredo"
    )
    their_error = ErrorType.objects.create(owner=other_user, name="z")

    for data in (payload(theirs, source), payload(discipline, their_source)):
        assert auth_client.post(EXERCISES, data, format="json").status_code == 400
    bad = record(auth_client, exercise, result="partial", dominant_error=str(their_error.pk))
    assert bad.status_code == 400
    assert auth_client.get(f"{EXERCISES}{their_exercise.pk}/").status_code == 404
    assert record(auth_client, their_exercise, result="partial").status_code == 404
    assert auth_client.get(f"{EXERCISES}{their_exercise.pk}/attempts/").status_code == 404
    assert auth_client.delete(f"{SOURCES}{their_source.pk}/").status_code == 404
    assert auth_client.get(EXERCISES).json()["count"] == 1


def test_attempt_can_be_linked_to_own_session_only(
    auth_client: APIClient, exercise: Exercise, user: User, other_user: User
) -> None:
    started = "2026-11-20T10:00:00Z"
    mine = StudySession.objects.create(owner=user, activity_kind="class", started_at=started)
    theirs = StudySession.objects.create(
        owner=other_user, activity_kind="class", started_at=started
    )

    ok = record(auth_client, exercise, result="partial", study_session=str(mine.pk))
    bad = record(auth_client, exercise, result="partial", study_session=str(theirs.pk))

    assert ok.status_code == 201
    assert bad.status_code == 400

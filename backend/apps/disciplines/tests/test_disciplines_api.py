from datetime import UTC, datetime

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core import clock
from apps.disciplines.models import Discipline

URL = "/api/v1/disciplines/"
pytestmark = pytest.mark.django_db


def make(owner: User, name: str = "Análise", position: int = 0) -> Discipline:
    return Discipline.objects.create(owner=owner, name=name, kind="olympiad", position=position)


def test_create_trims_name_and_appends_position(auth_client: APIClient, user: User) -> None:
    make(user, "Existente", position=4)

    response = auth_client.post(URL, {"name": "  Combinatória ", "kind": "olympiad"}, format="json")

    assert response.status_code == 201
    assert response.json()["name"] == "Combinatória"
    assert response.json()["position"] == 5


def test_name_is_unique_per_owner_ignoring_case(auth_client: APIClient, user: User) -> None:
    make(user, "Combinatória")

    response = auth_client.post(URL, {"name": "COMBINATÓRIA", "kind": "olympiad"}, format="json")

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "discipline_name_taken"


def test_two_owners_may_use_the_same_name(auth_client: APIClient, other_user: User) -> None:
    make(other_user, "Álgebra")

    response = auth_client.post(URL, {"name": "Álgebra", "kind": "olympiad"}, format="json")

    assert response.status_code == 201


@pytest.mark.parametrize(
    "payload", [{"kind": "invalid"}, {"kind": "olympiad", "color": "vermelho"}]
)
def test_invalid_kind_or_color_is_rejected(auth_client: APIClient, payload: dict[str, str]) -> None:
    response = auth_client.post(URL, {"name": "X", **payload}, format="json")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"


def test_archive_uses_clock_and_hides_from_default_list(auth_client: APIClient, user: User) -> None:
    discipline = make(user)
    instant = datetime(2026, 11, 27, 12, 0, tzinfo=UTC)
    clock.set_clock(lambda: instant)
    try:
        response = auth_client.post(f"{URL}{discipline.pk}/archive/")
    finally:
        clock.set_clock(None)

    assert response.status_code == 200
    discipline.refresh_from_db()
    assert discipline.archived_at == instant
    assert auth_client.get(URL).json()["count"] == 0
    assert auth_client.get(URL, {"archived": "true"}).json()["count"] == 1
    assert auth_client.post(f"{URL}{discipline.pk}/unarchive/").json()["archived_at"] is None


def test_reorder_sets_positions(auth_client: APIClient, user: User) -> None:
    first, second = make(user, "A", position=0), make(user, "B", position=1)

    response = auth_client.post(
        f"{URL}reorder/", {"ids": [str(second.pk), str(first.pk)]}, format="json"
    )

    assert response.status_code == 204
    assert [item["name"] for item in auth_client.get(URL).json()["results"]] == ["B", "A"]


def test_reorder_with_foreign_id_changes_nothing(
    auth_client: APIClient, user: User, other_user: User
) -> None:
    mine, foreign = make(user, "A", position=7), make(other_user, "Z")

    response = auth_client.post(
        f"{URL}reorder/", {"ids": [str(mine.pk), str(foreign.pk)]}, format="json"
    )

    assert response.status_code == 400
    mine.refresh_from_db()
    assert mine.position == 7


def test_other_users_discipline_is_invisible(auth_client: APIClient, other_user: User) -> None:
    foreign = make(other_user)
    detail = f"{URL}{foreign.pk}/"

    assert auth_client.get(URL).json()["count"] == 0
    assert auth_client.get(detail).status_code == 404
    assert auth_client.patch(detail, {"name": "x"}, format="json").status_code == 404
    assert auth_client.delete(detail).status_code == 404
    assert auth_client.post(f"{detail}archive/").status_code == 404

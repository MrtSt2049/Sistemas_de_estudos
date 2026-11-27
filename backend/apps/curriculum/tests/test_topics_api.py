from typing import Any

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.curriculum.models import Topic
from apps.disciplines.models import Discipline

URL = "/api/v1/topics/"
pytestmark = pytest.mark.django_db


@pytest.fixture
def discipline(user: User) -> Discipline:
    return Discipline.objects.create(owner=user, name="Combinatória", kind="olympiad")


def create(client: APIClient, discipline: Discipline, title: str, parent: str | None = None) -> Any:
    payload: dict[str, Any] = {"discipline": str(discipline.pk), "title": title}
    if parent:
        payload["parent"] = parent
    return client.post(URL, payload, format="json")


def chain(client: APIClient, discipline: Discipline, length: int) -> list[str]:
    ids: list[str] = []
    for level in range(length):
        response = create(client, discipline, f"N{level}", ids[-1] if ids else None)
        assert response.status_code == 201, response.json()
        ids.append(response.json()["id"])
    return ids


def move(client: APIClient, topic_id: str, parent: str | None, position: int = 0) -> Any:
    return client.post(
        f"{URL}{topic_id}/move/", {"parent": parent, "position": position}, format="json"
    )


def test_siblings_receive_contiguous_positions(
    auth_client: APIClient, discipline: Discipline
) -> None:
    positions = [create(auth_client, discipline, t).json()["position"] for t in "abc"]

    assert positions == [0, 1, 2]


def test_depth_is_limited_to_four_levels(auth_client: APIClient, discipline: Discipline) -> None:
    ids = chain(auth_client, discipline, 4)

    response = create(auth_client, discipline, "N5", ids[-1])

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "topic_depth_exceeded"


def test_parent_from_another_discipline_is_rejected(
    auth_client: APIClient, discipline: Discipline, user: User
) -> None:
    other = Discipline.objects.create(owner=user, name="Álgebra", kind="olympiad")
    parent = create(auth_client, other, "Pai").json()["id"]

    response = create(auth_client, discipline, "Filho", parent)

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "topic_parent_mismatch"


def test_move_under_itself_or_descendant_is_rejected(
    auth_client: APIClient, discipline: Discipline
) -> None:
    ids = chain(auth_client, discipline, 3)

    for target in (ids[0], ids[2]):
        response = move(auth_client, ids[0], target)
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "topic_cycle"


def test_move_cannot_push_subtree_beyond_max_depth(
    auth_client: APIClient, discipline: Discipline
) -> None:
    deep = chain(auth_client, discipline, 3)
    pair = chain(auth_client, discipline, 2)

    response = move(auth_client, pair[0], deep[2])

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "topic_depth_exceeded"


def test_move_renumbers_siblings(auth_client: APIClient, discipline: Discipline) -> None:
    a, b, c = (create(auth_client, discipline, t).json()["id"] for t in "abc")

    response = move(auth_client, c, None, 0)

    assert response.status_code == 200
    ordered = Topic.objects.filter(parent=None).order_by("position")
    assert [(str(t.pk), t.position) for t in ordered] == [(c, 0), (a, 1), (b, 2)]


def test_delete_removes_subtree_and_closes_gap(
    auth_client: APIClient, discipline: Discipline
) -> None:
    ids = chain(auth_client, discipline, 2)
    sibling = create(auth_client, discipline, "irmão").json()["id"]

    assert auth_client.delete(f"{URL}{ids[0]}/").status_code == 204
    assert [(str(t.pk), t.position) for t in Topic.objects.all()] == [(sibling, 0)]


def test_patch_updates_status_but_not_hierarchy(
    auth_client: APIClient, discipline: Discipline
) -> None:
    ids = chain(auth_client, discipline, 2)

    response = auth_client.patch(
        f"{URL}{ids[1]}/", {"status": "done", "parent": None}, format="json"
    )

    assert response.status_code == 200
    assert response.json()["status"] == "done"
    assert response.json()["parent"] == ids[0]


def test_tree_is_nested_with_constant_query_count(
    auth_client: APIClient, discipline: Discipline, django_assert_max_num_queries: Any
) -> None:
    chain(auth_client, discipline, 4)
    chain(auth_client, discipline, 4)

    with django_assert_max_num_queries(4):
        response = auth_client.get(f"{URL}tree/", {"discipline": str(discipline.pk)})

    assert response.status_code == 200
    roots = response.json()
    assert len(roots) == 2
    assert roots[0]["children"][0]["children"][0]["children"][0]["title"] == "N3"


@pytest.mark.parametrize("query", [{}, {"discipline": "nao-e-uuid"}])
def test_tree_requires_a_valid_discipline(auth_client: APIClient, query: dict[str, str]) -> None:
    assert auth_client.get(f"{URL}tree/", query).status_code == 400


def test_other_users_topics_are_invisible(auth_client: APIClient, other_user: User) -> None:
    foreign_discipline = Discipline.objects.create(
        owner=other_user, name="Segredo", kind="olympiad"
    )
    foreign = Topic.objects.create(owner=other_user, discipline=foreign_discipline, title="x")

    assert create(auth_client, foreign_discipline, "invasor").status_code == 400
    assert auth_client.get(URL).json()["count"] == 0
    tree = auth_client.get(f"{URL}tree/", {"discipline": str(foreign_discipline.pk)})
    assert tree.status_code == 404
    assert auth_client.get(f"{URL}{foreign.pk}/").status_code == 404
    assert auth_client.delete(f"{URL}{foreign.pk}/").status_code == 404
    assert move(auth_client, str(foreign.pk), None).status_code == 404

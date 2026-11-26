"""Contract test proving strict per-user data isolation (ADR-06, RNF004)."""

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.models import Tag


@pytest.mark.django_db
def test_tag_isolation_between_users(auth_client: APIClient, user: User, other_user: User) -> None:
    own_tag = Tag.objects.create(owner=user, name="Analise", slug="analise")
    foreign_tag = Tag.objects.create(owner=other_user, name="Segredo", slug="segredo")

    # Listing returns only owned resources
    list_resp = auth_client.get("/api/v1/tags/")
    assert list_resp.status_code == 200
    returned_ids = {item["id"] for item in list_resp.json()["results"]}
    assert str(own_tag.id) in returned_ids
    assert str(foreign_tag.id) not in returned_ids

    # Direct read/update/delete of another user's object returns 404 (not 403)
    assert auth_client.get(f"/api/v1/tags/{foreign_tag.id}/").status_code == 404
    assert (
        auth_client.patch(
            f"/api/v1/tags/{foreign_tag.id}/", {"name": "Hack"}, format="json"
        ).status_code
        == 404
    )
    assert auth_client.delete(f"/api/v1/tags/{foreign_tag.id}/").status_code == 404

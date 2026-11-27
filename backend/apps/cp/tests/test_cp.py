"""No test touches the network: the transport is replaced and real sockets are blocked."""

import io
import json
import urllib.error
from collections.abc import Iterator
from typing import Any

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.cp import client as cf
from apps.cp import services
from apps.cp.models import CpAccount, CpRatingChange, CpSubmission
from apps.disciplines.models import Discipline
from apps.exercises.models import Exercise

pytestmark = pytest.mark.django_db
BASE = "/api/v1/cp/"


@pytest.fixture(autouse=True)
def no_network(monkeypatch: pytest.MonkeyPatch) -> None:
    def refuse(*args: Any, **kwargs: Any) -> None:
        raise AssertionError("teste tentou acessar a rede")

    monkeypatch.setattr(cf.urllib.request, "urlopen", refuse)


def submission(
    sid: int,
    verdict: str | None = "OK",
    contest: int = 1850,
    index: str = "A",
    rating: int | None = 800,
    tags: tuple[str, ...] = ("math",),
) -> dict[str, Any]:
    problem: dict[str, Any] = {
        "contestId": contest,
        "index": index,
        "name": f"Problem {index}",
        "tags": list(tags),
    }
    if rating:
        problem["rating"] = rating
    raw: dict[str, Any] = {
        "id": sid,
        "creationTimeSeconds": 1_700_000_000 + sid,
        "problem": problem,
        "programmingLanguage": "C++20",
    }
    if verdict:
        raw["verdict"] = verdict
    return raw


RATING = [
    {
        "contestId": 1850,
        "contestName": "Round 886",
        "handle": "tourist",
        "rank": 10,
        "ratingUpdateTimeSeconds": 1_700_000_500,
        "oldRating": 1200,
        "newRating": 1350,
    }
]


class FakeApi:
    def __init__(self) -> None:
        self.submissions: list[dict[str, Any]] = [submission(1)]
        self.rating: list[dict[str, Any]] = RATING
        self.fail_on: str | None = None
        self.calls: list[str] = []

    def fetch(self, method: str, params: dict[str, str]) -> list[dict[str, Any]]:
        self.calls.append(method)
        if method == self.fail_on:
            raise cf.CodeforcesError("Codeforces indisponível.")
        return self.submissions if method == "user.status" else self.rating


@pytest.fixture
def api(monkeypatch: pytest.MonkeyPatch) -> Iterator[FakeApi]:
    fake = FakeApi()
    monkeypatch.setattr(cf, "fetch", fake.fetch)
    monkeypatch.setattr(cf, "REQUEST_INTERVAL_SECONDS", 0)
    yield fake


def sync(client: APIClient, handle: str = "tourist") -> Any:
    return client.post(f"{BASE}sync/", {"handle": handle}, format="json")


def test_sync_maps_submissions_and_rating(auth_client: APIClient, user: User, api: FakeApi) -> None:
    response = sync(auth_client)

    assert response.status_code == 200, response.json()
    assert response.json()["new_submissions"] == 1
    item = CpSubmission.objects.get(owner=user)
    assert (item.submission_id, item.contest_id, item.problem_index) == (1, 1850, "A")
    assert (item.rating, item.tags, item.verdict) == (800, ["math"], "OK")
    change = CpRatingChange.objects.get(owner=user)
    assert (change.old_rating, change.new_rating) == (1200, 1350)
    account = CpAccount.objects.get(owner=user)
    assert account.handle == "tourist"
    assert account.last_synced_at is not None


def test_sync_is_idempotent_and_updates_verdict(auth_client: APIClient, api: FakeApi) -> None:
    api.submissions = [submission(1, verdict="TESTING")]
    sync(auth_client)
    api.submissions = [submission(1, verdict="OK"), submission(2, index="B")]

    response = sync(auth_client)
    sync(auth_client)

    assert response.json()["new_submissions"] == 1
    assert CpSubmission.objects.count() == 2
    assert CpSubmission.objects.get(submission_id=1).verdict == "OK"
    assert CpRatingChange.objects.count() == 1


@pytest.mark.parametrize("method", ["user.status", "user.rating"])
def test_failure_keeps_existing_data(auth_client: APIClient, api: FakeApi, method: str) -> None:
    sync(auth_client)
    api.submissions = [submission(2)]
    api.fail_on = method

    response = sync(auth_client)

    assert response.status_code == 502
    assert response.json()["error"]["code"] == "codeforces_unavailable"
    assert list(CpSubmission.objects.values_list("submission_id", flat=True)) == [1]


def test_changing_handle_replaces_data_only_after_success(
    auth_client: APIClient, api: FakeApi
) -> None:
    sync(auth_client)
    api.fail_on = "user.status"
    sync(auth_client, "outro")
    assert CpAccount.objects.get().handle == "tourist"

    api.fail_on = None
    api.submissions = [submission(9)]
    api.rating = []
    sync(auth_client, "outro")

    assert list(CpSubmission.objects.values_list("submission_id", flat=True)) == [9]
    assert not CpRatingChange.objects.exists()


@pytest.mark.parametrize("handle", ["", "com espaço", "a&b=1", "x" * 25])
def test_invalid_handle_never_reaches_the_api(
    auth_client: APIClient, api: FakeApi, handle: str
) -> None:
    assert sync(auth_client, handle).status_code == 400
    assert api.calls == []


def test_credentials_are_not_accepted_or_stored(auth_client: APIClient, api: FakeApi) -> None:
    auth_client.post(f"{BASE}sync/", {"handle": "tourist", "api_secret": "s3cr3t"}, format="json")

    fields = {field.name for field in CpAccount._meta.get_fields()}
    assert not fields & {"password", "api_key", "api_secret", "token"}


def test_summary_counts_unique_solved_problems(auth_client: APIClient, api: FakeApi) -> None:
    api.submissions = [
        submission(1),
        submission(2),  # mesmo problema aceito duas vezes
        submission(3, index="B", rating=1200, tags=("dp", "math")),
        submission(4, index="C", verdict="WRONG_ANSWER", rating=1600),
        submission(5, index="D", rating=None, tags=()),
    ]
    sync(auth_client)

    body = auth_client.get(f"{BASE}summary/").json()

    assert body["solved_count"] == 3
    assert body["by_rating"] == [{"rating": 800, "count": 1}, {"rating": 1200, "count": 1}]
    assert body["unrated_count"] == 1
    assert body["by_tag"] == [{"tag": "math", "count": 2}, {"tag": "dp", "count": 1}]
    assert [point["new_rating"] for point in body["rating_history"]] == [1350]


def test_upsolving_lists_attempted_never_accepted(auth_client: APIClient, api: FakeApi) -> None:
    api.submissions = [
        submission(1, verdict="WRONG_ANSWER"),
        submission(2),  # A foi aceito depois
        submission(3, index="B", verdict="TIME_LIMIT_EXCEEDED"),
        submission(4, index="B", verdict="WRONG_ANSWER"),
        submission(5, index="C", verdict="TESTING"),
        submission(6, index="D", verdict=None),
    ]
    sync(auth_client)

    body = auth_client.get(f"{BASE}upsolving/").json()

    assert body["count"] == 1
    problem = body["results"][0]
    assert (problem["problem_index"], problem["attempts"]) == ("B", 2)
    assert problem["url"] == "https://codeforces.com/contest/1850/problem/B"
    assert problem["exercise"] is None


def test_upsolving_problem_becomes_exercise_once(
    auth_client: APIClient, user: User, api: FakeApi
) -> None:
    api.submissions = [submission(1, verdict="WRONG_ANSWER", rating=1500)]
    sync(auth_client)
    discipline = Discipline.objects.create(
        owner=user, name="Maratona", kind="competitive_programming"
    )
    body = {"contest_id": 1850, "problem_index": "A", "discipline": str(discipline.pk)}

    first = auth_client.post(f"{BASE}upsolving/import/", body, format="json")
    second = auth_client.post(f"{BASE}upsolving/import/", body, format="json")

    assert (first.status_code, second.status_code) == (201, 200)
    exercise = Exercise.objects.get()
    assert (exercise.external_ref, exercise.source.kind) == ("1850A", "competitive")
    listed = auth_client.get(f"{BASE}upsolving/").json()["results"][0]
    assert listed["exercise"] == str(exercise.pk)


def test_isolation(auth_client: APIClient, other_user: User, api: FakeApi) -> None:
    services.sync_account(owner=other_user, handle="alheio")
    discipline = Discipline.objects.create(owner=other_user, name="x", kind="olympiad")

    assert auth_client.get(f"{BASE}summary/").json()["solved_count"] == 0
    assert auth_client.get(f"{BASE}summary/").json()["handle"] is None
    assert auth_client.get(f"{BASE}upsolving/").json()["count"] == 0
    body = {"contest_id": 1850, "problem_index": "A", "discipline": str(discipline.pk)}
    response = auth_client.post(f"{BASE}upsolving/import/", body, format="json")
    assert response.status_code == 400


class _Response(io.BytesIO):
    def __enter__(self) -> "_Response":
        return self

    def __exit__(self, *args: object) -> None:
        self.close()


def test_client_builds_fixed_https_url(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: dict[str, Any] = {}

    def fake_urlopen(request: Any, timeout: float) -> _Response:
        seen.update(url=request.full_url, timeout=timeout, method=request.get_method())
        return _Response(json.dumps({"status": "OK", "result": [1]}).encode())

    monkeypatch.setattr(cf.urllib.request, "urlopen", fake_urlopen)

    assert cf.fetch("user.status", {"handle": "tourist"}) == [1]
    assert seen["url"] == "https://codeforces.com/api/user.status?handle=tourist"
    assert seen["method"] == "GET"
    assert seen["timeout"] > 0


@pytest.mark.parametrize("payload", [b"<html>", b'{"status": "OK"}', b'{"status": "FAILED"}'])
def test_client_rejects_bad_payloads(monkeypatch: pytest.MonkeyPatch, payload: bytes) -> None:
    monkeypatch.setattr(cf.urllib.request, "urlopen", lambda *a, **k: _Response(payload))

    with pytest.raises(cf.CodeforcesError):
        cf.fetch("user.status", {"handle": "x"})


def test_client_reports_unknown_handle(monkeypatch: pytest.MonkeyPatch) -> None:
    def not_found(request: Any, timeout: float) -> None:
        body = io.BytesIO(b'{"status":"FAILED","comment":"handle: User with handle x not found"}')
        raise urllib.error.HTTPError(request.full_url, 400, "Bad Request", {}, body)  # type: ignore[arg-type]

    monkeypatch.setattr(cf.urllib.request, "urlopen", not_found)

    with pytest.raises(cf.HandleNotFoundError):
        cf.fetch("user.status", {"handle": "x"})


def test_client_refuses_other_methods() -> None:
    with pytest.raises(ValueError, match="não autorizado"):
        cf.fetch("user.friends", {})

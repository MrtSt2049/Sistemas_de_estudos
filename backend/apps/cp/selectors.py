"""Aggregations over synced submissions: solved by rating/tag and upsolving."""

from collections import Counter
from typing import Any

from apps.accounts.models import User
from apps.cp.models import CpAccount, CpRatingChange, CpSubmission
from apps.exercises.models import Exercise

ACCEPTED = "OK"
# Sem veredito final ainda: não contam como falha.
_PENDING = frozenset({"", "TESTING", "SUBMITTED"})
# IDs a partir deste valor são do Gym, que tem outro caminho de URL.
_GYM_FIRST_ID = 100_000

_ProblemKey = tuple[int | None, str, str]


def problem_url(contest_id: int | None, index: str) -> str:
    if contest_id is None:
        return ""
    area = "gym" if contest_id >= _GYM_FIRST_ID else "contest"
    return f"https://codeforces.com/{area}/{contest_id}/problem/{index}"


def _key(row: dict[str, Any]) -> _ProblemKey:
    # Problemas sem contest são distinguidos também pelo nome.
    name = "" if row["contest_id"] is not None else row["problem_name"]
    return row["contest_id"], row["problem_index"], name


def _rows(owner: User) -> list[dict[str, Any]]:
    rows = (
        CpSubmission.objects.filter(owner=owner)
        .order_by("-submitted_at")
        .values(
            "contest_id",
            "problem_index",
            "problem_name",
            "rating",
            "tags",
            "verdict",
            "submitted_at",
        )
    )
    return [dict(row) for row in rows]


def summary(*, owner: User) -> dict[str, Any]:
    solved: dict[_ProblemKey, dict[str, Any]] = {}
    for row in _rows(owner):
        if row["verdict"] == ACCEPTED:
            solved.setdefault(_key(row), row)
    ratings = Counter(row["rating"] for row in solved.values() if row["rating"])
    tags = Counter(tag for row in solved.values() for tag in row["tags"])
    account = CpAccount.objects.filter(owner=owner).first()
    return {
        "handle": account.handle if account else None,
        "last_synced_at": account.last_synced_at if account else None,
        "solved_count": len(solved),
        "unrated_count": sum(1 for row in solved.values() if not row["rating"]),
        "by_rating": [{"rating": r, "count": c} for r, c in sorted(ratings.items())],
        "by_tag": [
            {"tag": t, "count": c} for t, c in sorted(tags.items(), key=lambda i: (-i[1], i[0]))
        ],
        "rating_history": CpRatingChange.objects.filter(owner=owner).order_by("happened_at"),
    }


def upsolving(*, owner: User) -> list[dict[str, Any]]:
    """Problems with at least one failed verdict and no accepted one, newest first."""
    problems: dict[_ProblemKey, dict[str, Any]] = {}
    accepted: set[_ProblemKey] = set()
    for row in _rows(owner):
        key = _key(row)
        if row["verdict"] == ACCEPTED:
            accepted.add(key)
        elif row["verdict"] not in _PENDING:
            if key not in problems:
                problems[key] = {**row, "attempts": 0, "last_attempt_at": row["submitted_at"]}
            problems[key]["attempts"] += 1

    imported = dict(
        Exercise.objects.filter(owner=owner, source__name__iexact="Codeforces").values_list(
            "external_ref", "pk"
        )
    )
    return [
        {
            **item,
            "url": problem_url(item["contest_id"], item["problem_index"]),
            "exercise": imported.get(f"{item['contest_id']}{item['problem_index']}"),
        }
        for key, item in problems.items()
        if key not in accepted
    ]

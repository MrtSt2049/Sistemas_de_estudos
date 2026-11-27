"""On-demand Codeforces sync and the upsolving bridge to exercises (ADR-015)."""

import time
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from django.db import transaction
from rest_framework import status

from apps.accounts.models import User
from apps.core import clock
from apps.core.exceptions import DomainError, NotFoundInScopeError
from apps.cp import client, selectors
from apps.cp.models import CpAccount, CpRatingChange, CpSubmission
from apps.disciplines.models import Discipline
from apps.exercises import services as exercise_services
from apps.exercises.models import Exercise, ExerciseSource, SourceKind

SOURCE_NAME = "Codeforces"
_SUBMISSION_UPDATE_FIELDS = ["verdict", "rating", "tags", "problem_name", "updated_at"]


class CodeforcesUnavailableError(DomainError):
    code = "codeforces_unavailable"
    status_code = status.HTTP_502_BAD_GATEWAY
    default_message = "Não foi possível sincronizar com o Codeforces."


@dataclass(frozen=True)
class SyncResult:
    handle: str
    new_submissions: int
    total_submissions: int
    rating_changes: int


def _timestamp(seconds: Any) -> datetime:
    return datetime.fromtimestamp(int(seconds), tz=UTC)


def _map_submission(owner: User, raw: dict[str, Any]) -> CpSubmission:
    problem = raw["problem"]
    rating = problem.get("rating")
    return CpSubmission(
        owner=owner,
        submission_id=int(raw["id"]),
        contest_id=problem.get("contestId"),
        problem_index=str(problem["index"])[:10],
        problem_name=str(problem["name"])[:255],
        rating=int(rating) if rating else None,
        tags=[str(tag) for tag in problem.get("tags", [])],
        verdict=str(raw.get("verdict", ""))[:40],
        programming_language=str(raw.get("programmingLanguage", ""))[:80],
        submitted_at=_timestamp(raw["creationTimeSeconds"]),
    )


def _map_rating(owner: User, raw: dict[str, Any]) -> CpRatingChange:
    return CpRatingChange(
        owner=owner,
        contest_id=int(raw["contestId"]),
        contest_name=str(raw["contestName"])[:255],
        rank=int(raw["rank"]),
        old_rating=int(raw["oldRating"]),
        new_rating=int(raw["newRating"]),
        happened_at=_timestamp(raw["ratingUpdateTimeSeconds"]),
    )


def _download(owner: User, handle: str) -> tuple[list[CpSubmission], list[CpRatingChange]]:
    """Fetch and map everything before any write, so a failure changes nothing."""
    try:
        raw_submissions = client.fetch("user.status", {"handle": handle})
        time.sleep(client.REQUEST_INTERVAL_SECONDS)
        raw_rating = client.fetch("user.rating", {"handle": handle})
        submissions = {
            s.submission_id: s for s in (_map_submission(owner, r) for r in raw_submissions)
        }
        changes = {c.contest_id: c for c in (_map_rating(owner, r) for r in raw_rating)}
    except client.HandleNotFoundError as exc:
        raise CodeforcesUnavailableError(
            str(exc), code="codeforces_handle_not_found", details={"handle": [str(exc)]}
        ) from exc
    except client.CodeforcesError as exc:
        raise CodeforcesUnavailableError(str(exc)) from exc
    except (KeyError, TypeError, ValueError, OverflowError) as exc:
        raise CodeforcesUnavailableError(
            "O Codeforces devolveu dados em um formato inesperado."
        ) from exc
    return list(submissions.values()), list(changes.values())


def sync_account(*, owner: User, handle: str) -> SyncResult:
    submissions, changes = _download(owner, handle)
    with transaction.atomic():
        User.objects.select_for_update().get(pk=owner.pk)
        account = CpAccount.objects.filter(owner=owner).first()
        if account and account.handle.lower() != handle.lower():
            # Dados de outro handle não podem se misturar aos novos.
            CpSubmission.objects.filter(owner=owner).delete()
            CpRatingChange.objects.filter(owner=owner).delete()
        before = CpSubmission.objects.filter(owner=owner).count()
        CpSubmission.objects.bulk_create(
            submissions,
            batch_size=1000,
            update_conflicts=True,
            unique_fields=["owner", "submission_id"],
            update_fields=_SUBMISSION_UPDATE_FIELDS,
        )
        CpRatingChange.objects.bulk_create(
            changes,
            batch_size=1000,
            update_conflicts=True,
            unique_fields=["owner", "contest_id"],
            update_fields=["contest_name", "rank", "old_rating", "new_rating", "updated_at"],
        )
        total = CpSubmission.objects.filter(owner=owner).count()
        CpAccount.objects.update_or_create(
            owner=owner, defaults={"handle": handle, "last_synced_at": clock.now()}
        )
    return SyncResult(handle, total - before, total, len(changes))


@transaction.atomic
def import_problem_as_exercise(
    *, owner: User, contest_id: int, problem_index: str, discipline: Discipline
) -> tuple[Exercise, bool]:
    """Turn an upsolving problem into an exercise (enables notebook and reviews)."""
    User.objects.select_for_update().get(pk=owner.pk)
    latest = CpSubmission.objects.filter(
        owner=owner, contest_id=contest_id, problem_index=problem_index
    ).first()
    if latest is None:
        raise NotFoundInScopeError("Problema não encontrado nas submissões sincronizadas.")
    source = ExerciseSource.objects.filter(owner=owner, name__iexact=SOURCE_NAME).first()
    if source is None:
        source = ExerciseSource.objects.create(
            owner=owner, name=SOURCE_NAME, kind=SourceKind.COMPETITIVE
        )
    reference = f"{contest_id}{problem_index}"
    existing = Exercise.objects.filter(owner=owner, source=source, external_ref=reference).first()
    if existing is not None:
        return existing, False
    exercise = exercise_services.create_exercise(
        owner=owner,
        data={
            "discipline": discipline,
            "source": source,
            "external_ref": reference,
            "title": latest.problem_name[:200],
            "url": selectors.problem_url(contest_id, problem_index),
        },
    )
    return exercise, True

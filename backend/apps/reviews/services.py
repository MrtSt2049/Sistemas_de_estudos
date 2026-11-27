"""Review scheduling and answers, all in the user's calendar day (RF045, RF046, RF048)."""

from datetime import date, datetime
from uuid import UUID

from django.db import transaction
from django.db.models import QuerySet

from apps.accounts.models import User, UserProfile
from apps.core import clock
from apps.core.exceptions import ConflictError, NotFoundInScopeError
from apps.curriculum.models import Topic
from apps.exercises.models import Attempt, AttemptResult, Exercise
from apps.reviews import scheduling
from apps.reviews.models import ReviewItem, ReviewLog, ReviewStatus


def _profile(owner: User) -> UserProfile:
    profile, _ = UserProfile.objects.get_or_create(user=owner)
    return profile


def today_for(owner: User) -> date:
    return clock.user_today(_profile(owner).timezone)


def _first_due(owner: User, at: datetime) -> date:
    profile = _profile(owner)
    day = clock.user_today(profile.timezone, instant=at)
    return scheduling.due_date(day, profile.review_intervals_days, 0)


def schedule_from_attempt(attempt: Attempt) -> None:
    """Anything short of solving alone (re)starts the exercise's review cycle.

    Runs inside the transaction that records the attempt.
    """
    if attempt.result == AttemptResult.SOLVED_ALONE:
        return
    ReviewItem.objects.update_or_create(
        exercise=attempt.exercise,
        defaults={
            "owner": attempt.owner,
            "step": 0,
            "due_on": _first_due(attempt.owner, attempt.attempted_at),
            "status": ReviewStatus.ACTIVE,
        },
    )


@transaction.atomic
def schedule_on_demand(
    *, owner: User, exercise: Exercise | None = None, topic: Topic | None = None
) -> tuple[ReviewItem, bool]:
    """Create the review item if missing; an existing schedule is left untouched."""
    User.objects.select_for_update().get(pk=owner.pk)
    return ReviewItem.objects.get_or_create(
        owner=owner,
        exercise=exercise,
        topic=topic,
        defaults={"due_on": _first_due(owner, clock.now())},
    )


def due_queue(*, owner: User) -> tuple[date, QuerySet[ReviewItem]]:
    today = today_for(owner)
    items = (
        ReviewItem.objects.filter(owner=owner, status=ReviewStatus.ACTIVE, due_on__lte=today)
        .select_related("exercise__discipline", "topic__discipline")
        .order_by("due_on", "created_at")
    )
    return today, items


@transaction.atomic
def answer_review(*, owner: User, item_id: UUID, rating: str, key: UUID) -> ReviewLog:
    """Apply a rating once; repeating the same key returns the original outcome."""
    item = ReviewItem.objects.select_for_update().filter(owner=owner, pk=item_id).first()
    if item is None:
        raise NotFoundInScopeError()
    previous = ReviewLog.objects.filter(item=item, idempotency_key=key).first()
    if previous is not None:
        return previous

    profile = _profile(owner)
    today = clock.user_today(profile.timezone)
    if item.status != ReviewStatus.ACTIVE or item.due_on > today:
        raise ConflictError("Este item não está vencido.", code="review_not_due")

    ladder = profile.review_intervals_days
    item.step = scheduling.next_step(item.step, rating, len(ladder))
    item.due_on = scheduling.due_date(today, ladder, item.step)
    item.last_reviewed_at = clock.now()
    item.save(update_fields=["step", "due_on", "last_reviewed_at", "updated_at"])
    return ReviewLog.objects.create(
        owner=owner,
        item=item,
        rating=rating,
        reviewed_at=item.last_reviewed_at,
        idempotency_key=key,
        step_after=item.step,
        due_on_after=item.due_on,
    )

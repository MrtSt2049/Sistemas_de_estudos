"""Goal validation and periodic reviews (RF062, RF066)."""

from datetime import date, timedelta
from typing import Any

from django.db import transaction

from apps.accounts.models import User, UserProfile
from apps.core import clock
from apps.core.exceptions import RuleViolationError
from apps.goals import selectors
from apps.goals.models import Goal, GoalMetric, GoalStatus, PeriodicReview, ReviewPeriodKind

_GOAL_FIELDS = (
    "title",
    "description",
    "scope",
    "period_start",
    "period_end",
    "metric",
    "target_value",
    "discipline",
    "status",
)
REVIEW_TEXT_FIELDS = (
    "planned_text",
    "completed_text",
    "evidence_text",
    "obstacles_text",
    "adjustments_text",
)


def _validate_goal(values: dict[str, Any], instance: Goal | None = None) -> None:
    def current(field: str) -> Any:
        if field in values:
            return values[field]
        return getattr(instance, field) if instance else None

    if current("period_end") < current("period_start"):
        message = "O fim do período não pode ser anterior ao início."
        raise RuleViolationError(message, code="invalid_period", details={"period_end": [message]})
    if current("metric") == GoalMetric.CP_CONTESTS and current("discipline") is not None:
        message = "Contests do Codeforces não são separados por disciplina."
        raise RuleViolationError(
            message, code="metric_without_discipline", details={"discipline": [message]}
        )


def create_goal(*, owner: User, data: dict[str, Any]) -> Goal:
    values = {field: data[field] for field in _GOAL_FIELDS if field in data}
    _validate_goal(values)
    return Goal.objects.create(owner=owner, **values)


def update_goal(*, goal: Goal, data: dict[str, Any]) -> Goal:
    values = {field: data[field] for field in _GOAL_FIELDS if field in data}
    _validate_goal(values, goal)
    for field, value in values.items():
        setattr(goal, field, value)
    goal.save(update_fields=[*values, "updated_at"])
    return goal


def goal_progress(goal: Goal) -> int:
    window = selectors.day_window(goal.owner, goal.period_start, goal.period_end)
    return selectors.measure(
        owner=goal.owner, metric=goal.metric, window=window, discipline=goal.discipline_id
    )


def period_bounds(*, owner: User, kind: str, day: date) -> tuple[date, date]:
    """The week (per the profile's first weekday, 0 = Monday) or month containing `day`."""
    if kind == ReviewPeriodKind.MONTHLY:
        first = day.replace(day=1)
        following = (first + timedelta(days=32)).replace(day=1)
        return first, following - timedelta(days=1)
    profile, _ = UserProfile.objects.get_or_create(user=owner)
    first = day - timedelta(days=(day.weekday() - profile.week_starts_on) % 7)
    return first, first + timedelta(days=6)


def today_for(owner: User) -> date:
    return clock.now().astimezone(selectors.user_timezone(owner)).date()


def review_draft(*, owner: User, kind: str, day: date | None = None) -> dict[str, Any]:
    """Everything needed to write the review, with the period's real numbers."""
    first, last = period_bounds(owner=owner, kind=kind, day=day or today_for(owner))
    goals = (
        Goal.objects.filter(owner=owner, period_start__lte=last, period_end__gte=first)
        .exclude(status=GoalStatus.ABANDONED)
        .select_related("discipline", "owner")
    )
    return {
        "kind": kind,
        "period_start": first,
        "period_end": last,
        "numbers": selectors.period_numbers(owner=owner, first=first, last=last),
        "goals": list(goals),
        "review": PeriodicReview.objects.filter(owner=owner, kind=kind, period_start=first).first(),
    }


@transaction.atomic
def save_review(*, owner: User, kind: str, day: date, texts: dict[str, str]) -> PeriodicReview:
    """One review per period: saving again edits the same record."""
    User.objects.select_for_update().get(pk=owner.pk)
    first, last = period_bounds(owner=owner, kind=kind, day=day)
    values = {field: texts[field] for field in REVIEW_TEXT_FIELDS if field in texts}
    review, _ = PeriodicReview.objects.update_or_create(
        owner=owner, kind=kind, period_start=first, defaults={**values, "period_end": last}
    )
    return review

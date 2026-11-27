"""Progress computed from real data, always in the user's calendar days (RF063)."""

from collections.abc import Callable
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from django.db.models import DurationField, ExpressionWrapper, F, Q, Sum

from apps.accounts.models import User, UserProfile
from apps.cp.models import CpRatingChange
from apps.exercises.models import Attempt, AttemptResult
from apps.goals.models import GoalMetric
from apps.reviews.models import ReviewLog
from apps.studysessions.models import StudySession


@dataclass(frozen=True)
class Window:
    """Half-open UTC interval covering whole days of the user's timezone."""

    start: datetime
    end: datetime


def user_timezone(owner: User) -> ZoneInfo:
    profile, _ = UserProfile.objects.get_or_create(user=owner)
    return ZoneInfo(profile.timezone)


def day_window(owner: User, first: date, last: date) -> Window:
    zone = user_timezone(owner)
    return Window(
        start=datetime.combine(first, time.min, tzinfo=zone),
        end=datetime.combine(last + timedelta(days=1), time.min, tzinfo=zone),
    )


def _sessions(owner: User, window: Window, discipline: UUID | None):  # type: ignore[no-untyped-def]
    queryset = StudySession.objects.filter(
        owner=owner,
        ended_at__isnull=False,
        started_at__gte=window.start,
        started_at__lt=window.end,
    )
    return queryset.filter(discipline_id=discipline) if discipline else queryset


def _study_minutes(owner: User, window: Window, discipline: UUID | None) -> int:
    duration = ExpressionWrapper(F("ended_at") - F("started_at"), output_field=DurationField())
    total = _sessions(owner, window, discipline).aggregate(total=Sum(duration))["total"]
    return int(total.total_seconds() // 60) if total else 0


def _sessions_count(owner: User, window: Window, discipline: UUID | None) -> int:
    return int(_sessions(owner, window, discipline).count())


def _exercises(owner: User, window: Window, discipline: UUID | None, *, solved_alone: bool) -> int:
    queryset = Attempt.objects.filter(
        owner=owner, attempted_at__gte=window.start, attempted_at__lt=window.end
    )
    if discipline:
        queryset = queryset.filter(exercise__discipline_id=discipline)
    if solved_alone:
        queryset = queryset.filter(result=AttemptResult.SOLVED_ALONE)
    return queryset.values("exercise_id").distinct().count()


def _attempted(owner: User, window: Window, discipline: UUID | None) -> int:
    return _exercises(owner, window, discipline, solved_alone=False)


def _solved(owner: User, window: Window, discipline: UUID | None) -> int:
    return _exercises(owner, window, discipline, solved_alone=True)


def _reviews_done(owner: User, window: Window, discipline: UUID | None) -> int:
    queryset = ReviewLog.objects.filter(
        owner=owner, reviewed_at__gte=window.start, reviewed_at__lt=window.end
    )
    if discipline:
        queryset = queryset.filter(
            Q(item__exercise__discipline_id=discipline) | Q(item__topic__discipline_id=discipline)
        )
    return queryset.count()


def _cp_contests(owner: User, window: Window, discipline: UUID | None) -> int:
    return CpRatingChange.objects.filter(
        owner=owner, happened_at__gte=window.start, happened_at__lt=window.end
    ).count()


_METRICS: dict[str, Callable[[User, Window, UUID | None], int]] = {
    GoalMetric.STUDY_MINUTES: _study_minutes,
    GoalMetric.SESSIONS_COUNT: _sessions_count,
    GoalMetric.EXERCISES_ATTEMPTED: _attempted,
    GoalMetric.EXERCISES_SOLVED: _solved,
    GoalMetric.REVIEWS_DONE: _reviews_done,
    GoalMetric.CP_CONTESTS: _cp_contests,
}


def measure(*, owner: User, metric: str, window: Window, discipline: UUID | None = None) -> int:
    return _METRICS[metric](owner, window, discipline)


def period_numbers(*, owner: User, first: date, last: date) -> dict[str, int]:
    window = day_window(owner, first, last)
    return {str(metric): measure(owner=owner, metric=metric, window=window) for metric in _METRICS}

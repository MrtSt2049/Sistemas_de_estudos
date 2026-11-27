"""Event rules and the weekly plan profile (RF055, RF057, RF058)."""

from datetime import date, datetime, time, timedelta
from typing import Any

from django.db import transaction

from apps.accounts.models import User
from apps.core.exceptions import RuleViolationError
from apps.goals.selectors import user_timezone
from apps.planning.models import CalendarEvent, EventKind, WeeklyPlanBlock, WeeklyPlanProfile
from apps.studysessions.models import ActivityKind

_EVENT_FIELDS = (
    "title",
    "kind",
    "starts_at",
    "ends_at",
    "all_day",
    "description",
    "location",
    "discipline",
    "recurrence_interval_weeks",
    "recurrence_until",
)
_KIND_BY_ACTIVITY: dict[str, str] = {
    ActivityKind.CLASS: EventKind.CLASS,
    ActivityKind.MOCK_EXAM: EventKind.EXAM,
}


def _invalid(message: str, code: str, field: str) -> RuleViolationError:
    return RuleViolationError(message, code=code, details={field: [message]})


def all_day_bounds(owner: User, first: date, last: date) -> tuple[datetime, datetime]:
    """All-day events span local midnights; the end is exclusive."""
    zone = user_timezone(owner)
    return (
        datetime.combine(first, time.min, tzinfo=zone),
        datetime.combine(last + timedelta(days=1), time.min, tzinfo=zone),
    )


def _prepare_event(
    owner: User, values: dict[str, Any], instance: CalendarEvent | None = None
) -> dict[str, Any]:
    def current(field: str) -> Any:
        if field in values:
            return values[field]
        return getattr(instance, field) if instance else None

    starts_at, ends_at = current("starts_at"), current("ends_at")
    if ends_at < starts_at:
        raise _invalid("O fim não pode ser anterior ao início.", "invalid_interval", "ends_at")
    if current("all_day"):
        zone = user_timezone(owner)
        local_end = ends_at.astimezone(zone)
        last = local_end.date()
        if local_end.time() == time.min and ends_at > starts_at:
            last -= timedelta(days=1)
        values["starts_at"], values["ends_at"] = all_day_bounds(
            owner, starts_at.astimezone(zone).date(), last
        )
    elif ends_at == starts_at:
        raise _invalid("O fim deve ser posterior ao início.", "invalid_interval", "ends_at")

    interval, until = current("recurrence_interval_weeks"), current("recurrence_until")
    if (interval is None) != (until is None):
        raise _invalid(
            "A recorrência exige o intervalo em semanas e a data final.",
            "invalid_recurrence",
            "recurrence_until",
        )
    if until is not None:
        first_day = current("starts_at").astimezone(user_timezone(owner)).date()
        if until < first_day or until > first_day + timedelta(days=3 * 366):
            raise _invalid(
                "A recorrência deve terminar após o início e em até 3 anos.",
                "invalid_recurrence",
                "recurrence_until",
            )
    return values


def create_event(*, owner: User, data: dict[str, Any]) -> CalendarEvent:
    values = {field: data[field] for field in _EVENT_FIELDS if field in data}
    return CalendarEvent.objects.create(owner=owner, **_prepare_event(owner, values))


def update_event(*, event: CalendarEvent, data: dict[str, Any]) -> CalendarEvent:
    values = {field: data[field] for field in _EVENT_FIELDS if field in data}
    values = _prepare_event(event.owner, values, event)
    for field, value in values.items():
        setattr(event, field, value)
    event.save(update_fields=[*values, "updated_at"])
    return event


@transaction.atomic
def activate_profile(*, profile: WeeklyPlanProfile) -> WeeklyPlanProfile:
    User.objects.select_for_update().get(pk=profile.owner_id)
    WeeklyPlanProfile.objects.filter(owner=profile.owner, is_active=True).exclude(
        pk=profile.pk
    ).update(is_active=False)
    profile.is_active = True
    profile.save(update_fields=["is_active", "updated_at"])
    return profile


def save_block(
    *, owner: User, data: dict[str, Any], block: WeeklyPlanBlock | None = None
) -> WeeklyPlanBlock:
    target = block or WeeklyPlanBlock(owner=owner)
    for field, value in data.items():
        setattr(target, field, value)
    if target.end_time <= target.start_time:
        raise _invalid("O fim deve ser posterior ao início.", "invalid_interval", "end_time")
    target.save()
    return target


@transaction.atomic
def apply_profile(*, profile: WeeklyPlanProfile, week_start: date) -> int:
    """Create the events of the chosen week; running it again creates nothing."""
    owner = profile.owner
    User.objects.select_for_update().get(pk=owner.pk)
    zone = user_timezone(owner)
    created_count = 0
    for block in profile.blocks.select_related("discipline"):
        day = week_start + timedelta(days=(block.weekday - week_start.weekday()) % 7)
        _, created = CalendarEvent.objects.get_or_create(
            owner=owner,
            import_key=f"plan:{block.pk}:{day.isoformat()}",
            defaults={
                "title": block.label,
                "kind": _KIND_BY_ACTIVITY.get(block.activity_kind, EventKind.STUDY),
                "starts_at": datetime.combine(day, block.start_time, tzinfo=zone),
                "ends_at": datetime.combine(day, block.end_time, tzinfo=zone),
                "discipline": block.discipline,
            },
        )
        created_count += int(created)
    return created_count

"""iCalendar export (RF061, RFC 5545) with an explicit VTIMEZONE."""

from collections.abc import Iterator
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from apps.accounts.models import User
from apps.core import clock
from apps.goals.models import Goal, GoalStatus
from apps.goals.selectors import user_timezone
from apps.planning.models import CalendarEvent

_LINE_LIMIT = 75


def _escape(text: str) -> str:
    escaped = text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,")
    return escaped.replace("\r\n", "\\n").replace("\n", "\\n").replace("\r", "\\n")


def _fold(line: str) -> str:
    """Fold at 75 octets without splitting a UTF-8 character."""
    parts: list[str] = []
    current, size = "", 0
    for char in line:
        width = len(char.encode())
        # Linhas de continuação gastam um octeto com o espaço inicial.
        if size + width > _LINE_LIMIT - (1 if parts else 0):
            parts.append(current)
            current, size = "", 0
        current += char
        size += width
    parts.append(current)
    return "\r\n ".join(parts)


def _offset(value: timedelta) -> str:
    total = int(value.total_seconds())
    sign = "+" if total >= 0 else "-"
    hours, remainder = divmod(abs(total), 3600)
    return f"{sign}{hours:02d}{remainder // 60:02d}"


def _local(value: datetime) -> str:
    return value.strftime("%Y%m%dT%H%M%S")


def _utc_offset(instant: datetime, zone: ZoneInfo) -> timedelta:
    offset = instant.astimezone(zone).utcoffset()
    assert offset is not None
    return offset


def _transitions(zone: ZoneInfo, first: int, last: int) -> Iterator[datetime]:
    """UTC instants where the offset changes, found by daily scan plus bisection."""
    cursor = datetime(first, 1, 1, tzinfo=UTC)
    end = datetime(last + 1, 1, 1, tzinfo=UTC)
    while cursor < end:
        following = cursor + timedelta(days=1)
        if _utc_offset(cursor, zone) != _utc_offset(following, zone):
            low, high = cursor, following
            while high - low > timedelta(minutes=1):
                middle = low + (high - low) / 2
                if _utc_offset(middle, zone) == _utc_offset(low, zone):
                    low = middle
                else:
                    high = middle
            yield high.replace(second=0, microsecond=0)
        cursor = following


def _observance(
    zone: ZoneInfo, instant: datetime, before: timedelta, local_start: datetime
) -> list[str]:
    moment = instant.astimezone(zone)
    kind = "DAYLIGHT" if moment.dst() else "STANDARD"
    return [
        f"BEGIN:{kind}",
        f"DTSTART:{_local(local_start)}",
        f"TZOFFSETFROM:{_offset(before)}",
        f"TZOFFSETTO:{_offset(_utc_offset(instant, zone))}",
        f"TZNAME:{moment.tzname()}",
        f"END:{kind}",
    ]


def timezone_lines(name: str, first_year: int, last_year: int) -> list[str]:
    zone = ZoneInfo(name)
    start = datetime(first_year, 1, 1, tzinfo=UTC)
    initial = _utc_offset(start, zone)
    lines = ["BEGIN:VTIMEZONE", f"TZID:{name}"]
    lines += _observance(zone, start, initial, datetime(first_year, 1, 1))
    for instant in _transitions(zone, first_year, last_year):
        before = _utc_offset(instant - timedelta(minutes=2), zone)
        # DTSTART é a hora local lida no relógio anterior à mudança.
        local_start = (instant + before).replace(tzinfo=None)
        lines += _observance(zone, instant, before, local_start)
    return [*lines, "END:VTIMEZONE"]


def _all_day(first: date, end_exclusive: date) -> list[str]:
    return [
        f"DTSTART;VALUE=DATE:{first:%Y%m%d}",
        f"DTEND;VALUE=DATE:{end_exclusive:%Y%m%d}",
    ]


def _event_lines(event: CalendarEvent, zone: ZoneInfo, stamp: str) -> list[str]:
    start, end = event.starts_at.astimezone(zone), event.ends_at.astimezone(zone)
    lines = ["BEGIN:VEVENT", f"UID:event-{event.pk}@study-platform", f"DTSTAMP:{stamp}"]
    if event.all_day:
        lines += _all_day(start.date(), end.date())
    else:
        lines += [
            f"DTSTART;TZID={zone.key}:{_local(start)}",
            f"DTEND;TZID={zone.key}:{_local(end)}",
        ]
    if event.recurrence_interval_weeks and event.recurrence_until:
        if event.all_day:
            until = f"{event.recurrence_until:%Y%m%d}"
        else:
            last_moment = datetime.combine(event.recurrence_until, time(23, 59, 59), tzinfo=zone)
            until = f"{_local(last_moment.astimezone(UTC))}Z"
        lines.append(f"RRULE:FREQ=WEEKLY;INTERVAL={event.recurrence_interval_weeks};UNTIL={until}")
    lines.append(f"SUMMARY:{_escape(event.title)}")
    if event.description:
        lines.append(f"DESCRIPTION:{_escape(event.description)}")
    if event.location:
        lines.append(f"LOCATION:{_escape(event.location)}")
    return [*lines, "END:VEVENT"]


def export_ics(*, owner: User) -> str:
    zone = user_timezone(owner)
    stamp = f"{_local(clock.now().astimezone(UTC))}Z"
    events = list(CalendarEvent.objects.filter(owner=owner).order_by("starts_at", "pk"))
    goals = list(Goal.objects.filter(owner=owner, status=GoalStatus.ACTIVE).order_by("pk"))

    years = [clock.now().year]
    for event in events:
        years += [event.starts_at.year, event.ends_at.year]
        if event.recurrence_until:
            years.append(event.recurrence_until.year)

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Study Platform//PT-BR",
        "CALSCALE:GREGORIAN",
        *timezone_lines(zone.key, min(years), max(years)),
    ]
    for event in events:
        lines += _event_lines(event, zone, stamp)
    for goal in goals:
        lines += [
            "BEGIN:VEVENT",
            f"UID:goal-{goal.pk}@study-platform",
            f"DTSTAMP:{stamp}",
            *_all_day(goal.period_end, goal.period_end + timedelta(days=1)),
            f"SUMMARY:{_escape(f'Prazo da meta: {goal.title}')}",
            "END:VEVENT",
        ]
    lines.append("END:VCALENDAR")
    return "".join(f"{_fold(line)}\r\n" for line in lines)

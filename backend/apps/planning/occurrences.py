"""Pure expansion of weekly recurrence, preserving the local wall-clock time."""

from collections.abc import Iterator
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo


def weekly_occurrences(
    *,
    starts_at: datetime,
    ends_at: datetime,
    zone: ZoneInfo,
    interval_weeks: int | None,
    until: date | None,
    window_start: datetime,
    window_end: datetime,
) -> Iterator[tuple[datetime, datetime]]:
    """Yield (start, end) pairs overlapping the half-open window.

    Wall-clock time is kept in `zone`, so a 19:00 class stays at 19:00 even if the
    zone's UTC offset changes.
    """
    local_start = starts_at.astimezone(zone)
    duration = ends_at - starts_at
    step = 0
    while True:
        day = local_start.date() + timedelta(weeks=step)
        if interval_weeks and until and day > until:
            return
        start = datetime.combine(day, local_start.time(), tzinfo=zone)
        end = start + duration
        if start >= window_end:
            return
        if end > window_start or start >= window_start:
            yield start, end
        if not interval_weeks:
            return
        step += interval_weeks

"""Shared clock utilities for deterministic UTC timestamps and user-day calculations."""

from collections.abc import Callable
from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo

_clock_override: Callable[[], datetime] | None = None


def now() -> datetime:
    """Return current UTC datetime (injectable in tests)."""
    if _clock_override is not None:
        return _clock_override()
    return datetime.now(tz=UTC)


def set_clock(fn: Callable[[], datetime] | None) -> None:
    """Override the global clock function (for deterministic tests)."""
    global _clock_override
    _clock_override = fn


def user_today(tz_name: str, *, instant: datetime | None = None) -> date:
    """Compute the calendar date for a user's configured IANA timezone."""
    current = instant or now()
    return current.astimezone(ZoneInfo(tz_name)).date()

"""Pure spaced-repetition rules over a configurable ladder of intervals (RF046, D-04)."""

from collections.abc import Sequence
from datetime import date, timedelta

# Positions gained by each rating; "again" is handled separately (back to the start).
_ADVANCE = {"hard": 0, "good": 1, "easy": 2}


def next_step(step: int, rating: str, ladder_length: int) -> int:
    if rating == "again":
        return 0
    return min(step + _ADVANCE[rating], ladder_length - 1)


def due_date(today: date, ladder: Sequence[int], step: int) -> date:
    return today + timedelta(days=ladder[min(step, len(ladder) - 1)])

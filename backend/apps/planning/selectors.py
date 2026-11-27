"""Calendar range: stored events expanded plus deadlines derived from goals (RF059)."""

from datetime import date, datetime, time, timedelta
from typing import Any

from django.db.models import Q

from apps.accounts.models import User
from apps.goals.models import Goal, GoalStatus
from apps.goals.selectors import day_window, user_timezone
from apps.planning.models import CalendarEvent, EventKind
from apps.planning.occurrences import weekly_occurrences


def calendar_items(*, owner: User, first: date, last: date) -> list[dict[str, Any]]:
    window = day_window(owner, first, last)
    zone = user_timezone(owner)
    events = (
        CalendarEvent.objects.filter(owner=owner, starts_at__lt=window.end)
        .filter(
            Q(recurrence_interval_weeks__isnull=False, recurrence_until__gte=first)
            | Q(recurrence_interval_weeks__isnull=True, ends_at__gte=window.start)
        )
        .select_related("discipline")
    )
    items: list[dict[str, Any]] = []
    for event in events:
        for start, end in weekly_occurrences(
            starts_at=event.starts_at,
            ends_at=event.ends_at,
            zone=zone,
            interval_weeks=event.recurrence_interval_weeks,
            until=event.recurrence_until,
            window_start=window.start,
            window_end=window.end,
        ):
            items.append(
                {
                    "source": "event",
                    "event": event.pk,
                    "goal": None,
                    "title": event.title,
                    "kind": event.kind,
                    "starts_at": start,
                    "ends_at": end,
                    "all_day": event.all_day,
                    "description": event.description,
                    "discipline_name": event.discipline.name if event.discipline else None,
                    "discipline_color": event.discipline.color if event.discipline else "",
                    "recurring": event.recurrence_interval_weeks is not None,
                }
            )

    # Derivados: nada é copiado, então mudar a meta atualiza o calendário.
    goals = Goal.objects.filter(
        owner=owner, status=GoalStatus.ACTIVE, period_end__gte=first, period_end__lte=last
    ).select_related("discipline")
    for goal in goals:
        start = datetime.combine(goal.period_end, time.min, tzinfo=zone)
        items.append(
            {
                "source": "goal",
                "event": None,
                "goal": goal.pk,
                "title": f"Prazo da meta: {goal.title}",
                "kind": EventKind.DEADLINE,
                "starts_at": start,
                "ends_at": start + timedelta(days=1),
                "all_day": True,
                "description": goal.description,
                "discipline_name": goal.discipline.name if goal.discipline else None,
                "discipline_color": goal.discipline.color if goal.discipline else "",
                "recurring": False,
            }
        )
    return sorted(items, key=lambda i: (i["starts_at"], not i["all_day"], i["title"]))

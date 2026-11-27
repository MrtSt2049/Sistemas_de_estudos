"""Idempotent import of the master calendar CSV (issue #10).

Source of truth: the Obsidian vault. The platform imports from it and never writes back.
Each week becomes an all-day study event; checkpoints become deadlines; planned
OBMU and contest hours become weekly study-time goals.
"""

from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from django.db import transaction

from apps.accounts.models import User
from apps.core.csv_import import read_csv_rows
from apps.disciplines.models import Discipline, DisciplineKind
from apps.disciplines.services import create_discipline
from apps.goals.models import Goal, GoalMetric, GoalScope
from apps.planning.models import CalendarEvent, EventKind
from apps.planning.services import all_day_bounds

HOUR_COLUMNS = ("h OBMU", "h Maratona", "h OctoBit/MEJ", "h Físico")
REQUIRED_COLUMNS = (
    "Semana",
    "Início",
    "Fim",
    "Fase",
    "Foco OBMU da semana",
    *HOUR_COLUMNS,
    "Checkpoint",
    "Feito?",
)
# Somente estas colunas de horas viram metas de estudo.
GOAL_AREAS = {
    "h OBMU": ("obmu", "OBMU", DisciplineKind.OLYMPIAD),
    "h Maratona": ("maratona", "Maratona SBC", DisciplineKind.COMPETITIVE_PROGRAMMING),
}


@dataclass(frozen=True)
class WeekRow:
    number: int
    first: date
    last: date
    phase: str
    focus: str
    hours: dict[str, Decimal]
    checkpoint: str
    done: str

    @property
    def title(self) -> str:
        return f"Semana {self.number} — {self.phase}"[:200]

    def description(self) -> str:
        hours = " · ".join(f"{name[2:]}: {value} h" for name, value in self.hours.items())
        return f"Foco OBMU: {self.focus}\n{hours}\nFeito no plano: {self.done or '—'}"


@dataclass
class CalendarImportResult:
    events_created: int = 0
    goals_created: int = 0
    updated: int = 0
    notes: list[str] = field(default_factory=list)


def _parse_date(raw: str, column: str) -> date:
    try:
        return date.fromisoformat(raw)
    except ValueError as exc:
        raise ValueError(f"data inválida em '{column}': '{raw}' (use AAAA-MM-DD)") from exc


def _parse_hours(raw: str, column: str) -> Decimal:
    try:
        hours = Decimal(raw.replace(",", ".") or "0")
    except InvalidOperation as exc:
        raise ValueError(f"horas inválidas em '{column}': '{raw}'") from exc
    if not hours.is_finite() or not 0 <= hours <= 168:
        raise ValueError(f"horas fora de 0 a 168 em '{column}': '{raw}'")
    return hours


def _parse_row(values: dict[str, str]) -> WeekRow:
    if not values["Semana"].isdigit() or int(values["Semana"]) < 1:
        raise ValueError(f"semana inválida: '{values['Semana']}'")
    first = _parse_date(values["Início"], "Início")
    last = _parse_date(values["Fim"], "Fim")
    if not first <= last <= first + timedelta(days=31):
        raise ValueError("o fim deve ser igual ou posterior ao início, em até 31 dias")
    if not values["Fase"]:
        raise ValueError("a coluna 'Fase' está vazia")
    return WeekRow(
        number=int(values["Semana"]),
        first=first,
        last=last,
        phase=values["Fase"],
        focus=values["Foco OBMU da semana"],
        hours={column: _parse_hours(values[column], column) for column in HOUR_COLUMNS},
        checkpoint=values["Checkpoint"],
        done=values["Feito?"],
    )


def parse_calendar_csv(path: Path) -> list[WeekRow]:
    return read_csv_rows(
        path,
        required=REQUIRED_COLUMNS,
        parse=_parse_row,
        unique_key=lambda row: row.number,
        key_label="número de semana",
    )


def _upsert(
    model: type[CalendarEvent] | type[Goal],
    *,
    owner: User,
    key: str,
    values: dict[str, Any],
    result: CalendarImportResult,
) -> bool:
    """Create or update by import key. Returns True when a row was created."""
    manager = model._default_manager
    existing = manager.filter(owner=owner, import_key=key).first()
    if existing is None:
        manager.create(owner=owner, import_key=key, **values)
        return True
    changed = [name for name, value in values.items() if getattr(existing, name) != value]
    if changed:
        for name in changed:
            setattr(existing, name, values[name])
        existing.save(update_fields=[*changed, "updated_at"])
        result.updated += 1
    return False


def _discipline(owner: User, name: str, kind: str) -> Discipline:
    existing = Discipline.objects.filter(owner=owner, name__iexact=name).first()
    return existing or create_discipline(owner=owner, data={"name": name, "kind": kind})


@transaction.atomic
def import_master_calendar(*, owner: User, rows: list[WeekRow]) -> CalendarImportResult:
    User.objects.select_for_update().get(pk=owner.pk)
    result = CalendarImportResult()
    disciplines = {
        column: _discipline(owner, name, kind) for column, (_, name, kind) in GOAL_AREAS.items()
    }
    for row in rows:
        starts_at, ends_at = all_day_bounds(owner, row.first, row.last)
        result.events_created += _upsert(
            CalendarEvent,
            owner=owner,
            key=f"master:week:{row.number}",
            values={
                "title": row.title,
                "kind": EventKind.STUDY,
                "starts_at": starts_at,
                "ends_at": ends_at,
                "all_day": True,
                "description": row.description(),
            },
            result=result,
        )
        if row.checkpoint:
            day_start, day_end = all_day_bounds(owner, row.last, row.last)
            result.events_created += _upsert(
                CalendarEvent,
                owner=owner,
                key=f"master:checkpoint:{row.number}",
                values={
                    "title": row.checkpoint[:200],
                    "kind": EventKind.DEADLINE,
                    "starts_at": day_start,
                    "ends_at": day_end,
                    "all_day": True,
                    "description": f"Checkpoint da semana {row.number}.",
                },
                result=result,
            )
        for column, (slug, name, _) in GOAL_AREAS.items():
            minutes = round(row.hours[column] * 60)
            if minutes <= 0:
                continue
            # "status" fica de fora: reimportar não reabre uma meta encerrada.
            result.goals_created += _upsert(
                Goal,
                owner=owner,
                key=f"master:goal:{slug}:{row.number}",
                values={
                    "title": f"{name} — semana {row.number}",
                    "scope": GoalScope.WEEKLY,
                    "period_start": row.first,
                    "period_end": row.last,
                    "metric": GoalMetric.STUDY_MINUTES,
                    "target_value": minutes,
                    "discipline": disciplines[column],
                },
                result=result,
            )
    return result

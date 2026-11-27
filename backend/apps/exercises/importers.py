"""Idempotent import of the OBMU exam bank CSV (issue #9)."""

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.db import transaction

from apps.accounts.models import User
from apps.core.csv_import import read_csv_rows
from apps.disciplines.models import Discipline, DisciplineKind
from apps.disciplines.services import create_discipline
from apps.exercises import services
from apps.exercises.models import Exercise, ExerciseSource, SourceKind

REQUIRED_COLUMNS = ("Ano", "Formato", "Uso planejado", "Status", "Nota (/300)", "Observação")
IMPORT_NAME = "OBMU"
# Everything from this heading on belongs to the importer; text above it is the user's.
BLOCK_HEADING = "### Dados do banco de provas"


@dataclass(frozen=True)
class ExamRow:
    year: int
    exam_format: str
    planned_use: str
    status: str
    score: Decimal | None
    note: str

    @property
    def title(self) -> str:
        return f"{IMPORT_NAME} {self.year} — {self.exam_format}"[:200]

    def metadata_block(self) -> str:
        score = "—" if self.score is None else f"{self.score} / 300"
        return "\n".join(
            [
                BLOCK_HEADING,
                "",
                f"- Uso planejado: {self.planned_use or '—'}",
                f"- Status no banco: {self.status or '—'}",
                f"- Nota: {score}",
                f"- Observação: {self.note or '—'}",
            ]
        )


@dataclass
class ImportResult:
    created: int = 0
    updated: int = 0
    unchanged: int = 0


def _parse_score(raw: str) -> Decimal | None:
    if not raw:
        return None
    try:
        score = Decimal(raw.replace(",", "."))
    except InvalidOperation as exc:
        raise ValueError(f"nota inválida: '{raw}'") from exc
    if not score.is_finite() or not 0 <= score <= 300:
        raise ValueError(f"nota fora do intervalo de 0 a 300: '{raw}'")
    return score


def _parse_row(values: dict[str, str]) -> ExamRow:
    if not values["Ano"].isdigit() or not 1900 <= int(values["Ano"]) <= 2100:
        raise ValueError(f"ano inválido: '{values['Ano']}'")
    if not values["Formato"]:
        raise ValueError("a coluna 'Formato' está vazia")
    return ExamRow(
        year=int(values["Ano"]),
        exam_format=values["Formato"],
        planned_use=values["Uso planejado"],
        status=values["Status"],
        score=_parse_score(values["Nota (/300)"]),
        note=values["Observação"],
    )


def parse_exam_csv(path: Path) -> list[ExamRow]:
    return read_csv_rows(
        path,
        required=REQUIRED_COLUMNS,
        parse=_parse_row,
        unique_key=lambda row: row.year,
        key_label="ano",
    )


def _merge_block(current: str, block: str) -> str:
    user_text = current.split(BLOCK_HEADING, 1)[0].rstrip()
    return f"{user_text}\n\n{block}" if user_text else block


@transaction.atomic
def import_obmu_exams(*, owner: User, rows: list[ExamRow]) -> ImportResult:
    User.objects.select_for_update().get(pk=owner.pk)
    discipline = Discipline.objects.filter(owner=owner, name__iexact=IMPORT_NAME).first()
    if discipline is None:
        discipline = create_discipline(
            owner=owner, data={"name": IMPORT_NAME, "kind": DisciplineKind.OLYMPIAD}
        )
    source = ExerciseSource.objects.filter(owner=owner, name__iexact=IMPORT_NAME).first()
    if source is None:
        source = ExerciseSource.objects.create(
            owner=owner, name=IMPORT_NAME, kind=SourceKind.OLYMPIAD
        )

    result = ImportResult()
    for row in rows:
        reference = str(row.year)
        existing = Exercise.objects.filter(
            owner=owner, source=source, external_ref=reference
        ).first()
        if existing is None:
            services.create_exercise(
                owner=owner,
                data={
                    "discipline": discipline,
                    "source": source,
                    "external_ref": reference,
                    "title": row.title,
                    "statement_md": row.metadata_block(),
                },
            )
            result.created += 1
            continue
        statement = _merge_block(existing.statement_md, row.metadata_block())
        if statement == existing.statement_md and existing.title == row.title:
            result.unchanged += 1
            continue
        services.update_exercise(
            exercise=existing, data={"title": row.title, "statement_md": statement}
        )
        result.updated += 1
    return result

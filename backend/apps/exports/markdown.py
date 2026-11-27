"""Markdown export (RF033) as a zip with path-safe file names."""

import io
import zipfile
from uuid import UUID

from django.utils.text import slugify

from apps.accounts.models import User
from apps.exercises.models import Exercise
from apps.goals.models import PeriodicReview

_QUESTIONS = (
    ("planned_text", "Planejado"),
    ("completed_text", "Concluído"),
    ("evidence_text", "Evidências de evolução"),
    ("obstacles_text", "Obstáculos"),
    ("adjustments_text", "Ajustes"),
)


def safe_name(title: str, identifier: UUID) -> str:
    """slugify drops separators and dots; the id keeps names unique."""
    return f"{slugify(title)[:60] or 'sem-titulo'}-{identifier.hex[:8]}.md"


def _exercise_document(exercise: Exercise) -> str:
    lines = [
        f"# {exercise.title}",
        "",
        f"- Disciplina: {exercise.discipline.name}",
        f"- Fonte: {exercise.source.name}",
        f"- Referência: {exercise.external_ref or '—'}",
        f"- Estado: {exercise.get_state_display()}",
        f"- Tags: {', '.join(tag.name for tag in exercise.tags.all()) or '—'}",
    ]
    if exercise.statement_md:
        lines += ["", "## Enunciado", "", exercise.statement_md]
    if exercise.solution_md:
        lines += ["", "## Solução", "", exercise.solution_md]
    attempts = list(exercise.attempts.all())
    if attempts:
        lines += ["", "## Tentativas"]
        for attempt in attempts:
            lines += ["", f"### {attempt.attempted_at:%Y-%m-%d} — {attempt.get_result_display()}"]
            if attempt.key_technique:
                lines += ["", f"Técnica-chave: {attempt.key_technique}"]
            if attempt.notes_md:
                lines += ["", attempt.notes_md]
    return "\n".join(lines) + "\n"


def export_markdown(*, owner: User) -> bytes:
    buffer = io.BytesIO()
    exercises = (
        Exercise.objects.filter(owner=owner)
        .select_related("discipline", "source")
        .prefetch_related("tags", "attempts")
        .order_by("pk")
    )
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("LEIAME.md", "# Exportação da Study Platform\n")
        for exercise in exercises.iterator(chunk_size=500):
            archive.writestr(
                f"exercicios/{safe_name(exercise.title, exercise.pk)}",
                _exercise_document(exercise),
            )
        for review in PeriodicReview.objects.filter(owner=owner).order_by("period_start"):
            body = [f"# Revisão {review.get_kind_display().lower()} — {review.period_start}"]
            for field, heading in _QUESTIONS:
                body += ["", f"## {heading}", "", getattr(review, field) or "—"]
            archive.writestr(
                f"revisoes/{review.kind}-{review.period_start.isoformat()}.md",
                "\n".join(body) + "\n",
            )
    return buffer.getvalue()

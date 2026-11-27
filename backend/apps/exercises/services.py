"""Write operations and business rules for exercises and attempts (RF034–RF039)."""

from collections.abc import Callable, Iterable
from typing import Any
from uuid import UUID

from django.db import models, transaction
from django.db.models import ProtectedError, RestrictedError

from apps.accounts.models import User
from apps.core.exceptions import ConflictError, RuleViolationError
from apps.core.markdown import validate_safe_markdown
from apps.exercises.models import (
    Attempt,
    AttemptResult,
    ErrorType,
    Exercise,
    ExerciseSource,
    ExerciseState,
)

DEFAULT_ERROR_TYPES = ("Conceitual", "Algébrico", "Lógico", "Implementação", "Gestão de tempo")

# Higher layers (e.g. reviews) register here to react inside the same transaction,
# without making this app depend on them.
AttemptHook = Callable[[Attempt], None]
attempt_recorded_hooks: list[AttemptHook] = []

_EXERCISE_FIELDS = (
    "discipline",
    "topic",
    "source",
    "external_ref",
    "title",
    "statement_md",
    "solution_md",
    "difficulty",
    "url",
)
_ATTEMPT_FIELDS = (
    "attempted_at",
    "result",
    "duration_seconds",
    "hint_level",
    "dominant_error",
    "key_technique",
    "rewritten",
    "notes_md",
)
_ATTEMPT_EDITABLE = ("dominant_error", "key_technique", "rewritten", "notes_md")


def derive_state(results: Iterable[str]) -> str:
    """Pure state rule (RF039): `mastered` stays out until reviews grant it (D-05)."""
    seen = set(results)
    if not seen:
        return ExerciseState.NEW
    if AttemptResult.SOLVED_ALONE in seen:
        return ExerciseState.SOLVED
    return ExerciseState.IN_PROGRESS


def refresh_exercise_state(exercise: Exercise) -> str:
    if exercise.state != ExerciseState.MASTERED:
        state = derive_state(exercise.attempts.values_list("result", flat=True))
        if state != exercise.state:
            exercise.state = state
            exercise.save(update_fields=["state", "updated_at"])
    return exercise.state


def ensure_default_error_types(*, owner: User) -> None:
    """Idempotent: seeds only users that never received the defaults."""
    with transaction.atomic():
        User.objects.select_for_update().get(pk=owner.pk)
        if ErrorType.objects.filter(owner=owner, is_default=True).exists():
            return
        names = ErrorType.objects.filter(owner=owner).values_list("name", flat=True)
        existing = {name.lower() for name in names}
        ErrorType.objects.bulk_create(
            [
                ErrorType(owner=owner, name=name, is_default=True)
                for name in DEFAULT_ERROR_TYPES
                if name.lower() not in existing
            ]
        )


def ensure_unique_name(
    model: type[ExerciseSource] | type[ErrorType],
    *,
    owner: User,
    name: str,
    exclude_id: UUID | None = None,
) -> None:
    queryset = model._default_manager.filter(owner=owner, name__iexact=name)
    if exclude_id is not None:
        queryset = queryset.exclude(pk=exclude_id)
    if queryset.exists():
        message = "Já existe um cadastro com este nome."
        raise ConflictError(message, code="name_taken", details={"name": [message]})


def delete_reference(instance: models.Model) -> None:
    try:
        with transaction.atomic():
            instance.delete()
    except (ProtectedError, RestrictedError) as exc:
        raise ConflictError(
            "Este cadastro está em uso e não pode ser excluído.", code="reference_in_use"
        ) from exc


def _validate_exercise(
    *, owner: User, values: dict[str, Any], instance: Exercise | None = None
) -> None:
    def current(field: str) -> Any:
        if field in values:
            return values[field]
        return getattr(instance, field) if instance else None

    topic, discipline = current("topic"), current("discipline")
    if topic is not None and topic.discipline_id != discipline.pk:
        message = "O tópico pertence a outra disciplina."
        raise RuleViolationError(
            message, code="topic_discipline_mismatch", details={"topic": [message]}
        )
    for field in ("statement_md", "solution_md"):
        if field in values:
            validate_safe_markdown(values[field], field=field)
    reference, source = current("external_ref"), current("source")
    if reference:
        duplicates = Exercise.objects.filter(owner=owner, source=source, external_ref=reference)
        if instance is not None:
            duplicates = duplicates.exclude(pk=instance.pk)
        if duplicates.exists():
            message = "Já existe um exercício desta fonte com a mesma referência."
            raise ConflictError(
                message, code="exercise_ref_taken", details={"external_ref": [message]}
            )


def _exercise_values(data: dict[str, Any]) -> dict[str, Any]:
    values = {field: data[field] for field in _EXERCISE_FIELDS if field in data}
    if "external_ref" in values:
        values["external_ref"] = (values["external_ref"] or "").strip() or None
    return values


@transaction.atomic
def create_exercise(*, owner: User, data: dict[str, Any]) -> Exercise:
    values = _exercise_values(data)
    _validate_exercise(owner=owner, values=values)
    exercise = Exercise.objects.create(owner=owner, **values)
    if "tags" in data:
        exercise.tags.set(data["tags"])
    return exercise


@transaction.atomic
def update_exercise(*, exercise: Exercise, data: dict[str, Any]) -> Exercise:
    values = _exercise_values(data)
    _validate_exercise(owner=exercise.owner, values=values, instance=exercise)
    for field, value in values.items():
        setattr(exercise, field, value)
    exercise.save(update_fields=[*values, "updated_at"])
    if "tags" in data:
        exercise.tags.set(data["tags"])
    return exercise


@transaction.atomic
def record_attempt(*, owner: User, exercise: Exercise, data: dict[str, Any]) -> Attempt:
    """Store the attempt, update the exercise state and run hooks atomically."""
    locked = Exercise.objects.select_for_update().get(pk=exercise.pk, owner=owner)
    values = {field: data[field] for field in _ATTEMPT_FIELDS if field in data}
    validate_safe_markdown(values.get("notes_md", ""), field="notes_md")
    attempt = Attempt.objects.create(owner=owner, exercise=locked, **values)
    refresh_exercise_state(locked)
    exercise.state = locked.state
    for hook in attempt_recorded_hooks:
        hook(attempt)
    return attempt


def update_attempt(*, attempt: Attempt, data: dict[str, Any]) -> Attempt:
    changed = [field for field in _ATTEMPT_EDITABLE if field in data]
    if "notes_md" in data:
        validate_safe_markdown(data["notes_md"], field="notes_md")
    for field in changed:
        setattr(attempt, field, data[field])
    attempt.save(update_fields=[*changed, "updated_at"])
    return attempt


@transaction.atomic
def delete_attempt(*, attempt: Attempt) -> None:
    exercise = Exercise.objects.select_for_update().get(pk=attempt.exercise_id)
    attempt.delete()
    refresh_exercise_state(exercise)

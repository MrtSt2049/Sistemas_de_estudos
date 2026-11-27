"""Write operations and business rules for disciplines (RF013, RF014, RF016)."""

from typing import Any
from uuid import UUID

from django.db import transaction
from django.db.models import ProtectedError

from apps.accounts.models import User
from apps.core import clock
from apps.core.exceptions import ConflictError, RuleViolationError
from apps.disciplines.models import Discipline

_EDITABLE_FIELDS = ("name", "kind", "code", "color", "position")


def _ensure_unique_name(*, owner: User, name: str, exclude_id: UUID | None = None) -> None:
    queryset = Discipline.objects.filter(owner=owner, name__iexact=name.strip())
    if exclude_id is not None:
        queryset = queryset.exclude(pk=exclude_id)
    if queryset.exists():
        raise ConflictError(
            "Já existe uma disciplina com este nome.",
            code="discipline_name_taken",
            details={"name": ["Já existe uma disciplina com este nome."]},
        )


def create_discipline(*, owner: User, data: dict[str, Any]) -> Discipline:
    name = str(data["name"]).strip()
    _ensure_unique_name(owner=owner, name=name)
    values = {field: data[field] for field in _EDITABLE_FIELDS if field in data}
    values["name"] = name
    if "position" not in values:
        last = Discipline.objects.filter(owner=owner).order_by("-position").first()
        values["position"] = (last.position + 1) if last else 0
    return Discipline.objects.create(owner=owner, **values)


def update_discipline(*, discipline: Discipline, data: dict[str, Any]) -> Discipline:
    if "name" in data:
        data = {**data, "name": str(data["name"]).strip()}
        _ensure_unique_name(owner=discipline.owner, name=data["name"], exclude_id=discipline.pk)
    for field in _EDITABLE_FIELDS:
        if field in data:
            setattr(discipline, field, data[field])
    discipline.save()
    return discipline


def archive_discipline(*, discipline: Discipline) -> Discipline:
    if discipline.archived_at is None:
        discipline.archived_at = clock.now()
        discipline.save(update_fields=["archived_at", "updated_at"])
    return discipline


def unarchive_discipline(*, discipline: Discipline) -> Discipline:
    if discipline.archived_at is not None:
        discipline.archived_at = None
        discipline.save(update_fields=["archived_at", "updated_at"])
    return discipline


@transaction.atomic
def reorder_disciplines(*, owner: User, ids: list[UUID]) -> None:
    if len(set(ids)) != len(ids):
        raise RuleViolationError("A lista de ordenação contém IDs repetidos.", code="duplicate_ids")
    owned = {
        d.pk: d for d in Discipline.objects.select_for_update().filter(owner=owner, pk__in=ids)
    }
    if len(owned) != len(ids):
        raise RuleViolationError(
            "A lista contém disciplinas inexistentes.", code="unknown_discipline"
        )
    for position, discipline_id in enumerate(ids):
        discipline = owned[discipline_id]
        if discipline.position != position:
            discipline.position = position
            discipline.save(update_fields=["position", "updated_at"])


def delete_discipline(*, discipline: Discipline) -> None:
    try:
        with transaction.atomic():
            discipline.delete()
    except ProtectedError as exc:
        raise ConflictError(
            "A disciplina possui registros dependentes (ex.: exercícios). "
            "Arquive-a ou remova os dependentes antes.",
            code="discipline_has_dependents",
        ) from exc

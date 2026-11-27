"""Read-only queries for disciplines."""

from uuid import UUID

from django.db.models import QuerySet

from apps.accounts.models import User
from apps.core.exceptions import NotFoundInScopeError
from apps.disciplines.models import Discipline


def discipline_list(*, owner: User, archived: bool | None = False) -> QuerySet[Discipline]:
    queryset = Discipline.objects.filter(owner=owner)
    if archived is True:
        queryset = queryset.filter(archived_at__isnull=False)
    elif archived is False:
        queryset = queryset.filter(archived_at__isnull=True)
    return queryset


def get_owned_discipline(*, owner: User, discipline_id: UUID) -> Discipline:
    discipline = Discipline.objects.filter(owner=owner, pk=discipline_id).first()
    if discipline is None:
        raise NotFoundInScopeError()
    return discipline

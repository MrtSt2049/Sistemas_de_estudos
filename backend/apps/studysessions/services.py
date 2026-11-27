"""Session lifecycle: server time, one active session, no overlaps (RF067, RF068, RF071)."""

from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

from django.db import transaction
from django.db.models import Q

from apps.accounts.models import User
from apps.core import clock
from apps.core.exceptions import ConflictError, NotFoundInScopeError, RuleViolationError
from apps.curriculum.services import mark_studied
from apps.studysessions.models import StudySession

MAX_SESSION_DURATION = timedelta(hours=24)
_CONTENT_FIELDS = ("activity_kind", "discipline", "topic", "notes", "focus_rating", "energy_rating")


def _lock_owner(owner: User) -> None:
    """Serialize session writes per user so the overlap check cannot race."""
    User.objects.select_for_update().get(pk=owner.pk)


def _with_consistent_topic(
    values: dict[str, Any], instance: StudySession | None = None
) -> dict[str, Any]:
    topic = values.get("topic", instance.topic if instance else None)
    discipline = values.get("discipline", instance.discipline if instance else None)
    if topic is None:
        return values
    if discipline is None:
        return {**values, "discipline": topic.discipline}
    if topic.discipline_id != discipline.pk:
        message = "O tópico pertence a outra disciplina."
        raise RuleViolationError(
            message, code="topic_discipline_mismatch", details={"topic": [message]}
        )
    return values


def _validate_interval(started_at: datetime, ended_at: datetime) -> None:
    if ended_at <= started_at or ended_at - started_at > MAX_SESSION_DURATION:
        message = "O fim deve ser posterior ao início, com no máximo 24 horas de duração."
        raise RuleViolationError(message, code="invalid_interval", details={"ended_at": [message]})
    if ended_at > clock.now():
        message = "O registro manual não pode terminar no futuro."
        raise RuleViolationError(message, code="session_in_future", details={"ended_at": [message]})


def _ensure_no_overlap(
    *, owner: User, started_at: datetime, ended_at: datetime, exclude_id: UUID | None = None
) -> None:
    overlapping = StudySession.objects.filter(owner=owner, started_at__lt=ended_at).filter(
        Q(ended_at__isnull=True) | Q(ended_at__gt=started_at)
    )
    if exclude_id is not None:
        overlapping = overlapping.exclude(pk=exclude_id)
    if overlapping.exists():
        raise ConflictError(
            "O intervalo se sobrepõe a outra sessão registrada.", code="session_overlap"
        )


def get_active_session(*, owner: User) -> StudySession | None:
    return StudySession.objects.filter(owner=owner, ended_at__isnull=True).first()


@transaction.atomic
def start_session(*, owner: User, data: dict[str, Any]) -> StudySession:
    _lock_owner(owner)
    if get_active_session(owner=owner) is not None:
        raise ConflictError("Já existe uma sessão em andamento.", code="active_session_exists")
    values = {field: data[field] for field in _CONTENT_FIELDS if field in data}
    return StudySession.objects.create(
        owner=owner, started_at=clock.now(), **_with_consistent_topic(values)
    )


@transaction.atomic
def finish_active_session(*, owner: User, data: dict[str, Any]) -> StudySession:
    _lock_owner(owner)
    session = get_active_session(owner=owner)
    if session is None:
        raise NotFoundInScopeError("Não há sessão em andamento.")
    for field in ("notes", "focus_rating", "energy_rating"):
        if field in data:
            setattr(session, field, data[field])
    # The database requires ended_at > started_at, even for an instant finish.
    session.ended_at = max(clock.now(), session.started_at + timedelta(microseconds=1))
    session.save()
    if session.topic is not None:
        mark_studied(topic=session.topic, at=session.ended_at)
    return session


@transaction.atomic
def create_manual_session(*, owner: User, data: dict[str, Any]) -> StudySession:
    _lock_owner(owner)
    started_at, ended_at = data["started_at"], data["ended_at"]
    _validate_interval(started_at, ended_at)
    _ensure_no_overlap(owner=owner, started_at=started_at, ended_at=ended_at)
    values = {field: data[field] for field in _CONTENT_FIELDS if field in data}
    session = StudySession.objects.create(
        owner=owner,
        started_at=started_at,
        ended_at=ended_at,
        is_manual=True,
        **_with_consistent_topic(values),
    )
    if session.topic is not None:
        mark_studied(topic=session.topic, at=ended_at)
    return session


@transaction.atomic
def update_session(*, session: StudySession, data: dict[str, Any]) -> StudySession:
    _lock_owner(session.owner)
    values = {field: data[field] for field in _CONTENT_FIELDS if field in data}
    values = _with_consistent_topic(values, session)
    if "started_at" in data or "ended_at" in data:
        if session.ended_at is None:
            raise ConflictError(
                "Encerre a sessão antes de alterar os horários.", code="session_still_active"
            )
        started_at = data.get("started_at", session.started_at)
        ended_at = data.get("ended_at", session.ended_at)
        _validate_interval(started_at, ended_at)
        _ensure_no_overlap(
            owner=session.owner, started_at=started_at, ended_at=ended_at, exclude_id=session.pk
        )
        values |= {"started_at": started_at, "ended_at": ended_at}
    for field, value in values.items():
        setattr(session, field, value)
    session.save()
    return session

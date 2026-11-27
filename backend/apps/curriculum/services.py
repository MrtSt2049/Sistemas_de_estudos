"""Topic hierarchy invariants: same discipline, depth <= 4, no cycles (RF017).

Every structural write locks the discipline row, so concurrent moves cannot
create a cycle or duplicate sibling positions.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from django.db import transaction
from django.db.models import Q

from apps.accounts.models import User
from apps.core.exceptions import RuleViolationError
from apps.curriculum.models import MAX_TOPIC_DEPTH, Topic
from apps.disciplines.models import Discipline

_EDITABLE_FIELDS = ("title", "description", "status")
_ParentMap = dict[UUID, UUID | None]


def _lock_discipline(discipline_id: UUID) -> None:
    Discipline.objects.select_for_update().get(pk=discipline_id)


def _parent_map(discipline_id: UUID) -> _ParentMap:
    return dict(Topic.objects.filter(discipline_id=discipline_id).values_list("pk", "parent_id"))


def _depth(topic_id: UUID | None, parents: _ParentMap) -> int:
    depth = 0
    while topic_id is not None:
        depth += 1
        topic_id = parents[topic_id]
    return depth


def _subtree_height(topic_id: UUID, parents: _ParentMap) -> int:
    children = [child for child, parent in parents.items() if parent == topic_id]
    return 1 + max((_subtree_height(child, parents) for child in children), default=0)


def _is_self_or_descendant(candidate: UUID | None, topic_id: UUID, parents: _ParentMap) -> bool:
    while candidate is not None:
        if candidate == topic_id:
            return True
        candidate = parents[candidate]
    return False


def _ensure_same_discipline(parent: Topic | None, discipline_id: UUID) -> None:
    if parent is not None and parent.discipline_id != discipline_id:
        message = "O tópico pai pertence a outra disciplina."
        raise RuleViolationError(
            message, code="topic_parent_mismatch", details={"parent": [message]}
        )


def _ensure_depth(depth: int) -> None:
    if depth > MAX_TOPIC_DEPTH:
        raise RuleViolationError(
            f"A árvore de tópicos aceita no máximo {MAX_TOPIC_DEPTH} níveis.",
            code="topic_depth_exceeded",
        )


def _siblings(
    discipline_id: UUID, parent_id: UUID | None, exclude: UUID | None = None
) -> list[Topic]:
    queryset = Topic.objects.filter(discipline_id=discipline_id, parent_id=parent_id)
    if exclude is not None:
        queryset = queryset.exclude(pk=exclude)
    return list(queryset.order_by("position", "created_at"))


def _renumber(siblings: list[Topic]) -> None:
    changed = []
    for position, topic in enumerate(siblings):
        if topic.position != position:
            topic.position = position
            changed.append(topic)
    Topic.objects.bulk_update(changed, ["position"])


@transaction.atomic
def create_topic(*, owner: User, data: dict[str, Any]) -> Topic:
    discipline: Discipline = data["discipline"]
    parent: Topic | None = data.get("parent")
    _lock_discipline(discipline.pk)
    _ensure_same_discipline(parent, discipline.pk)
    if parent is not None:
        _ensure_depth(_depth(parent.pk, _parent_map(discipline.pk)) + 1)

    values = {field: data[field] for field in _EDITABLE_FIELDS if field in data}
    return Topic.objects.create(
        owner=owner,
        discipline=discipline,
        parent=parent,
        position=len(_siblings(discipline.pk, parent.pk if parent else None)),
        **values,
    )


def update_topic(*, topic: Topic, data: dict[str, Any]) -> Topic:
    """Edit content only; hierarchy changes go through `move_topic`."""
    changed = [field for field in _EDITABLE_FIELDS if field in data]
    for field in changed:
        setattr(topic, field, data[field])
    topic.save(update_fields=[*changed, "updated_at"])
    return topic


def mark_studied(*, topic: Topic, at: datetime) -> None:
    """Keep the most recent study instant (derived field owned by this app)."""
    Topic.objects.filter(pk=topic.pk).filter(
        Q(last_studied_at__isnull=True) | Q(last_studied_at__lt=at)
    ).update(last_studied_at=at)


@transaction.atomic
def move_topic(*, topic: Topic, parent: Topic | None, position: int) -> Topic:
    _lock_discipline(topic.discipline_id)
    topic.refresh_from_db()
    _ensure_same_discipline(parent, topic.discipline_id)
    parents = _parent_map(topic.discipline_id)
    new_parent_id = parent.pk if parent else None
    if _is_self_or_descendant(new_parent_id, topic.pk, parents):
        raise RuleViolationError(
            "Um tópico não pode ser movido para dentro dele mesmo.", code="topic_cycle"
        )
    _ensure_depth(_depth(new_parent_id, parents) + _subtree_height(topic.pk, parents))

    old_parent_id = topic.parent_id
    target = _siblings(topic.discipline_id, new_parent_id, exclude=topic.pk)
    index = min(position, len(target))
    topic.parent = parent
    topic.position = index
    topic.save(update_fields=["parent", "position", "updated_at"])
    target.insert(index, topic)
    _renumber(target)
    if old_parent_id != new_parent_id:
        _renumber(_siblings(topic.discipline_id, old_parent_id))
    topic.refresh_from_db()
    return topic


@transaction.atomic
def delete_topic(*, topic: Topic) -> None:
    discipline_id, parent_id = topic.discipline_id, topic.parent_id
    _lock_discipline(discipline_id)
    topic.delete()
    _renumber(_siblings(discipline_id, parent_id))

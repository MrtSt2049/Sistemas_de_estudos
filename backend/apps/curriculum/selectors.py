"""Read-only queries for topics."""

from typing import Any
from uuid import UUID

from apps.curriculum.models import Topic
from apps.disciplines.models import Discipline


def topic_tree(*, discipline: Discipline) -> list[dict[str, Any]]:
    """Build the nested tree from a single query."""
    topics = Topic.objects.filter(discipline=discipline).order_by("position", "created_at")
    nodes: dict[UUID, dict[str, Any]] = {t.pk: {"topic": t, "children": []} for t in topics}
    roots: list[dict[str, Any]] = []
    for node in nodes.values():
        parent_id = node["topic"].parent_id
        (nodes[parent_id]["children"] if parent_id else roots).append(node)
    return roots

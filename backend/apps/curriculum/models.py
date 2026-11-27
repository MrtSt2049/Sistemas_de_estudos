"""Hierarchical topics per discipline (RF017)."""

from django.db import models

from apps.core.models import OwnedModel
from apps.disciplines.models import Discipline

MAX_TOPIC_DEPTH = 4


class TopicStatus(models.TextChoices):
    NOT_STARTED = "not_started", "Não iniciado"
    IN_PROGRESS = "in_progress", "Em andamento"
    DONE = "done", "Concluído"


class Topic(OwnedModel):
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE, related_name="topics")
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    position = models.IntegerField(default=0)
    status = models.CharField(
        max_length=15, choices=TopicStatus.choices, default=TopicStatus.NOT_STARTED
    )
    last_studied_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["position", "created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=TopicStatus.values),
                name="ck_curriculum_topic_status_valid",
            ),
        ]
        indexes = [
            models.Index(
                fields=["discipline", "parent", "position"], name="ix_curriculum_topic_tree"
            ),
        ]

    def __str__(self) -> str:
        return self.title

"""Unified review queue with exclusive foreign keys (RF045, RF048, ADR-11)."""

from django.db import models

from apps.core.models import OwnedModel
from apps.curriculum.models import Topic
from apps.exercises.models import Exercise


class ReviewStatus(models.TextChoices):
    ACTIVE = "active", "Ativo"
    SUSPENDED = "suspended", "Suspenso"


class ReviewRating(models.TextChoices):
    AGAIN = "again", "Errei"
    HARD = "hard", "Difícil"
    GOOD = "good", "Bom"
    EASY = "easy", "Fácil"


class ReviewItem(OwnedModel):
    exercise = models.ForeignKey(
        Exercise, on_delete=models.CASCADE, null=True, blank=True, related_name="review_items"
    )
    topic = models.ForeignKey(
        Topic, on_delete=models.CASCADE, null=True, blank=True, related_name="review_items"
    )
    step = models.PositiveSmallIntegerField(default=0)
    due_on = models.DateField()
    status = models.CharField(
        max_length=10, choices=ReviewStatus.choices, default=ReviewStatus.ACTIVE
    )
    last_reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["due_on", "created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(exercise__isnull=False, topic__isnull=True)
                | models.Q(exercise__isnull=True, topic__isnull=False),
                name="ck_reviews_item_exactly_one_target",
            ),
            models.UniqueConstraint(
                fields=["exercise"],
                condition=models.Q(exercise__isnull=False),
                name="uq_reviews_item_exercise",
            ),
            models.UniqueConstraint(
                fields=["topic"],
                condition=models.Q(topic__isnull=False),
                name="uq_reviews_item_topic",
            ),
        ]
        indexes = [
            models.Index(
                fields=["owner", "due_on"],
                condition=models.Q(status="active"),
                name="ix_review_due",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.exercise_id or self.topic_id} · {self.due_on}"


class ReviewLog(OwnedModel):
    item = models.ForeignKey(ReviewItem, on_delete=models.CASCADE, related_name="logs")
    rating = models.CharField(max_length=5, choices=ReviewRating.choices)
    reviewed_at = models.DateTimeField()
    idempotency_key = models.UUIDField()
    step_after = models.PositiveSmallIntegerField()
    due_on_after = models.DateField()

    class Meta:
        ordering = ["-reviewed_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["item", "idempotency_key"], name="uq_reviews_log_item_key"
            ),
        ]
        indexes = [
            models.Index(fields=["item", "-reviewed_at"], name="ix_review_log_item"),
        ]

    def __str__(self) -> str:
        return f"{self.item_id} · {self.rating}"

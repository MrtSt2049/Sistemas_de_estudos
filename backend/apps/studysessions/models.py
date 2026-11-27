"""Study sessions (RF067, RF068, RF071)."""

from django.db import models

from apps.core import clock
from apps.core.models import OwnedModel
from apps.curriculum.models import Topic
from apps.disciplines.models import Discipline


class ActivityKind(models.TextChoices):
    READING = "reading", "Leitura"
    EXERCISES = "exercises", "Exercícios"
    REVIEW = "review", "Revisão"
    CLASS = "class", "Aula"
    MOCK_EXAM = "mock_exam", "Simulado"
    PROJECT = "project", "Projeto"
    PROGRAMMING = "programming", "Programação"


class StudySession(OwnedModel):
    activity_kind = models.CharField(max_length=15, choices=ActivityKind.choices)
    discipline = models.ForeignKey(
        Discipline, on_delete=models.SET_NULL, null=True, blank=True, related_name="sessions"
    )
    topic = models.ForeignKey(
        Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name="sessions"
    )
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    focus_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    energy_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    is_manual = models.BooleanField(default=False)

    class Meta:
        ordering = ["-started_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner"],
                condition=models.Q(ended_at__isnull=True),
                name="uq_studysessions_one_active_per_owner",
            ),
            models.CheckConstraint(
                condition=models.Q(ended_at__isnull=True)
                | models.Q(ended_at__gt=models.F("started_at")),
                name="ck_studysessions_end_after_start",
            ),
            models.CheckConstraint(
                condition=models.Q(focus_rating__isnull=True)
                | models.Q(focus_rating__gte=1, focus_rating__lte=5),
                name="ck_studysessions_focus_range",
            ),
            models.CheckConstraint(
                condition=models.Q(energy_rating__isnull=True)
                | models.Q(energy_rating__gte=1, energy_rating__lte=5),
                name="ck_studysessions_energy_range",
            ),
        ]
        indexes = [
            models.Index(fields=["owner", "-started_at"], name="ix_session_owner_start"),
            models.Index(
                fields=["owner", "discipline", "started_at"], name="ix_session_discipline"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.activity_kind} @ {self.started_at:%Y-%m-%d %H:%M}"

    @property
    def duration_seconds(self) -> int | None:
        if self.ended_at is None:
            return None
        return int((self.ended_at - self.started_at).total_seconds())

    @property
    def elapsed_seconds(self) -> int:
        """Server-side elapsed time, immune to a wrong client clock."""
        end = self.ended_at or clock.now()
        return max(int((end - self.started_at).total_seconds()), 0)

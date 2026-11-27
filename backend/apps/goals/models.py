"""Goals with automatic progress and periodic reviews (RF062, RF063, RF066)."""

from django.db import models

from apps.core.models import OwnedModel
from apps.disciplines.models import Discipline


class GoalScope(models.TextChoices):
    WEEKLY = "weekly", "Semanal"
    MONTHLY = "monthly", "Mensal"
    SEMESTER = "semester", "Semestral"
    YEARLY = "yearly", "Anual"
    CUSTOM = "custom", "Período livre"


class GoalMetric(models.TextChoices):
    STUDY_MINUTES = "study_minutes", "Minutos de estudo"
    SESSIONS_COUNT = "sessions_count", "Sessões de estudo"
    EXERCISES_ATTEMPTED = "exercises_attempted", "Exercícios tentados"
    EXERCISES_SOLVED = "exercises_solved", "Exercícios resolvidos sozinho"
    REVIEWS_DONE = "reviews_done", "Revisões feitas"
    CP_CONTESTS = "cp_contests", "Contests com rating"


class GoalStatus(models.TextChoices):
    ACTIVE = "active", "Ativa"
    DONE = "done", "Concluída"
    ABANDONED = "abandoned", "Abandonada"


class ReviewPeriodKind(models.TextChoices):
    WEEKLY = "weekly", "Semanal"
    MONTHLY = "monthly", "Mensal"


class Goal(OwnedModel):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    scope = models.CharField(max_length=10, choices=GoalScope.choices)
    period_start = models.DateField()
    period_end = models.DateField()
    metric = models.CharField(max_length=25, choices=GoalMetric.choices)
    target_value = models.PositiveIntegerField()
    discipline = models.ForeignKey(
        Discipline, on_delete=models.SET_NULL, null=True, blank=True, related_name="goals"
    )
    status = models.CharField(max_length=12, choices=GoalStatus.choices, default=GoalStatus.ACTIVE)
    # Chave de origem das importações, para que reexecutar não duplique.
    import_key = models.CharField(max_length=100, null=True, blank=True)  # noqa: DJ001

    class Meta:
        ordering = ["period_end", "period_start", "title"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(period_end__gte=models.F("period_start")),
                name="ck_goals_goal_period",
            ),
            models.CheckConstraint(
                condition=models.Q(target_value__gt=0), name="ck_goals_goal_target_positive"
            ),
            models.UniqueConstraint(
                fields=["owner", "import_key"],
                condition=models.Q(import_key__isnull=False),
                name="uq_goals_goal_owner_import_key",
            ),
        ]
        indexes = [
            models.Index(fields=["owner", "status", "period_end"], name="ix_goal_active"),
        ]

    def __str__(self) -> str:
        return self.title


class PeriodicReview(OwnedModel):
    """Only the free text is stored; the numbers are always computed live."""

    kind = models.CharField(max_length=10, choices=ReviewPeriodKind.choices)
    period_start = models.DateField()
    period_end = models.DateField()
    planned_text = models.TextField(blank=True, default="")
    completed_text = models.TextField(blank=True, default="")
    evidence_text = models.TextField(blank=True, default="")
    obstacles_text = models.TextField(blank=True, default="")
    adjustments_text = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-period_start"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "kind", "period_start"], name="uq_goals_review_period"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.kind} {self.period_start}"

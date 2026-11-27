"""Calendar events and weekly plan profiles (RF055–RF058).

Recurrence is weekly for the whole series; per-occurrence exceptions wait for D-10.
"""

from django.db import models

from apps.core.models import OwnedModel
from apps.disciplines.models import Discipline
from apps.studysessions.models import ActivityKind


class EventKind(models.TextChoices):
    CLASS = "class", "Aula"
    EXAM = "exam", "Prova"
    STUDY = "study", "Estudo"
    COMPETITION = "competition", "Competição"
    DEADLINE = "deadline", "Entrega"
    WORKOUT = "workout", "Treino físico"
    PERSONAL = "personal", "Pessoal"


class CalendarEvent(OwnedModel):
    title = models.CharField(max_length=200)
    kind = models.CharField(max_length=15, choices=EventKind.choices)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    all_day = models.BooleanField(default=False)
    description = models.TextField(blank=True, default="")
    location = models.CharField(max_length=200, blank=True, default="")
    discipline = models.ForeignKey(
        Discipline, on_delete=models.SET_NULL, null=True, blank=True, related_name="events"
    )
    recurrence_interval_weeks = models.PositiveSmallIntegerField(null=True, blank=True)
    recurrence_until = models.DateField(null=True, blank=True)
    # Chave de origem de importações e da semana padrão: reexecutar não duplica.
    import_key = models.CharField(max_length=100, null=True, blank=True)  # noqa: DJ001

    class Meta:
        ordering = ["starts_at", "title"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(ends_at__gte=models.F("starts_at")),
                name="ck_planning_event_end",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    recurrence_interval_weeks__isnull=True, recurrence_until__isnull=True
                )
                | models.Q(recurrence_interval_weeks__gte=1, recurrence_until__isnull=False),
                name="ck_planning_event_recurrence",
            ),
            models.UniqueConstraint(
                fields=["owner", "import_key"],
                condition=models.Q(import_key__isnull=False),
                name="uq_planning_event_owner_import_key",
            ),
        ]
        indexes = [
            models.Index(fields=["owner", "starts_at", "ends_at"], name="ix_event_range"),
        ]

    def __str__(self) -> str:
        return self.title


class WeeklyPlanProfile(OwnedModel):
    name = models.CharField(max_length=80)
    is_active = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["owner", "name"], name="uq_planning_profile_name"),
            models.UniqueConstraint(
                fields=["owner"],
                condition=models.Q(is_active=True),
                name="uq_planning_one_active_profile",
            ),
        ]

    def __str__(self) -> str:
        return self.name


class WeeklyPlanBlock(OwnedModel):
    profile = models.ForeignKey(WeeklyPlanProfile, on_delete=models.CASCADE, related_name="blocks")
    weekday = models.PositiveSmallIntegerField()  # 0 = segunda-feira
    start_time = models.TimeField()
    end_time = models.TimeField()
    label = models.CharField(max_length=100)
    activity_kind = models.CharField(max_length=15, choices=ActivityKind.choices)
    discipline = models.ForeignKey(
        Discipline, on_delete=models.SET_NULL, null=True, blank=True, related_name="plan_blocks"
    )

    class Meta:
        ordering = ["weekday", "start_time"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(weekday__lte=6), name="ck_planning_block_weekday"
            ),
            models.CheckConstraint(
                condition=models.Q(end_time__gt=models.F("start_time")),
                name="ck_planning_block_times",
            ),
        ]

    def __str__(self) -> str:
        return self.label

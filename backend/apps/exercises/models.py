"""Exercise sources, error types, exercises and attempts (RF034–RF039).

Reference rows in use are protected with RESTRICT: direct deletion is blocked,
while deleting the owner account still cascades through everything.
"""

from django.db import models
from django.db.models.functions import Lower

from apps.core import clock
from apps.core.models import OwnedModel, Tag
from apps.curriculum.models import Topic
from apps.disciplines.models import Discipline
from apps.studysessions.models import StudySession


class SourceKind(models.TextChoices):
    OLYMPIAD = "olympiad", "Olimpíada"
    COMPETITIVE = "competitive", "Programação competitiva"
    BOOK = "book", "Livro"
    COURSE = "course", "Curso"
    OTHER = "other", "Outra"


class ExerciseState(models.TextChoices):
    NEW = "new", "Novo"
    IN_PROGRESS = "in_progress", "Em andamento"
    SOLVED = "solved", "Resolvido"
    MASTERED = "mastered", "Bem estudado"


class AttemptResult(models.TextChoices):
    SOLVED_ALONE = "solved_alone", "Resolvi sozinho"
    SOLVED_WITH_HINT = "solved_with_hint", "Resolvi com dica"
    PARTIAL = "partial", "Parcial"
    NOT_SOLVED = "not_solved", "Não resolvi"


class ExerciseSource(OwnedModel):
    name = models.CharField(max_length=100)
    kind = models.CharField(max_length=20, choices=SourceKind.choices, default=SourceKind.OTHER)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                "owner", Lower("name"), name="uq_exercises_source_owner_lower_name"
            ),
        ]

    def __str__(self) -> str:
        return self.name


class ErrorType(OwnedModel):
    name = models.CharField(max_length=60)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                "owner", Lower("name"), name="uq_exercises_errortype_owner_lower_name"
            ),
        ]

    def __str__(self) -> str:
        return self.name


class Exercise(OwnedModel):
    discipline = models.ForeignKey(Discipline, on_delete=models.RESTRICT, related_name="exercises")
    topic = models.ForeignKey(
        Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name="exercises"
    )
    source = models.ForeignKey(ExerciseSource, on_delete=models.RESTRICT, related_name="exercises")
    external_ref = models.CharField(max_length=100, null=True, blank=True)  # noqa: DJ001
    title = models.CharField(max_length=200)
    statement_md = models.TextField(blank=True, default="")
    solution_md = models.TextField(blank=True, default="")
    difficulty = models.PositiveSmallIntegerField(null=True, blank=True)
    url = models.URLField(max_length=500, blank=True, default="")
    state = models.CharField(
        max_length=15, choices=ExerciseState.choices, default=ExerciseState.NEW
    )
    mastered_at = models.DateTimeField(null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name="exercises")

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "source", "external_ref"],
                condition=models.Q(external_ref__isnull=False),
                name="uq_exercises_exercise_owner_source_ref",
            ),
            models.CheckConstraint(
                condition=models.Q(difficulty__isnull=True)
                | models.Q(difficulty__gte=1, difficulty__lte=5),
                name="ck_exercises_exercise_difficulty_range",
            ),
            models.CheckConstraint(
                condition=models.Q(state__in=ExerciseState.values),
                name="ck_exercises_exercise_state_valid",
            ),
        ]
        indexes = [
            models.Index(fields=["owner", "discipline", "state"], name="ix_exercise_disc_state"),
            models.Index(fields=["owner", "source"], name="ix_exercise_source"),
            models.Index(fields=["owner", "difficulty"], name="ix_exercise_difficulty"),
        ]

    def __str__(self) -> str:
        return self.title


class Attempt(OwnedModel):
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="attempts")
    study_session = models.ForeignKey(
        StudySession, on_delete=models.SET_NULL, null=True, blank=True, related_name="attempts"
    )
    attempted_at = models.DateTimeField(default=clock.now)
    result = models.CharField(max_length=20, choices=AttemptResult.choices)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    hint_level = models.PositiveSmallIntegerField(default=0)
    dominant_error = models.ForeignKey(
        ErrorType, on_delete=models.RESTRICT, null=True, blank=True, related_name="attempts"
    )
    key_technique = models.CharField(max_length=200, blank=True, default="")
    rewritten = models.BooleanField(default=False)
    notes_md = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-attempted_at", "-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(result__in=AttemptResult.values),
                name="ck_exercises_attempt_result_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(hint_level__lte=3),
                name="ck_exercises_attempt_hint_range",
            ),
        ]
        indexes = [
            models.Index(fields=["owner", "-attempted_at"], name="ix_attempt_owner_date"),
            models.Index(fields=["exercise", "-attempted_at"], name="ix_attempt_exercise_date"),
            models.Index(
                fields=["owner", "dominant_error"],
                condition=models.Q(dominant_error__isnull=False),
                name="ix_attempt_error",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.exercise_id} · {self.result}"

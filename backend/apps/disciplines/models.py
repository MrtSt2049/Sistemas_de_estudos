"""Discipline entity unified by kind (RF013, RF014, RF016, ADR-10)."""

from django.db import models
from django.db.models.functions import Lower

from apps.core.models import OwnedModel


class DisciplineKind(models.TextChoices):
    UNIVERSITY_COURSE = "university_course", "Curso universitário"
    OLYMPIAD = "olympiad", "Olimpíada"
    COMPETITIVE_PROGRAMMING = "competitive_programming", "Programação competitiva"
    SOFTWARE_ENGINEERING = "software_engineering", "Engenharia de software"
    SELF_STUDY = "self_study", "Estudo livre"


class Discipline(OwnedModel):
    name = models.CharField(max_length=150)
    kind = models.CharField(max_length=30, choices=DisciplineKind.choices)
    code = models.CharField(max_length=30, blank=True, default="")
    color = models.CharField(max_length=7, blank=True, default="")
    position = models.IntegerField(default=0)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["position", "name"]
        constraints = [
            models.UniqueConstraint(
                "owner",
                Lower("name"),
                name="uq_disciplines_discipline_owner_lower_name",
            ),
            models.CheckConstraint(
                condition=models.Q(kind__in=DisciplineKind.values),
                name="ck_disciplines_discipline_kind_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(color="") | models.Q(color__regex=r"^#[0-9A-Fa-f]{6}$"),
                name="ck_disciplines_discipline_color_hex",
            ),
        ]

    def __str__(self) -> str:
        return self.name

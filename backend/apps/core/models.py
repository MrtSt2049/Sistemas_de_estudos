"""Shared abstract models and base domain entities (ADR-05, ADR-06)."""

import uuid

from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class OwnedModel(TimeStampedModel):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="%(app_label)s_%(class)s_set",
    )

    class Meta:
        abstract = True


class Tag(OwnedModel):
    name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=60)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "slug"],
                name="uq_core_tag_owner_slug",
            ),
        ]

    def __str__(self) -> str:
        return self.name

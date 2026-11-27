"""Competitive programming data imported from Codeforces (RF078–RF082, ADR-015).

Only the public handle is stored: no credentials of any kind.
"""

from django.db import models

from apps.core.models import OwnedModel


class CpAccount(OwnedModel):
    handle = models.CharField(max_length=24)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["owner"], name="uq_cp_account_owner"),
        ]

    def __str__(self) -> str:
        return self.handle


class CpSubmission(OwnedModel):
    submission_id = models.BigIntegerField()
    contest_id = models.IntegerField(null=True, blank=True)
    problem_index = models.CharField(max_length=10)
    problem_name = models.CharField(max_length=255)
    rating = models.IntegerField(null=True, blank=True)
    tags = models.JSONField(default=list)
    verdict = models.CharField(max_length=40, blank=True, default="")
    programming_language = models.CharField(max_length=80, blank=True, default="")
    submitted_at = models.DateTimeField()

    class Meta:
        ordering = ["-submitted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "submission_id"], name="uq_cp_submission_owner_id"
            ),
        ]
        indexes = [
            models.Index(fields=["owner", "-submitted_at"], name="ix_cp_submission_date"),
        ]

    def __str__(self) -> str:
        return f"{self.submission_id} {self.verdict}"


class CpRatingChange(OwnedModel):
    contest_id = models.IntegerField()
    contest_name = models.CharField(max_length=255)
    rank = models.IntegerField()
    old_rating = models.IntegerField()
    new_rating = models.IntegerField()
    happened_at = models.DateTimeField()

    class Meta:
        ordering = ["happened_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "contest_id"], name="uq_cp_rating_owner_contest"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.contest_name}: {self.new_rating}"

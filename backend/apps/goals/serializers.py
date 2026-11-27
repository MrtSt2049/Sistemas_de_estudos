from typing import Any

from rest_framework import serializers

from apps.core.fields import OwnedPrimaryKeyRelatedField
from apps.disciplines.models import Discipline
from apps.goals import services
from apps.goals.models import Goal, PeriodicReview, ReviewPeriodKind


class GoalSerializer(serializers.ModelSerializer[Goal]):
    discipline = OwnedPrimaryKeyRelatedField(
        queryset=Discipline.objects.all(), required=False, allow_null=True
    )
    discipline_name = serializers.CharField(source="discipline.name", read_only=True, default=None)
    target_value = serializers.IntegerField(min_value=1, max_value=1_000_000)
    current_value = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            "id",
            "title",
            "description",
            "scope",
            "period_start",
            "period_end",
            "metric",
            "target_value",
            "current_value",
            "discipline",
            "discipline_name",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        validators: list[object] = []

    def get_current_value(self, goal: Goal) -> int:
        return services.goal_progress(goal)


class PeriodicReviewSerializer(serializers.ModelSerializer[PeriodicReview]):
    class Meta:
        model = PeriodicReview
        fields = ["id", "kind", "period_start", "period_end", *services.REVIEW_TEXT_FIELDS]
        read_only_fields = ["id", "kind", "period_start", "period_end"]
        validators: list[object] = []


class PeriodNumbersSerializer(serializers.Serializer[Any]):
    study_minutes = serializers.IntegerField()
    sessions_count = serializers.IntegerField()
    exercises_attempted = serializers.IntegerField()
    exercises_solved = serializers.IntegerField()
    reviews_done = serializers.IntegerField()
    cp_contests = serializers.IntegerField()


class ReviewDraftQuerySerializer(serializers.Serializer[dict[str, Any]]):
    kind = serializers.ChoiceField(choices=ReviewPeriodKind.choices, default="weekly")
    date = serializers.DateField(required=False)


class ReviewDraftSerializer(serializers.Serializer[Any]):
    kind = serializers.ChoiceField(choices=ReviewPeriodKind.choices)
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    numbers = PeriodNumbersSerializer()
    goals = GoalSerializer(many=True)
    review = PeriodicReviewSerializer(allow_null=True)


class ReviewSaveSerializer(serializers.Serializer[dict[str, Any]]):
    kind = serializers.ChoiceField(choices=ReviewPeriodKind.choices)
    date = serializers.DateField()
    planned_text = serializers.CharField(required=False, allow_blank=True, max_length=5000)
    completed_text = serializers.CharField(required=False, allow_blank=True, max_length=5000)
    evidence_text = serializers.CharField(required=False, allow_blank=True, max_length=5000)
    obstacles_text = serializers.CharField(required=False, allow_blank=True, max_length=5000)
    adjustments_text = serializers.CharField(required=False, allow_blank=True, max_length=5000)

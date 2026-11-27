from typing import Any

from rest_framework import serializers

from apps.core.fields import OwnedPrimaryKeyRelatedField
from apps.curriculum.models import Topic
from apps.exercises.models import Exercise
from apps.reviews.models import ReviewItem, ReviewRating


class ReviewItemSerializer(serializers.ModelSerializer[ReviewItem]):
    title = serializers.SerializerMethodField()
    discipline_name = serializers.SerializerMethodField()
    statement_md = serializers.SerializerMethodField()
    solution_md = serializers.SerializerMethodField()

    class Meta:
        model = ReviewItem
        fields = [
            "id",
            "exercise",
            "topic",
            "title",
            "discipline_name",
            "statement_md",
            "solution_md",
            "step",
            "due_on",
            "status",
            "last_reviewed_at",
        ]
        read_only_fields = fields

    def get_title(self, item: ReviewItem) -> str:
        target = item.exercise or item.topic
        assert target is not None
        return target.title

    def get_discipline_name(self, item: ReviewItem) -> str:
        target = item.exercise or item.topic
        assert target is not None
        return target.discipline.name

    def get_statement_md(self, item: ReviewItem) -> str:
        if item.exercise:
            return item.exercise.statement_md
        return item.topic.description if item.topic else ""

    def get_solution_md(self, item: ReviewItem) -> str:
        return item.exercise.solution_md if item.exercise else ""


class ReviewQueueSerializer(serializers.Serializer[dict[str, Any]]):
    today = serializers.DateField()
    count = serializers.IntegerField()
    results = ReviewItemSerializer(many=True)


class ReviewAnswerSerializer(serializers.Serializer[dict[str, Any]]):
    rating = serializers.ChoiceField(choices=ReviewRating.choices)
    idempotency_key = serializers.UUIDField()


class ReviewOutcomeSerializer(serializers.Serializer[Any]):
    item = serializers.UUIDField(source="item_id")
    rating = serializers.CharField()
    step = serializers.IntegerField(source="step_after")
    due_on = serializers.DateField(source="due_on_after")


class ReviewScheduleSerializer(serializers.Serializer[dict[str, Any]]):
    exercise = OwnedPrimaryKeyRelatedField(queryset=Exercise.objects.all(), required=False)
    topic = OwnedPrimaryKeyRelatedField(queryset=Topic.objects.all(), required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if len(attrs) != 1:
            raise serializers.ValidationError("Informe exatamente um: exercise ou topic.")
        return attrs

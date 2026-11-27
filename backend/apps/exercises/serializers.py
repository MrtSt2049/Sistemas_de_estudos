from typing import Any

from rest_framework import serializers

from apps.core.fields import OwnedPrimaryKeyRelatedField
from apps.core.models import Tag
from apps.curriculum.models import Topic
from apps.disciplines.models import Discipline
from apps.exercises.models import Attempt, ErrorType, Exercise, ExerciseSource


class ExerciseSourceSerializer(serializers.ModelSerializer[ExerciseSource]):
    class Meta:
        model = ExerciseSource
        fields = ["id", "name", "kind", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
        validators: list[object] = []


class ErrorTypeSerializer(serializers.ModelSerializer[ErrorType]):
    class Meta:
        model = ErrorType
        fields = ["id", "name", "is_default", "created_at", "updated_at"]
        read_only_fields = ["id", "is_default", "created_at", "updated_at"]
        validators: list[object] = []


class ExerciseSerializer(serializers.ModelSerializer[Exercise]):
    discipline = OwnedPrimaryKeyRelatedField(queryset=Discipline.objects.all())
    topic = OwnedPrimaryKeyRelatedField(
        queryset=Topic.objects.all(), required=False, allow_null=True
    )
    # "source" também é um atributo de Field nos stubs do DRF.
    source = OwnedPrimaryKeyRelatedField(  # type: ignore[assignment]
        queryset=ExerciseSource.objects.all()
    )
    tags = OwnedPrimaryKeyRelatedField(queryset=Tag.objects.all(), many=True, required=False)
    external_ref = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
    difficulty = serializers.IntegerField(min_value=1, max_value=5, required=False, allow_null=True)
    discipline_name = serializers.CharField(source="discipline.name", read_only=True)
    source_name = serializers.CharField(source="source.name", read_only=True)
    topic_title = serializers.CharField(source="topic.title", read_only=True, default=None)

    class Meta:
        model = Exercise
        fields = [
            "id",
            "discipline",
            "discipline_name",
            "topic",
            "topic_title",
            "source",
            "source_name",
            "external_ref",
            "title",
            "statement_md",
            "solution_md",
            "difficulty",
            "url",
            "state",
            "mastered_at",
            "tags",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "state", "mastered_at", "created_at", "updated_at"]
        validators: list[object] = []


class AttemptSerializer(serializers.ModelSerializer[Attempt]):
    dominant_error = OwnedPrimaryKeyRelatedField(
        queryset=ErrorType.objects.all(), required=False, allow_null=True
    )
    hint_level = serializers.IntegerField(min_value=0, max_value=3, required=False)
    duration_seconds = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    exercise_title = serializers.CharField(source="exercise.title", read_only=True)
    discipline = serializers.UUIDField(source="exercise.discipline_id", read_only=True)
    dominant_error_name = serializers.CharField(
        source="dominant_error.name", read_only=True, default=None
    )

    class Meta:
        model = Attempt
        fields = [
            "id",
            "exercise",
            "exercise_title",
            "discipline",
            "attempted_at",
            "result",
            "duration_seconds",
            "hint_level",
            "dominant_error",
            "dominant_error_name",
            "key_technique",
            "rewritten",
            "notes_md",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "exercise", "created_at", "updated_at"]


class AttemptRecordedSerializer(serializers.Serializer[dict[str, Any]]):
    attempt = AttemptSerializer()
    exercise_state = serializers.CharField()

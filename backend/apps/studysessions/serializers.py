from typing import Any

from rest_framework import serializers

from apps.core.fields import OwnedPrimaryKeyRelatedField
from apps.curriculum.models import Topic
from apps.disciplines.models import Discipline
from apps.studysessions.models import ActivityKind, StudySession


class _AssociationFields(serializers.Serializer[Any]):
    discipline = OwnedPrimaryKeyRelatedField(
        queryset=Discipline.objects.all(), required=False, allow_null=True
    )
    topic = OwnedPrimaryKeyRelatedField(
        queryset=Topic.objects.all(), required=False, allow_null=True
    )


class _RatingFields(serializers.Serializer[Any]):
    focus_rating = serializers.IntegerField(
        min_value=1, max_value=5, required=False, allow_null=True
    )
    energy_rating = serializers.IntegerField(
        min_value=1, max_value=5, required=False, allow_null=True
    )
    notes = serializers.CharField(required=False, allow_blank=True, max_length=5000)


class StudySessionSerializer(
    _AssociationFields, _RatingFields, serializers.ModelSerializer[StudySession]
):
    started_at = serializers.DateTimeField()
    ended_at = serializers.DateTimeField()
    duration_seconds = serializers.IntegerField(read_only=True, allow_null=True)
    elapsed_seconds = serializers.IntegerField(read_only=True)
    discipline_name = serializers.CharField(source="discipline.name", read_only=True, default=None)
    topic_title = serializers.CharField(source="topic.title", read_only=True, default=None)

    class Meta:
        model = StudySession
        fields = [
            "id",
            "activity_kind",
            "discipline",
            "discipline_name",
            "topic",
            "topic_title",
            "started_at",
            "ended_at",
            "duration_seconds",
            "elapsed_seconds",
            "focus_rating",
            "energy_rating",
            "notes",
            "is_manual",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_manual", "created_at", "updated_at"]


class SessionStartSerializer(_AssociationFields):
    activity_kind = serializers.ChoiceField(choices=ActivityKind.choices)


class SessionFinishSerializer(_RatingFields):
    pass

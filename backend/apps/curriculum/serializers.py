from typing import Any

from rest_framework import serializers

from apps.core.fields import OwnedPrimaryKeyRelatedField
from apps.curriculum.models import Topic
from apps.disciplines.models import Discipline


class TopicSerializer(serializers.ModelSerializer[Topic]):
    discipline = OwnedPrimaryKeyRelatedField(queryset=Discipline.objects.all())
    # "parent" também é um atributo de Field nos stubs do DRF.
    parent = OwnedPrimaryKeyRelatedField(  # type: ignore[assignment]
        queryset=Topic.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Topic
        fields = [
            "id",
            "discipline",
            "parent",
            "title",
            "description",
            "position",
            "status",
            "last_studied_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "position", "last_studied_at", "created_at", "updated_at"]


class TopicMoveSerializer(serializers.Serializer[dict[str, Any]]):
    parent = OwnedPrimaryKeyRelatedField(  # type: ignore[assignment]
        queryset=Topic.objects.all(), required=False, allow_null=True, default=None
    )
    position = serializers.IntegerField(min_value=0)


class TopicTreeQuerySerializer(serializers.Serializer[dict[str, Any]]):
    discipline = serializers.UUIDField()


class TopicNodeSerializer(serializers.Serializer[dict[str, Any]]):
    id = serializers.UUIDField(source="topic.id")
    title = serializers.CharField(source="topic.title")
    description = serializers.CharField(source="topic.description")
    status = serializers.CharField(source="topic.status")
    position = serializers.IntegerField(source="topic.position")
    parent = serializers.UUIDField(source="topic.parent_id", allow_null=True)  # type: ignore[assignment]
    last_studied_at = serializers.DateTimeField(source="topic.last_studied_at", allow_null=True)
    children = serializers.SerializerMethodField()

    def get_children(self, node: dict[str, Any]) -> Any:
        return TopicNodeSerializer(node["children"], many=True).data

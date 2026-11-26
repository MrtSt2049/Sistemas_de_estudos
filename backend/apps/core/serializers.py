from django.utils.text import slugify
from rest_framework import serializers

from apps.core.models import Tag


class TagSerializer(serializers.ModelSerializer[Tag]):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "created_at", "updated_at"]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def create(self, validated_data: dict[str, object]) -> Tag:
        validated_data["slug"] = slugify(str(validated_data["name"]))
        return super().create(validated_data)

    def update(self, instance: Tag, validated_data: dict[str, object]) -> Tag:
        if "name" in validated_data:
            validated_data["slug"] = slugify(str(validated_data["name"]))
        return super().update(instance, validated_data)

from rest_framework import serializers

from apps.disciplines.models import Discipline


class DisciplineSerializer(serializers.ModelSerializer[Discipline]):
    color = serializers.RegexField(
        r"^#[0-9A-Fa-f]{6}$", required=False, allow_blank=True, max_length=7
    )

    class Meta:
        model = Discipline
        fields = [
            "id",
            "name",
            "kind",
            "code",
            "color",
            "position",
            "archived_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "archived_at", "created_at", "updated_at"]
        # Uniqueness is enforced in services/DB (case-insensitive per owner).
        validators: list[object] = []


class ReorderSerializer(serializers.Serializer[dict[str, object]]):
    ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)

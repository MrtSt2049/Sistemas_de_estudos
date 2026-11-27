from typing import Any

from rest_framework import serializers

from apps.core.fields import OwnedPrimaryKeyRelatedField
from apps.disciplines.models import Discipline
from apps.planning.models import CalendarEvent, WeeklyPlanBlock, WeeklyPlanProfile

MAX_RANGE_DAYS = 92


class CalendarEventSerializer(serializers.ModelSerializer[CalendarEvent]):
    discipline = OwnedPrimaryKeyRelatedField(
        queryset=Discipline.objects.all(), required=False, allow_null=True
    )
    recurrence_interval_weeks = serializers.IntegerField(
        min_value=1, max_value=52, required=False, allow_null=True
    )

    class Meta:
        model = CalendarEvent
        fields = [
            "id",
            "title",
            "kind",
            "starts_at",
            "ends_at",
            "all_day",
            "description",
            "location",
            "discipline",
            "recurrence_interval_weeks",
            "recurrence_until",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        validators: list[object] = []


class CalendarRangeSerializer(serializers.Serializer[dict[str, Any]]):
    start = serializers.DateField()
    end = serializers.DateField()

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        days = (attrs["end"] - attrs["start"]).days
        if not 0 <= days <= MAX_RANGE_DAYS:
            raise serializers.ValidationError(f"Informe um intervalo de 1 a {MAX_RANGE_DAYS} dias.")
        return attrs


class CalendarItemSerializer(serializers.Serializer[Any]):
    source = serializers.ChoiceField(choices=["event", "goal"])  # type: ignore[assignment]
    event = serializers.UUIDField(allow_null=True)
    goal = serializers.UUIDField(allow_null=True)
    title = serializers.CharField()
    kind = serializers.CharField()
    starts_at = serializers.DateTimeField()
    ends_at = serializers.DateTimeField()
    all_day = serializers.BooleanField()
    description = serializers.CharField(allow_blank=True)
    discipline_name = serializers.CharField(allow_null=True)
    discipline_color = serializers.CharField(allow_blank=True)
    recurring = serializers.BooleanField()


class WeeklyPlanBlockSerializer(serializers.ModelSerializer[WeeklyPlanBlock]):
    profile = OwnedPrimaryKeyRelatedField(queryset=WeeklyPlanProfile.objects.all())
    discipline = OwnedPrimaryKeyRelatedField(
        queryset=Discipline.objects.all(), required=False, allow_null=True
    )
    weekday = serializers.IntegerField(min_value=0, max_value=6)

    class Meta:
        model = WeeklyPlanBlock
        fields = [
            "id",
            "profile",
            "weekday",
            "start_time",
            "end_time",
            "label",
            "activity_kind",
            "discipline",
        ]
        read_only_fields = ["id"]


class WeeklyPlanProfileSerializer(serializers.ModelSerializer[WeeklyPlanProfile]):
    blocks = WeeklyPlanBlockSerializer(many=True, read_only=True)

    class Meta:
        model = WeeklyPlanProfile
        fields = ["id", "name", "is_active", "blocks"]
        read_only_fields = ["id", "is_active"]
        validators: list[object] = []


class ApplyProfileSerializer(serializers.Serializer[dict[str, Any]]):
    week_start = serializers.DateField()


class ApplyResultSerializer(serializers.Serializer[Any]):
    created = serializers.IntegerField()

from typing import Any

from rest_framework import serializers

from apps.core.fields import OwnedPrimaryKeyRelatedField
from apps.cp.models import CpRatingChange
from apps.disciplines.models import Discipline


class SyncRequestSerializer(serializers.Serializer[dict[str, Any]]):
    handle = serializers.RegexField(
        r"^[A-Za-z0-9_.\-]{1,24}$",
        error_messages={"invalid": "Informe um handle válido do Codeforces."},
    )


class SyncResultSerializer(serializers.Serializer[Any]):
    handle = serializers.CharField()
    new_submissions = serializers.IntegerField()
    total_submissions = serializers.IntegerField()
    rating_changes = serializers.IntegerField()


class RatingChangeSerializer(serializers.ModelSerializer[CpRatingChange]):
    class Meta:
        model = CpRatingChange
        fields = ["contest_id", "contest_name", "rank", "old_rating", "new_rating", "happened_at"]


class RatingBucketSerializer(serializers.Serializer[Any]):
    rating = serializers.IntegerField()
    count = serializers.IntegerField()


class TagBucketSerializer(serializers.Serializer[Any]):
    tag = serializers.CharField()
    count = serializers.IntegerField()


class CpSummarySerializer(serializers.Serializer[Any]):
    handle = serializers.CharField(allow_null=True)
    last_synced_at = serializers.DateTimeField(allow_null=True)
    solved_count = serializers.IntegerField()
    unrated_count = serializers.IntegerField()
    by_rating = RatingBucketSerializer(many=True)
    by_tag = TagBucketSerializer(many=True)
    rating_history = RatingChangeSerializer(many=True)


class UpsolveItemSerializer(serializers.Serializer[Any]):
    contest_id = serializers.IntegerField(allow_null=True)
    problem_index = serializers.CharField()
    problem_name = serializers.CharField()
    rating = serializers.IntegerField(allow_null=True)
    tags = serializers.ListField(child=serializers.CharField())
    attempts = serializers.IntegerField()
    last_attempt_at = serializers.DateTimeField()
    url = serializers.CharField(allow_blank=True)
    exercise = serializers.UUIDField(allow_null=True)


class UpsolvePageSerializer(serializers.Serializer[Any]):
    count = serializers.IntegerField()
    results = UpsolveItemSerializer(many=True)


class UpsolveImportSerializer(serializers.Serializer[dict[str, Any]]):
    contest_id = serializers.IntegerField(min_value=1)
    problem_index = serializers.RegexField(r"^[A-Za-z0-9]{1,10}$")
    discipline = OwnedPrimaryKeyRelatedField(queryset=Discipline.objects.all())


class ImportedExerciseSerializer(serializers.Serializer[Any]):
    exercise = serializers.UUIDField()

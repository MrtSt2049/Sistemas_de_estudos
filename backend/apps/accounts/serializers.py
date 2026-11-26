"""Serializers for authentication, profile, and password management."""

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from rest_framework import serializers

from apps.accounts.models import User, UserProfile


class LoginSerializer(serializers.Serializer[dict[str, str]]):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class RegisterSerializer(serializers.Serializer[dict[str, str]]):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    display_name = serializers.CharField(
        max_length=120, required=False, allow_blank=True, default=""
    )


class ChangePasswordSerializer(serializers.Serializer[dict[str, str]]):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)


class UserProfileSerializer(serializers.ModelSerializer[UserProfile]):
    class Meta:
        model = UserProfile
        fields = [
            "display_name",
            "timezone",
            "locale",
            "theme",
            "daily_study_goal_minutes",
            "week_starts_on",
            "review_intervals_days",
        ]

    def validate_timezone(self, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise serializers.ValidationError("Fuso horário IANA inválido.") from exc
        return value

    def validate_review_intervals_days(self, value: list[int]) -> list[int]:
        if not isinstance(value, list) or not (2 <= len(value) <= 8):
            raise serializers.ValidationError(
                "A escada de revisão deve conter entre 2 e 8 intervalos."
            )
        if any(not isinstance(day, int) or day <= 0 for day in value):
            raise serializers.ValidationError("Todos os intervalos devem ser inteiros positivos.")
        if value != sorted(set(value)):
            raise serializers.ValidationError(
                "Os intervalos devem estar em ordem estritamente crescente."
            )
        return value


class MeSerializer(serializers.ModelSerializer[User]):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ["id", "email", "date_joined", "profile"]
        read_only_fields = ["id", "email", "date_joined"]

    def update(self, instance: User, validated_data: dict[str, object]) -> User:
        profile_data = validated_data.pop("profile", None)
        if isinstance(profile_data, dict):
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            for attr, val in profile_data.items():
                setattr(profile, attr, val)
            profile.save()
        return instance

"""Full JSON export (RF092): every owned model, discovered automatically."""

from typing import Any

from django.apps import apps
from django.core import serializers

from apps.accounts.models import User, UserProfile
from apps.core import clock
from apps.core.models import OwnedModel

SCHEMA_VERSION = 1
_PROFILE_FIELDS = (
    "display_name",
    "timezone",
    "locale",
    "theme",
    "daily_study_goal_minutes",
    "week_starts_on",
    "review_intervals_days",
)


def owned_models() -> list[type[OwnedModel]]:
    """Discovering models means a new module is exported without extra wiring."""
    found = [model for model in apps.get_models() if issubclass(model, OwnedModel)]
    return sorted(found, key=lambda model: model._meta.label_lower)


def export_data(*, owner: User) -> dict[str, Any]:
    profile, _ = UserProfile.objects.get_or_create(user=owner)
    data: dict[str, Any] = {}
    for model in owned_models():
        queryset = model._default_manager.filter(owner=owner).order_by("pk")
        many_to_many = [field.name for field in model._meta.many_to_many]
        if many_to_many:
            queryset = queryset.prefetch_related(*many_to_many)
        data[model._meta.label_lower] = serializers.serialize("python", queryset)
    return {
        "schema_version": SCHEMA_VERSION,
        "exported_at": clock.now(),
        # Nunca inclui o hash da senha nem tokens.
        "account": {
            "id": owner.pk,
            "email": owner.email,
            "date_joined": owner.date_joined,
            "profile": {name: getattr(profile, name) for name in _PROFILE_FIELDS},
        },
        "data": data,
    }

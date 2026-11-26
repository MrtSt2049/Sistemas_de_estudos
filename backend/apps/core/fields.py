"""Serializer field enforcing that referenced objects belong to request.user."""

from typing import Any

from django.db.models import QuerySet
from rest_framework import serializers


class OwnedPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField[Any]):
    """Restrict FK lookups strictly to objects owned by the authenticated user."""

    def get_queryset(self) -> QuerySet[Any]:
        queryset = super().get_queryset()
        if queryset is None:
            raise AssertionError("OwnedPrimaryKeyRelatedField requires a queryset.")
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return queryset.none()
        return queryset.filter(owner=request.user)

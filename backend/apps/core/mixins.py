"""Ownership mixins enforcing strict per-user data isolation (ADR-06, RNF004)."""

from typing import Any

from django.db.models import QuerySet


class OwnedQuerysetMixin:
    """Filter queryset by authenticated user and inject owner on creation."""

    request: Any

    def get_queryset(self) -> QuerySet[Any]:
        queryset: QuerySet[Any] = super().get_queryset()  # type: ignore[misc]
        user = getattr(self.request, "user", None)
        if not user or not user.is_authenticated:
            return queryset.none()
        return queryset.filter(owner=user)

    def perform_create(self, serializer: Any) -> None:
        serializer.save(owner=self.request.user)

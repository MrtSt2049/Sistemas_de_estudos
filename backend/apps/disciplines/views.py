"""Thin HTTP layer for disciplines (RF013, RF014, RF016)."""

from typing import Any

from django.db.models import QuerySet
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.core.mixins import OwnedQuerysetMixin
from apps.disciplines import services
from apps.disciplines.filters import DisciplineFilter
from apps.disciplines.models import Discipline
from apps.disciplines.serializers import DisciplineSerializer, ReorderSerializer


def _parse_archived(raw: str | None) -> bool | None:
    if raw is None or raw == "":
        return False
    if raw.lower() == "all":
        return None
    return raw.lower() in {"1", "true", "yes"}


class DisciplineViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet[Discipline]):
    queryset = Discipline.objects.all()
    serializer_class = DisciplineSerializer
    filterset_class = DisciplineFilter
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    search_fields = ["name", "code"]
    ordering_fields = ["position", "name", "created_at"]

    def get_queryset(self) -> QuerySet[Discipline]:
        queryset = super().get_queryset()
        if self.action == "list":
            archived = _parse_archived(self.request.query_params.get("archived"))
            if archived is True:
                queryset = queryset.filter(archived_at__isnull=False)
            elif archived is False:
                queryset = queryset.filter(archived_at__isnull=True)
        return queryset

    @extend_schema(
        parameters=[
            OpenApiParameter("archived", str, description="false (padrão), true ou all"),
        ]
    )
    def list(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer: Any) -> None:
        assert isinstance(self.request.user, User)
        serializer.instance = services.create_discipline(
            owner=self.request.user, data=serializer.validated_data
        )

    def perform_update(self, serializer: Any) -> None:
        serializer.instance = services.update_discipline(
            discipline=serializer.instance, data=serializer.validated_data
        )

    def perform_destroy(self, instance: Discipline) -> None:
        services.delete_discipline(discipline=instance)

    @extend_schema(request=None, responses={200: DisciplineSerializer})
    @action(detail=True, methods=["post"])
    def archive(self, request: Request, pk: str | None = None) -> Response:
        discipline = services.archive_discipline(discipline=self.get_object())
        return Response(DisciplineSerializer(discipline).data)

    @extend_schema(request=None, responses={200: DisciplineSerializer})
    @action(detail=True, methods=["post"])
    def unarchive(self, request: Request, pk: str | None = None) -> Response:
        discipline = services.unarchive_discipline(discipline=self.get_object())
        return Response(DisciplineSerializer(discipline).data)

    @extend_schema(request=ReorderSerializer, responses={204: None})
    @action(detail=False, methods=["post"])
    def reorder(self, request: Request) -> Response:
        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assert isinstance(request.user, User)
        services.reorder_disciplines(owner=request.user, ids=serializer.validated_data["ids"])
        return Response(status=status.HTTP_204_NO_CONTENT)

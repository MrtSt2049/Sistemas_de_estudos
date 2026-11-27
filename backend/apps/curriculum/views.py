"""Thin HTTP layer for topics (RF017)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.core.mixins import OwnedQuerysetMixin
from apps.curriculum import selectors, services
from apps.curriculum.models import Topic
from apps.curriculum.serializers import (
    TopicMoveSerializer,
    TopicNodeSerializer,
    TopicSerializer,
    TopicTreeQuerySerializer,
)
from apps.disciplines.selectors import get_owned_discipline


class TopicViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet[Topic]):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    filterset_fields = ["discipline", "parent", "status"]
    search_fields = ["title"]
    ordering_fields = ["position", "title", "created_at"]

    def perform_create(self, serializer: Any) -> None:
        assert isinstance(self.request.user, User)
        serializer.instance = services.create_topic(
            owner=self.request.user, data=serializer.validated_data
        )

    def perform_update(self, serializer: Any) -> None:
        serializer.instance = services.update_topic(
            topic=serializer.instance, data=serializer.validated_data
        )

    def perform_destroy(self, instance: Topic) -> None:
        services.delete_topic(topic=instance)

    @extend_schema(
        parameters=[TopicTreeQuerySerializer], responses={200: TopicNodeSerializer(many=True)}
    )
    @action(detail=False, methods=["get"], pagination_class=None, filter_backends=[])
    def tree(self, request: Request) -> Response:
        query = TopicTreeQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        assert isinstance(request.user, User)
        discipline = get_owned_discipline(
            owner=request.user, discipline_id=query.validated_data["discipline"]
        )
        roots = selectors.topic_tree(discipline=discipline)
        return Response(TopicNodeSerializer(roots, many=True).data)  # type: ignore[arg-type]

    @extend_schema(request=TopicMoveSerializer, responses={200: TopicSerializer})
    @action(detail=True, methods=["post"])
    def move(self, request: Request, pk: str | None = None) -> Response:
        topic = self.get_object()
        serializer = TopicMoveSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        moved = services.move_topic(
            topic=topic,
            parent=serializer.validated_data["parent"],
            position=serializer.validated_data["position"],
        )
        return Response(TopicSerializer(moved).data)

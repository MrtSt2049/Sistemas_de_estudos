"""Thin HTTP layer for study sessions."""

from typing import Any

import django_filters
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.core.mixins import OwnedQuerysetMixin
from apps.studysessions import services
from apps.studysessions.models import ActivityKind, StudySession
from apps.studysessions.serializers import (
    SessionFinishSerializer,
    SessionStartSerializer,
    StudySessionSerializer,
)


class StudySessionFilter(django_filters.FilterSet):
    discipline = django_filters.UUIDFilter(field_name="discipline_id")
    topic = django_filters.UUIDFilter(field_name="topic_id")
    activity_kind = django_filters.ChoiceFilter(choices=ActivityKind.choices)
    started_after = django_filters.IsoDateTimeFilter(field_name="started_at", lookup_expr="gte")
    started_before = django_filters.IsoDateTimeFilter(field_name="started_at", lookup_expr="lt")


class StudySessionViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet[StudySession]):
    queryset = StudySession.objects.select_related("discipline", "topic")
    serializer_class = StudySessionSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    filterset_class = StudySessionFilter
    ordering_fields = ["started_at"]

    def _user(self) -> User:
        assert isinstance(self.request.user, User)
        return self.request.user

    def _validated(self, serializer_class: Any) -> dict[str, Any]:
        serializer = serializer_class(data=self.request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        return dict(serializer.validated_data)

    def perform_create(self, serializer: Any) -> None:
        serializer.instance = services.create_manual_session(
            owner=self._user(), data=serializer.validated_data
        )

    def perform_update(self, serializer: Any) -> None:
        serializer.instance = services.update_session(
            session=serializer.instance, data=serializer.validated_data
        )

    @extend_schema(responses={200: StudySessionSerializer, 204: None}, filters=False)
    @action(detail=False, methods=["get"], pagination_class=None, filter_backends=[])
    def active(self, request: Request) -> Response:
        session = services.get_active_session(owner=self._user())
        if session is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(StudySessionSerializer(session).data)

    @extend_schema(request=SessionStartSerializer, responses={201: StudySessionSerializer})
    @action(detail=False, methods=["post"])
    def start(self, request: Request) -> Response:
        session = services.start_session(
            owner=self._user(), data=self._validated(SessionStartSerializer)
        )
        return Response(StudySessionSerializer(session).data, status=status.HTTP_201_CREATED)

    @extend_schema(request=SessionFinishSerializer, responses={200: StudySessionSerializer})
    @action(detail=False, methods=["post"], url_path="active/finish")
    def finish(self, request: Request) -> Response:
        session = services.finish_active_session(
            owner=self._user(), data=self._validated(SessionFinishSerializer)
        )
        return Response(StudySessionSerializer(session).data)

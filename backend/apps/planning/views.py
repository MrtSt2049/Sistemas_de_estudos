"""Thin HTTP layer for the calendar and the weekly plan."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.core.exceptions import ConflictError
from apps.core.mixins import OwnedQuerysetMixin
from apps.planning import selectors, services
from apps.planning.models import CalendarEvent, WeeklyPlanBlock, WeeklyPlanProfile
from apps.planning.serializers import (
    ApplyProfileSerializer,
    ApplyResultSerializer,
    CalendarEventSerializer,
    CalendarItemSerializer,
    CalendarRangeSerializer,
    WeeklyPlanBlockSerializer,
    WeeklyPlanProfileSerializer,
)

_METHODS = ["get", "post", "patch", "delete", "head", "options"]


def _user(request: Request) -> User:
    assert isinstance(request.user, User)
    return request.user


class CalendarEventViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet[CalendarEvent]):
    queryset = CalendarEvent.objects.all()
    serializer_class = CalendarEventSerializer
    http_method_names = _METHODS
    filterset_fields = ["kind", "discipline"]
    search_fields = ["title"]

    def perform_create(self, serializer: Any) -> None:
        serializer.instance = services.create_event(
            owner=_user(self.request), data=serializer.validated_data
        )

    def perform_update(self, serializer: Any) -> None:
        serializer.instance = services.update_event(
            event=serializer.instance, data=serializer.validated_data
        )


class CalendarView(APIView):
    @extend_schema(
        parameters=[CalendarRangeSerializer],
        responses={200: CalendarItemSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        query = CalendarRangeSerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        items = selectors.calendar_items(
            owner=_user(request),
            first=query.validated_data["start"],
            last=query.validated_data["end"],
        )
        return Response(CalendarItemSerializer(items, many=True).data)


class WeeklyPlanProfileViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet[WeeklyPlanProfile]):
    queryset = WeeklyPlanProfile.objects.prefetch_related("blocks")
    serializer_class = WeeklyPlanProfileSerializer
    http_method_names = _METHODS

    def _check_name(self, serializer: Any) -> None:
        name = serializer.validated_data.get("name")
        queryset = WeeklyPlanProfile.objects.filter(owner=_user(self.request), name=name)
        if serializer.instance:
            queryset = queryset.exclude(pk=serializer.instance.pk)
        if name and queryset.exists():
            message = "Já existe um perfil com este nome."
            raise ConflictError(message, code="name_taken", details={"name": [message]})

    def perform_create(self, serializer: Any) -> None:
        self._check_name(serializer)
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer: Any) -> None:
        self._check_name(serializer)
        serializer.save()

    @extend_schema(request=None, responses={200: WeeklyPlanProfileSerializer})
    @action(detail=True, methods=["post"])
    def activate(self, request: Request, pk: str | None = None) -> Response:
        profile = services.activate_profile(profile=self.get_object())
        return Response(WeeklyPlanProfileSerializer(profile).data)

    @extend_schema(request=ApplyProfileSerializer, responses={200: ApplyResultSerializer})
    @action(detail=True, methods=["post"])
    def apply(self, request: Request, pk: str | None = None) -> Response:
        profile = self.get_object()
        serializer = ApplyProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = services.apply_profile(
            profile=profile, week_start=serializer.validated_data["week_start"]
        )
        return Response({"created": created})


class WeeklyPlanBlockViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet[WeeklyPlanBlock]):
    queryset = WeeklyPlanBlock.objects.all()
    serializer_class = WeeklyPlanBlockSerializer
    http_method_names = _METHODS
    filterset_fields = ["profile"]

    def perform_create(self, serializer: Any) -> None:
        serializer.instance = services.save_block(
            owner=_user(self.request), data=serializer.validated_data
        )

    def perform_update(self, serializer: Any) -> None:
        serializer.instance = services.save_block(
            owner=_user(self.request),
            data=serializer.validated_data,
            block=serializer.instance,
        )

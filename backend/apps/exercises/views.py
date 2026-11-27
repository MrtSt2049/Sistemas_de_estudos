"""Thin HTTP layer for exercises (RF034–RF039)."""

from typing import Any

import django_filters
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.core.mixins import OwnedQuerysetMixin
from apps.exercises import services
from apps.exercises.models import (
    Attempt,
    ErrorType,
    Exercise,
    ExerciseSource,
    ExerciseState,
)
from apps.exercises.serializers import (
    AttemptRecordedSerializer,
    AttemptSerializer,
    ErrorTypeSerializer,
    ExerciseSerializer,
    ExerciseSourceSerializer,
)

_METHODS = ["get", "post", "patch", "delete", "head", "options"]


class _NamedReferenceViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet[Any]):
    """Shared behaviour for per-user registries with case-insensitive unique names."""

    http_method_names = _METHODS
    search_fields = ["name"]
    reference_model: type[ExerciseSource] | type[ErrorType]
    ordering_fields = ["name", "created_at"]

    def _check_name(self, serializer: Any) -> None:
        assert isinstance(self.request.user, User)
        name = serializer.validated_data.get("name")
        if name is not None:
            services.ensure_unique_name(
                self.reference_model,
                owner=self.request.user,
                name=name,
                exclude_id=serializer.instance.pk if serializer.instance else None,
            )

    def perform_create(self, serializer: Any) -> None:
        self._check_name(serializer)
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer: Any) -> None:
        self._check_name(serializer)
        serializer.save()

    def perform_destroy(self, instance: Any) -> None:
        services.delete_reference(instance)


class ExerciseSourceViewSet(_NamedReferenceViewSet):
    queryset = ExerciseSource.objects.all()
    reference_model = ExerciseSource
    serializer_class = ExerciseSourceSerializer
    filterset_fields = ["kind"]


class ErrorTypeViewSet(_NamedReferenceViewSet):
    queryset = ErrorType.objects.all()
    reference_model = ErrorType
    serializer_class = ErrorTypeSerializer

    def list(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        assert isinstance(request.user, User)
        services.ensure_default_error_types(owner=request.user)
        return super().list(request, *args, **kwargs)


class ExerciseFilter(django_filters.FilterSet):
    discipline = django_filters.UUIDFilter(field_name="discipline_id")
    topic = django_filters.UUIDFilter(field_name="topic_id")
    source = django_filters.UUIDFilter(field_name="source_id")
    tag = django_filters.UUIDFilter(field_name="tags__id")
    state = django_filters.ChoiceFilter(choices=ExerciseState.choices)
    difficulty = django_filters.NumberFilter()


class ExerciseViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet[Exercise]):
    queryset = Exercise.objects.select_related("discipline", "topic", "source").prefetch_related(
        "tags"
    )
    serializer_class = ExerciseSerializer
    http_method_names = _METHODS
    filterset_class = ExerciseFilter
    search_fields = ["title", "external_ref"]
    ordering_fields = ["created_at", "title", "difficulty", "state", "external_ref"]

    def perform_create(self, serializer: Any) -> None:
        assert isinstance(self.request.user, User)
        serializer.instance = services.create_exercise(
            owner=self.request.user, data=serializer.validated_data
        )

    def perform_update(self, serializer: Any) -> None:
        serializer.instance = services.update_exercise(
            exercise=serializer.instance, data=serializer.validated_data
        )

    @extend_schema(methods=["GET"], responses={200: AttemptSerializer(many=True)}, filters=False)
    @extend_schema(
        methods=["POST"], request=AttemptSerializer, responses={201: AttemptRecordedSerializer}
    )
    @action(detail=True, methods=["get", "post"], filter_backends=[])
    def attempts(self, request: Request, pk: str | None = None) -> Response:
        exercise = self.get_object()
        if request.method == "GET":
            queryset = exercise.attempts.select_related("exercise", "dominant_error")
            # o stub prende o paginador ao model do ViewSet
            page = self.paginate_queryset(queryset)  # type: ignore[arg-type]
            return self.get_paginated_response(AttemptSerializer(page, many=True).data)

        serializer = AttemptSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        assert isinstance(request.user, User)
        attempt = services.record_attempt(
            owner=request.user, exercise=exercise, data=serializer.validated_data
        )
        body = {"attempt": AttemptSerializer(attempt).data, "exercise_state": exercise.state}
        return Response(body, status=status.HTTP_201_CREATED)


class AttemptViewSet(
    OwnedQuerysetMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet[Attempt],
):
    queryset = Attempt.objects.select_related("exercise", "dominant_error")
    serializer_class = AttemptSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]
    filterset_fields = ["exercise", "result"]
    ordering_fields = ["attempted_at"]

    def perform_update(self, serializer: Any) -> None:
        serializer.instance = services.update_attempt(
            attempt=serializer.instance, data=serializer.validated_data
        )

    def perform_destroy(self, instance: Attempt) -> None:
        services.delete_attempt(attempt=instance)

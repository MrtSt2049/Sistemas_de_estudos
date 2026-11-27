"""Thin HTTP layer for the review queue."""

from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.core.mixins import OwnedQuerysetMixin
from apps.reviews import services
from apps.reviews.models import ReviewItem
from apps.reviews.serializers import (
    ReviewAnswerSerializer,
    ReviewItemSerializer,
    ReviewOutcomeSerializer,
    ReviewQueueSerializer,
    ReviewScheduleSerializer,
)

# Uma sessão de revisão trabalha com no máximo este lote; `count` informa o total.
QUEUE_BATCH = 100


class ReviewViewSet(
    OwnedQuerysetMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet[ReviewItem],
):
    queryset = ReviewItem.objects.select_related("exercise__discipline", "topic__discipline")
    serializer_class = ReviewItemSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]
    filterset_fields = ["status"]
    lookup_value_regex = "[0-9a-fA-F-]{36}"

    def _user(self) -> User:
        assert isinstance(self.request.user, User)
        return self.request.user

    @extend_schema(responses={200: ReviewQueueSerializer}, filters=False)
    @action(detail=False, methods=["get"], pagination_class=None, filter_backends=[])
    def queue(self, request: Request) -> Response:
        today, items = services.due_queue(owner=self._user())
        body = {"today": today, "count": items.count(), "results": items[:QUEUE_BATCH]}
        return Response(ReviewQueueSerializer(body).data)

    @extend_schema(request=ReviewAnswerSerializer, responses={200: ReviewOutcomeSerializer})
    @action(detail=True, methods=["post"])
    def answer(self, request: Request, pk: str) -> Response:
        serializer = ReviewAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        log = services.answer_review(
            owner=self._user(),
            item_id=self.get_object().pk,
            rating=serializer.validated_data["rating"],
            key=serializer.validated_data["idempotency_key"],
        )
        return Response(ReviewOutcomeSerializer(log).data)

    @extend_schema(
        request=ReviewScheduleSerializer,
        responses={200: ReviewItemSerializer, 201: ReviewItemSerializer},
    )
    @action(detail=False, methods=["post"])
    def schedule(self, request: Request) -> Response:
        serializer = ReviewScheduleSerializer(
            data=request.data, context=self.get_serializer_context()
        )
        serializer.is_valid(raise_exception=True)
        item, created = services.schedule_on_demand(owner=self._user(), **serializer.validated_data)
        code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(ReviewItemSerializer(item).data, status=code)

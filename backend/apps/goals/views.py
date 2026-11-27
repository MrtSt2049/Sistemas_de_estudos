"""Thin HTTP layer for goals and periodic reviews."""

from typing import Any

import django_filters
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.core.mixins import OwnedQuerysetMixin
from apps.goals import services
from apps.goals.models import Goal, GoalScope, GoalStatus, PeriodicReview
from apps.goals.serializers import (
    GoalSerializer,
    PeriodicReviewSerializer,
    ReviewDraftQuerySerializer,
    ReviewDraftSerializer,
    ReviewSaveSerializer,
)


class GoalFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=GoalStatus.choices)
    scope = django_filters.ChoiceFilter(choices=GoalScope.choices)
    discipline = django_filters.UUIDFilter(field_name="discipline_id")
    active_on = django_filters.DateFilter(method="filter_active_on")

    def filter_active_on(self, queryset: Any, name: str, value: Any) -> Any:
        return queryset.filter(period_start__lte=value, period_end__gte=value)


class GoalViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet[Goal]):
    queryset = Goal.objects.select_related("discipline", "owner__profile")
    serializer_class = GoalSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    filterset_class = GoalFilter
    search_fields = ["title"]
    ordering_fields = ["period_start", "period_end", "title"]

    def perform_create(self, serializer: Any) -> None:
        assert isinstance(self.request.user, User)
        serializer.instance = services.create_goal(
            owner=self.request.user, data=serializer.validated_data
        )

    def perform_update(self, serializer: Any) -> None:
        serializer.instance = services.update_goal(
            goal=serializer.instance, data=serializer.validated_data
        )


class PeriodicReviewViewSet(
    OwnedQuerysetMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet[PeriodicReview],
):
    queryset = PeriodicReview.objects.all()
    serializer_class = PeriodicReviewSerializer
    filterset_fields = ["kind"]


class ReviewDraftView(APIView):
    @extend_schema(parameters=[ReviewDraftQuerySerializer], responses={200: ReviewDraftSerializer})
    def get(self, request: Request) -> Response:
        query = ReviewDraftQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        assert isinstance(request.user, User)
        draft = services.review_draft(
            owner=request.user,
            kind=query.validated_data["kind"],
            day=query.validated_data.get("date"),
        )
        return Response(ReviewDraftSerializer(draft).data)

    @extend_schema(request=ReviewSaveSerializer, responses={200: PeriodicReviewSerializer})
    def post(self, request: Request) -> Response:
        serializer = ReviewSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        assert isinstance(request.user, User)
        review = services.save_review(
            owner=request.user, kind=data.pop("kind"), day=data.pop("date"), texts=data
        )
        return Response(PeriodicReviewSerializer(review).data)

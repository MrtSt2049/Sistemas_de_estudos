"""Thin HTTP layer for competitive programming."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.cp import selectors, services
from apps.cp.serializers import (
    CpSummarySerializer,
    ImportedExerciseSerializer,
    SyncRequestSerializer,
    SyncResultSerializer,
    UpsolveImportSerializer,
    UpsolvePageSerializer,
)

UPSOLVE_LIMIT = 200


class SyncThrottle(UserRateThrottle):
    scope = "cp_sync"
    rate = "6/min"


def _user(request: Request) -> User:
    assert isinstance(request.user, User)
    return request.user


def _validated(serializer_class: Any, request: Request) -> dict[str, Any]:
    serializer = serializer_class(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    return dict(serializer.validated_data)


class SyncView(APIView):
    throttle_classes = [SyncThrottle]

    @extend_schema(request=SyncRequestSerializer, responses={200: SyncResultSerializer})
    def post(self, request: Request) -> Response:
        data = _validated(SyncRequestSerializer, request)
        result = services.sync_account(owner=_user(request), handle=data["handle"])
        return Response(SyncResultSerializer(result).data)


class SummaryView(APIView):
    @extend_schema(responses={200: CpSummarySerializer})
    def get(self, request: Request) -> Response:
        return Response(CpSummarySerializer(selectors.summary(owner=_user(request))).data)


class UpsolvingView(APIView):
    @extend_schema(responses={200: UpsolvePageSerializer})
    def get(self, request: Request) -> Response:
        items = selectors.upsolving(owner=_user(request))
        body = {"count": len(items), "results": items[:UPSOLVE_LIMIT]}
        return Response(UpsolvePageSerializer(body).data)


class UpsolvingImportView(APIView):
    @extend_schema(
        request=UpsolveImportSerializer,
        responses={200: ImportedExerciseSerializer, 201: ImportedExerciseSerializer},
    )
    def post(self, request: Request) -> Response:
        exercise, created = services.import_problem_as_exercise(
            owner=_user(request), **_validated(UpsolveImportSerializer, request)
        )
        code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response({"exercise": str(exercise.pk)}, status=code)

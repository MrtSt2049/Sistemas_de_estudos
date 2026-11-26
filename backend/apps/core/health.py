"""Liveness (/healthz) and readiness (/readyz) endpoints (RNF029)."""

import logging

from django.db import connection
from django.http import HttpRequest, JsonResponse

logger = logging.getLogger(__name__)


def healthz(request: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "ok"})


def readyz(request: HttpRequest) -> JsonResponse:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        logger.exception("Database readiness check failed")
        return JsonResponse({"status": "unavailable"}, status=503)
    return JsonResponse({"status": "ready"})

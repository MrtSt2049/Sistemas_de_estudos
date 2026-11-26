"""Request correlation ID middleware and context variable (RNF029)."""

import contextvars
import logging
import time
import uuid
from collections.abc import Callable

from django.http import HttpRequest, HttpResponse

_request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")
logger = logging.getLogger("apps.core.http")


def get_request_id() -> str:
    return _request_id_var.get()


class RequestIdMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        token = _request_id_var.set(request_id)
        start = time.monotonic()
        try:
            response = self.get_response(request)
            response["X-Request-ID"] = request_id
            duration_ms = round((time.monotonic() - start) * 1000, 2)
            user_id = (
                str(request.user.pk)
                if getattr(request, "user", None) and request.user.is_authenticated
                else None
            )
            logger.info(
                "http_request",
                extra={
                    "method": request.method,
                    "path": request.path,
                    "status": response.status_code,
                    "duration_ms": duration_ms,
                    "user_id": user_id,
                },
            )
            return response
        finally:
            _request_id_var.reset(token)

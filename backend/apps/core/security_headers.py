"""Content-Security-Policy header, enabled per environment (RNF003)."""

from collections.abc import Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponse


class ContentSecurityPolicyMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        policy = getattr(settings, "CONTENT_SECURITY_POLICY", "")
        if policy:
            response.setdefault("Content-Security-Policy", policy)
        return response

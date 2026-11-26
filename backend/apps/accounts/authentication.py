"""Cookie-based JWT authentication with CSRF enforcement (ADR-04, RNF002, RNF003)."""

from typing import Any

from django.conf import settings
from django.http import HttpResponse
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework.authentication import CSRFCheck
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import Token


def _dummy_view(_request: Any, *_args: Any, **_kwargs: Any) -> HttpResponse:
    return HttpResponse()


def enforce_csrf(request: Request) -> None:
    """Enforce Django CSRF validation on cookie-authenticated unsafe requests."""

    def dummy_get_response(_request: Any) -> HttpResponse:
        return HttpResponse()

    check = CSRFCheck(dummy_get_response)
    check.process_request(request)
    reason = check.process_view(request, _dummy_view, (), {})
    if reason:
        raise PermissionDenied(f"CSRF Failed: {reason}")


class CookieJWTAuthentication(JWTAuthentication):
    """Read access JWT from HttpOnly cookie and enforce CSRF on unsafe methods."""

    def authenticate(self, request: Request) -> tuple[Any, Token] | None:
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)
        if not raw_token:
            return None

        try:
            validated_token = self.get_validated_token(raw_token.encode())
        except (InvalidToken, TokenError) as exc:
            raise AuthenticationFailed("Token expirado ou inválido.", code="token_expired") from exc

        if request.method not in ("GET", "HEAD", "OPTIONS", "TRACE"):
            enforce_csrf(request)

        return self.get_user(validated_token), validated_token


class CookieJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "apps.accounts.authentication.CookieJWTAuthentication"
    name = "cookieAuth"

    def get_security_definition(self, auto_schema: Any) -> dict[str, Any]:
        return {
            "type": "apiKey",
            "in": "cookie",
            "name": settings.AUTH_COOKIE_ACCESS,
        }

"""Helpers to attach and clear HttpOnly JWT cookies."""

from datetime import timedelta
from typing import Literal, cast

from django.conf import settings
from rest_framework.response import Response

SameSitePolicy = Literal["Lax", "Strict", "None"]


def _samesite() -> SameSitePolicy:
    return cast(SameSitePolicy, settings.AUTH_COOKIE_SAMESITE)


def set_auth_cookies(response: Response, *, access_token: str, refresh_token: str) -> None:
    access_ttl = cast(timedelta, settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"])
    refresh_ttl = cast(timedelta, settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"])
    access_max_age = int(access_ttl.total_seconds())
    refresh_max_age = int(refresh_ttl.total_seconds())

    response.set_cookie(
        key=settings.AUTH_COOKIE_ACCESS,
        value=access_token,
        max_age=access_max_age,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=_samesite(),
        domain=settings.COOKIE_DOMAIN,
        path="/",
    )
    response.set_cookie(
        key=settings.AUTH_COOKIE_REFRESH,
        value=refresh_token,
        max_age=refresh_max_age,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=_samesite(),
        domain=settings.COOKIE_DOMAIN,
        path="/api/v1/auth/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key=settings.AUTH_COOKIE_ACCESS,
        domain=settings.COOKIE_DOMAIN,
        path="/",
        samesite=_samesite(),
    )
    response.delete_cookie(
        key=settings.AUTH_COOKIE_REFRESH,
        domain=settings.COOKIE_DOMAIN,
        path="/api/v1/auth/",
        samesite=_samesite(),
    )

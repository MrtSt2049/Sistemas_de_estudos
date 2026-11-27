"""Thin HTTP views for cookie-based JWT authentication and user profile (RF088–RF093)."""

import contextlib
from typing import Any

from django.conf import settings
from django.contrib.auth import authenticate
from django.middleware.csrf import get_token
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.authentication import enforce_csrf
from apps.accounts.cookies import clear_auth_cookies, set_auth_cookies
from apps.accounts.models import User, UserProfile
from apps.accounts.serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    MeSerializer,
    RegisterSerializer,
)
from apps.accounts.services import change_user_password, create_user_with_profile


class _CsrfProtectedView(APIView):
    """Anonymous auth endpoints still require the CSRF token.

    DRF exempts its views from Django's CSRF middleware and only enforces it
    during authentication, which these endpoints disable.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def initial(self, request: Request, *args: Any, **kwargs: Any) -> None:
        super().initial(request, *args, **kwargs)
        if request.method not in ("GET", "HEAD", "OPTIONS"):
            enforce_csrf(request)


class CsrfView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        responses={200: {"type": "object", "properties": {"csrfToken": {"type": "string"}}}}
    )
    def get(self, request: Request) -> Response:
        return Response({"csrfToken": get_token(request)})


class LoginView(_CsrfProtectedView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    @extend_schema(request=LoginSerializer, responses={200: MeSerializer})
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request=request,
            username=serializer.validated_data["email"].strip().lower(),
            password=serializer.validated_data["password"],
        )
        if user is None or not isinstance(user, User) or not user.is_active:
            raise AuthenticationFailed("Credenciais inválidas.", code="invalid_credentials")

        UserProfile.objects.get_or_create(user=user)
        refresh = RefreshToken.for_user(user)
        response = Response(MeSerializer(user).data, status=status.HTTP_200_OK)
        set_auth_cookies(
            response, access_token=str(refresh.access_token), refresh_token=str(refresh)
        )
        get_token(request)
        return response


class RefreshView(_CsrfProtectedView):
    @extend_schema(
        request=None,
        responses={200: {"type": "object", "properties": {"status": {"type": "string"}}}},
    )
    def post(self, request: Request) -> Response:
        raw_refresh = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not raw_refresh:
            raise AuthenticationFailed("Sessão expirada.", code="token_expired")

        try:
            old_refresh = RefreshToken(raw_refresh)  # type: ignore[arg-type]
            user_id = old_refresh["user_id"]
            user = User.objects.get(pk=user_id, is_active=True)
            old_refresh.blacklist()
            new_refresh = RefreshToken.for_user(user)
        except (TokenError, User.DoesNotExist) as exc:
            raise AuthenticationFailed("Sessão expirada.", code="token_expired") from exc

        response = Response({"status": "ok"}, status=status.HTTP_200_OK)
        set_auth_cookies(
            response,
            access_token=str(new_refresh.access_token),
            refresh_token=str(new_refresh),
        )
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={204: None})
    def post(self, request: Request) -> Response:
        raw_refresh = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if raw_refresh:
            with contextlib.suppress(TokenError):
                RefreshToken(raw_refresh).blacklist()  # type: ignore[arg-type]
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_auth_cookies(response)
        return response


class RegisterView(_CsrfProtectedView):
    @extend_schema(request=RegisterSerializer, responses={201: MeSerializer})
    def post(self, request: Request) -> Response:
        if not settings.ALLOW_REGISTRATION:
            raise PermissionDenied("Cadastro público desativado.")

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = create_user_with_profile(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            display_name=serializer.validated_data.get("display_name", ""),
        )
        return Response(MeSerializer(user).data, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: MeSerializer})
    def get(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        UserProfile.objects.get_or_create(user=user)
        return Response(MeSerializer(user).data)

    @extend_schema(request=MeSerializer, responses={200: MeSerializer})
    def patch(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        UserProfile.objects.get_or_create(user=user)
        serializer = MeSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer, responses={204: None})
    def post(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        change_user_password(
            user=user,
            current_password=serializer.validated_data["current_password"],
            new_password=serializer.validated_data["new_password"],
        )
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_auth_cookies(response)
        return response

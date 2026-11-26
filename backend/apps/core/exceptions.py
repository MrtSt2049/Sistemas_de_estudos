"""Domain exceptions and unified DRF error envelope (DEVELOPMENT_PLAN §3.4.9)."""

import logging
from typing import Any

from django.db import IntegrityError
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    Throttled,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from apps.core.middleware import get_request_id

logger = logging.getLogger(__name__)


class DomainError(Exception):
    """Base domain exception translated into a standardized API error response."""

    code: str = "domain_error"
    status_code: int = status.HTTP_400_BAD_REQUEST
    default_message: str = "Operação inválida."

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message or self.default_message
        if code is not None:
            self.code = code
        self.details = details or {}
        super().__init__(self.message)


class ConflictError(DomainError):
    code = "conflict"
    status_code = status.HTTP_409_CONFLICT
    default_message = "Conflito com o estado atual do recurso."


class RuleViolationError(DomainError):
    code = "rule_violation"
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = "Regra de negócio violada."


class NotFoundInScopeError(DomainError):
    code = "not_found"
    status_code = status.HTTP_404_NOT_FOUND
    default_message = "Recurso não encontrado."


def _envelope(code: str, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
            "request_id": get_request_id(),
        }
    }


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response:
    if isinstance(exc, DomainError):
        return Response(
            _envelope(exc.code, exc.message, exc.details),
            status=exc.status_code,
        )

    if isinstance(exc, IntegrityError):
        logger.warning("Database integrity error", exc_info=exc)
        return Response(
            _envelope("conflict", "Violação de integridade de dados."),
            status=status.HTTP_409_CONFLICT,
        )

    if isinstance(exc, Http404 | NotFound):
        return Response(
            _envelope("not_found", "Recurso não encontrado."),
            status=status.HTTP_404_NOT_FOUND,
        )

    response = drf_exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled server exception", exc_info=exc)
        return Response(
            _envelope("server_error", "Erro interno do servidor."),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(exc, ValidationError):
        details = (
            response.data
            if isinstance(response.data, dict)
            else {"non_field_errors": response.data}
        )
        return Response(
            _envelope("validation_error", "Dados inválidos.", details),
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, NotAuthenticated):
        return Response(
            _envelope("not_authenticated", "Autenticação obrigatória."),
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if isinstance(exc, AuthenticationFailed):
        detail_code = getattr(exc, "default_code", "authentication_failed")
        code = "token_expired" if "expired" in str(exc).lower() else str(detail_code)
        return Response(
            _envelope(code, "Falha na autenticação."),
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if isinstance(exc, PermissionDenied):
        return Response(
            _envelope("permission_denied", "Permissão negada."),
            status=status.HTTP_403_FORBIDDEN,
        )

    if isinstance(exc, Throttled):
        return Response(
            _envelope("throttled", "Muitas requisições. Tente novamente em instantes."),
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    return Response(
        _envelope("error", "Não foi possível processar a requisição."),
        status=response.status_code,
    )

"""Isolated, read-only client for the public Codeforces API (ADR-015)."""

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

logger = logging.getLogger(__name__)

API_ROOT = "https://codeforces.com/api/"
ALLOWED_METHODS = frozenset({"user.status", "user.rating"})
TIMEOUT_SECONDS = 20
MAX_RESPONSE_BYTES = 30 * 1024 * 1024
# The public API accepts about one request every two seconds.
REQUEST_INTERVAL_SECONDS: float = 2.0


class CodeforcesError(Exception):
    """The API could not be reached or returned something unusable."""


class HandleNotFoundError(CodeforcesError):
    pass


def _read_limited(stream: Any) -> bytes:
    data: bytes = stream.read(MAX_RESPONSE_BYTES + 1)
    if len(data) > MAX_RESPONSE_BYTES:
        raise CodeforcesError("A resposta do Codeforces excede o limite de tamanho.")
    return data


def _decode(data: bytes) -> dict[str, Any]:
    try:
        payload = json.loads(data)
    except ValueError as exc:
        raise CodeforcesError("O Codeforces devolveu uma resposta inválida.") from exc
    if not isinstance(payload, dict):
        raise CodeforcesError("O Codeforces devolveu uma resposta inválida.")
    return payload


def _failure(payload: dict[str, Any]) -> CodeforcesError:
    comment = str(payload.get("comment", ""))
    if "not found" in comment and "handle" in comment:
        return HandleNotFoundError("Handle não encontrado no Codeforces.")
    return CodeforcesError("O Codeforces recusou a consulta.")


def fetch(method: str, params: dict[str, str]) -> list[Any]:
    """GET one allowed method and return its `result` list."""
    if method not in ALLOWED_METHODS:
        raise ValueError(f"Método não autorizado pela ADR-015: {method}")
    url = f"{API_ROOT}{method}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(  # noqa: S310 - fixed https host
        url, headers={"User-Agent": "study-platform"}
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:  # noqa: S310
            payload = _decode(_read_limited(response))
    except urllib.error.HTTPError as exc:
        # Domain failures arrive as HTTP 400 with a JSON body.
        raise _failure(_decode(_read_limited(exc))) from exc
    except (urllib.error.URLError, TimeoutError, ConnectionError) as exc:
        logger.warning("Codeforces request failed: %s", method, exc_info=True)
        raise CodeforcesError("Não foi possível conectar ao Codeforces.") from exc
    if payload.get("status") != "OK":
        raise _failure(payload)
    result = payload.get("result")
    if not isinstance(result, list):
        raise CodeforcesError("O Codeforces devolveu uma resposta inválida.")
    return result

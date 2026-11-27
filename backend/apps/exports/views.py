"""Authenticated downloads of the user's own data."""

import json

from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.core import clock
from apps.exports.data import export_data
from apps.exports.ics import export_ics
from apps.exports.markdown import export_markdown


class ExportThrottle(UserRateThrottle):
    scope = "export"
    rate = "20/min"


def _attachment(content: bytes | str, content_type: str, name: str) -> HttpResponse:
    response = HttpResponse(content, content_type=content_type)
    filename = f"study-platform-{clock.now():%Y%m%d}-{name}"
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response["Cache-Control"] = "private, no-store"
    return response


class _ExportView(APIView):
    throttle_classes = [ExportThrottle]

    def user(self, request: Request) -> User:
        assert isinstance(request.user, User)
        return request.user


class JsonExportView(_ExportView):
    @extend_schema(responses={(200, "application/json"): OpenApiTypes.BINARY})
    def get(self, request: Request) -> HttpResponse:
        payload = export_data(owner=self.user(request))
        content = json.dumps(payload, cls=DjangoJSONEncoder, ensure_ascii=False, indent=2)
        return _attachment(content, "application/json; charset=utf-8", "dados.json")


class MarkdownExportView(_ExportView):
    @extend_schema(responses={(200, "application/zip"): OpenApiTypes.BINARY})
    def get(self, request: Request) -> HttpResponse:
        return _attachment(
            export_markdown(owner=self.user(request)), "application/zip", "markdown.zip"
        )


class IcsExportView(_ExportView):
    @extend_schema(responses={(200, "text/calendar"): OpenApiTypes.BINARY})
    def get(self, request: Request) -> HttpResponse:
        return _attachment(
            export_ics(owner=self.user(request)),
            "text/calendar; charset=utf-8",
            "calendario.ics",
        )

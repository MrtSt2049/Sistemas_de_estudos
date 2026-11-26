"""Logging filter that injects request_id into every structured JSON log record."""

import logging

from apps.core.middleware import get_request_id


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id()
        return True

"""Safe Markdown validator rejecting raw HTML tags (ADR-13, RNF003)."""

import re

from apps.core.exceptions import RuleViolationError

_RAW_HTML_PATTERN = re.compile(
    r"<\s*/?\s*(script|iframe|object|embed|style|link|meta|form|input|button|svg|math|img|a|div|span)\b[^>]*>",
    re.IGNORECASE,
)


def validate_safe_markdown(value: str) -> str:
    """Reject raw HTML tags in Markdown content while preserving LaTeX/KaTeX math."""
    if _RAW_HTML_PATTERN.search(value):
        raise RuleViolationError(
            "HTML bruto não é permitido em conteúdo Markdown.",
            code="unsafe_markdown",
        )
    return value

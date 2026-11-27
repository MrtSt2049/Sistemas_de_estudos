"""Safe Markdown validator rejecting raw HTML tags (ADR-13, RNF003).

Code blocks and math are removed before the check, so `vector<int>` or `$a<b$`
stay valid. The frontend renderer also never interprets raw HTML.
"""

import re

from apps.core.exceptions import RuleViolationError

_LITERAL_SPANS = re.compile(
    r"```.*?```|~~~.*?~~~|`[^`\n]*`|\$\$.*?\$\$|\$(?:\\.|[^$\\\n])+\$",
    re.DOTALL,
)
# `<tag>`, `<tag attr>` or `</tag>`; autolinks such as <https://...> do not match.
_RAW_HTML = re.compile(r"</?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*)?/?>|<!--|<![A-Za-z]")


def validate_safe_markdown(value: str, *, field: str = "content") -> str:
    """Reject raw HTML tags in Markdown content while preserving LaTeX and code."""
    if _RAW_HTML.search(_LITERAL_SPANS.sub(" ", value)):
        message = "HTML bruto não é permitido em conteúdo Markdown."
        raise RuleViolationError(message, code="unsafe_markdown", details={field: [message]})
    return value

"""Production settings with strict security enforcement."""

from .base import *  # noqa: F403

DEBUG = False
ENABLE_API_DOCS = False

SECURE_SSL_REDIRECT = True
# Sondas do contêiner chegam por HTTP, sem passar pelo proxy.
SECURE_REDIRECT_EXEMPT = [r"^healthz$", r"^readyz$"]
CONTENT_SECURITY_POLICY = (
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
    "object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

AUTH_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

if not ALLOWED_HOSTS or ALLOWED_HOSTS == ["localhost", "127.0.0.1"]:  # noqa: F405
    raise ValueError("DJANGO_ALLOWED_HOSTS must be explicitly configured in production.")

"""Automated test settings (never connects to production Supabase)."""

import os

os.environ.setdefault("DJANGO_SECRET_KEY", "test-only-insecure-secret-key-not-for-prod-123456")
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://study_platform:study_platform@localhost:5432/study_platform_test",
)

from .base import *  # noqa: E402, F403

DEBUG = False
AUTH_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False
ENABLE_API_DOCS = True

# Fast password hasher strictly for test suite speed (RNF001 / backend/AGENTS.md §11)
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_THROTTLE_CLASSES": [],
}

LOGGING = {
    **LOGGING,  # noqa: F405
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
}

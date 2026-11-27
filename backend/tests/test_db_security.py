"""Every table in the public schema must have RLS enabled (RNF006, ADR-02)."""

import pytest
from django.db import connection


@pytest.mark.django_db
def test_all_public_tables_have_row_level_security_enabled() -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity"
        )
        unprotected = sorted(row[0] for row in cursor.fetchall())

    assert unprotected == []

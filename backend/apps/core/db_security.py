"""Keep RLS enabled on every public table after each explicit `migrate` (ADR-02, RNF006).

Migration `core.0002` only reaches the tables that exist when it runs. Tables created
by later migrations would be left without RLS, so the same hardening is re-applied
after every `migrate`. It is idempotent and enables RLS without any policy, which
denies access to non-owner roles while leaving the Django (owner) role unaffected.
"""

from typing import Any

from django.db import connections

_ENABLE_MISSING_RLS_SQL = """
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND NOT rowsecurity
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
    END LOOP;
END
$$;
"""


def enable_row_level_security(sender: Any, using: str, **kwargs: Any) -> None:
    connection = connections[using]
    if connection.vendor != "postgresql":
        return
    with connection.cursor() as cursor:
        cursor.execute(_ENABLE_MISSING_RLS_SQL)

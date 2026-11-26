"""Conditional Supabase security migration: enable RLS and revoke anon/authenticated privileges.

Only applies role revocations when Supabase roles (`anon`, `authenticated`) exist,
keeping full compatibility with standard local/CI PostgreSQL (ADR-02, RNF006).
"""

from django.db import migrations

ENABLE_RLS_AND_REVOKE_SQL = """
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
    END LOOP;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
    END IF;
END
$$;
"""


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql=ENABLE_RLS_AND_REVOKE_SQL,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]

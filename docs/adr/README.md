# Architecture Decision Records (ADRs)

Registro oficial das decisões arquiteturais da **Study Platform**, extraídas e mantidas em sincronia com [`DEVELOPMENT_PLAN.md`](../../DEVELOPMENT_PLAN.md) (seções 3.4.12 e 3.15).

| ADR | Título | Status |
|---|---|---|
| [ADR-001](0001-modular-monolith-and-decoupled-frontend.md) | Monólito modular Django + frontend Next.js desacoplado via REST | Aceita |
| [ADR-002](0002-supabase-as-managed-postgresql-only.md) | Supabase exclusivamente como PostgreSQL gerenciado | Aceita |
| [ADR-003](0003-supabase-session-pooler-connection.md) | Conexão via Session Pooler (porta 5432, IPv4) | Aceita |
| [ADR-004](0004-jwt-authentication-in-httponly-cookies.md) | Autenticação própria com SimpleJWT em cookies `HttpOnly` | Aceita |
| [ADR-005](0005-uuid-v4-primary-keys.md) | Chaves primárias UUID v4 | Aceita |
| [ADR-006](0006-owner-isolation-from-day-one.md) | Isolamento de dados por `owner` desde o início | Aceita |
| [ADR-007](0007-service-and-selector-layering.md) | Regras de negócio em `services`, leitura em `selectors`, views finas | Aceita |
| [ADR-008](0008-openapi-contract-and-generated-ts-types.md) | Contrato OpenAPI (`drf-spectacular`) e tipos TS gerados | Aceita |
| [ADR-009](0009-no-celery-or-message-queues.md) | Sem filas assíncronas/Celery; cálculos sob demanda em SQL | Aceita |
| [ADR-010](0010-unified-discipline-entity-with-kind.md) | Entidade única `Discipline` com campo `kind` | Aceita |
| [ADR-011](0011-exclusive-fks-for-review-items.md) | Fila de revisão com FKs exclusivas e `CheckConstraint` | Aceita |
| [ADR-012](0012-django-52-lts-and-python-313.md) | Django 5.2 LTS e Python 3.13 | Aceita |
| [ADR-013](0013-safe-markdown-katex-and-tiptap-json.md) | Markdown seguro + KaTeX e Tiptap JSON para anotações | Aceita |
| [ADR-014](0014-utc-timestamps-and-user-timezone.md) | Timestamps em UTC (`timestamptz`) e dia derivado do fuso do perfil | Aceita |

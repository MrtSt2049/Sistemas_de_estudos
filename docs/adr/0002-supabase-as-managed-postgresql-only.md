# ADR-002: Supabase exclusivamente como PostgreSQL gerenciado

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto
O projeto precisa de PostgreSQL gerenciado sem acoplar a lógica de domínio a recursos proprietários de um provedor BaaS.

## Decisão
Usar o Supabase exclusivamente como banco PostgreSQL gerenciado acessado pelo Django ORM via `DATABASE_URL`. Não usar Supabase Auth, PostgREST/Data API nem `supabase-js`.

## Alternativas descartadas
- Usar Supabase como BaaS completo no frontend (duplicaria autenticação e regras no cliente, violando ADR-001).

## Consequências
Portabilidade total para qualquer PostgreSQL padrão; RLS e revogação de privilégios de `anon`/`authenticated` devem ser aplicados via migração condicional do Django.

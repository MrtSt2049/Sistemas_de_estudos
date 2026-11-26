# ADR-008: Contrato OpenAPI (drf-spectacular) e tipos TypeScript gerados

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto
Tipos mantidos manualmente no frontend tendem a divergir silenciosamente da API Django.

## Decisão
Publicar o esquema OpenAPI 3 via `drf-spectacular` (`/api/schema/`) e gerar `frontend/src/types/api.ts` automaticamente com `openapi-typescript`, validando ausência de divergências no CI.

## Alternativas descartadas
- Manter interfaces TypeScript manualmente.

## Consequências
Contrato único de verdade entre backend e frontend.

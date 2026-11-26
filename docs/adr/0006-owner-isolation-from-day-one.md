# ADR-006: Isolamento de dados por owner desde o início

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto
O sistema começa para um único usuário, mas deve suportar múltiplos usuários no futuro sem reescrita do schema ou da API.

## Decisão
Todo model de negócio herda de `core.models.OwnedModel` (campo `owner` FK para `User`). Todo ViewSet usa `OwnedQuerysetMixin`, toda FK recebida usa `OwnedPrimaryKeyRelatedField`, e objetos de outro usuário retornam `404`.

## Alternativas descartadas
- Modelar sem `owner` inicialmente (custo alto de migração e risco de vazamento futuro).

## Consequências
Segurança por padrão garantida por teste de contrato automatizado com dois usuários.

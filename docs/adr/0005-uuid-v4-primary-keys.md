# ADR-005: Chaves primárias UUID v4

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto
Identificadores sequenciais expostos na API permitem enumeração e dificultam futuras importações ou fusões de dados.

## Decisão
Todas as entidades de domínio utilizam `UUIDField(primary_key=True, default=uuid.uuid4, editable=False)` gerado na aplicação.

## Alternativas descartadas
- `bigint` sequencial (mais compacto, porém previsível).

## Consequências
Maior segurança contra enumeração de recursos e portabilidade em exportações/importações.

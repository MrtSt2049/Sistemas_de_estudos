# ADR-007: Regras de negócio em services, leitura em selectors, views finas

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto
Misturar regras de negócio em views, serializers ou models dificulta testes unitários e favorece duplicação de lógica.

## Decisão
Concentrar operações de escrita e regras de negócio em `services.py` (funções puras/transacionais sem dependência de HTTP), consultas reutilizáveis em `selectors.py`, e manter views finas (≤ 15 linhas por ação).

## Alternativas descartadas
- Fat models ou lógica de negócio em serializers/views.

## Consequências
Alta testabilidade, transações explícitas (`transaction.atomic`) e fronteiras claras entre apps.

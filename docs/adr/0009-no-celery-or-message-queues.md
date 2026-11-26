# ADR-009: Sem filas assíncronas/Celery; cálculos sob demanda em SQL

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto
O volume de dados de uma plataforma pessoal de estudos não exige infraestrutura distribuída de mensageria.

## Decisão
Não introduzir Celery, Redis ou brokers de mensagens. Executar agregações em SQL (`annotate`/`aggregate`) e cálculos sob demanda em serviços síncronos.

## Alternativas descartadas
- Celery + Redis para estatísticas e revisões.

## Consequências
Infraestrutura enxuta, custo reduzido e menor superfície de falhas operacionais.

# ADR-012: Django 5.2 LTS e Python 3.13

- **Status:** Aceita (D-11 e D-13 confirmadas em 2026-11-26)
- **Data:** 2026-11-26

## Contexto
O projeto é de longa duração e precisa de estabilidade de API e atualizações de segurança previsíveis.

## Decisão
Fixar Python 3.13, Django 5.2 LTS (suporte estendido até abril de 2028) e gerenciamento de dependências via `pip` + `requirements/{base,dev,prod}.txt`, com plano de avaliação da LTS 6.2 após estabilização.

## Alternativas descartadas
- Versões não-LTS do Django com ciclo de suporte curto.

## Consequências
Base estável e compatível com `psycopg` v3, DRF e `django-stubs`.

# ADR-011: Fila de revisão com FKs exclusivas e CheckConstraint

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto
A fila unificada de revisão atende flashcards, exercícios e tópicos.

## Decisão
Usar chaves estrangeiras explícitas e opcionais (`flashcard`, `exercise`, `topic`) em `ReviewItem` com `CheckConstraint` no PostgreSQL garantindo exatamente uma FK preenchida.

## Alternativas descartadas
- `GenericForeignKey` do Django (sem integridade referencial no banco).

## Consequências
Integridade referencial real e consultas eficientes com `select_related`.

# ADR-010: Entidade única Discipline com campo kind

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto
O estudante atua em graduação, olimpíadas de matemática, programação competitiva, engenharia de software e estudo livre.

## Decisão
Unificar todas as áreas sob a entidade `Discipline` com campo `kind`, mantendo campos acadêmicos opcionais validados por `CheckConstraint`.

## Alternativas descartadas
- Tabelas separadas por área de estudo (duplicaria relacionamentos com tópicos, exercícios e sessões).

## Consequências
Modelo relacional unificado e estatísticas transversais simples.

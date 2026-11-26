# ADR-014: Timestamps em UTC (timestamptz) e dia derivado do fuso do perfil

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto
Sequências de estudo, metas semanais e revisões diárias quebram facilmente em viradas de dia e mudanças de horário de verão se datas locais forem persistidas sem fuso.

## Decisão
Armazenar todo instante em UTC (`timestamptz`), injetar relógio via `core.clock.now()` e calcular o "dia do usuário" exclusivamente a partir de `UserProfile.timezone`.

## Alternativas descartadas
- Persistir horários locais sem fuso horário.

## Consequências
Cálculos determinísticos e testáveis com `freezegun` e relógio injetável em múltiplos fusos.

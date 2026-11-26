# ADR-001: Monólito modular Django + frontend Next.js desacoplado via REST

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto
A Study Platform atende inicialmente um único usuário, com escopo de 16 módulos acadêmicos e de estudo, exigindo desacoplamento entre interface e regras de negócio.

## Decisão
Adotar um monólito modular em Django + DRF (`/api/v1/`) separado de um frontend Next.js (App Router + TypeScript `strict`), comunicando-se exclusivamente via API REST JSON.

## Alternativas descartadas
- Microsserviços (complexidade operacional sem ganho para a escala do projeto).
- Next.js full-stack acessando o banco diretamente (mistura responsabilidades).

## Consequências
Separação clara de camadas, implantação simples e facilidade de manutenção; exige disciplina de contrato OpenAPI entre backend e frontend.

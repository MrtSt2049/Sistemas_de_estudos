# ADR-013: Markdown seguro + KaTeX e Tiptap JSON para anotações

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto
O sistema armazena enunciados, soluções, flashcards e anotações ricas com fórmulas matemáticas, exigindo proteção contra XSS.

## Decisão
Adotar Markdown seguro (rejeitando HTML bruto) + KaTeX para enunciados, soluções e cartões, e Tiptap armazenado em JSON para anotações ricas (carregado via `dynamic import` no cliente).

## Alternativas descartadas
- Armazenar e renderizar HTML bruto fornecido pelo usuário.

## Consequências
Redução drástica do risco de XSS e portabilidade para exportação em Markdown/LaTeX.

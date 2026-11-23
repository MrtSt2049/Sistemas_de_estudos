# Guia de contribuição

Este guia vale para pessoas e para agentes de programação. A referência técnica oficial é o [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md); em caso de dúvida, ele prevalece. As convenções de fluxo abaixo (ramificação, commits, PR) são **propostas** neste planejamento e podem ser ajustadas por PR.

## Antes de começar

1. Leia o plano, principalmente as seções 3.1.7 (fora do escopo), 3.4 (arquitetura) e 3.11 (qualidade).
2. Toda mudança parte de um **requisito** (`RFxxx`), de um risco ou de uma decisão (`D-xx`). Se não existe, proponha alterar o plano primeiro.
3. **Nunca** adicione funcionalidade de inteligência artificial (chatbots, agentes, RAG, geração por LLM).
4. Não invente comandos, portas, variáveis ou configurações: o que não está definido no plano é "pendente de definição" e deve virar uma decisão registrada.

## Ambiente

Veja o `README.md` (seções 8 a 15). Resumo: Docker Compose para subir tudo, ou execução local de backend e frontend. Testes nunca usam o banco de produção do Supabase.

## Fluxo de trabalho

1. Crie uma *branch* curta a partir da principal: `feat/rf037-registrar-tentativa`, `fix/...`, `docs/...`, `chore/...`.
2. Faça mudanças pequenas e verificáveis (um PR = uma intenção).
3. Escreva os testes **junto** com o código; o critério de aceitação do requisito deve estar coberto.
4. Rode localmente: lint, formatação, tipos e testes (README, seção 15).
5. Abra o *pull request* e preencha o checklist abaixo.
6. O merge exige CI verde e revisão. Prefira *squash merge* com a mensagem no formato abaixo.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/pt-br/): `tipo(escopo): descrição no imperativo`.

Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`. Escopo = módulo (ex.: `exercises`, `reviews`, `frontend`). Cite o requisito no corpo quando existir (`Refs: RF037`).

## Padrões de código

**Backend (Python/Django)**
- Tipos em todas as funções públicas; `ruff` e `mypy` limpos.
- Regra de negócio em `services.py`, leitura em `selectors.py`, views finas; **todo** queryset filtrado por `owner` (use `OwnedQuerysetMixin`).
- Restrições de integridade também no banco (`CheckConstraint`, `UniqueConstraint`).
- Nunca registrar senha, token ou conteúdo de notas em log.
- Dependência nova exige justificativa no PR.

**Frontend (Next.js/TypeScript)**
- `strict` ligado; sem `any` sem comentário justificando.
- Tipos da API **gerados** do OpenAPI; não editar `types/api.ts` à mão.
- Chamadas à API somente em `features/<módulo>/api.ts` via `lib/api-client.ts`.
- Todo componente de dados cobre os estados de carregamento, vazio, erro e sucesso.
- Estilos somente por tokens do design system; sem valores soltos de cor ou espaçamento.

## Banco de dados e migrações

- Alterações de schema **somente** por migrações do Django; nunca pelo painel do Supabase.
- Revise o SQL (`sqlmigrate`) e descreva o impacto no PR.
- Remoções de coluna/tabela em duas etapas (primeiro o código deixa de usar, depois a migração).
- Migrações não rodam automaticamente ao iniciar contêineres.

## Checklist do pull request

- [ ] O requisito (`RFxxx`) está citado e os critérios de aceitação estão cobertos por testes.
- [ ] Migração revisada e segura (ou "sem migração").
- [ ] Todo queryset filtra por `owner`; referências a outros recursos validam a posse.
- [ ] Regra de negócio em `services`; view fina.
- [ ] Interface com estados de carregamento, vazio, erro e sucesso; funciona de 390 a 1440 px nos dois temas.
- [ ] Acessibilidade: foco, teclado, rótulos, contraste.
- [ ] Sem segredos, dados pessoais ou logs sensíveis.
- [ ] Dependência nova justificada (ou nenhuma).
- [ ] Documentação atualizada (`DEVELOPMENT_PLAN.md`, `docs/`, ADR, `CHANGELOG.md`).

## Decisões arquiteturais

Decisões relevantes viram um ADR curto em `docs/adr/` (contexto, decisão, alternativas, consequências). Decisões ainda abertas estão na seção 3.15 do plano.

## Atualização dos documentos

Os arquivos de `docs/` são extraídos do `DEVELOPMENT_PLAN.md`. Altere o plano primeiro e replique no arquivo de `docs/` no **mesmo** pull request, para não divergirem.

## Segurança

Não abra *issue* pública com vulnerabilidade ou segredo vazado. Revogue a credencial exposta imediatamente e avise o responsável pelo projeto.

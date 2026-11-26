# Plano de implementação — Fechamento da F0 e Fase F1 (Núcleo de estudo)

> Gerado em 26/11/2026 a partir de `DEVELOPMENT_PLAN.md`, `docs/ROADMAP.md` e do estado do repositório.
> Metodologia obrigatória: **TDD (Red → Green → Refactor)**. Nenhum código de produção sem um teste que falhou antes.
> Referência oficial em caso de conflito: `DEVELOPMENT_PLAN.md`.

## 1. Diagnóstico do estado atual

| Item | Estado |
|---|---|
| Git | 2 commits; **todo o esqueleto da F0 está não versionado** (`backend/apps`, `config`, `frontend/src`, CI, ADRs, Dockerfiles) |
| Backend | Django 5.2 + DRF; apps `core` (OwnedModel, mixins, health, logs, markdown, clock) e `accounts` (User, JWT em cookies) |
| Testes backend | `test_health`, `test_auth`, `test_isolation_contract` — **não executáveis agora**: Docker parado e `pytest` fica bloqueado aguardando o PostgreSQL |
| Frontend | Next.js App Router, login, shell, `api-client`, 1 teste Vitest (`errors.test.ts`) |
| Pendências F0 (roadmap) | CI verde comprovado, migração aplicada no Supabase Dev, design system aprovado, README com comandos validados, teste de contrato "falha de propósito → passa" |

## 2. Etapa 0 — Fechar a F0 (pré-requisito, bloqueante)

1. Subir `local-db` (`docker compose --profile local-db up -d`) e rodar `pytest`, `ruff`, `mypy`, `lint-imports`, `npm run lint`, `npm run typecheck`, `npx vitest run`. Registrar resultados; corrigir falhas via TDD (systematic-debugging).
2. Adicionar `timeout` de conexão no `DATABASE_URL`/settings de teste para o pytest **falhar rápido** em vez de travar sem banco (teste primeiro: `readyz` retorna 503 sem DB).
3. Commitar a F0 em blocos lógicos numa branch `feat/f0-foundation` (ignorar `.env`, `.venv`, caches — conferir `.gitignore`).
4. Validar CI no GitHub, aplicar migrações no Supabase Dev, registrar aprovação do design system e validar comandos do README.
5. Demonstrar o teste de contrato: introduzir vazamento proposital num endpoint de exemplo → teste vermelho → corrigir → verde.

**Critério:** checklist 3.14.1 da F0 completo. Só então iniciar a F1.

## 3. Fase F1 — ordem das fatias (cada fatia = 1 PR, backend → frontend)

A ordem respeita dependências de FK: `disciplines` → `curriculum` → `exercises` → `studysessions` → `analytics`.

### Fatia 1 — `disciplines` (RF013, RF014, RF016)
**Testes primeiro (`apps/disciplines/tests/`):**
- `test_models`: unicidade `(owner, lower(name))`; `kind` restrito; `color` hex válido.
- `test_services`: `archive`/`unarchive` definem/limpam `archived_at` via `clock` injetado; `reorder(ids)` atômico e rejeita ids de outro usuário; `delete` com dependentes → erro de conflito.
- `test_api`: CRUD; filtro `archived` padrão falso; `search`; `POST /reorder/` → 204; DELETE com exercícios → 409; **isolamento**: usuário B recebe 404 em recurso de A.
**Implementação:** `models`, `services`, `selectors`, `serializers`, `views` (ViewSet + `OwnedQuerysetMixin`), `filters`, migração com índice funcional `lower(name)`.
**Frontend:** `features/disciplines` (api, queries, schemas Zod), lista, formulário, arquivar, reordenação. Testes Vitest para schemas e componentes críticos.

### Fatia 2 — `curriculum` (RF017–RF020)
**Testes primeiro:**
- Profundidade máxima 4 → `400`; pai de outra disciplina → `400`; `move` que cria ciclo → `400`; reordenação atômica (posições contíguas após mover).
- `POST /mastery/` cria `TopicMasteryLog(source=manual)`; nível fora de 0..5 → `400`.
- `GET /topics/tree/` aninhado, sem N+1 (`django_assert_max_num_queries`).
- Isolamento entre usuários em todas as rotas.
**Frontend:** árvore de tópicos (expandir, mover, editar domínio, status).

### Fatia 3 — `exercises` (RF034–RF040)
**Testes primeiro:**
- `ErrorType` padrão criados no primeiro acesso (idempotente).
- `topic` de outra disciplina → `400`; `source+external_ref` duplicado → `409`; fonte/tipo de erro em uso → `409` ao excluir.
- **Máquina de estados** (serviço puro, testes parametrizados): `new` → `in_progress` (tentativa não resolvida) → `solved` (`solved_alone`). `mastered` **fica fora da F1** (D-05 é da F2).
- `POST /exercises/{id}/attempts/` grava tentativa e estado na mesma transação (teste de rollback quando falha).
- Filtros `discipline`, `topic`, `source`, `difficulty`, `state`, `tag`, `search`, `ordering`.
- Markdown: HTML bruto é sanitizado (reutilizar `core/markdown.py`).
**Frontend:** lista com filtros na URL, ficha do exercício, formulário de tentativa, renderizador Markdown + KaTeX (sem `dangerouslySetInnerHTML` de conteúdo não sanitizado).

### Fatia 4 — `studysessions` (RF067–RF071)
**Testes primeiro:**
- Só uma sessão ativa por usuário (índice único parcial); iniciar segunda → `409`.
- Encerrar calcula duração com `clock` falso; atualiza `Topic.last_studied_at`.
- Registro manual com `ended_at < started_at` → `400`; autoavaliação 1..5.
- Associações a disciplina/tópico/exercícios do próprio usuário (`OwnedPrimaryKeyRelatedField`).
- `GET /study-sessions/active/` recupera sessão após recarregar (RF071).
**Frontend:** cronômetro baseado em `started_at` do servidor (não em contador local), registro manual, recuperação da sessão ativa.

### Fatia 5 — `analytics` básico + Configurações (RF001, RF002, RF005, RF089, RF090)
**Testes primeiro:** resumo do dia e indicadores semanais com dados semeados e relógio fixo (fronteira de semana e fuso `America/Sao_Paulo`); orçamento de queries; perfil e troca de senha (já existentes em `accounts` — completar cobertura).
**Frontend:** dashboard com cards e ações rápidas; tela de Configurações (perfil, senha).

### Fatia 6 — Encerramento da F1
- Comando `manage.py seed_dev` (testado: idempotente).
- E2E Playwright dos fluxos (2) e (3) de 3.11.1.
- Medição de RNF010/RNF011 nas listagens e no dashboard.
- Regenerar tipos do OpenAPI no frontend; atualizar `docs/API.md`, `CHANGELOG.md`; tag `0.1.0`.
- **Uso real por 7 dias** sem perda de dados.

## 4. Ciclo TDD por tarefa (padrão)

1. Escrever 1 teste do comportamento → `pytest apps/<app>/tests/test_x.py::test_y` → **ver falhar pelo motivo certo**.
2. Código mínimo → ver passar.
3. Refatorar mantendo verde.
4. Antes do PR: suíte completa (`pytest`, `vitest`), `ruff`, `mypy`, `lint-imports`, `eslint`, `tsc`. Reportar qualquer falha pelo nome.

## 5. Riscos e decisões

- **Bloqueio imediato:** Docker Desktop parado → testes do backend não rodam.
- **D-05** (estado `mastered`) e **D-04** (algoritmo de revisão) pertencem à F2; não antecipar.
- **D-12** (plano do Supabase / backups) deve ser verificada **antes da F1**, conforme o plano.
- Regras de negócio (estado do exercício, duração da sessão, agregados) ficam só no backend; o frontend valida apenas formato.

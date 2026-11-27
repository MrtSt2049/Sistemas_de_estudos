# Plano de implantação pragmático — Do esqueleto F0 ao uso diário real e produção

> Gerado em 27/11/2026 para equilibrar excelência de engenharia com entrega rápida (teto de **4–6 h/semana**, sem competir com OBMU e Maratona).
> Metodologia obrigatória: **TDD (Red → Green → Refactor)** + **commits contínuos, pequenos e atômicos na conta pessoal do proprietário**.
> Referência técnica: `DEVELOPMENT_PLAN.md` (atualizar explicitamente quando uma decisão de escopo for revisada, como a API do Codeforces).

---

## 0. Regra obrigatória de Git e commits contínuos (ler antes de cada sessão)

**Nunca acumular código sem versionar.** Cada bloco/fatia concluído e validado gera **1 commit pequeno e atômico** (Conventional Commits) na conta pessoal do proprietário.

### Verificação obrigatória antes de commitar ou fazer push
```bash
git config user.name          # deve ser: Marcus Rafael
git config user.email         # deve ser: marcusrafaelmarquini@gmail.com
git remote -v                 # conferir repositório pessoal
gh auth status                # conferir conta GitHub pessoal autenticada
git check-ignore -v backend/.env frontend/.env.local  # garantir .env ignorados
```

### Regras absolutas de autoria
- **Sempre commitar exclusivamente na conta pessoal do proprietário** (`Marcus Rafael <marcusrafaelmarquini@gmail.com>`).
- **Nunca** atribuir autoria ou `Co-authored-by` a ferramentas de IA ou contas de terceiros.
- **Nunca** usar `git add .` às cegas — adicionar caminhos explícitos (`git add <arquivos>`) e revisar `git diff --cached` antes de commitar.
- **Nunca** executar `git push --force`, `git reset --hard`, `git commit --amend` ou `git rebase` sem autorização explícita.
- Trabalhar em branches curtas (`feat/*`, `fix/*`, `docs/*`, `chore/*`) e fazer merge na `main` com CI verde.

---

## 1. Diagnóstico honesto do estado atual

| Área | Situação real em 27/11/2026 | Ação imediata |
|---|---|---|
| **Engenharia (F0)** | Backend Django 5.2 + DRF (`core`, `accounts`, JWT em cookies `HttpOnly`, isolamento por `owner`, healthchecks, logs JSON), frontend Next.js (login + tema claro/escuro), 14 ADRs, Docker e CI estruturados | Validar com Docker/Postgres e **commitar em blocos lógicos** |
| **README.md** | Desatualizado: ainda diz *"Nenhum código de aplicação foi escrito ainda"* | Atualizar para refletir F0 pronta e comandos reais validados |
| **Segredos (`.env`)** | `backend/.env` e `frontend/.env.local` existem localmente; ambos **ignorados** pelo `.gitignore` (linhas 6–7) e não rastreados | Manter verificação em todo commit (`git status` + `git diff --cached`) |
| **Dados reais** | `Plano/banco-provas-obmu.csv` (25 provas, 2001–2025), `calendario-mestre.csv` e Protocolo 2027 vivem fora da plataforma | Importar `banco-provas-obmu.csv` como seed real já na F1 enxuta |
| **Obsidian vs. `Plano/`** | Versões do protocolo já divergem entre `Plano/` e o Obsidian Vault | Definir 1 fonte da verdade antes de absorver calendário/metas |
| **Risco principal** | `DEVELOPMENT_PLAN.md` de 164 KB com 16 módulos e **0 módulos de estudo em uso** | Cortar a F1 para ~3 semanas e medir sucesso por **uso diário real** |

---

## 2. Etapa 0 — Higiene, fechamento da F0 e primeiros commits (Semana 1)

Objetivo: sair do estado "código não versionado + README defasado" para **repositório limpo, CI verde e F0 commitada na conta pessoal**.

1. **Conferir proteção de segredos e identidade Git** (`git check-ignore`, `git config user.name/email`, `gh auth status`).
2. **Atualizar `README.md`** removendo o aviso de "nenhum código escrito" e registrando os comandos já validados da F0.
3. **Subir PostgreSQL local** (`docker compose --profile local-db up -d`) e executar a bateria completa: `pytest`, `ruff check .`, `ruff format --check .`, `mypy .`, `lint-imports`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
4. **Commitar a F0 em blocos lógicos na conta `Marcus Rafael`** (em branch `feat/f0-foundation`):
   - `chore(repo): add gitignore, editorconfig, pre-commit and adrs`
   - `feat(backend): bootstrap django 5.2 core, accounts jwt cookies and rls migration`
   - `feat(frontend): bootstrap nextjs app router, voltage theme and login flow`
   - `ci(docker): add multi-stage dockerfiles, compose config and github actions`
   - `docs(readme): sync phase 0 status and validated local commands`
5. **Validar CI verde no GitHub** e aplicar migrações no Supabase Dev (`python manage.py migrate`).

**Critério de saída:** `git status` limpo, CI verde no GitHub, F0 commitada na sua conta e login funcionando contra PostgreSQL real.

---

## 3. F1 Enxuta — Núcleo diário para treinar OBMU (~3 semanas)

> **Corte intencional de escopo:** os demais requisitos dos 24 previstos originalmente na F1 ficam para depois. Entram **somente** as 3 peças necessárias para usar a plataforma todos os dias na OBMU + os dados reais do CSV.

### Fatia 1.1 — Disciplinas e Tópicos (`RF013`, `RF017`)
- **Testes primeiro:** CRUD de `Discipline` (unicidade `(owner, lower(name))`, `kind`) e árvore de `Topic` (profundidade máx. 4, sem ciclos, isolamento 404 entre usuários).
- **Entrega:** backend + tela simples de cadastro/listagem + árvore de tópicos.
- **Commit (sua conta):** `feat(disciplines): add disciplines and hierarchical topics crud`

### Fatia 1.2 — Exercícios, Tentativas e Tipo de Erro (`RF034`–`RF039`)
- **Testes primeiro:** `ExerciseSource`, `ErrorType` padrão idempotente, `Exercise` (estados `new` → `in_progress` → `solved`), `Attempt` atualizando estado na mesma transação (`transaction.atomic`), Markdown seguro + KaTeX.
- **Entrega:** lista com filtros, ficha do exercício e registro de tentativa em ≤ 30 s.
- **Commit (sua conta):** `feat(exercises): add exercises, attempts and error types`

### Fatia 1.3 — Cronômetro de Sessão (`RF067`, `RF068`, `RF071`)
- **Testes primeiro:** índice único parcial garantindo 1 sessão ativa por usuário (`409` na segunda), duração calculada pelo servidor (`clock.now()`), registro manual, recuperação após reload (`GET /study-sessions/active/`).
- **Entrega:** cronômetro no topo da interface (iniciar em ≤ 2 cliques) + registro manual.
- **Commit (sua conta):** `feat(sessions): add study session timer and manual logging`

### Fatia 1.4 — Seed com dados reais (`Plano/banco-provas-obmu.csv`)
- **Testes primeiro:** comando `manage.py seed_obmu` idempotente lendo `Ano, Formato, Uso planejado, Status, Nota (/300), Observação` de `banco-provas-obmu.csv` sem duplicar fontes ou registros ao rodar duas vezes.
- **Entrega:** banco povoado com as 25 provas da OBMU (2001–2025) prontas para uso real.
- **Commit (sua conta):** `feat(exercises): add idempotent seed command for obmu csv`

**Meta da F1 (obrigatória antes de abrir a F2):** **uso real por 7 dias consecutivos** treinando OBMU na plataforma, sem perda de dados. Tag: `v0.1.0`.

---

## 4. F2 Antecipada — Caderno de Erros + Revisão Espaçada Automática (~2–3 semanas)

> **Diferencial real frente ao Notion:** problema não resolvido ou resolvido com dica/erro **volta automaticamente** em **D+3, D+7, D+21**, executando o protocolo *"retomar problemas não resolvidos"*.

### Fatia 2.1 — Caderno de Erros (`RF042`)
- **Testes primeiro:** listagem de tentativas com erro dominante filtrada por disciplina/tipo de erro, registro de técnica-chave e flag de reescrita limpa (`rewritten`).
- **Commit (sua conta):** `feat(exercises): add error notebook view and rewrite tracking`

### Fatia 2.2 — Motor de Revisão Espaçada (`RF045`, `RF046`, `RF048`)
- **Testes primeiro:** função pura de agendamento com escada configurável (padrão inicial **D+3, D+7, D+21** para exercícios com erro; testes de virada de dia em `America/Sao_Paulo`), criação automática de `ReviewItem` ao registrar tentativa não resolvida sozinho, resposta idempotente (`Errei / Difícil / Bom / Fácil`) e atalhos de teclado `1–4`.
- **Entrega:** fila diária de revisão no topo do dashboard + sessão rápida de revisão.
- **Commit (sua conta):** `feat(reviews): add automatic spaced repetition queue (D+3, D+7, D+21)`

**Meta da F2 (MVP pessoal):** **14 dias de uso diário real** com a fila de revisão em dia + 1 backup lógico restaurado localmente. Tag: `v0.2.0`.

---

## 5. F3 Diferencial de Portfólio — Programação Competitiva + API do Codeforces (~2–3 semanas)

> **Revisão formal de escopo necessária:** a seção `3.1.7` de `DEVELOPMENT_PLAN.md` atualmente proíbe integração automática com Codeforces. Antes de codificar, registrar uma **ADR-015** aprovando o consumo somente-leitura da API pública do Codeforces (sem credenciais, acionado sob demanda pelo usuário — sem Celery/filas).

### Fatia 3.1 — Modelo Competitivo + Sincronização Codeforces (`RF078`–`RF082`)
- **Testes primeiro:** cliente HTTP isolado com respostas mockadas (sem rede nos testes), mapeamento de `user.status` (submissões) e `user.rating` (histórico de rating) para exercícios/contests do usuário, importação idempotente por `submission_id`, lista automática de **upsolving** para problemas tentados e não aceitos.
- **Entrega:** botão "Sincronizar Codeforces", gráficos de resolvidos por rating/tag e fila de upsolving integrada ao caderno de erros.
- **Commit (sua conta):**
  - `docs(adr): approve read-only codeforces api integration (ADR-015)`
  - `feat(cp): add codeforces sync, rating history and upsolving list`

**Meta da F3:** uso real no treino da Maratona SBC sem digitação manual de submissões. Tag: `v0.3.0`.

---

## 6. F4 Unificação do Planejamento — Fonte Única da Verdade

1. **Decisão operacional (fora do código):** congelar um dos dois repositórios de notas (`Plano/` **ou** Obsidian Vault) como fonte única e arquivar o espelho divergente.
2. **Absorção gradual na plataforma:**
   - Importar `Plano/calendario-mestre.csv` para o módulo de planejamento/calendário (`RF055`–`RF059`).
   - Implementar metas com progresso automático (`RF062`, `RF063`, `RF066` — revisão semanal de domingo pré-preenchida com os números reais da semana).
- **Commits (sua conta):**
  - `feat(goals): add automatic goal progress and weekly review`
  - `feat(planning): add calendar and master schedule csv import`

Tag: `v0.4.0`.

---

## 7. F5 Produção, Endurecimento e Avaliação Multiusuário (`v1.0.0`)

Executar o runbook detalhado em [F5-implantacao-e-endurecimento.md](F5-implantacao-e-endurecimento.md):
- Definir `D-07` (hospedagem sob mesmo domínio registrável para cookies `HttpOnly; SameSite=Lax`).
- Exportação completa JSON/Markdown/ICS (`RF033`, `RF061`, `RF092`) + `scripts/backup_db.sh` com **restauração testada**.
- Auditoria OWASP (`manage.py check --deploy`), cabeçalhos HSTS/CSP, `axe`/WCAG 2.2 AA e medição de latência.
- **Potencial multiusuário (somente após validar o MVP no uso diário):** como o isolamento por `owner` e o teste de contrato já existem desde a F0, abrir acesso controlado (convite ou `ALLOW_REGISTRATION` por período) para colegas da USP, grupos como o **GEMPRO** e potenciais clientes da **OctoBit**.

---

## 8. Checklist rápido de fim de sessão (para nunca travar nem acumular diff)

1. Rodar checks da fatia (`pytest`, `ruff`, `mypy` / `npm run lint`, `typecheck`, `test`).
2. Conferir `git status` e garantir que nenhum `.env` ou arquivo temporário entrou.
3. Confirmar identidade: `git config user.name` (`Marcus Rafael`) e `git config user.email` (`marcusrafaelmarquini@gmail.com`).
4. Adicionar arquivos específicos (`git add <caminhos>`) e commitar em Conventional Commits.
5. Atualizar `CHANGELOG.md` ao fechar cada fase (`0.1.0`, `0.2.0`, `0.3.0`, `0.4.0`, `1.0.0`).

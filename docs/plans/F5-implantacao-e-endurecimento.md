# Plano de implantação — Ambientes, Endurecimento e Go-Live (F0 → F5 / v1.0.0)

> Gerado em 26/11/2026 a partir de `DEVELOPMENT_PLAN.md` (seções 3.10–3.15), `docs/ROADMAP.md` e do estado do repositório.
> Metodologia obrigatória: **verificação antes da promoção (Test → Verify → Promote)**. Nenhuma mudança vai para produção sem teste automatizado, backup pré-migração e smoke test.
> Referência oficial em caso de conflito: `DEVELOPMENT_PLAN.md`.

## 1. Diagnóstico do estado atual

| Item | Estado |
|---|---|
| Containers | `backend/Dockerfile` (dev/prod com Gunicorn), `frontend/Dockerfile` (dev/build/prod standalone) e `docker-compose.yml` (`local-db` opcional) criados na F0; **build de imagens ainda não validado com Docker ativo** |
| Banco (Supabase) | `DATABASE_URL` via Session Pooler (porta 5432, ADR-03) e migração condicional RLS (`0002_supabase_rls_security.py`) prontos; **projeto Supabase Dev/Prod ainda não provisionado/migrado** |
| CI/CD | `.github/workflows/ci.yml` criado (lint, tipos, `import-linter`, OpenAPI, `pytest` com Postgres 17, Vitest, build Next.js, `pip-audit`, `npm audit`); **execução no GitHub pendente de push** |
| Produção (`D-07`, `D-12`) | Hospedagem de frontend/backend, domínio registrável único, plano Supabase (backups) e serviço de e-mail **em aberto** |
| Operação (F5) | `scripts/backup_db.sh`, teste de restauração, exportações (`RF033`, `RF061`, `RF092`), carga sintética (`RNF010`) e auditorias OWASP/WCAG **a construir na F5** |

## 2. Etapa 0 — Base implantável (bloqueante antes de qualquer deploy)

1. Subir Docker e validar builds de desenvolvimento e produção: `docker compose --profile local-db up --build` e `docker build --target production` em `backend/` e `frontend/` (com `--build-arg NEXT_PUBLIC_API_BASE_URL=...`).
2. Provisionar **Supabase Dev**, configurar `DATABASE_URL` (Session Pooler `:5432`) em `backend/.env`, revisar desativação da Data API e aplicar `python manage.py migrate` explicitamente.
3. Confirmar via SQL no Supabase Dev que **100% das tabelas em `public`** têm RLS ativado e que `anon`/`authenticated` não possuem privilégios (`RNF006`).
4. Validar `/healthz`, `/readyz` (`200`), `createsuperuser`, login/refresh/logout com cookies `HttpOnly` e CI verde no GitHub.

**Critério:** ambiente local + Supabase Dev + CI operando de ponta a ponta sem migração automática em entrypoint.

## 3. Fatias de implantação (cada fatia = 1 PR, testada antes da promoção)

### Fatia 1 — Exportação de dados e portabilidade (RF033, RF061, RF092)
**Testes primeiro:**
- `test_export_json`: exportação completa contém 100% das entidades do usuário A e **0 registros** do usuário B (`RNF004`); estrutura validada por schema.
- `test_export_markdown`: notas com KaTeX reabrem sem perda de fórmulas; nomes de arquivo sanitizados contra path traversal.
- `test_export_ics`: arquivo `.ics` válido com `VTIMEZONE` e eventos convertidos corretamente.
**Implementação:** serviços de exportação em streaming/memória controlada; endpoints autenticados sob `/api/v1/`.

### Fatia 2 — Rotina de backup e prova de restauração (RNF028)
**Testes/verificação primeiro:**
- Script `scripts/backup_db.sh` (`pg_dump` via `DATABASE_URL`, compactado + criptografado) falha rápido se `DATABASE_URL` ou chave de criptografia estiverem ausentes.
- **Teste real de restauração:** restaurar o dump gerado em um PostgreSQL local limpo, subir o backend apontando para ele e rodar a suíte de integridade (`pytest`) + conferência de contagens.
**Implementação:** `scripts/backup_db.sh`, documentação de retenção (4 semanais, 6 mensais) e conferência do backup gerenciado do plano Supabase (`D-12`).

### Fatia 3 — Desempenho, carga sintética e índices (RNF010, RNF011, RNF012)
**Testes primeiro:**
- Comando de carga sintética gerando **10.000 exercícios** e **5.000 notas** em banco local.
- Medição automatizada de latência: p95 < 300 ms em listagens e < 150 ms em leituras simples; `assertNumQueries` constante no dashboard, estatísticas e página da disciplina.
- `EXPLAIN ANALYZE` nas consultas lentas para validar uso dos índices (`3.5.5` e GIN full-text).
- Verificação de LCP < 2,5 s em 4G simulado e carregamento tardio (`dynamic import`) de Tiptap e Recharts.

### Fatia 4 — Endurecimento de segurança e acessibilidade (RNF003, RNF008, RNF021)
**Testes/auditorias primeiro:**
- `DJANGO_SETTINGS_MODULE=config.settings.production python manage.py check --deploy --fail-level WARNING` sem falhas críticas.
- Verificação automatizada de cabeçalhos: HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, CSP no frontend, `/api/docs/` retornando `404` e `/api/v1/auth/register/` bloqueado (`403`) com `ALLOW_REGISTRATION=false`.
- Suíte `axe` no Playwright sem violações sérias + revisão manual WCAG 2.2 AA (390 px a 1440 px, temas claro e escuro).
- Checklist OWASP Top 10 registrado e `pip-audit` / `npm audit` sem vulnerabilidades altas/críticas sem justificativa.

### Fatia 5 — Provisionamento de produção e Go-Live (D-07 → v1.0.0)
**Pré-requisito:** `D-07` decidida (provedor + **mesmo domínio registrável** para `app.<domínio>` e `api.<domínio>`, ou proxy reverso no Next.js — risco R06).
**Sequência estrita de release:**
1. Conferir CI verde na tag `v1.0.0`, `CHANGELOG.md` atualizado e `sqlmigrate` revisado.
2. Configurar segredos no cofre do provedor (backend runtime + `NEXT_PUBLIC_API_BASE_URL` no build do frontend).
3. Executar backup pré-migração (`scripts/backup_db.sh`) no Supabase Produção.
4. Construir imagens `production` (backend + frontend).
5. Executar `python manage.py migrate --noinput` como job isolado e confirmar RLS em 100% das tabelas de `public`.
6. Subir backend (Gunicorn) → validar `GET /healthz` e `GET /readyz` (`200`).
7. Subir frontend (`node server.js`) → executar **smoke test pós-deploy**: login, cookies `HttpOnly; Secure; SameSite=Lax`, `X-CSRFToken`, leitura do dashboard, troca de tema sem *flash*, `/api/docs/` = `404`, logs JSON sem vazamento de segredos.

### Fatia 6 — Rollback e operação contínua
- **Migrações destrutivas (regra de 2 releases):** Release N remove uso no código; Release N+1 remove coluna/tabela no banco.
- **Rollback de código:** reimplantar tag Docker anterior (compatível com o schema pela regra acima).
- **Rollback de banco:** modo manutenção → restaurar dump pré-migração da etapa 3 → reimplantar tag anterior.

## 4. Ciclo de verificação por release (padrão)

1. Backend: `ruff check .`, `ruff format --check .`, `mypy .`, `lint-imports`, `manage.py spectacular --validate`, `pytest --cov`, `pip-audit -r requirements/base.txt`.
2. Frontend: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit --audit-level=high`, E2E Playwright dos 7 fluxos críticos (`3.11.1`).
3. Produção: `check --deploy`, backup pré-migração, `migrate --noinput` explícito, `/healthz` + `/readyz` + smoke test de autenticação.

## 5. Riscos e decisões

- **Bloqueio imediato:** Docker Desktop parado impede validar builds de imagem e `pytest` com `local-db`.
- **`D-07` (hospedagem e domínio):** deve garantir mesmo domínio registrável para cookies `HttpOnly; SameSite=Lax` (R06); fallback = proxy reverso no Next.js.
- **`D-02` (storage de PDFs):** se adotar Supabase Storage na F4, `SUPABASE_SERVICE_ROLE_KEY` existe **apenas no backend** e entra no plano de backup.
- **`D-12` (plano Supabase e e-mail):** verificar limites de pausa por inatividade e backups gerenciados antes da F1; não depender apenas do backup do provedor (R04, R14).
- **Regra absoluta:** nunca rodar `migrate` no `CMD`/entrypoint do container e nunca apontar testes automatizados para o Supabase de produção.

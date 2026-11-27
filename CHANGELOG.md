# Changelog

Todas as mudanças relevantes deste projeto serão registradas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento semântico a partir da `0.1.0` (ver roadmap).

## [Não lançado]

### Adicionado
- Disciplinas e árvore de tópicos com até 4 níveis (RF013, RF017).
- Exercícios, fontes, tipos de erro, tentativas e estado derivado, com Markdown e KaTeX sem HTML bruto (RF034–RF040).
- Cronômetro e registro manual de sessões (RF067, RF068, RF071).
- Comando `seed_obmu` para importar o banco de provas.
- Caderno de erros (RF042) e revisão espaçada D+3, D+7, D+21 com atalhos 1–4 (RF045, RF046, RF048).
- Sincronização sob demanda e somente leitura com o Codeforces: rating, gráficos e upsolving (ADR-015).
- Calendário (mês, semana e dia), recorrência semanal, semana padrão, metas com progresso automático e revisão semanal/mensal; comando `seed_calendar`.
- Exportação em JSON, Markdown e ICS (RF033, RF061, RF092).
- Scripts de backup criptografado e restauração local; teste E2E com axe; medição de desempenho; `docs/RUNBOOK.md`.
- Componentes base de interface e navegação em gaveta abaixo de 1024 px.
- `DEVELOPMENT_PLAN.md`: plano técnico completo (requisitos, arquitetura, modelagem do banco para PostgreSQL/Supabase, API, infraestrutura, testes, roadmap, riscos e critérios de conclusão).
- `README.md`, `CONTRIBUTING.md` e `docs/` (`ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `ROADMAP.md`, `DEPLOYMENT_PLAN.md`, `RUNBOOK.md`).
- `docs/adr/`: registros `ADR-001` a `ADR-015` (incluindo aprovação da integração somente leitura e sob demanda com a API pública do Codeforces).
- Raiz do repositório: `.gitignore`, `.editorconfig`, `.pre-commit-config.yaml`, `scripts/` (`backup_db.sh`, `restore_db.sh`, `e2e.sh`) e pipeline CI em `.github/workflows/ci.yml` (backend, frontend e E2E Playwright + axe).
- Módulos de estudo e endurecimento (F1–F5): `disciplines`, `curriculum`, `exercises` (com caderno de erros e `seed_obmu`), `studysessions`, `reviews` (revisão espaçada), `cp` (Codeforces read-only e upsolving), `planning` (calendário, plano semanal e `seed_calendar`), `goals` (metas e revisão semanal), `exports` (JSON, Markdown e ICS), `backend/scripts/perf_check.py`, CSP com nonce e suporte opcional a `API_PROXY_TARGET`.
- Backend (`backend/`): projeto Django 5.2 LTS + DRF com settings por ambiente (`base`, `local`, `test`, `production`), apps `core` (`OwnedModel`, `OwnedQuerysetMixin`, `OwnedPrimaryKeyRelatedField`, exceções padronizadas, logs JSON com `request_id`, `/healthz`, `/readyz`, `Tag`) e `accounts` (`User` por e-mail com UUID, SimpleJWT em cookies `HttpOnly` + CSRF, rotação/blacklist, perfil, troca de senha), migrações iniciais + migração condicional de segurança RLS do Supabase, `Dockerfile` multi-stage e testes (`test_health.py`, `test_auth.py`, `test_isolation_contract.py`).
- Frontend (`frontend/`): projeto Next.js (App Router, TypeScript `strict`, saída `standalone`), tokens claro/escuro do Design System Voltage sem *flash*, `api-client` centralizado com cookies `HttpOnly` + `X-CSRFToken` + refresh único, shell autenticado, tela `/login`, `Dockerfile` multi-stage e teste unitário com Vitest.
- `docker-compose.yml` atualizado com `backend`, `frontend` e perfil opcional `local-db`.

### Corrigido
- `login`, `refresh` e `register` passam a exigir token CSRF; o limite de login não pode mais ser contornado com `X-Forwarded-For`.
- Produção: *healthcheck* sem redirecionamento para HTTPS, cookie CSRF com `COOKIE_DOMAIN` e `collectstatic` na imagem.
- RLS passa a ser reaplicado após cada `migrate`: as tabelas criadas depois da migração `core.0002` (`django_session`, `token_blacklist_*` e as de módulos futuros) ficavam sem RLS.
- Testes e `/readyz` não travam mais com o banco inacessível (`DB_CONNECT_TIMEOUT`) nem esperam o IPv6 de `localhost` no Windows.

### Segurança
- Dependências atualizadas para corrigir vulnerabilidades conhecidas: Django REST Framework 3.18, Zod 4, Vitest 5 e PostCSS 8.5.

### Alterado
- Consolidação das pastas `Estudos` e `Site_de_estudos` em uma só (`Site_de_estudos`). O protótipo Next.js + Drizzle foi removido; dados, regras de domínio, testes e decisões úteis foram preservados em `docs/legacy-prototype/` e o prompt do design system em `docs/design/`. PDFs e mini-sites de disciplina ficam em `Sistema_de_estudos/Materiais/`, fora do repositório.

### Decisões
- `D-04`: escada de revisão padrão D+3, D+7, D+21 (substitui 1, 3, 10, 30 nos perfis que não a personalizaram).
- `ADR-015` aceita: leitura sob demanda da API pública do Codeforces.
- Fonte única do planejamento: a pasta `Obsidian_Vault_The_Plan/` (fora do repositório). A plataforma importa dela e nunca escreve nela.
- `D-05` (estado "bem estudado"), `D-07` (hospedagem), `D-10` (exceções de recorrência) e `D-12` continuam pendentes.
- `D-01`, `D-03`, `D-08`, `D-11`, `D-13` confirmadas na Fase 0 (`local-db` para testes/CI + Supabase Dev; JWT em cookies `HttpOnly`; nome provisório e licença privada; `pip` + `requirements/*.txt`; Python 3.13, Django 5.2 LTS, Node 22/24 LTS, Next.js estável).
- `D-14` resolvida: o protótipo é apenas referência; reaproveitam-se dados e regras, não código.
- Backend Django + DRF e frontend Next.js desacoplados por API REST.
- Supabase usado **apenas como PostgreSQL gerenciado**, acessado somente pelo backend (ADR-02).
- Sem integração com inteligência artificial.

## Marcos previstos

| Versão | Fase | Conteúdo |
|---|---|---|
| 0.1.0 | F1 | Núcleo de estudo: disciplinas, tópicos, exercícios, tentativas, sessões |
| 0.2.0 | F2 | **MVP**: revisão espaçada, anotações, metas, estatísticas |
| 0.3.0 | F3 | Notas e semestres, simulados, calendário |
| 0.4.0 | F4 | Biblioteca, programação competitiva, projetos |
| 1.0.0 | F5 | Exportação, backups, endurecimento e implantação |

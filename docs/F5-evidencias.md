# Evidências e pendências da F5 (issue #6)

Registro do que **foi executado** em 2026-11-27, na máquina de desenvolvimento, com PostgreSQL 17 local. O passo a passo de operação está em [`RUNBOOK.md`](RUNBOOK.md). Nada foi publicado e nenhum comando tocou o Supabase.

## Backup e restauração (RNF028)

`backup_db.sh` e `restore_db.sh`, contra um banco local vazio. Contagens idênticas na origem e no restaurado:

| usuários | exercícios | eventos | metas | migrações | tabelas com RLS |
|---|---|---|---|---|---|
| 1 | 25 | 58 | 102 | 43 | 32 de 32 |

Com o backend apontado para o banco restaurado: `migrate --check` sem pendências, `check` sem problemas e exportação JSON com 188 registros. Foram recusados: destino remoto, URL com `?host=` e senha errada.

> A prova usou dados locais. **Repita com um backup real do Supabase** antes do go-live.

## Desempenho (RNF010–RNF012)

`python scripts/perf_check.py` (em `backend/`): 10.000 exercícios, 5.000 tentativas e 2.000 sessões, 40 amostras por rota, sem rede.

| Rota | p95 (ms) | meta (ms) |
|---|---|---|
| listas de exercícios (filtros, busca, página 300) | 17–31 | 300 |
| caderno de erros, sessões, fila de revisão | 11–25 | 300 |
| metas (25 por página) | 65 | 300 |
| revisão semanal | 66 | 300 |
| leituras simples | 3–7 | 150 |

Os planos usam `ix_exercise_disc_state` e `ix_attempt_owner_date`. Na fila de revisão (300 linhas) o PostgreSQL escolhe *Seq Scan*. As metas custam uma agregação por item da página.

**Não medido:** 5.000 anotações (o módulo ainda não existe) e LCP em 4G simulado.

## Revisão OWASP Top 10 (2021)

| Risco | Controle | Situação |
|---|---|---|
| A01 Controle de acesso | autenticação por padrão, filtro por `owner`, FKs validadas por posse, testes de isolamento | coberto |
| A02 Falhas criptográficas | Argon2id, cookies `HttpOnly; Secure; SameSite=Lax`, HSTS, backup AES-256 | coberto |
| A03 Injeção | ORM; HTML bruto rejeitado e não interpretado; KaTeX com `trust: false`; ICS escapado; nomes do zip saneados | coberto |
| A04 Design inseguro | restauração por script só local; chamada externa sob demanda (ADR-015) | coberto |
| A05 Configuração | `check --deploy --fail-level WARNING` nos testes; CSP no backend e no frontend; documentação da API desligada em produção | coberto |
| A06 Componentes vulneráveis | `pip-audit` e `npm audit` sem achados | repetir a cada release |
| A07 Autenticação | rotação e blacklist de refresh, limite de login | corrigido nesta revisão |
| A08 Integridade | migrações versionadas, `npm ci` no CI | imagens e actions sem digest fixo |
| A09 Logs | JSON com `request_id`, sem senha ou token no ensaio | **não há alertas** |
| A10 SSRF | host fixo, HTTPS, tempo e tamanho limitados | coberto |

**Falhas encontradas e corrigidas:** `login`, `refresh` e `register` aceitavam POST sem token CSRF; o limite de login podia ser contornado com `X-Forwarded-For` forjado; o cookie CSRF não usava `COOKIE_DOMAIN`; o *healthcheck* era redirecionado para HTTPS em produção; tabelas criadas depois da primeira migração ficavam sem RLS.

**Limitações conhecidas:** os contadores de limite ficam na memória de cada *worker* do Gunicorn (com 3, o teto efetivo é até 3 vezes maior); o CSP do frontend permite `style-src 'unsafe-inline'`.

**Configuração que o deploy exige:** `DJANGO_ALLOWED_HOSTS` com o host da API **e `localhost`** (*healthcheck*); `NUM_PROXIES` igual ao número de proxies confiáveis (com `0` atrás de proxy, todos os clientes dividem o mesmo limite); o proxy envia `X-Forwarded-Proto: https`; com subdomínios, `COOKIE_DOMAIN=.<domínio>`.

## Acessibilidade (RNF021)

`bash scripts/e2e.sh`: 13 de 13. O axe varreu 11 telas, nos temas claro e escuro, em 1440 px e 390 px, sem violações sérias ou críticas, sem rolagem horizontal e sem erros de CSP ou hidratação. Diálogos abertos não são varridos.

## Ensaio das imagens de produção

Imagens `production`, com proxy do Next (`API_PROXY_TARGET`) e PostgreSQL local: migração como etapa isolada, RLS em 32 de 32 tabelas, contêiner `healthy`, login sem CSRF `403` e com CSRF `200`, cookies `HttpOnly; Secure; SameSite=Lax`, `/api/docs/` e `/api/schema/` `404`, cabeçalhos de segurança presentes.

## Pendências

- [ ] Decidir **D-07** (provedor e domínio) e **D-12** (plano do Supabase e e-mail).
- [ ] Preencher o `DATABASE_URL` do Supabase Dev, migrar e conferir RLS e privilégios.
- [ ] Enviar os branches e obter CI verde no GitHub (o job `e2e` nunca rodou lá).
- [ ] Repetir a prova de restauração com um backup real.
- [ ] Revisão manual WCAG 2.2 AA (teclado e leitor de tela).
- [ ] Medir LCP em 4G simulado.
- [ ] Alertas de erro e limite de requisições compartilhado, antes de convidar outras pessoas.
- [ ] Antes de convidar alguém: redefinição de senha, exclusão de conta e aviso de privacidade (LGPD).

# Runbook Operacional — Study Platform

> Referência complementar a [`DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) (seção 3.10) e [`docs/DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md).
> Aplica-se a **Supabase (PostgreSQL gerenciado via Session Pooler `:5432`)**, **Django + Gunicorn** e **Next.js (`standalone`)**.

---

## 1. Regras Inegociáveis de Operação

1. **Nunca** executar `python manage.py migrate` no entrypoint/CMD dos contêineres. Migrações são sempre explícitas e isoladas.
2. **Nunca** apontar testes automatizados (`pytest`, `perf_check.py`, `scripts/e2e.sh`) ou `scripts/restore_db.sh` para o banco de produção.
3. **Nunca** versionar `.env`, `.env.local`, chaves de criptografia (`BACKUP_PASSPHRASE`) ou arquivos `.dump` / `.dump.enc`.
4. **Supabase exclusivamente como PostgreSQL** (ADR-002): manter Data API desativada e RLS ativo em 100% das tabelas do schema `public`.

---

## 2. Backup Lógico Criptografado (`RNF028`)

### 2.1 Execução direta (com `pg_dump` e `openssl` no host)

```bash
DATABASE_URL="postgresql://postgres.<PROJECT-REF>:<SENHA>@<POOLER-HOST>:5432/postgres" \
BACKUP_PASSPHRASE="<senha-forte-min-16-caracteres>" \
BACKUP_DIR="backups" \
bash scripts/backup_db.sh
```

O script gera `backups/study-platform-<YYYYMMDDTHHMMSSZ>.dump.enc` (formato custom compactado do `pg_dump`, apenas schema `public`, criptografado com AES-256-CBC + PBKDF2 600.000 iterações).

### 2.2 Execução via Docker (quando `pg_dump`/`openssl` não estão instalados no host)

```bash
docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  -e BACKUP_PASSPHRASE="$BACKUP_PASSPHRASE" \
  -e BACKUP_DIR="/work/backups" \
  -v "$(pwd):/work" -w /work \
  postgres:17 \
  bash scripts/backup_db.sh
```

### 2.3 Política de retenção

- **Backups lógicos off-site:** manter **4 semanais** e **6 mensais**, sempre criptografados e armazenados fora do servidor de aplicação.
- **Backups gerenciados do Supabase:** conferir o plano contratado (`D-12`) e nunca depender apenas do backup automático do provedor.

---

## 3. Prova Local de Restauração

Validar periodicamente (e obrigatoriamente antes de `v1.0.0`) que o backup pode ser descriptografado e restaurado em um PostgreSQL **local** limpo:

```bash
# 1. Subir PostgreSQL local
docker compose --profile local-db up -d db

# 2. Criar banco descartável para a prova
docker compose --profile local-db exec -T db \
  psql -U study_platform -d postgres -c "DROP DATABASE IF EXISTS restore_test; CREATE DATABASE restore_test;"

# 3. Restaurar o arquivo criptografado (o script recusa hosts não locais)
RESTORE_DATABASE_URL="postgresql://study_platform:study_platform@127.0.0.1:5432/restore_test" \
BACKUP_PASSPHRASE="<senha-do-backup>" \
bash scripts/restore_db.sh backups/study-platform-<TIMESTAMP>.dump.enc

# 4. Conferir contagens e integridade apontando o Django para restore_test
DATABASE_URL="postgresql://study_platform:study_platform@127.0.0.1:5432/restore_test" \
python backend/manage.py check
```

---

## 4. Migrações e Verificação de RLS no Supabase (`RNF006`)

### 4.1 Aplicar migrações explicitamente

```bash
# Revisar o SQL antes de aplicar em produção
python manage.py sqlmigrate <app> <numero>

# Aplicar como etapa isolada (reaplica RLS automaticamente no hook post_migrate)
python manage.py migrate --noinput
```

### 4.2 Verificação SQL obrigatória pós-migração

Executar no SQL Editor do Supabase ou via `psql` contra o banco migrado:

```sql
-- 1. Deve retornar 0 linhas (todas as tabelas em public com RLS ativo)
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public' AND NOT rowsecurity;

-- 2. Deve retornar 0 linhas (nenhum privilégio concedido a anon ou authenticated)
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated');
```

---

## 5. Sequência de Release em Produção (`v1.0.0`)

Pré-requisitos: `D-07` (hospedagem e origem única) e `D-12` (plano Supabase/e-mail) decididos; CI verde na tag; `CHANGELOG.md` atualizado.

1. **Verificação estática de produção:**
   ```bash
   DJANGO_SETTINGS_MODULE=config.settings.production \
   python backend/manage.py check --deploy --fail-level WARNING
   ```
2. **Backup pré-migração:** executar `scripts/backup_db.sh` contra o Supabase Produção e confirmar arquivo gerado não vazio.
3. **Build das imagens `production`:**
   ```bash
   docker build --target production -t sp-backend:v1.0.0 ./backend

   # Opção A (D-07 — mesmo domínio registrável: app.<domínio> e api.<domínio>)
   docker build --target production \
     --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.<dominio>/api/v1 \
     -t sp-frontend:v1.0.0 ./frontend

   # Opção B (D-07 — proxy reverso no Next.js em origem única)
   docker build --target production \
     --build-arg NEXT_PUBLIC_API_BASE_URL=/api/v1 \
     --build-arg API_PROXY_TARGET=https://<backend-interno> \
     -t sp-frontend:v1.0.0 ./frontend
   ```
4. **Migração explícita:** executar `python manage.py migrate --noinput` como job isolado e rodar as consultas SQL da Seção 4.2.
5. **Subir backend (Gunicorn):** validar `GET /healthz` (`200`) e `GET /readyz` (`200`).
6. **Subir frontend (`node server.js`):** executar o smoke test da Seção 6.

---

## 6. Smoke Test Pós-Deploy

- [ ] `GET /healthz` e `GET /readyz` retornam `200`.
- [ ] `GET /api/docs/` e `GET /api/schema/` retornam `404` (`ENABLE_API_DOCS = False`).
- [ ] `POST /api/v1/auth/register/` bloqueado com `ALLOW_REGISTRATION=false`.
- [ ] Login em `/login` define cookies `HttpOnly; Secure; SameSite=Lax` e exige `X-CSRFToken` nas mutações.
- [ ] Cabeçalhos de segurança presentes: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` e `Content-Security-Policy` com nonce.
- [ ] Dashboard carrega dados reais sem erros de console; alternância de tema claro/escuro ocorre sem *flash*.
- [ ] Logs JSON estruturados sem vazamento de senhas, tokens ou `DATABASE_URL`.

---

## 7. Rollback e Restauração Manual em Produção

### 7.1 Regra de 2 releases para migrações destrutivas
- **Release N:** remove leitura/escrita da coluna ou tabela no código, mantendo o schema compatível.
- **Release N+1:** remove a coluna ou tabela do banco.

### 7.2 Rollback de código
Reimplantar a tag Docker anterior (ex.: `v0.4.0`), preservando o banco caso a migração tenha sido compatível para trás.

### 7.3 Restauração manual em produção (incidente grave de banco)
1. Colocar backend e frontend em modo manutenção (parar tráfego de escrita).
2. Descriptografar o dump pré-migração localmente em diretório temporário com `umask 077`:
   ```bash
   umask 077
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE \
     -in backups/study-platform-<TIMESTAMP>.dump.enc -out /tmp/restore.dump
   ```
3. Restaurar explicitamente no banco de produção após dupla conferência da URL:
   ```bash
   pg_restore --dbname="$PROD_DATABASE_URL" --clean --if-exists \
     --no-owner --no-privileges --exit-on-error --single-transaction /tmp/restore.dump
   rm -f /tmp/restore.dump
   ```
4. Reexecutar as consultas SQL de RLS (Seção 4.2), reimplantar a tag anterior da aplicação e rodar o smoke test (Seção 6).

---

## 8. Política de Acesso Multiusuário Controlado

- **Padrão permanente:** `ALLOW_REGISTRATION=false`. Nenhuma abertura pública é habilitada por padrão.
- **Abertura controlada (somente após validação do MVP no uso diário):**
  - Preferir criação explícita de contas pelo administrador (`manage.py createsuperuser` ou comando dedicado) **ou** habilitar `ALLOW_REGISTRATION=true` apenas durante janela curta e controlada, retornando imediatamente para `false` após o cadastro.
  - Garantir `test_isolation_contract.py` verde no CI antes de qualquer nova conta ativa no ambiente.

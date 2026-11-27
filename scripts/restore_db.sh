#!/usr/bin/env bash
# Restaura um backup em um PostgreSQL LOCAL, para provar que ele funciona.
#
# Uso:
#   RESTORE_DATABASE_URL=postgresql://u:s@127.0.0.1:5432/restore_test \
#   BACKUP_PASSPHRASE=... scripts/restore_db.sh <arquivo.dump.enc>
#
# Recusa qualquer destino que não seja local. A restauração em produção é um
# procedimento manual descrito em docs/RUNBOOK.md.
set -euo pipefail
umask 077

fail() {
  echo "restore_db: $*" >&2
  exit 1
}

file="${1:-}"
[ -f "$file" ] || fail "informe um arquivo de backup existente."
[ -n "${RESTORE_DATABASE_URL:-}" ] || fail "defina RESTORE_DATABASE_URL."
[ -n "${BACKUP_PASSPHRASE:-}" ] || fail "defina BACKUP_PASSPHRASE."

url="$RESTORE_DATABASE_URL"
# Parâmetros na URL (ex.: ?host=...) poderiam redirecionar a conexão.
case "$url" in
  *\?*) fail "a URL de destino não pode ter parâmetros." ;;
  postgresql://* | postgres://*) ;;
  *) fail "use uma URL postgresql://." ;;
esac
authority="${url#*://}"
authority="${authority%%/*}"
hostport="${authority##*@}"
case "$hostport" in
  *,*) fail "informe um único host." ;;
esac
host="${hostport%:*}"
case "$host" in
  localhost | 127.0.0.1 | db | "[::1]") ;;
  *) fail "destino recusado: só é permitido restaurar em um banco local (host: '$host')." ;;
esac
unset PGHOST PGHOSTADDR PGSERVICE PGSERVICEFILE

command -v pg_restore >/dev/null || fail "pg_restore não encontrado."
command -v openssl >/dev/null || fail "openssl não encontrado."

plain="$(mktemp)"
trap 'rm -f "$plain"' EXIT
export BACKUP_PASSPHRASE
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE \
  -in "$file" -out "$plain" || fail "não foi possível descriptografar (senha incorreta?)."

pg_restore --dbname="$url" --clean --if-exists --no-owner --no-privileges \
  --exit-on-error --single-transaction "$plain"
echo "Restauração concluída."

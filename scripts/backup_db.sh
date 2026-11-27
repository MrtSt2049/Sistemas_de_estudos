#!/usr/bin/env bash
# Backup lógico, compactado e criptografado do schema public (RNF028).
#
# Uso:
#   DATABASE_URL=... BACKUP_PASSPHRASE=... [BACKUP_DIR=backups] scripts/backup_db.sh
#
# Requer pg_dump (versão igual ou superior à do servidor) e openssl. Sem eles no
# computador, rode dentro da imagem oficial: veja docs/RUNBOOK.md.
set -euo pipefail
umask 077

fail() {
  echo "backup_db: $*" >&2
  exit 1
}

[ -n "${DATABASE_URL:-}" ] || fail "defina DATABASE_URL."
[ -n "${BACKUP_PASSPHRASE:-}" ] || fail "defina BACKUP_PASSPHRASE (guarde-a fora do repositório)."
[ "${#BACKUP_PASSPHRASE}" -ge 16 ] || fail "BACKUP_PASSPHRASE precisa de pelo menos 16 caracteres."
command -v pg_dump >/dev/null || fail "pg_dump não encontrado."
command -v openssl >/dev/null || fail "openssl não encontrado."

dir="${BACKUP_DIR:-backups}"
mkdir -p "$dir"
target="$dir/study-platform-$(date -u +%Y%m%dT%H%M%SZ).dump.enc"
partial="$target.part"
trap 'rm -f "$partial"' EXIT

export BACKUP_PASSPHRASE
# Formato custom já é compactado. Somente o schema public: os demais pertencem ao Supabase.
pg_dump --dbname="$DATABASE_URL" --format=custom --schema=public --no-owner --no-privileges |
  openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass env:BACKUP_PASSPHRASE -out "$partial"

[ -s "$partial" ] || fail "o arquivo gerado está vazio."
mv "$partial" "$target"
echo "$target"

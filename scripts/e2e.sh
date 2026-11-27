#!/usr/bin/env bash
# Testes ponta a ponta contra a pilha completa, em um banco local descartável.
#
# Requer: PostgreSQL local (docker compose --profile local-db up -d db),
# dependências do backend instaladas e "npx playwright install chromium".
# Uso (na raiz): scripts/e2e.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
database="study_platform_e2e"
export E2E_EMAIL="e2e@example.com"
export E2E_PASSWORD="E2e!Password-123456" # conta descartável, só existe neste banco

cd "$root/backend"
if [ -f .venv/Scripts/activate ]; then
  source .venv/Scripts/activate
elif [ -f .venv/bin/activate ]; then
  source .venv/bin/activate
fi
export PYTHONUTF8=1
export DJANGO_SETTINGS_MODULE=config.settings.local
export DJANGO_SECRET_KEY="e2e-only-insecure-secret-key-1234567890"
export DATABASE_URL="postgresql://study_platform:study_platform@127.0.0.1:5432/$database"
export CORS_ALLOWED_ORIGINS="http://localhost:3000"
export CSRF_TRUSTED_ORIGINS="http://localhost:3000"
export API_THROTTLE_RATE="5000/min"

python - <<'PY'
import psycopg

url = "postgresql://study_platform:study_platform@127.0.0.1:5432/postgres"
with psycopg.connect(url, autocommit=True, connect_timeout=10) as connection:
    connection.execute("DROP DATABASE IF EXISTS study_platform_e2e WITH (FORCE)")
    connection.execute("CREATE DATABASE study_platform_e2e")
PY
python manage.py migrate --noinput -v 0
python manage.py shell -v 0 <<'PY'
import os
from datetime import date

from apps.accounts.models import User, UserProfile
from apps.disciplines.models import Discipline
from apps.exercises.models import Exercise, ExerciseSource
from apps.reviews.models import ReviewItem

user = User.objects.create_user(os.environ["E2E_EMAIL"], os.environ["E2E_PASSWORD"])
UserProfile.objects.create(user=user, display_name="Teste E2E")
discipline = Discipline.objects.create(owner=user, name="Revisão E2E", kind="olympiad")
source = ExerciseSource.objects.create(owner=user, name="Semente")
exercise = Exercise.objects.create(
    owner=user, discipline=discipline, source=source, title="Item vencido",
    statement_md="Calcule $1+1$.", solution_md="$2$",
)
ReviewItem.objects.create(owner=user, exercise=exercise, due_on=date(2020, 1, 1))
PY

python manage.py runserver 127.0.0.1:8000 --noreload >"${TMPDIR:-/tmp}/e2e-api.log" 2>&1 &
api_pid=$!
web_pid=""
cleanup() {
  kill "$api_pid" 2>/dev/null || true
  [ -n "$web_pid" ] && kill "$web_pid" 2>/dev/null || true
}
trap cleanup EXIT

cd "$root/frontend"
export NEXT_PUBLIC_API_BASE_URL="http://localhost:8000/api/v1"
npm run build >"${TMPDIR:-/tmp}/e2e-build.log" 2>&1 || {
  tail -30 "${TMPDIR:-/tmp}/e2e-build.log"
  exit 1
}
# Chama o Next diretamente para que o encerramento atinja o próprio servidor.
node node_modules/next/dist/bin/next start -p 3000 >"${TMPDIR:-/tmp}/e2e-web.log" 2>&1 &
web_pid=$!

for url in http://127.0.0.1:8000/healthz http://127.0.0.1:3000/login; do
  curl --silent --fail --output /dev/null --retry 60 --retry-delay 1 --retry-all-errors "$url"
done

npx playwright test "$@"

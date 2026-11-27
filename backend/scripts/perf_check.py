"""Carga sintética e medição de latência e consultas (RNF010–RNF012).

Cria um banco local descartável, popula e mede. Uso (em backend/):
    python scripts/perf_check.py
"""

import os
import random
import statistics
import sys
import time
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

DATABASE = "study_platform_perf"
SERVER = "postgresql://study_platform:study_platform@127.0.0.1:5432"
EXERCISES, ATTEMPTS, SESSIONS, SAMPLES = 10_000, 5_000, 2_000, 40
LIST_LIMIT_MS, READ_LIMIT_MS = 300, 150

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
# O destino é fixo e local: a carga nunca vai para o DATABASE_URL do .env.
os.environ["DATABASE_URL"] = f"{SERVER}/{DATABASE}"
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.test"

import psycopg  # noqa: E402

with psycopg.connect(f"{SERVER}/postgres", autocommit=True, connect_timeout=10) as admin:
    admin.execute(f"DROP DATABASE IF EXISTS {DATABASE} WITH (FORCE)")
    admin.execute(f"CREATE DATABASE {DATABASE}")

import django  # noqa: E402

django.setup()

from django.core.management import call_command  # noqa: E402
from django.db import connection  # noqa: E402
from django.test.utils import CaptureQueriesContext, setup_test_environment  # noqa: E402
from rest_framework.test import APIClient  # noqa: E402

from apps.accounts.models import User, UserProfile  # noqa: E402
from apps.disciplines.models import Discipline  # noqa: E402
from apps.exercises.models import Attempt, ErrorType, Exercise, ExerciseSource  # noqa: E402
from apps.goals.models import Goal  # noqa: E402
from apps.reviews.models import ReviewItem  # noqa: E402
from apps.studysessions.models import StudySession  # noqa: E402

setup_test_environment()
call_command("migrate", verbosity=0)
random.seed(42)

user = User.objects.create_user("perf@example.com", "Perf!Password-123456")
UserProfile.objects.create(user=user)
disciplines = [
    Discipline.objects.create(owner=user, name=f"Disciplina {i}", kind="olympiad", position=i)
    for i in range(10)
]
sources = [ExerciseSource.objects.create(owner=user, name=f"Fonte {i}") for i in range(10)]
errors = [ErrorType.objects.create(owner=user, name=f"Erro {i}") for i in range(5)]
exercises = Exercise.objects.bulk_create(
    [
        Exercise(
            owner=user,
            discipline=random.choice(disciplines),
            source=random.choice(sources),
            external_ref=f"ref-{i}",
            title=f"Problema {i} sobre grafos" if i % 7 == 0 else f"Problema {i}",
            statement_md="Enunciado $x^2$." * 5,
            difficulty=i % 5 + 1,
            state=("new", "in_progress", "solved")[i % 3],
        )
        for i in range(EXERCISES)
    ],
    batch_size=1000,
)
now = datetime.now(tz=UTC)
Attempt.objects.bulk_create(
    [
        Attempt(
            owner=user,
            exercise=random.choice(exercises),
            result=random.choice(["solved_alone", "partial", "not_solved"]),
            dominant_error=random.choice(errors) if i % 3 == 0 else None,
            attempted_at=now - timedelta(hours=i),
        )
        for i in range(ATTEMPTS)
    ],
    batch_size=1000,
)
StudySession.objects.bulk_create(
    [
        StudySession(
            owner=user,
            activity_kind="exercises",
            discipline=random.choice(disciplines),
            started_at=now - timedelta(hours=3 * i + 2),
            ended_at=now - timedelta(hours=3 * i + 1),
        )
        for i in range(SESSIONS)
    ],
    batch_size=1000,
)
ReviewItem.objects.bulk_create(
    [ReviewItem(owner=user, exercise=e, due_on=date(2020, 1, 1)) for e in exercises[:300]]
)
today = date.today()
Goal.objects.bulk_create(
    [
        Goal(
            owner=user,
            title=f"Meta {i}",
            scope="weekly",
            period_start=today - timedelta(days=6),
            period_end=today,
            metric=("study_minutes", "exercises_solved")[i % 2],
            target_value=10,
            discipline=disciplines[i % 10],
        )
        for i in range(25)
    ]
)
with connection.cursor() as cursor:
    cursor.execute("ANALYZE")

client = APIClient()
client.force_authenticate(user)
discipline, source = disciplines[0].pk, sources[0].pk
week_start = today - timedelta(days=today.weekday())
CASES = [
    ("lista", "/api/v1/exercises/"),
    ("lista filtrada", f"/api/v1/exercises/?discipline={discipline}&state=new&difficulty=3"),
    ("lista busca", "/api/v1/exercises/?search=grafos&ordering=title"),
    ("lista página 300", "/api/v1/exercises/?page=300"),
    ("lista fonte", f"/api/v1/exercises/?source={source}"),
    ("caderno de erros", "/api/v1/attempts/?has_error=true"),
    ("sessões", "/api/v1/study-sessions/"),
    ("fila de revisão", "/api/v1/reviews/queue/"),
    ("metas (25)", "/api/v1/goals/"),
    ("revisão semanal", "/api/v1/periodic-reviews/draft/"),
    ("calendário semana", f"/api/v1/calendar/?start={week_start}&end={week_start + timedelta(6)}"),
    ("leitura exercício", f"/api/v1/exercises/{exercises[0].pk}/"),
    ("leitura disciplina", f"/api/v1/disciplines/{discipline}/"),
    ("leitura sessão ativa", "/api/v1/study-sessions/active/"),
]

print(f"{EXERCISES} exercícios, {ATTEMPTS} tentativas, {SESSIONS} sessões, {SAMPLES} amostras\n")
print(f"{'caso':<22}{'p50 ms':>8}{'p95 ms':>8}{'SQL':>5}  resultado")
failed = False
for name, url in CASES:
    with CaptureQueriesContext(connection) as captured:
        response = client.get(url)
    assert response.status_code in (200, 204), (url, response.status_code)
    queries = len(captured)
    timings = []
    for _ in range(SAMPLES):
        started = time.perf_counter()
        client.get(url)
        timings.append((time.perf_counter() - started) * 1000)
    p95 = statistics.quantiles(timings, n=20)[-1]
    limit = READ_LIMIT_MS if name.startswith("leitura") else LIST_LIMIT_MS
    failed |= p95 >= limit
    verdict = "ok" if p95 < limit else f"ACIMA de {limit} ms"
    print(f"{name:<22}{statistics.median(timings):>8.1f}{p95:>8.1f}{queries:>5}  {verdict}")

print("\nEXPLAIN ANALYZE (índices usados):")
for label, queryset in [
    (
        "exercícios por disciplina e estado",
        Exercise.objects.filter(owner=user, discipline=disciplines[0], state="new")[:25],
    ),
    (
        "tentativas por data",
        Attempt.objects.filter(owner=user).order_by("-attempted_at")[:25],
    ),
    (
        "fila de revisão",
        ReviewItem.objects.filter(owner=user, status="active", due_on__lte=today),
    ),
]:
    plan = queryset.explain(analyze=True)
    used = [line.strip()[:110] for line in plan.splitlines() if "Index" in line or "Seq" in line]
    print(f"- {label}: {used[:2]}")

connection.close()
with psycopg.connect(f"{SERVER}/postgres", autocommit=True, connect_timeout=10) as admin:
    admin.execute(f"DROP DATABASE {DATABASE} WITH (FORCE)")
sys.exit(1 if failed else 0)

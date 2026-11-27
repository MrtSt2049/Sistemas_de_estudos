"""The fixture uses the real CSV headers with synthetic rows (the repository is public)."""

from pathlib import Path

import pytest
from django.core.management import CommandError, call_command

from apps.accounts.models import User
from apps.disciplines.models import Discipline
from apps.exercises.models import Exercise, ExerciseSource

pytestmark = pytest.mark.django_db
HEADER = "Ano,Formato,Uso planejado,Status,Nota (/300),Observação\n"


def rows(count: int = 25) -> str:
    return "".join(
        f'{2025 - i},Fase única,Lista temática,A fazer,,"Q1, Q2 usadas"\n' for i in range(count)
    )


def write_csv(tmp_path: Path, body: str, header: str = HEADER) -> Path:
    path = tmp_path / "provas.csv"
    path.write_text(header + body, encoding="utf-8-sig")
    return path


def seed(path: Path, user: User) -> None:
    call_command("seed_obmu", file=str(path), email=user.email)


def test_imports_25_exams_without_duplicates_on_rerun(tmp_path: Path, user: User) -> None:
    path = write_csv(tmp_path, rows())

    seed(path, user)
    seed(path, user)

    assert Exercise.objects.filter(owner=user).count() == 25
    assert ExerciseSource.objects.filter(owner=user).count() == 1
    assert Discipline.objects.filter(owner=user).count() == 1
    exam = Exercise.objects.get(external_ref="2025")
    assert exam.title == "OBMU 2025 — Fase única"
    assert "Q1, Q2 usadas" in exam.statement_md
    assert exam.state == "new"


def test_rerun_updates_data_but_keeps_user_content_and_state(tmp_path: Path, user: User) -> None:
    seed(write_csv(tmp_path, "2025,Fase única,Simulado,A fazer,,\n"), user)
    exam = Exercise.objects.get()
    exam.statement_md = f"Minhas anotações\n\n{exam.statement_md}"
    exam.state = "in_progress"
    exam.save()

    seed(write_csv(tmp_path, "2025,Fase única,Simulado,Feita,187.5,\n"), user)

    exam.refresh_from_db()
    assert exam.statement_md.startswith("Minhas anotações")
    assert "187.5" in exam.statement_md
    assert "A fazer" not in exam.statement_md
    assert exam.state == "in_progress"


def test_reuses_existing_discipline_and_source_ignoring_case(tmp_path: Path, user: User) -> None:
    Discipline.objects.create(owner=user, name="obmu", kind="olympiad")
    ExerciseSource.objects.create(owner=user, name="Obmu", kind="olympiad")

    seed(write_csv(tmp_path, rows(2)), user)

    assert Discipline.objects.count() == 1
    assert ExerciseSource.objects.count() == 1


def test_missing_column_is_reported(tmp_path: Path, user: User) -> None:
    path = write_csv(tmp_path, "2025,x\n", header="Ano,Formato\n")

    with pytest.raises(CommandError, match="Colunas ausentes: .*Observação"):
        seed(path, user)


def test_all_bad_lines_are_reported_and_nothing_is_imported(tmp_path: Path, user: User) -> None:
    body = (
        "2025,Fase única,a,A fazer,,\n"
        "abc,Fase única,a,A fazer,,\n"
        "2023,,a,A fazer,,\n"
        "2022,Fase única,a,A fazer,999,\n"
        "2025,Fase única,a,A fazer,,\n"
    )

    with pytest.raises(CommandError) as raised:
        seed(write_csv(tmp_path, body), user)

    message = str(raised.value)
    for expected in ("Linha 3", "Linha 4", "Linha 5", "Linha 6"):
        assert expected in message
    assert not Exercise.objects.exists()


def test_unknown_file_or_user(tmp_path: Path, user: User) -> None:
    with pytest.raises(CommandError, match="Arquivo não encontrado"):
        seed(tmp_path / "nao-existe.csv", user)
    with pytest.raises(CommandError, match="Usuário não encontrado"):
        call_command("seed_obmu", file=str(write_csv(tmp_path, rows(1))), email="x@example.com")

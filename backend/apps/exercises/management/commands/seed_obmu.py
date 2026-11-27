from argparse import ArgumentParser
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandError

from apps.accounts.models import User
from apps.core.csv_import import ImportFileError
from apps.core.exceptions import DomainError
from apps.exercises.importers import import_obmu_exams, parse_exam_csv


class Command(BaseCommand):
    help = "Importa o banco de provas da OBMU (CSV). Pode ser executado várias vezes."

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument("--file", required=True, help="Caminho do banco-provas-obmu.csv")
        parser.add_argument("--email", required=True, help="E-mail da conta que recebe os dados")

    def handle(self, *args: Any, **options: Any) -> None:
        user = User.objects.filter(email__iexact=options["email"]).first()
        if user is None:
            raise CommandError(f"Usuário não encontrado: {options['email']}")
        try:
            result = import_obmu_exams(owner=user, rows=parse_exam_csv(Path(options["file"])))
        except ImportFileError as exc:
            raise CommandError(str(exc)) from exc
        except DomainError as exc:
            raise CommandError(f"Nada foi importado. {exc.message}") from exc
        self.stdout.write(
            self.style.SUCCESS(
                f"Provas criadas: {result.created} · atualizadas: {result.updated} "
                f"· sem mudança: {result.unchanged}"
            )
        )

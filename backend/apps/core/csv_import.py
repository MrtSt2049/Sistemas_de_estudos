"""Shared CSV reading for idempotent imports: validate everything, then write."""

import csv
from collections.abc import Callable, Hashable, Sequence
from pathlib import Path


class ImportFileError(Exception):
    """The file cannot be imported; the message lists every problem found."""


def read_csv_rows[Row](
    path: Path,
    *,
    required: Sequence[str],
    parse: Callable[[dict[str, str]], Row],
    unique_key: Callable[[Row], Hashable],
    key_label: str,
) -> list[Row]:
    """Parse the whole file, reporting every invalid line with its number."""
    if not path.is_file():
        raise ImportFileError(f"Arquivo não encontrado: {path}")
    rows: list[Row] = []
    errors: list[str] = []
    seen: set[Hashable] = set()
    try:
        with path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            missing = [column for column in required if column not in (reader.fieldnames or [])]
            if missing:
                raise ImportFileError(f"Colunas ausentes: {', '.join(missing)}")
            for line, raw in enumerate(reader, start=2):
                values = {column: (raw.get(column) or "").strip() for column in required}
                try:
                    row = parse(values)
                    key = unique_key(row)
                    if key in seen:
                        raise ValueError(f"{key_label} repetido: {key}")
                except ValueError as exc:
                    errors.append(f"Linha {line}: {exc}")
                    continue
                seen.add(key)
                rows.append(row)
    except UnicodeDecodeError as exc:
        raise ImportFileError("O arquivo precisa estar codificado em UTF-8.") from exc
    if errors:
        raise ImportFileError("Nada foi importado.\n" + "\n".join(errors))
    if not rows:
        raise ImportFileError("O arquivo não tem linhas de dados.")
    return rows

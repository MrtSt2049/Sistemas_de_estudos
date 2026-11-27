import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/errors";

/** Distribui `error.details` da API pelos campos; o restante vira erro geral. */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): void {
  if (!(error instanceof ApiError)) {
    setError("root", { message: "Não foi possível conectar ao servidor." });
    return;
  }
  const unmatched: string[] = [];
  for (const [key, value] of Object.entries(error.details)) {
    const message = Array.isArray(value) ? value[0] : String(value);
    if (!message) continue;
    if ((fields as readonly string[]).includes(key)) setError(key as Path<T>, { message });
    else unmatched.push(message);
  }
  setError("root", { message: unmatched[0] ?? error.message });
}

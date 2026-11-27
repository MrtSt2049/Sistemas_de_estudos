import { z } from "zod";
import type { AttemptInput, AttemptResult, ExerciseState, SourceKind } from "@/features/exercises/api";
import type { BadgeTone } from "@/components/ui/card";

export const STATE_LABELS: Record<ExerciseState, string> = {
  new: "Novo",
  in_progress: "Em andamento",
  solved: "Resolvido",
  mastered: "Bem estudado",
};

export const STATE_TONES: Record<ExerciseState, BadgeTone> = {
  new: "neutral",
  in_progress: "warn",
  solved: "ok",
  mastered: "accent",
};

export const RESULT_LABELS: Record<AttemptResult, string> = {
  solved_alone: "Resolvi sozinho",
  solved_with_hint: "Resolvi com dica",
  partial: "Parcial",
  not_solved: "Não resolvi",
};

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  olympiad: "Olimpíada",
  competitive: "Programação competitiva",
  book: "Livro",
  course: "Curso",
  other: "Outra",
};

const optionalMinutes = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{1,4}$/.test(value), "Use minutos inteiros.");

export const attemptSchema = z.object({
  result: z.enum(["solved_alone", "solved_with_hint", "partial", "not_solved"], {
    message: "Escolha o resultado.",
  }),
  minutes: optionalMinutes,
  hint_level: z.enum(["0", "1", "2", "3"]),
  dominant_error: z.string(),
  key_technique: z.string().max(200, "Máximo de 200 caracteres."),
  notes_md: z.string(),
});

export type AttemptFormInput = z.infer<typeof attemptSchema>;

export function toAttemptPayload(form: AttemptFormInput): AttemptInput {
  return {
    result: form.result,
    duration_seconds: form.minutes === "" ? null : Number(form.minutes) * 60,
    hint_level: Number(form.hint_level),
    dominant_error: form.dominant_error || null,
    key_technique: form.key_technique.trim(),
    notes_md: form.notes_md,
  };
}

export const exerciseSchema = z.object({
  title: z.string().trim().min(1, "Informe o título.").max(200, "Máximo de 200 caracteres."),
  discipline: z.string().min(1, "Escolha a disciplina."),
  source: z.string().min(1, "Escolha a fonte."),
  topic: z.string(),
  external_ref: z.string().trim().max(100, "Máximo de 100 caracteres."),
  difficulty: z.enum(["", "1", "2", "3", "4", "5"]),
  url: z.union([z.literal(""), z.string().url("Informe um endereço válido.")]),
  statement_md: z.string(),
  solution_md: z.string(),
});

export type ExerciseFormInput = z.infer<typeof exerciseSchema>;

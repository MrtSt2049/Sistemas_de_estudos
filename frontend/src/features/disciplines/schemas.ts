import { z } from "zod";
import type { DisciplineKind, TopicStatus } from "@/features/disciplines/api";

export const KIND_LABELS: Record<DisciplineKind, string> = {
  university_course: "Curso universitário",
  olympiad: "Olimpíada",
  competitive_programming: "Programação competitiva",
  software_engineering: "Engenharia de software",
  self_study: "Estudo livre",
};

export const TOPIC_STATUS_LABELS: Record<TopicStatus, string> = {
  not_started: "Não iniciado",
  in_progress: "Em andamento",
  done: "Concluído",
};

export const disciplineSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(150, "Máximo de 150 caracteres."),
  kind: z.enum([
    "university_course",
    "olympiad",
    "competitive_programming",
    "software_engineering",
    "self_study",
  ]),
  code: z.string().trim().max(30, "Máximo de 30 caracteres."),
});

export type DisciplineFormInput = z.infer<typeof disciplineSchema>;

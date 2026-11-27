import type { ActivityKind } from "@/features/sessions/api";

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  reading: "Leitura",
  exercises: "Exercícios",
  review: "Revisão",
  class: "Aula",
  mock_exam: "Simulado",
  project: "Projeto",
  programming: "Programação",
};

/** Formata segundos como HH:MM:SS. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(Math.floor(totalSeconds), 0);
  return [Math.floor(safe / 3600), Math.floor((safe % 3600) / 60), safe % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

/**
 * Tempo decorrido a partir do valor informado pelo servidor: só o intervalo
 * desde a resposta é medido no cliente, então o relógio local errado não importa.
 */
export function elapsedSince(serverElapsed: number, receivedAt: number, now: number): number {
  return serverElapsed + Math.max(Math.floor((now - receivedAt) / 1000), 0);
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
}

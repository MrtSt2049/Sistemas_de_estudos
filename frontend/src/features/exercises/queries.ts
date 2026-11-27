"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getExercise,
  listAttempts,
  listErrorTypes,
  listExerciseAttempts,
  listExercises,
  listSources,
} from "@/features/exercises/api";
import type { QueryParams } from "@/lib/crud";

export const exerciseKeys = {
  all: ["exercises"] as const,
  list: (params: QueryParams) => ["exercises", "list", params] as const,
  detail: (id: string) => ["exercises", "detail", id] as const,
  attempts: (id: string) => ["exercises", "attempts", id] as const,
  sources: ["exercise-sources"] as const,
  errorTypes: ["error-types"] as const,
  // Sob "exercises" para que registrar ou excluir tentativas atualize o caderno.
  notebook: (params: QueryParams) => ["exercises", "notebook", params] as const,
};

export function useExercises(params: QueryParams) {
  return useQuery({
    queryKey: exerciseKeys.list(params),
    queryFn: () => listExercises(params),
    placeholderData: keepPreviousData,
  });
}

export function useExercise(id: string) {
  return useQuery({ queryKey: exerciseKeys.detail(id), queryFn: () => getExercise(id) });
}

export function useExerciseAttempts(id: string) {
  return useQuery({ queryKey: exerciseKeys.attempts(id), queryFn: () => listExerciseAttempts(id) });
}

export function useSources() {
  return useQuery({ queryKey: exerciseKeys.sources, queryFn: listSources });
}

export function useErrorTypes() {
  return useQuery({ queryKey: exerciseKeys.errorTypes, queryFn: listErrorTypes });
}

export function useErrorNotebook(params: QueryParams) {
  return useQuery({
    queryKey: exerciseKeys.notebook(params),
    queryFn: () => listAttempts(params),
    placeholderData: keepPreviousData,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getDiscipline, getTopicTree, listDisciplines } from "@/features/disciplines/api";

export const disciplineKeys = {
  all: ["disciplines"] as const,
  list: (archived: boolean) => ["disciplines", "list", archived] as const,
  detail: (id: string) => ["disciplines", "detail", id] as const,
};

export const topicKeys = {
  all: ["topics"] as const,
  tree: (disciplineId: string) => ["topics", "tree", disciplineId] as const,
};

export function useDisciplines(archived = false) {
  return useQuery({
    queryKey: disciplineKeys.list(archived),
    queryFn: () => listDisciplines(archived),
  });
}

export function useDiscipline(id: string) {
  return useQuery({ queryKey: disciplineKeys.detail(id), queryFn: () => getDiscipline(id) });
}

export function useTopicTree(disciplineId: string) {
  return useQuery({
    queryKey: topicKeys.tree(disciplineId),
    queryFn: () => getTopicTree(disciplineId),
    enabled: Boolean(disciplineId),
  });
}

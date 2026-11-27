"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getActiveSession, listSessions } from "@/features/sessions/api";

export const sessionKeys = {
  all: ["sessions"] as const,
  active: ["sessions", "active"] as const,
  list: (page: number) => ["sessions", "list", page] as const,
};

export function useActiveSession() {
  return useQuery({
    queryKey: sessionKeys.active,
    queryFn: getActiveSession,
    // Mantém o cronômetro correto quando a aba volta a ser usada.
    refetchOnWindowFocus: true,
  });
}

export function useSessions(page: number) {
  return useQuery({
    queryKey: sessionKeys.list(page),
    queryFn: () => listSessions(page),
    placeholderData: keepPreviousData,
  });
}

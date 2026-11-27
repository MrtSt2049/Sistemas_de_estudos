import { apiRequest } from "@/lib/api-client";
import { toQuery, type Page } from "@/lib/crud";
import type { components } from "@/types/api";

type Schemas = components["schemas"];
export type StudySession = Schemas["StudySession"];
export type ActivityKind = Schemas["ActivityKindEnum"];
export type SessionStartInput = Schemas["SessionStartRequest"];
export type SessionFinishInput = Schemas["SessionFinishRequest"];
export type ManualSessionInput = Schemas["StudySessionRequest"];

/** A API responde 204 quando não há sessão; o cache do TanStack não aceita undefined. */
export const getActiveSession = async (): Promise<StudySession | null> =>
  (await apiRequest<StudySession | undefined>("/study-sessions/active/")) ?? null;

export const startSession = (data: SessionStartInput) =>
  apiRequest<StudySession>("/study-sessions/start/", { method: "POST", body: data });

export const finishSession = (data: SessionFinishInput) =>
  apiRequest<StudySession>("/study-sessions/active/finish/", { method: "POST", body: data });

export const createManualSession = (data: ManualSessionInput) =>
  apiRequest<StudySession>("/study-sessions/", { method: "POST", body: data });

export const listSessions = (page: number) =>
  apiRequest<Page<StudySession>>(`/study-sessions/${toQuery({ page })}`);

export const deleteSession = (id: string) =>
  apiRequest<void>(`/study-sessions/${id}/`, { method: "DELETE" });

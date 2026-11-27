import { apiRequest } from "@/lib/api-client";
import { fetchAll } from "@/lib/crud";
import type { components } from "@/types/api";

type Schemas = components["schemas"];
export type CalendarItem = Schemas["CalendarItem"];
export type CalendarEvent = Schemas["CalendarEvent"];
export type CalendarEventInput = Schemas["CalendarEventRequest"];
export type EventKind = Schemas["CalendarEventKindEnum"];
export type WeeklyProfile = Schemas["WeeklyPlanProfile"];
export type BlockInput = Schemas["WeeklyPlanBlockRequest"];

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  class: "Aula",
  exam: "Prova",
  study: "Estudo",
  competition: "Competição",
  deadline: "Entrega",
  workout: "Treino físico",
  personal: "Pessoal",
};

export const getCalendar = (start: string, end: string) =>
  apiRequest<CalendarItem[]>(`/calendar/?start=${start}&end=${end}`);

export const getEvent = (id: string) => apiRequest<CalendarEvent>(`/events/${id}/`);

export const saveEvent = ({ id, data }: { id?: string; data: CalendarEventInput }) =>
  id
    ? apiRequest<CalendarEvent>(`/events/${id}/`, { method: "PATCH", body: data })
    : apiRequest<CalendarEvent>("/events/", { method: "POST", body: data });

export const deleteEvent = (id: string) => apiRequest<void>(`/events/${id}/`, { method: "DELETE" });

export const listProfiles = () => fetchAll<WeeklyProfile>("/week-profiles/");

export const createProfile = (name: string) =>
  apiRequest<WeeklyProfile>("/week-profiles/", { method: "POST", body: { name } });

export const activateProfile = (id: string) =>
  apiRequest<WeeklyProfile>(`/week-profiles/${id}/activate/`, { method: "POST" });

export const deleteProfile = (id: string) =>
  apiRequest<void>(`/week-profiles/${id}/`, { method: "DELETE" });

export const applyProfile = ({ id, weekStart }: { id: string; weekStart: string }) =>
  apiRequest<Schemas["ApplyResult"]>(`/week-profiles/${id}/apply/`, {
    method: "POST",
    body: { week_start: weekStart },
  });

export const createBlock = (data: BlockInput) =>
  apiRequest<Schemas["WeeklyPlanBlock"]>("/week-blocks/", { method: "POST", body: data });

export const deleteBlock = (id: string) =>
  apiRequest<void>(`/week-blocks/${id}/`, { method: "DELETE" });

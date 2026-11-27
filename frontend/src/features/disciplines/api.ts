import { apiRequest } from "@/lib/api-client";
import { fetchAll } from "@/lib/crud";
import type { components } from "@/types/api";

type Schemas = components["schemas"];
export type Discipline = Schemas["Discipline"];
export type DisciplineKind = Schemas["KindEnum"];
export type DisciplineInput = Schemas["DisciplineRequest"];
export type Topic = Schemas["Topic"];
export type TopicNode = Omit<Schemas["TopicNode"], "children"> & { children: TopicNode[] };
export type TopicStatus = Schemas["StatusEnum"];

export const listDisciplines = (archived: boolean) =>
  fetchAll<Discipline>("/disciplines/", { archived });

export const getDiscipline = (id: string) => apiRequest<Discipline>(`/disciplines/${id}/`);

export const saveDiscipline = ({ id, data }: { id?: string; data: DisciplineInput }) =>
  id
    ? apiRequest<Discipline>(`/disciplines/${id}/`, { method: "PATCH", body: data })
    : apiRequest<Discipline>("/disciplines/", { method: "POST", body: data });

export const setArchived = ({ id, archived }: { id: string; archived: boolean }) =>
  apiRequest<Discipline>(`/disciplines/${id}/${archived ? "archive" : "unarchive"}/`, {
    method: "POST",
  });

export const reorderDisciplines = (ids: string[]) =>
  apiRequest<void>("/disciplines/reorder/", { method: "POST", body: { ids } });

export const deleteDiscipline = (id: string) =>
  apiRequest<void>(`/disciplines/${id}/`, { method: "DELETE" });

export const getTopicTree = (disciplineId: string) =>
  apiRequest<TopicNode[]>(`/topics/tree/?discipline=${disciplineId}`);

export const createTopic = (data: { discipline: string; title: string; parent: string | null }) =>
  apiRequest<Topic>("/topics/", { method: "POST", body: data });

export const updateTopic = ({
  id,
  data,
}: {
  id: string;
  data: { title?: string; description?: string; status?: TopicStatus };
}) => apiRequest<Topic>(`/topics/${id}/`, { method: "PATCH", body: data });

export const moveTopic = ({
  id,
  parent,
  position,
}: {
  id: string;
  parent: string | null;
  position: number;
}) => apiRequest<Topic>(`/topics/${id}/move/`, { method: "POST", body: { parent, position } });

export const deleteTopic = (id: string) =>
  apiRequest<void>(`/topics/${id}/`, { method: "DELETE" });

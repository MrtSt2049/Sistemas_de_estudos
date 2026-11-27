import { apiRequest } from "@/lib/api-client";
import { fetchAll, toQuery, type Page, type QueryParams } from "@/lib/crud";
import type { components } from "@/types/api";

type Schemas = components["schemas"];
export type Exercise = Schemas["Exercise"];
export type ExerciseInput = Schemas["ExerciseRequest"];
export type ExerciseSource = Schemas["ExerciseSource"];
export type SourceKind = Schemas["ExerciseSourceKindEnum"];
export type ErrorType = Schemas["ErrorType"];
export type Attempt = Schemas["Attempt"];
export type AttemptInput = Schemas["AttemptRequest"];
export type AttemptResult = Schemas["ResultEnum"];
export type ExerciseState = Schemas["StateEnum"];

export const listExercises = (params: QueryParams) =>
  apiRequest<Page<Exercise>>(`/exercises/${toQuery(params)}`);

export const getExercise = (id: string) => apiRequest<Exercise>(`/exercises/${id}/`);

export const saveExercise = ({ id, data }: { id?: string; data: ExerciseInput }) =>
  id
    ? apiRequest<Exercise>(`/exercises/${id}/`, { method: "PATCH", body: data })
    : apiRequest<Exercise>("/exercises/", { method: "POST", body: data });

export const deleteExercise = (id: string) =>
  apiRequest<void>(`/exercises/${id}/`, { method: "DELETE" });

export const listSources = () => fetchAll<ExerciseSource>("/exercise-sources/");

export const createSource = (data: { name: string; kind: SourceKind }) =>
  apiRequest<ExerciseSource>("/exercise-sources/", { method: "POST", body: data });

export const listErrorTypes = () => fetchAll<ErrorType>("/error-types/");

export const listExerciseAttempts = (exerciseId: string) =>
  apiRequest<Page<Attempt>>(`/exercises/${exerciseId}/attempts/?page_size=100`);

export const recordAttempt = ({ exerciseId, data }: { exerciseId: string; data: AttemptInput }) =>
  apiRequest<Schemas["AttemptRecorded"]>(`/exercises/${exerciseId}/attempts/`, {
    method: "POST",
    body: data,
  });

export const deleteAttempt = (id: string) =>
  apiRequest<void>(`/attempts/${id}/`, { method: "DELETE" });

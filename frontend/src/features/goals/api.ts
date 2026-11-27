import { apiRequest } from "@/lib/api-client";
import { toQuery, type Page, type QueryParams } from "@/lib/crud";
import type { components } from "@/types/api";

type Schemas = components["schemas"];
export type Goal = Schemas["Goal"];
export type GoalInput = Schemas["GoalRequest"];
export type GoalMetric = Schemas["MetricEnum"];
export type GoalScope = Schemas["ScopeEnum"];
export type ReviewDraft = Schemas["ReviewDraft"];
export type ReviewPeriodKind = Schemas["ReviewPeriodKindEnum"];

export const METRIC_LABELS: Record<GoalMetric, string> = {
  study_minutes: "Minutos de estudo",
  sessions_count: "Sessões de estudo",
  exercises_attempted: "Exercícios tentados",
  exercises_solved: "Exercícios resolvidos sozinho",
  reviews_done: "Revisões feitas",
  cp_contests: "Contests com rating",
};

export const SCOPE_LABELS: Record<GoalScope, string> = {
  weekly: "Semanal",
  monthly: "Mensal",
  semester: "Semestral",
  yearly: "Anual",
  custom: "Período livre",
};

export const listGoals = (params: QueryParams) =>
  apiRequest<Page<Goal>>(`/goals/${toQuery(params)}`);

export const createGoal = (data: GoalInput) =>
  apiRequest<Goal>("/goals/", { method: "POST", body: data });

export const updateGoal = ({ id, data }: { id: string; data: Schemas["PatchedGoalRequest"] }) =>
  apiRequest<Goal>(`/goals/${id}/`, { method: "PATCH", body: data });

export const deleteGoal = (id: string) => apiRequest<void>(`/goals/${id}/`, { method: "DELETE" });

export const getReviewDraft = (kind: ReviewPeriodKind, date: string) =>
  apiRequest<ReviewDraft>(`/periodic-reviews/draft/${toQuery({ kind, date })}`);

export const saveReview = (data: Schemas["ReviewSaveRequest"]) =>
  apiRequest<Schemas["PeriodicReview"]>("/periodic-reviews/draft/", { method: "POST", body: data });

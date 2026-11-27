import { apiRequest } from "@/lib/api-client";
import type { components } from "@/types/api";

type Schemas = components["schemas"];
export type CpSummary = Schemas["CpSummary"];
export type UpsolveItem = Schemas["UpsolveItem"];

export const getCpSummary = () => apiRequest<CpSummary>("/cp/summary/");

export const getUpsolving = () => apiRequest<Schemas["UpsolvePage"]>("/cp/upsolving/");

export const syncCodeforces = (handle: string) =>
  apiRequest<Schemas["SyncResult"]>("/cp/sync/", { method: "POST", body: { handle } });

export const importUpsolveProblem = (data: Schemas["UpsolveImportRequest"]) =>
  apiRequest<Schemas["ImportedExercise"]>("/cp/upsolving/import/", {
    method: "POST",
    body: data,
  });

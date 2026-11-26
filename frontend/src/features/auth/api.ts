import { apiRequest } from "@/lib/api-client";
import type { components } from "@/types/api";

export type MeResponse = components["schemas"]["Me"];
export type LoginPayload = components["schemas"]["LoginRequest"];

export async function fetchCsrfToken(): Promise<{ csrfToken: string }> {
  return apiRequest<{ csrfToken: string }>("/auth/csrf/");
}

export async function login(payload: LoginPayload): Promise<MeResponse> {
  await fetchCsrfToken();
  return apiRequest<MeResponse>("/auth/login/", {
    method: "POST",
    body: payload,
    skipRefresh: true,
  });
}

export async function logout(): Promise<void> {
  await apiRequest<void>("/auth/logout/", { method: "POST" });
}

export async function fetchMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>("/auth/me/");
}

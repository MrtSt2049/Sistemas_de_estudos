import { ApiError, isApiErrorEnvelope } from "@/lib/errors";

const CLIENT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_URL ?? CLIENT_BASE_URL;
  }
  return CLIENT_BASE_URL;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

const UNSAFE_METHODS = new Set(["POST", "PATCH", "DELETE"]);

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipRefresh?: boolean;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, skipRefresh = false, method = "GET", ...rest } = options;
  const normalizedMethod = method.toUpperCase();
  const reqHeaders = new Headers(headers);

  if (body !== undefined && !reqHeaders.has("Content-Type")) {
    reqHeaders.set("Content-Type", "application/json");
  }

  if (UNSAFE_METHODS.has(normalizedMethod) && typeof document !== "undefined") {
    const csrf = getCookie("csrftoken");
    if (csrf) {
      reqHeaders.set("X-CSRFToken", csrf);
    }
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...rest,
    method: normalizedMethod,
    headers: reqHeaders,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const errCode = isApiErrorEnvelope(payload) ? payload.error.code : "server_error";

    if (
      response.status === 401 &&
      errCode === "token_expired" &&
      !skipRefresh &&
      typeof window !== "undefined"
    ) {
      const refreshRes = await fetch(`${getBaseUrl()}/auth/refresh/`, {
        method: "POST",
        credentials: "include",
      });
      if (refreshRes.ok) {
        return apiRequest<T>(path, { ...options, skipRefresh: true });
      }
    }

    if (isApiErrorEnvelope(payload)) {
      throw new ApiError({
        status: response.status,
        code: payload.error.code,
        message: payload.error.message,
        details: payload.error.details,
        requestId: payload.error.request_id,
      });
    }

    throw new ApiError({ status: response.status, code: "server_error" });
  }

  return payload as T;
}

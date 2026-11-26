export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    request_id?: string;
  };
}

const ERROR_MESSAGES: Record<string, string> = {
  validation_error: "Verifique os campos destacados.",
  not_authenticated: "Sua sessão expirou. Faça login novamente.",
  token_expired: "Sua sessão expirou. Faça login novamente.",
  invalid_credentials: "E-mail ou senha inválidos.",
  permission_denied: "Você não tem permissão para executar esta ação.",
  not_found: "Recurso não encontrado.",
  conflict: "Conflito com o estado atual dos dados.",
  throttled: "Muitas tentativas. Aguarde alguns instantes.",
  server_error: "Ocorreu um erro interno. Tente novamente.",
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, string[]>;
  readonly requestId: string;

  constructor(params: {
    status: number;
    code: string;
    message?: string;
    details?: Record<string, string[]>;
    requestId?: string;
  }) {
    const mapped = ERROR_MESSAGES[params.code] ?? params.message ?? "Erro ao comunicar com o servidor.";
    super(mapped);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details ?? {};
    this.requestId = params.requestId ?? "-";
  }
}

export function isApiErrorEnvelope(payload: unknown): payload is ApiErrorEnvelope {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "object" &&
    (payload as { error: unknown }).error !== null
  );
}

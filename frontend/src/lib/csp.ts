interface Options {
  nonce: string;
  /** Absoluta (outra origem) ou relativa, quando o Next faz proxy da API. */
  apiBaseUrl: string;
  development: boolean;
}

export function buildContentSecurityPolicy({ nonce, apiBaseUrl, development }: Options): string {
  const apiOrigin = apiBaseUrl.startsWith("http") ? new URL(apiBaseUrl).origin : "";
  // O modo de desenvolvimento do Next exige eval e websocket para recarregar.
  const scriptExtra = development ? " 'unsafe-eval'" : "";
  const connectExtra = development ? " ws:" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${scriptExtra}`,
    // KaTeX, Recharts e o Sonner aplicam estilos em linha.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}${connectExtra}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

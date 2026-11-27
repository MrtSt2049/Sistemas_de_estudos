import type { NextConfig } from "next";

// Alternativa para a D-07: com API_PROXY_TARGET, o Next faz proxy da API e o
// navegador fala com uma única origem (use NEXT_PUBLIC_API_BASE_URL=/api/v1).
// Os dois valores são lidos no build.
const proxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Ignorado pelo navegador em HTTP; vale quando servido por HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // O Django exige a barra final; o Next não pode removê-la nas rotas com proxy.
  skipTrailingSlashRedirect: Boolean(proxyTarget),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    if (!proxyTarget) return [];
    return [{ source: "/api/v1/:path*/", destination: `${proxyTarget}/api/v1/:path*/` }];
  },
};

export default nextConfig;

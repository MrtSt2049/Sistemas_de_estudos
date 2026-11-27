import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "@/lib/csp";

const base = { nonce: "abc", development: false };

describe("content security policy", () => {
  it("allows only the nonce for scripts in production", () => {
    const policy = buildContentSecurityPolicy({
      ...base,
      apiBaseUrl: "https://api.example.com/api/v1",
    });

    expect(policy).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic';");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).toContain("connect-src 'self' https://api.example.com;");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("needs no extra origin when the API is proxied", () => {
    expect(buildContentSecurityPolicy({ ...base, apiBaseUrl: "/api/v1" })).toContain(
      "connect-src 'self';",
    );
  });
});

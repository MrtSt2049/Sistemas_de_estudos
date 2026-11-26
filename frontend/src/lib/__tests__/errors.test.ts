import { describe, expect, it } from "vitest";
import { ApiError, isApiErrorEnvelope } from "@/lib/errors";

describe("ApiError", () => {
  it("maps known API codes to pt-BR messages", () => {
    const err = new ApiError({ status: 401, code: "invalid_credentials", requestId: "req-1" });
    expect(err.message).toBe("E-mail ou senha inválidos.");
    expect(err.requestId).toBe("req-1");
  });

  it("detects valid API error envelopes", () => {
    expect(isApiErrorEnvelope({ error: { code: "not_found", message: "x" } })).toBe(true);
    expect(isApiErrorEnvelope(null)).toBe(false);
  });
});

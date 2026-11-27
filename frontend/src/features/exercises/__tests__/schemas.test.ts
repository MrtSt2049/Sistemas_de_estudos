import { describe, expect, it } from "vitest";
import { attemptSchema, toAttemptPayload } from "@/features/exercises/schemas";

const base = {
  result: "partial" as const,
  minutes: "",
  hint_level: "0" as const,
  dominant_error: "",
  key_technique: "",
  notes_md: "",
};

describe("attempt form", () => {
  it("converts minutes to seconds and empty values to null", () => {
    expect(toAttemptPayload({ ...base, minutes: "25" }).duration_seconds).toBe(1500);
    const empty = toAttemptPayload(base);
    expect(empty.duration_seconds).toBeNull();
    expect(empty.dominant_error).toBeNull();
  });

  it("requires a result and rejects negative or fractional minutes", () => {
    expect(attemptSchema.safeParse({ ...base, result: undefined }).success).toBe(false);
    expect(attemptSchema.safeParse({ ...base, minutes: "-1" }).success).toBe(false);
    expect(attemptSchema.safeParse({ ...base, minutes: "1.5" }).success).toBe(false);
  });
});

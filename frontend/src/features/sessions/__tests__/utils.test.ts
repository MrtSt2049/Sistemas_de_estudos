import { describe, expect, it } from "vitest";
import { elapsedSince, formatClock, formatDuration } from "@/features/sessions/utils";

describe("session time helpers", () => {
  it("formats the clock and durations", () => {
    expect(formatClock(3725)).toBe("01:02:05");
    expect(formatClock(-3)).toBe("00:00:00");
    expect(formatDuration(5400)).toBe("1 h 30 min");
    expect(formatDuration(300)).toBe("5 min");
  });

  it("adds only the local interval to the server elapsed time", () => {
    expect(elapsedSince(420, 1_000_000, 1_005_900)).toBe(425);
    expect(elapsedSince(420, 1_000_000, 999_000)).toBe(420);
  });
});

import { describe, expect, it } from "vitest";
import {
  fromDateKey,
  occursOn,
  shiftAnchor,
  toDateKey,
  visibleDays,
} from "@/features/planning/dates";

const keys = (days: Date[]) => days.map(toDateKey);

describe("calendar dates", () => {
  it("pads the month view to whole Monday-based weeks", () => {
    const days = keys(visibleDays("month", fromDateKey("2026-11-15")));

    expect(days[0]).toBe("2026-10-26");
    expect(days.at(-1)).toBe("2026-12-06");
    expect(days).toHaveLength(42);
  });

  it("starts the week on Monday even from a Sunday", () => {
    const days = keys(visibleDays("week", fromDateKey("2026-11-29")));

    expect([days[0], days.at(-1)]).toEqual(["2026-11-23", "2026-11-29"]);
  });

  it("moves between months without skipping short ones", () => {
    expect(toDateKey(shiftAnchor("month", fromDateKey("2027-01-31"), 1))).toBe("2027-02-01");
  });

  it("shows events crossing midnight on both days, not after an exclusive end", () => {
    const event = {
      starts_at: new Date("2026-11-27T23:00:00").toISOString(),
      ends_at: new Date("2026-11-28T01:00:00").toISOString(),
    };
    const allDay = {
      starts_at: new Date("2026-11-27T00:00:00").toISOString(),
      ends_at: new Date("2026-11-28T00:00:00").toISOString(),
    };

    expect(occursOn(event, fromDateKey("2026-11-27"))).toBe(true);
    expect(occursOn(event, fromDateKey("2026-11-28"))).toBe(true);
    expect(occursOn(allDay, fromDateKey("2026-11-28"))).toBe(false);
  });
});

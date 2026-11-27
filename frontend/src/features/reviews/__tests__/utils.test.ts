import { describe, expect, it } from "vitest";
import { ratingFromKey } from "@/features/reviews/utils";

const press = (key: string, extra: Partial<Parameters<typeof ratingFromKey>[0]> = {}) =>
  ratingFromKey({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    repeat: false,
    target: document.body,
    ...extra,
  });

describe("review shortcuts", () => {
  it("maps keys 1 to 4", () => {
    expect(["1", "2", "3", "4"].map((key) => press(key))).toEqual([
      "again",
      "hard",
      "good",
      "easy",
    ]);
    expect(press("5")).toBeNull();
  });

  it("ignores typing, modifiers and held keys", () => {
    expect(press("1", { target: document.createElement("input") })).toBeNull();
    expect(press("1", { ctrlKey: true })).toBeNull();
    expect(press("1", { repeat: true })).toBeNull();
  });
});

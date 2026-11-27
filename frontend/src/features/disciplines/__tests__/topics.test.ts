import { describe, expect, it } from "vitest";
import type { TopicNode } from "@/features/disciplines/api";
import { disciplineSchema } from "@/features/disciplines/schemas";
import { flattenTree } from "@/features/disciplines/utils";

function node(id: string, children: TopicNode[] = []): TopicNode {
  return {
    id,
    title: id,
    description: "",
    status: "not_started",
    position: 0,
    parent: null,
    last_studied_at: null,
    children,
  };
}

describe("flattenTree", () => {
  it("keeps display order and depth", () => {
    const flat = flattenTree([node("a", [node("b", [node("c")])]), node("d")]);

    expect(flat.map(({ node: item, depth }) => `${item.id}${depth}`)).toEqual([
      "a1",
      "b2",
      "c3",
      "d1",
    ]);
  });
});

describe("disciplineSchema", () => {
  it("rejects a blank name and trims the valid one", () => {
    expect(disciplineSchema.safeParse({ name: "  ", kind: "olympiad", code: "" }).success).toBe(
      false,
    );
    expect(disciplineSchema.parse({ name: " Álgebra ", kind: "olympiad", code: "" }).name).toBe(
      "Álgebra",
    );
  });
});

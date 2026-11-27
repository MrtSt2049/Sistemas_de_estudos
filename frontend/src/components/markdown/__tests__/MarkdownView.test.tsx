import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MarkdownView } from "@/components/markdown/MarkdownView";

afterEach(cleanup);

describe("MarkdownView", () => {
  it("never turns raw HTML into elements", () => {
    const { container } = render(
      <MarkdownView>{'<script>alert(1)</script><img src=x onerror="alert(1)">'}</MarkdownView>,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("does not create javascript: links", () => {
    const { container } = render(<MarkdownView>{"[x](javascript:alert(1))"}</MarkdownView>);

    expect(container.querySelector("a")?.getAttribute("href") ?? "").not.toContain("javascript:");
  });

  it("renders math with KaTeX and keeps code literal", () => {
    const { container } = render(
      <MarkdownView>{"Seja $a<b$.\n\n```cpp\nvector<int> v;\n```"}</MarkdownView>,
    );

    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.querySelector("code")?.textContent).toContain("vector<int> v;");
  });
});

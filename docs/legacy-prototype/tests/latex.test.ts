import { describe, it, expect } from "vitest";
import { renderRichLatex } from "../../lib/latex/renderer";

describe("LaTeX & Theorem Block Renderer (lib/latex/renderer.ts)", () => {
  it("renders inline and display KaTeX math and escapes unsafe HTML", () => {
    const html = renderRichLatex(
      "Seja $f(x) = x^2$ com <script>alert(1)</script> e $$\\int_0^1 x\\,dx = \\frac{1}{2}$$"
    );
    expect(html).not.toContain("latex-error");
    expect(html).toContain("katex");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders custom academic blocks (:::teorema, :::demonstracao, :::definicao)", () => {
    const input = `:::teorema [Bolzano-Weierstrass]
Toda sequência limitada em $\\mathbb{R}^n$ possui subsequência convergente.
:::
:::demonstracao
Segue por bissecção sucessiva de cubos compactos.
:::`;
    const html = renderRichLatex(input);
    expect(html).not.toContain("latex-error");
    expect(html).toContain("Teorema");
    expect(html).toContain("Bolzano-Weierstrass");
    expect(html).toContain("Demonstração");
  });

  it("handles invalid LaTeX gracefully without throwing and renders .latex-error", () => {
    const html = renderRichLatex("Fórmula quebrada: $\\frac{1}{2$ fim.");
    expect(html).toContain("latex-error");
    expect(html).toContain("Erro LaTeX");
  });
});


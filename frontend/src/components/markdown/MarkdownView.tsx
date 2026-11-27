import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

/**
 * Markdown + KaTeX seguro (ADR-13): o react-markdown não interpreta HTML bruto
 * (sem rehype-raw) e o KaTeX roda com `trust: false`.
 */
export function MarkdownView({ children }: { children: string }) {
  return (
    <div className="markdown break-words text-sm leading-6 text-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { trust: false, throwOnError: false }]]}
        skipHtml
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

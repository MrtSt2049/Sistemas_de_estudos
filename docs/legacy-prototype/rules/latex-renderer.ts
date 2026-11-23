import katex from 'katex';

const THM_LABELS: Record<string, string> = {
  definicao: 'Definição',
  teorema: 'Teorema',
  proposicao: 'Proposição',
  lema: 'Lema',
  corolario: 'Corolário',
  exemplo: 'Exemplo',
  demonstracao: 'Demonstração',
  observacao: 'Observação',
  hipoteses: 'Hipóteses',
};

export function escapeHtml(str: string): string {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return ch;
    }
  });
}

function renderKatexSafe(tex: string, displayMode: boolean): string {
  try {
    const html = katex.renderToString(tex.trim(), {
      displayMode,
      throwOnError: true,
      strict: false,
      trust: false,
    });
    return displayMode
      ? `<div class="katex-display-scroll">${html}</div>`
      : html;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de sintaxe LaTeX';
    return `<span class="latex-error" role="alert" title="${escapeHtml(msg)}">⚠ Erro LaTeX: <code>${escapeHtml(tex)}</code></span>`;
  }
}

function protectAndRenderMath(input: string): { text: string; store: string[] } {
  const store: string[] = [];
  const replaced = input.replace(
    /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$((?:\\.|[^$\\\n])+?)\$/g,
    (_match, blockDollar, blockBracket, inlineParen, inlineDollar) => {
      const isDisplay = blockDollar !== undefined || blockBracket !== undefined;
      const expr = blockDollar ?? blockBracket ?? inlineParen ?? inlineDollar ?? '';
      const rendered = renderKatexSafe(expr, isDisplay);
      store.push(rendered);
      return `\u0000${store.length - 1}\u0000`;
    }
  );
  return { text: replaced, store };
}

function restoreMath(text: string, store: string[]): string {
  return text.replace(/\u0000(\d+)\u0000/g, (_m, idx) => store[Number(idx)] ?? '');
}

export function renderInlineLatex(raw: string): string {
  const { text, store } = protectAndRenderMath(String(raw ?? ''));
  const escaped = escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  return restoreMath(escaped, store);
}

function renderMarkdownParagraphs(raw: string): string {
  return raw
    .split(/(```[\s\S]*?```)/g)
    .map((part) => {
      if (part.length >= 6 && part.startsWith('```') && part.endsWith('```')) {
        const inner = part.slice(3, -3).replace(/^[\w+#-]*\r?\n/, '');
        return `<pre class="code"><code>${escapeHtml(inner)}</code></pre>`;
      }
      const { text, store } = protectAndRenderMath(part);
      const escaped = escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

      const htmlBlocks = escaped
        .split(/\r?\n{2,}/)
        .map((block) => {
          const trimmed = block.trim();
          if (!trimmed) return '';
          if (/^(- .*(\r?\n|$))+$/.test(trimmed)) {
            const lis = trimmed
              .split(/\r?\n/)
              .map((line) => `<li>${line.slice(2)}</li>`)
              .join('');
            return `<ul>${lis}</ul>`;
          }
          return `<p>${trimmed.replace(/\r?\n/g, '<br/>')}</p>`;
        })
        .join('');

      return restoreMath(htmlBlocks, store);
    })
    .join('');
}

export function renderRichLatex(src: string | null | undefined): string {
  const content = String(src ?? '');
  if (!content.trim()) return '';

  const out: string[] = [];
  const blockRegex = /^:::(\w+)[ \t]*([^\r\n]*)\r?\n([\s\S]*?)\r?\n:::[ \t]*(?:\r?\n|$)/gm;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      out.push(renderMarkdownParagraphs(content.slice(lastIndex, match.index)));
    }
    const kind = match[1].toLowerCase();
    const title = match[2]?.trim();
    const body = match[3] ?? '';
    const label = THM_LABELS[kind] || kind;
    const titleHtml = title ? ` <span>(${renderInlineLatex(title)})</span>` : '';

    out.push(
      `<div class="thm thm-${escapeHtml(kind)}"><div class="thm-h">${escapeHtml(label)}${titleHtml}</div><div class="thm-b">${renderMarkdownParagraphs(body)}</div></div>`
    );
    lastIndex = blockRegex.lastIndex;
  }

  out.push(renderMarkdownParagraphs(content.slice(lastIndex)));
  return out.join('');
}


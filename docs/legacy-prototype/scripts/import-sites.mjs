// Converte os mini-sites de disciplina (data/Disciplinas/site-*) em conteúdo para o banco.
// Saída: db/content/sites.generated.json  →  consumido por db/seed-content.ts
// Uso: node scripts/import-sites.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = process.cwd();
const outFile = path.join(root, 'db', 'content', 'sites.generated.json');

const SITES = [
  { dir: 'site-processos', courseId: 'course-5952008', key: 'pe', label: 'Processos Estocásticos' },
  { dir: 'site-vc', courseId: 'course-5952007', key: 'vc', label: 'Variável Complexa' },
];

const KNOWN_TAGS =
  'p|ul|ol|li|b|strong|i|em|br|span|details|summary|div|table|thead|tbody|tr|td|th|code|sup|sub|h[1-6]|a';

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// HTML do site → texto no dialeto do renderer (parágrafos, "- " e **negrito**, math com \( \) e \[ \]).
export function htmlToRich(html) {
  if (!html) return '';
  let s = String(html);

  // tabelas → linhas "- a | b | c"
  s = s.replace(/<table[\s\S]*?<\/table>/gi, (tbl) => {
    const rows = [...tbl.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) =>
      [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
        .map((c) => c[1].replace(/\s+/g, ' ').trim())
        .join(' | ')
    );
    return '\n\n' + rows.map((r) => '- ' + r).join('\n') + '\n\n';
  });

  // blocos <details> (resolução recolhível) → texto corrido
  s = s.replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, '\n\n**$1.** ');
  s = s.replace(/<\/?details[^>]*>/gi, '\n\n');

  // observações do transcritor
  s = s.replace(/<p class="nota">/gi, '<p>**Nota:** ');

  // listas: cada <li> vira uma linha única "- ..."
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, inner) => '\n- ' + inner.replace(/\s*\n\s*/g, ' ').trim());
  s = s.replace(/<\/?(ul|ol)[^>]*>/gi, '\n\n');

  s = s.replace(/<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n\n').replace(/<p[^>]*>/gi, '\n\n');
  s = s.replace(/<\/div>/gi, '\n\n');

  // remove somente tags conhecidas (um "<" dentro de math, como x<0, permanece)
  s = s.replace(new RegExp(`</?(${KNOWN_TAGS})(\\s[^>]*)?>`, 'gi'), '');
  s = decode(s);

  s = s
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\*\*\s*\*\*/g, '')
    .trim();

  // o renderer só reconhece lista quando o bloco inteiro é feito de linhas "- ":
  // separa listas do texto vizinho, mas mantém itens consecutivos juntos
  const out = [];
  for (const line of s.split('\n')) {
    const isItem = line.startsWith('- ');
    if (isItem && out[out.length - 1] === '' && out[out.length - 2]?.startsWith('- ')) out.pop();
    const prev = out[out.length - 1];
    if (prev !== undefined && prev !== '' && line !== '' && prev.startsWith('- ') !== isItem) out.push('');
    out.push(line);
  }
  return out.join('\n');
}


// Títulos aparecem em texto simples (cartões, listas, revisão): troca o LaTeX por Unicode legível.
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', n: 'ₙ', i: 'ᵢ', k: 'ₖ', j: 'ⱼ' };
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', n: 'ⁿ' };
const SYMBOLS = {
  to: '→', ge: '≥', le: '≤', ne: '≠', pi: 'π', lambda: 'λ', theta: 'θ', sigma: 'σ', mu: 'μ', xi: 'ξ',
  infty: '∞', cdot: '·', times: '×', in: '∈', sum: 'Σ', mathbb: '', mathrm: '', operatorname: '', text: '',
};
export function plainText(src) {
  if (!src) return src;
  let s = String(src);
  s = s.replace(/\\\(|\\\)|\\\[|\\\]|\$/g, '');
  s = s.replace(/\\([a-zA-Z]+)/g, (_m, cmd) => (cmd in SYMBOLS ? SYMBOLS[cmd] : cmd));
  s = s.replace(/_\{([^}]*)\}|_([A-Za-z0-9])/g, (_m, a, b) => {
    const t = a ?? b;
    return [...t].every((c) => c in SUB) ? [...t].map((c) => SUB[c]).join('') : '_' + t;
  });
  s = s.replace(/\^\{([^}]*)\}|\^([A-Za-z0-9])/g, (_m, a, b) => {
    const t = a ?? b;
    return [...t].every((c) => c in SUP) ? [...t].map((c) => SUP[c]).join('') : '^' + t;
  });
  return s.replace(/[{}]/g, '').replace(/\s{2,}/g, ' ').trim();
}

function list(items) {
  return (items ?? []).map((i) => '- ' + htmlToRich(i).replace(/\n+/g, ' ')).join('\n');
}

function loadSite(dir) {
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['teoria', 'provas', 'exercicios']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'data', 'Disciplinas', dir, 'data', `${f}.js`), 'utf8'), ctx);
  }
  return ctx;
}

function solution(q) {
  const parts = [];
  if (q.conteudo) parts.push(`**Conteúdo exigido.** ${htmlToRich(q.conteudo)}`);
  if (q.ideia) parts.push(`**Ideia central.** ${htmlToRich(q.ideia)}`);
  if (q.passos?.length) parts.push(`**Resolução.**\n\n${list(q.passos)}`);
  if (q.resposta) parts.push(`**Resposta.** ${htmlToRich(q.resposta)}`);
  if (q.verificacao) parts.push(`**Verificação.** ${htmlToRich(q.verificacao)}`);
  if (q.erros) parts.push(`**Erros comuns.** ${htmlToRich(q.erros)}`);
  if (q.generalizacao) parts.push(`**Generalização.** ${htmlToRich(q.generalizacao)}`);
  if (q.criterios?.length) parts.push(`**Critérios de correção.**\n\n${list(q.criterios)}`);
  return parts.join('\n\n');
}

const COMP = {
  calculo: 'cálculo',
  demonstracao: 'demonstração',
  interpretacao: 'interpretação',
  aplicacao: 'aplicação',
};

const result = { topics: [], materials: [], questions: [] };

for (const site of SITES) {
  const ctx = loadSite(site.dir);
  const modTitle = (id) => ctx.MODULOS[id] ?? id;

  // ---- tópicos + resumos de teoria (um por módulo) ----
  ctx.TEORIA.forEach((mod, idx) => {
    result.topics.push({
      id: `topic-${site.key}-${mod.id}`,
      courseId: site.courseId,
      unit: plainText(modTitle(mod.id)),
      title: plainText(mod.titulo),
      order: idx + 1,
    });
    const body = [
      `**${mod.titulo}.** ${htmlToRich(mod.resumo)}`,
      ...mod.secoes.map((sec) => `**${sec.t}**\n\n${htmlToRich(sec.h)}`),
    ].join('\n\n');
    result.materials.push({
      id: `mat-teoria-${site.key}-${mod.id}`,
      kind: 'resumo',
      front: 'grad',
      courseId: site.courseId,
      title: plainText(`Teoria — ${mod.titulo}`),
      author: 'Material próprio (resumo)',
      reference: plainText(modTitle(mod.id)),
      status: 'estudando',
      notes: body,
    });
  });

  // ---- folha de consulta ----
  if (ctx.CONSULTA?.length) {
    result.materials.push({
      id: `mat-consulta-${site.key}`,
      kind: 'resumo',
      front: 'grad',
      courseId: site.courseId,
      title: `Folha de consulta — ${site.label}`,
      author: 'Material próprio (resumo)',
      reference: 'Fórmulas e critérios de decisão',
      status: 'estudando',
      notes: ctx.CONSULTA.map((c) => `**${c.t}**\n\n${list(c.itens)}`).join('\n\n'),
    });
  }

  // ---- questões: provas/listas, exercícios inéditos, quiz ----
  const push = (q, kind) => {
    const tags = [
      ...(q.modulos ?? []).map((m) => ctx.TEORIA.find((t) => t.id === m)?.titulo ?? m),
      COMP[q.competencia] ?? q.competencia,
      kind,
    ]
      .filter(Boolean)
      .join(', ');
    const dicas = (q.dicas ?? []).map((d) => htmlToRich(d));
    result.questions.push({
      id: `q-${site.key}-${q.id.toLowerCase()}`,
      track: 'grad',
      courseId: site.courseId,
      title: plainText(q.titulo),
      statement: htmlToRich(q.enunciado),
      source: q.origem,
      number: q.num != null ? String(q.num) : null,
      difficulty: Math.max(1, Math.min(5, q.nivel ?? 3)),
      tags: plainText(tags),
      prerequisites: q.conteudo ? htmlToRich(q.conteudo) : null,
      hint1: dicas[0] ?? null,
      hint2: dicas[1] ?? null,
      hint3: dicas.length > 2 ? dicas.slice(2).join('\n\n') : null,
      officialSolution: solution(q),
    });
  };
  ctx.PROVAS.forEach((q) => push(q, q.tipo === 'prova' ? 'prova/lista' : 'exercício'));
  ctx.EXERCICIOS.forEach((q) => push(q, 'exercício inédito'));

  for (const [modId, items] of Object.entries(ctx.QUIZ ?? {})) {
    items.forEach((it, i) => {
      const letters = 'abcde';
      const opts = it.o.map((o, k) => `- (${letters[k]}) ${htmlToRich(o).replace(/\n+/g, ' ')}`).join('\n');
      result.questions.push({
        id: `q-${site.key}-quiz-${modId}-${i + 1}`,
        track: 'grad',
        courseId: site.courseId,
        title: `Quiz ${modId.replace('m', '')}.${i + 1}`,
        statement: `${htmlToRich(it.q)}\n\n${opts}`,
        source: `Quiz — ${modTitle(modId)}`,
        number: `${modId.replace('m', '')}.${i + 1}`,
        difficulty: 1,
        tags: `${modTitle(modId)}, múltipla escolha, quiz`,
        prerequisites: null,
        hint1: null,
        hint2: null,
        hint3: null,
        officialSolution: `**Resposta.** (${letters[it.ok]}) ${htmlToRich(it.o[it.ok]).replace(/\n+/g, ' ')}\n\n${htmlToRich(it.e)}`,
      });
    });
  }
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(result, null, 1) + '\n', 'utf8');
console.log(
  `topics=${result.topics.length} materials=${result.materials.length} questions=${result.questions.length} → ${path.relative(root, outFile)}`
);

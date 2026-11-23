import type { ContentQuestion } from './types';

export const r = String.raw;

const fence = (text: string) => text.replace(/~~~/g, '```');

type Fields = Omit<ContentQuestion, 'track' | 'courseId' | 'id'> & { n: string | number };

/** Rótulo curto exibido no cartão, derivado do identificador (`cses-1069` → `1069`, `2025-p3a` → `P3A`). */
function label(n: string | number): string | null {
  if (typeof n === 'number') return String(n);
  let m: RegExpExecArray | null;
  if ((m = /^cses-(\d+)$/.exec(n))) return m[1];
  if ((m = /^cf-(\w+)$/.exec(n))) return m[1].toUpperCase();
  if ((m = /^\d{4}-p(\w+)$/.exec(n))) return `P${m[1].toUpperCase()}`;
  if ((m = /^p\d-\d{4}-(\d+)$/.exec(n))) return m[1];
  return null; // exercícios/clássicos sem numeração oficial
}

/** Cria o construtor de questões de uma disciplina/frente: ids estáveis `q-<slug>-<n>`. */
export function bank(track: ContentQuestion['track'], courseId: string | null, slug: string) {
  return ({ n, ...f }: Fields): ContentQuestion => ({
    id: `q-${slug}-${String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    track,
    courseId,
    number: label(n),
    ...f,
    // r`...` não aceita crases: o código é escrito entre ~~~ e convertido aqui para cerca Markdown
    statement: fence(f.statement),
    officialSolution: f.officialSolution ? fence(f.officialSolution) : f.officialSolution,
  });
}

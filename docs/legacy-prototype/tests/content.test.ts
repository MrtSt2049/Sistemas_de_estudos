import { describe, it, expect } from 'vitest';
import { contentMaterials, contentQuestions, contentTopics } from '../../db/content';
import { renderRichLatex } from '../../lib/latex/renderer';

const COURSE_IDS = new Set([
  'course-5952014',
  'course-5952008',
  'course-5952007',
  'course-5952020',
  'course-5952021',
  'course-rad1508',
  'course-rcc1911',
  'course-5952002',
  'course-5952006',
  'course-5952011',
  'course-5952036',
  'course-rec2101',
]);

describe('conteúdo-base (db/content)', () => {
  it('tem ids únicos em tópicos, questões e materiais', () => {
    for (const list of [contentTopics, contentQuestions, contentMaterials]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('só referencia disciplinas existentes no seed', () => {
    for (const t of contentTopics) expect(COURSE_IDS.has(t.courseId), t.id).toBe(true);
    for (const m of contentMaterials) expect(m.courseId && COURSE_IDS.has(m.courseId), m.id).toBe(true);
    for (const q of contentQuestions) {
      if (q.track === 'grad') expect(q.courseId && COURSE_IDS.has(q.courseId), q.id).toBe(true);
      else expect(q.courseId ?? null, q.id).toBeNull();
    }
  });

  it('cobre todas as 12 disciplinas com tópicos e questões', () => {
    for (const id of COURSE_IDS) {
      expect(contentTopics.some((t) => t.courseId === id), `tópicos ${id}`).toBe(true);
      expect(contentQuestions.some((q) => q.courseId === id), `questões ${id}`).toBe(true);
    }
  });

  it('respeita as restrições do schema de questões', () => {
    for (const q of contentQuestions) {
      expect(['grad', 'obmu', 'cp']).toContain(q.track);
      expect(q.difficulty, q.id).toBeGreaterThanOrEqual(1);
      expect(q.difficulty, q.id).toBeLessThanOrEqual(5);
      expect(q.title.trim().length, q.id).toBeGreaterThan(0);
      expect(q.statement.trim().length, q.id).toBeGreaterThan(5);
    }
  });

  it('mantém LaTeX fora de campos exibidos como texto simples (título, tags, tópicos)', () => {
    const raw = /[\\$]/;
    const bad = [
      ...contentQuestions.filter((q) => raw.test(q.title) || raw.test(q.tags ?? '') || raw.test(q.source ?? '')).map((q) => q.id),
      ...contentTopics.filter((t) => raw.test(t.title) || raw.test(t.unit ?? '')).map((t) => t.id),
      ...contentMaterials.filter((m) => raw.test(m.title) || raw.test(m.reference ?? '')).map((m) => m.id),
    ];
    expect(bad).toEqual([]);
  });

  it('renderiza todo texto sem erro de LaTeX nem HTML residual', () => {
    const bad: string[] = [];
    const check = (id: string, field: string, text?: string | null) => {
      if (!text) return;
      const html = renderRichLatex(text);
      if (html.includes('latex-error')) {
        const m = /Erro LaTeX: <code>([^<]{0,80})/.exec(html);
        bad.push(`${id}.${field}: ${m?.[1] ?? ''}`);
      }
    };
    for (const q of contentQuestions) {
      for (const f of ['statement', 'hint1', 'hint2', 'hint3', 'officialSolution', 'prerequisites'] as const) {
        check(q.id, f, q[f]);
      }
    }
    for (const m of contentMaterials) check(m.id, 'notes', m.notes);
    expect(bad).toEqual([]);
  });

  it('as questões da Maratona trazem solução de referência, complexidade e link', () => {
    for (const q of contentQuestions.filter((x) => x.track === 'cp')) {
      expect(q.officialSolution, q.id).toMatch(/```python/);
      expect(q.complexity, q.id).toBeTruthy();
      expect(q.url, q.id).toMatch(/^https:\/\//);
    }
  });
});

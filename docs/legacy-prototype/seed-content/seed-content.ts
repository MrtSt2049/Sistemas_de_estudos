import { eq, sql } from 'drizzle-orm';
import { getDb } from './index';
import { courses, materials, questions, settings, topics } from './schema';
import { CONTENT_VERSION, contentMaterials, contentQuestions, contentTopics } from './content';

const CHUNK = 40;

function chunks<T>(items: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Carrega tópicos, questões e resumos-base.
 * - Só roda quando settings.content_version < CONTENT_VERSION (apagar um item não o traz de volta).
 * - Nunca sobrescreve linhas existentes: edições e progresso (estado, streak, tentativas) ficam intactos.
 * - `force` atualiza apenas os campos de conteúdo dos itens-base, preservando estado e revisão.
 */
export async function runContentSeed(opts: { force?: boolean } = {}) {
  const db = await getDb();
  await db.insert(settings).values({ id: 'default' }).onConflictDoNothing();
  const [current] = await db.select().from(settings).where(eq(settings.id, 'default'));
  if (!opts.force && (current?.contentVersion ?? 0) >= CONTENT_VERSION) {
    return { skipped: true as const, version: current?.contentVersion ?? 0 };
  }

  const existingCourses = new Set((await db.select({ id: courses.id }).from(courses)).map((c) => c.id));
  const courseOrNull = (id?: string | null) => (id && existingCourses.has(id) ? id : null);

  for (const part of chunks(contentTopics.filter((t) => existingCourses.has(t.courseId)))) {
    const q = db.insert(topics).values(part.map((t) => ({ ...t, status: 'nao_iniciado', mastery: 0 })));
    if (opts.force) {
      await q.onConflictDoUpdate({
        target: topics.id,
        set: { unit: sql`excluded.unit`, title: sql`excluded.title`, order: sql`excluded."order"` },
      });
    } else {
      await q.onConflictDoNothing();
    }
  }

  for (const part of chunks(contentQuestions)) {
    const rows = part.map((c) => ({
      id: c.id,
      track: c.track,
      courseId: courseOrNull(c.courseId),
      title: c.title,
      statement: c.statement,
      source: c.source ?? null,
      number: c.number ?? null,
      difficulty: Math.max(1, Math.min(5, c.difficulty)),
      tags: c.tags ?? null,
      prerequisites: c.prerequisites ?? null,
      hint1: c.hint1 ?? null,
      hint2: c.hint2 ?? null,
      hint3: c.hint3 ?? null,
      officialSolution: c.officialSolution ?? null,
      complexity: c.complexity ?? null,
      url: c.url ?? null,
      builtin: true,
    }));
    const q = db.insert(questions).values(rows);
    if (opts.force) {
      await q.onConflictDoUpdate({
        target: questions.id,
        set: {
          title: sql`excluded.title`,
          statement: sql`excluded.statement`,
          source: sql`excluded.source`,
          number: sql`excluded.number`,
          difficulty: sql`excluded.difficulty`,
          tags: sql`excluded.tags`,
          prerequisites: sql`excluded.prerequisites`,
          hint1: sql`excluded.hint_1`,
          hint2: sql`excluded.hint_2`,
          hint3: sql`excluded.hint_3`,
          officialSolution: sql`excluded.official_solution`,
          complexity: sql`excluded.complexity`,
          url: sql`excluded.url`,
        },
      });
    } else {
      await q.onConflictDoNothing();
    }
  }

  for (const part of chunks(contentMaterials)) {
    const rows = part.map((m) => ({ ...m, courseId: courseOrNull(m.courseId) }));
    const q = db.insert(materials).values(rows);
    if (opts.force) {
      await q.onConflictDoUpdate({
        target: materials.id,
        set: { title: sql`excluded.title`, notes: sql`excluded.notes`, reference: sql`excluded.reference` },
      });
    } else {
      await q.onConflictDoNothing();
    }
  }

  await db.update(settings).set({ contentVersion: CONTENT_VERSION }).where(eq(settings.id, 'default'));
  return {
    skipped: false as const,
    version: CONTENT_VERSION,
    topics: contentTopics.length,
    questions: contentQuestions.length,
    materials: contentMaterials.length,
  };
}

if (require.main === module) {
  runContentSeed({ force: process.argv.includes('--force') })
    .then((summary) => {
      console.log('Conteúdo-base:', summary);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Erro ao carregar conteúdo-base:', err);
      process.exit(1);
    });
}

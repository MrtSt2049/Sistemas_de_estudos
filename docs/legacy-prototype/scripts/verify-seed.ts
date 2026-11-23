// Verifica a carga do conteúdo-base em um banco PGlite descartável (DATABASE_URL=file:<pasta>).
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { materials, questions, settings, topics } from '../db/schema';
import { runSeed } from '../db/seed';
import { runContentSeed } from '../db/seed-content';

async function counts() {
  const db = await getDb();
  const [q] = await db.select({ n: sql<number>`count(*)::int` }).from(questions);
  const [t] = await db.select({ n: sql<number>`count(*)::int` }).from(topics);
  const [m] = await db.select({ n: sql<number>`count(*)::int` }).from(materials);
  const [s] = await db.select().from(settings).where(eq(settings.id, 'default'));
  return { questions: q.n, topics: t.n, materials: m.n, contentVersion: s?.contentVersion };
}

async function main() {
  const db = await getDb();
  await runSeed();
  console.log('1ª carga      ', await runContentSeed(), await counts());
  console.log('2ª (sem mudar)', await runContentSeed(), await counts());

  // usuário apaga uma questão-base e registra progresso em outra: nada disso pode ser desfeito
  await db.delete(questions).where(eq(questions.id, 'q-cp-cf-4a'));
  await db.update(questions).set({ state: 'dominada', streak: 3 }).where(eq(questions.id, 'q-cp-cf-1a'));
  console.log('após apagar   ', await runContentSeed(), await counts());

  const forced = await runContentSeed({ force: true });
  const [kept] = await db.select().from(questions).where(eq(questions.id, 'q-cp-cf-1a'));
  console.log('force         ', forced, await counts());
  console.log('progresso preservado:', kept.state === 'dominada' && kept.streak === 3);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });

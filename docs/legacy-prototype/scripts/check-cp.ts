// Executa a solução de referência (bloco ```python) de cada questão da Maratona contra exemplos.
// Uso: npm run content:check-cp   (usa $PYTHON ou "python")
import { spawnSync } from 'node:child_process';
import { contentQuestions } from '../db/content';

type Case = { input: string; expected?: string; check?: (out: string) => string | null };

const lines = (...l: string[]) => l.join('\n') + '\n';

const CASES: Record<string, Case[]> = {
  'q-cp-cses-1068': [{ input: '3\n', expected: '3 10 5 16 8 4 2 1' }],
  'q-cp-cses-1083': [{ input: lines('5', '2 3 1 5'), expected: '4' }],
  'q-cp-cses-1069': [{ input: 'ATTCGGGA\n', expected: '3' }],
  'q-cp-cses-1094': [{ input: lines('5', '3 2 5 1 7'), expected: '5' }],
  'q-cp-cses-1071': [{ input: lines('3', '2 3', '1 1', '4 2'), expected: lines('8', '1', '15').trim() }],
  'q-cp-cses-1072': [{ input: '8\n', expected: [0, 6, 28, 96, 252, 550, 1056, 1848].join('\n') }],
  'q-cp-cses-1618': [{ input: '20\n', expected: '4' }, { input: '1000000000\n', expected: '249999998' }],
  'q-cp-cses-1754': [{ input: lines('3', '2 1', '2 2', '3 3'), expected: 'YES\nNO\nYES' }],
  'q-cp-cses-1621': [{ input: lines('5', '2 3 2 2 3'), expected: '2' }],
  'q-cp-cses-1084': [{ input: lines('4 3 5', '60 45 80 60', '30 60 75'), expected: '2' }],
  'q-cp-cses-1090': [{ input: lines('4 10', '7 2 3 9'), expected: '3' }],
  'q-cp-cses-1619': [{ input: lines('3', '5 8', '2 4', '3 9'), expected: '2' }],
  'q-cp-cses-1629': [{ input: lines('3', '3 5', '4 9', '5 8'), expected: '2' }],
  'q-cp-cses-1640': [
    {
      input: lines('4 8', '2 7 5 1'),
      check: (out) => {
        const [i, j] = out.trim().split(/\s+/).map(Number);
        const a = [2, 7, 5, 1];
        return i !== j && a[i - 1] + a[j - 1] === 8 ? null : `par inválido: ${out}`;
      },
    },
    { input: lines('3 100', '1 2 3'), expected: 'IMPOSSIBLE' },
  ],
  'q-cp-cses-1643': [{ input: lines('8', '-1 3 -2 5 3 -5 2 2'), expected: '9' }, { input: lines('3', '-5 -2 -9'), expected: '-2' }],
  'q-cp-cses-1620': [{ input: lines('3 7', '3 2 5'), expected: '8' }],
  'q-cp-cses-1633': [{ input: '3\n', expected: '4' }, { input: '10\n', expected: '492' }],
  'q-cp-cses-1634': [{ input: lines('3 11', '1 5 7'), expected: '3' }, { input: lines('1 3', '2'), expected: '-1' }],
  'q-cp-cses-1635': [{ input: lines('3 9', '2 3 5'), expected: '8' }],
  'q-cp-cses-1636': [{ input: lines('3 9', '2 3 5'), expected: '3' }],
  'q-cp-cses-1638': [{ input: lines('4', '....', '.*..', '...*', '*...'), expected: '3' }],
  'q-cp-cses-1639': [{ input: lines('LOVE', 'MOVIE'), expected: '2' }],
  'q-cp-cses-1158': [{ input: lines('4 10', '4 8 5 3', '5 12 8 1'), expected: '13' }],
  'q-cp-cses-1192': [{ input: lines('5 8', '########', '#..#...#', '####.#.#', '#..#...#', '########'), expected: '3' }],
  'q-cp-cses-1667': [{ input: lines('5 5', '1 2', '1 3', '1 4', '2 3', '5 4'), expected: '3\n1 4 5' }],
  'q-cp-cses-1671': [{ input: lines('3 4', '1 2 6', '1 3 2', '3 2 3', '1 3 4'), expected: '0 5 2' }],
  'q-cp-cses-1195': [{ input: lines('3 4', '1 2 3', '2 3 1', '1 3 7', '2 1 5'), expected: '2' }],
  'q-cp-cses-1646': [{ input: lines('8 4', '3 2 4 5 1 1 5 3', '2 4', '5 6', '1 8', '3 3'), expected: '11\n2\n24\n4' }],
  'q-cp-cses-1648': [{ input: lines('8 4', '3 2 4 5 1 1 5 3', '2 1 4', '2 5 6', '1 3 1', '2 1 4'), expected: '14\n2\n11' }],
  'q-cp-cf-4a': [{ input: '8\n', expected: 'YES' }, { input: '2\n', expected: 'NO' }, { input: '1\n', expected: 'NO' }],
  'q-cp-cf-1a': [{ input: '6 6 4\n', expected: '4' }, { input: '1000000000 1000000000 1\n', expected: '1000000000000000000' }],
};

// Confere a fórmula da espiral contra uma construção direta da grade.
function spiralGrid(n: number): number[][] {
  const g = Array.from({ length: n }, () => Array(n).fill(0));
  let v = 1;
  for (let m = 1; m <= n; m++) {
    const cells: [number, number][] = [];
    // camada m: percurso depende da paridade (linhas/colunas 1-indexadas)
    if (m % 2 === 0) {
      for (let y = 1; y <= m; y++) cells.push([y, m]);
      for (let x = m - 1; x >= 1; x--) cells.push([m, x]);
    } else {
      for (let x = 1; x <= m; x++) cells.push([m, x]);
      for (let y = m - 1; y >= 1; y--) cells.push([y, m]);
    }
    for (const [y, x] of cells) g[y - 1][x - 1] = v++;
  }
  return g;
}
{
  const g = spiralGrid(12);
  const qs: string[] = [];
  const exp: number[] = [];
  for (let y = 1; y <= 12; y++) for (let x = 1; x <= 12; x++) { qs.push(`${y} ${x}`); exp.push(g[y - 1][x - 1]); }
  CASES['q-cp-cses-1071'].push({ input: `${qs.length}\n${qs.join('\n')}\n`, expected: exp.join('\n') });
}

const py = process.env.PYTHON || 'python';
let failed = 0;
let checked = 0;
const cp = contentQuestions.filter((q) => q.track === 'cp');

for (const q of cp) {
  const code = /```python\n([\s\S]*?)```/.exec(q.officialSolution ?? '')?.[1];
  const cases = CASES[q.id];
  if (!code || !cases) {
    console.log(`SEM TESTE  ${q.id}`);
    failed++;
    continue;
  }
  for (const c of cases) {
    const res = spawnSync(py, ['-c', code], { input: c.input, encoding: 'utf8', timeout: 20000 });
    const out = (res.stdout ?? '').replace(/\r/g, '').trim();
    const err = c.check ? c.check(out) : out === c.expected ? null : `esperado ${JSON.stringify(c.expected)}, obtido ${JSON.stringify(out)} ${res.stderr ?? ''}`;
    checked++;
    if (err) {
      failed++;
      console.log(`FALHOU  ${q.id}: ${err.slice(0, 300)}`);
    }
  }
}
console.log(`${cp.length} questões, ${checked} casos, ${failed} problemas`);
process.exit(failed ? 1 : 0);

import fs from 'fs';
import path from 'path';
import { getDb } from './index';
import {
  courses,
  calendarWeeks,
  pastPapers,
  goals,
  goalSteps,
  events,
  materials,
  settings,
} from './schema';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export async function runSeed() {
  const db = await getDb();
  const dataDir = path.join(process.cwd(), 'data');

  // 1. Settings padrão
  await db
    .insert(settings)
    .values({
      id: 'default',
      maxReschedulesPerDay: 2,
    })
    .onConflictDoNothing();

  // 2. 12 disciplinas de 2026/2 (códigos do protocolo / FFCLRP-USP Matemática Aplicada a Negócios)
  // Campos sem informação nos materiais ficam vazios (null), nunca inventados.
  const coursesData = [
    {
      id: 'course-5952014',
      code: '5952014',
      name: 'Introdução à Probabilidade e Estatística II',
      semester: '2026/2',
      professor: 'Rafael A. Rosales',
      credits: 4,
      block: 'Matemática (OBMU)',
      bibliography:
        'Dantas — Probabilidade: um Curso Introdutório · Morettin & Bussab — Estatística Básica · Bolfarine & Sandoval — Introdução à Inferência Estatística',
      synergy:
        'Condicionamento e independência → problemas de probabilidade da OBMU; Esperança e variância → combinatória probabilística; Passeios aleatórios → reticulados e recorrências; Funções geradoras → Probabilidade e Combinatória.',
    },
    {
      id: 'course-5952008',
      code: '5952008',
      name: 'Processos Estocásticos',
      semester: '2026/2',
      professor: 'Rafael A. Rosales',
      credits: 4,
      block: 'Matemática (OBMU)',
      bibliography: 'Atuncar (2011) · Fernandez (2014)',
      synergy:
        'Cadeias de Markov em tempo discreto, classes de comunicação, tempos de chegada/retorno ($H_A, T_A$), propriedade forte de Markov, passeios aleatórios e distribuição invariante.',
    },
    {
      id: 'course-5952007',
      code: '5952007',
      name: 'Funções de Uma Variável Complexa',
      semester: '2026/2',
      professor: 'Marcelo Rempel Ebert',
      credits: 4,
      block: 'Matemática (OBMU)',
      synergy:
        '1) Forma polar e raízes ($z^n = r^n e^{in\\theta}$); 2) Equações de Cauchy–Riemann; 3) Séries de potências; 4) Integrais complexas e primitivas.',
    },
    {
      id: 'course-5952020',
      code: '5952020',
      name: 'Espaços Métricos',
      semester: '2026/2',
      professor: null,
      credits: 4,
      block: 'Matemática (OBMU)',
      bibliography:
        'Elon Lages Lima — Espaços Métricos · Domingues — Espaços Métricos e Introdução à Topologia',
      synergy: 'Base rigorosa de topologia, compacidade, completude e continuidade para Análise na OBMU.',
    },
    {
      id: 'course-5952021',
      code: '5952021',
      name: 'Equações Diferenciais Ordinárias',
      semester: '2026/2',
      professor: null,
      credits: 4,
      block: 'Matemática (OBMU)',
      bibliography: 'Boyce & DiPrima — Equações Diferenciais Elementares e Problemas de Valores de Contorno',
      synergy: 'Conexão direta com recorrências lineares, funções geradoras e análise.',
    },
    {
      id: 'course-rad1508',
      code: 'RAD1508',
      name: 'Pesquisa Operacional I',
      semester: '2026/2',
      professor: null,
      credits: 4,
      block: 'Aplicada (Maratona)',
      bibliography: 'Hillier & Lieberman — Introdução à Pesquisa Operacional',
      synergy: 'Programação linear, inteira, modelagem em grafos e fluxos (sinergia com Maratona SBC).',
    },
    {
      id: 'course-rcc1911',
      code: 'RCC1911',
      name: 'Contabilidade Empresarial',
      semester: '2026/2',
      professor: 'Lívia Stanzani',
      credits: 4,
      block: 'Negócios',
      bibliography:
        'CPC 00 (R2) · Marion (2022) — Contabilidade Básica · Santos et al. (2022) — Manual de Contabilidade Societária · Assaf Neto (2009)',
      synergy: 'Análise vertical/horizontal, indicadores de liquidez, capital de giro (CCL, NCG, ST) e ciclos operacional/financeiro.',
    },
    {
      id: 'course-5952002',
      code: '5952002',
      name: 'Cálculo Diferencial e Integral II',
      semester: '2026/2',
      professor: null,
      credits: 6,
      block: 'Matemática (OBMU)',
      bibliography: null,
      synergy: 'Séries, sequências, funções de várias variáveis e integrais múltiplas.',
    },
    {
      id: 'course-5952006',
      code: '5952006',
      name: 'Cálculo Numérico',
      semester: '2026/2',
      professor: null,
      credits: 4,
      block: 'Aplicada (Maratona)',
      bibliography: null,
      synergy: 'Sistemas lineares, busca binária contínua, convergência e análise de erro numérico.',
    },
    {
      id: 'course-5952011',
      code: '5952011',
      name: 'Introdução à Computação II',
      semester: '2026/2',
      professor: null,
      credits: 4,
      block: 'Aplicada (Maratona)',
      bibliography: null,
      synergy: 'Estruturas de dados, análise de complexidade e algoritmos fundamentais.',
    },
    {
      id: 'course-5952036',
      code: '5952036',
      name: 'Álgebra Linear e Aplicações',
      semester: '2026/2',
      professor: null,
      credits: 4,
      block: 'Matemática (OBMU)',
      bibliography: 'Elon Lages Lima — Álgebra Linear',
      synergy: 'Espaços vetoriais, transformações lineares, autovalores, polinômio característico e Cayley–Hamilton.',
    },
    {
      id: 'course-rec2101',
      code: 'REC2101',
      name: 'Teoria Microeconômica I',
      semester: '2026/2',
      professor: null,
      credits: 4,
      block: 'Negócios',
      bibliography: null,
      synergy: 'Otimização condicionada, convexidade e teoria da escolha.',
    },
  ];

  for (const c of coursesData) {
    await db
      .insert(courses)
      .values({
        id: c.id,
        code: c.code,
        name: c.name,
        semester: c.semester,
        professor: c.professor,
        credits: c.credits,
        block: c.block,
        bibliography: c.bibliography ?? null,
        synergy: c.synergy ?? null,
        avgRule: 'ponderada',
      })
      .onConflictDoUpdate({
        target: courses.id,
        set: {
          code: c.code,
          name: c.name,
          semester: c.semester,
          professor: c.professor,
          credits: c.credits,
          block: c.block,
          bibliography: c.bibliography ?? null,
          synergy: c.synergy ?? null,
        },
      });
  }

  // 3. 52 semanas do Calendário Mestre (data/calendario-mestre.csv)
  const calCsvPath = path.join(dataDir, 'calendario-mestre.csv');
  if (fs.existsSync(calCsvPath)) {
    const raw = fs.readFileSync(calCsvPath, 'utf8');
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 9) continue;
      const weekNum = Number(cols[0]);
      if (!weekNum) continue;
      await db
        .insert(calendarWeeks)
        .values({
          id: `week-${weekNum}`,
          weekNumber: weekNum,
          startDate: cols[1],
          endDate: cols[2],
          phase: cols[3],
          focus: cols[4],
          hoursObmu: Number(cols[5]) || 0,
          hoursCp: Number(cols[6]) || 0,
          hoursOctobit: Number(cols[7]) || 0,
          hoursFisico: Number(cols[8]) || 0,
          checkpoint: cols[9] || null,
          completed: (cols[10] || '').toLowerCase() === 'sim',
        })
        .onConflictDoUpdate({
          target: calendarWeeks.weekNumber,
          set: {
            startDate: cols[1],
            endDate: cols[2],
            phase: cols[3],
            focus: cols[4],
            hoursObmu: Number(cols[5]) || 0,
            hoursCp: Number(cols[6]) || 0,
            hoursOctobit: Number(cols[7]) || 0,
            hoursFisico: Number(cols[8]) || 0,
            checkpoint: cols[9] || null,
          },
        });
    }
  }

  // 4. 25 linhas do Banco de Provas OBMU (data/banco-provas-obmu.csv)
  const provasCsvPath = path.join(dataDir, 'banco-provas-obmu.csv');
  if (fs.existsSync(provasCsvPath)) {
    const raw = fs.readFileSync(provasCsvPath, 'utf8');
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 4) continue;
      const year = Number(cols[0]);
      if (!year) continue;
      const score = cols[4] !== '' && cols[4] != null ? Number(cols[4]) : null;
      await db
        .insert(pastPapers)
        .values({
          id: `paper-${year}`,
          year,
          format: cols[1],
          plannedUse: cols[2],
          status: cols[3] || 'A fazer',
          score: Number.isNaN(score) ? null : score,
          notes: cols[5] || null,
        })
        .onConflictDoUpdate({
          target: pastPapers.year,
          set: {
            format: cols[1],
            plannedUse: cols[2],
            notes: cols[5] || null,
          },
        });
    }
  }

  // 5. 6 Metas do Protocolo (00-PROTOCOLO-MESTRE.md + 06-FACULDADE-USP.md)
  const goalsSeed = [
    {
      id: 'goal-obmu-2027',
      title: 'Ouro na OBMU 2027 (volume de estudo profundo)',
      description: 'Acumular ~775h de preparação focada em resolução e escrita rigorosa de problemas.',
      type: 'competitiva',
      metric: 'horas',
      front: 'obmu',
      courseId: null,
      targetValue: 775,
      unit: 'h',
      startDate: '2026-10-12',
      endDate: '2027-10-10',
      priority: 'alta',
      completionCriteria: 'Nota >= corte do ouro (meta de simulado = corte médio 2020-2025 × 1,15) e 10 simulados feitos.',
      steps: [
        'Levantar no site da OBM o corte do ouro 2020–2025 (Semana 1)',
        'Concluir fundação (Putnam & Beyond cap. 1, 2, 3, 5, 6 selecionados)',
        'Realizar Simulado #1 ao final do mega-bloco de férias (fev/2027)',
        'Completar Simulados #2 a #8 até agosto/2027',
        'Atingir meta (corte + 15%) nos Simulados #9 e #10 em setembro/2027',
      ],
    },
    {
      id: 'goal-obmu-simulados',
      title: '10 Simulados Completos da OBMU (2 dias cada)',
      description: 'Simulados às 14:00–18:30 corrigidos com rubrica 0/10/25/40/50 e reescritos.',
      type: 'processo',
      metric: 'simulados',
      front: 'obmu',
      courseId: null,
      targetValue: 10,
      unit: 'simulados',
      startDate: '2026-10-12',
      endDate: '2027-09-26',
      priority: 'alta',
      completionCriteria: '10 simulados registrados e reescritos no sistema.',
      steps: [
        'Simulado #1 (fev/2027)',
        'Simulados #2 a #6 (mar–jul/2027)',
        'Simulados #7 e #8 (jul/2027)',
        'Simulados #9 e #10 (ago–set/2027)',
      ],
    },
    {
      id: 'goal-maratona-2027',
      title: 'Bom desempenho na Maratona SBC 2027',
      description: 'Resolver >= 4 problemas na 1ª fase, top-15% da sede e buscar vaga na Final Nacional (~398h).',
      type: 'competitiva',
      metric: 'horas',
      front: 'cp',
      courseId: null,
      targetValue: 398,
      unit: 'h',
      startDate: '2026-10-12',
      endDate: '2027-09-26',
      priority: 'média',
      completionCriteria: 'Time de 3 pessoas formado até jan/2027, >= 8 contests de 5h em equipe e toolkit C++ pronto.',
      steps: [
        'Publicar competitive-programming-toolkit no GitHub',
        'Construir Judge local e gerador de stress test',
        'Definir os 2 colegas do time até 31/01/2027',
        'Imprimir caderno de time revisado (maio–jun/2027)',
      ],
    },
    {
      id: 'goal-octobit-mej',
      title: 'OctoBit Jr no palco do MEJ 2027',
      description: 'Construir cases com números, entregar projeto-âncora e preparar dossiê/pitch de 5 min (teto ~5h/sem).',
      type: 'resultado',
      metric: 'horas',
      front: 'octobit',
      courseId: null,
      targetValue: 246,
      unit: 'h',
      startDate: '2026-10-12',
      endDate: '2027-09-20',
      priority: 'média',
      completionCriteria: '4 cases publicados, dossiê MEJ, deck de 8-10 slides e pitch de 5 min ensaiado 3x.',
      steps: [
        'Fechar proposta comercial Imobiliária + Administradora (Av. do Café)',
        'Colocar MVP 1 e site Next.js em produção (dez/26–fev/27)',
        'Publicar estudo de caso com números e depoimento (jun/2027)',
        'Finalizar vídeo de 90s e ensaiar pitch 3x (jul/2027)',
      ],
    },
    {
      id: 'goal-corpo-biohacking',
      title: 'Salto físico e biohacking com evidência',
      description: '3 treinos de força/sem + Zona 2 + sono 7h30–9h + superávit calórico e proteína (80–110g/dia).',
      type: 'processo',
      metric: 'horas',
      front: 'fisico',
      courseId: null,
      targetValue: 335,
      unit: 'h',
      startDate: '2026-10-12',
      endDate: '2027-10-10',
      priority: 'alta',
      completionCriteria: 'Check-up médico realizado, sprint de 20 dias concluído e consistência >= 5 sessões/semana.',
      steps: [
        'Agendar consulta médica/nutricionista e exames básicos',
        'Completar Sprint Físico de 20 dias (13/10 a 01/11/2026) com teste de 12 min',
        'Iniciar progressão de força A/B/C + Zona 2 (a partir de 02/11/2026)',
      ],
    },
    {
      id: 'goal-faculdade-2026',
      title: 'Fechar o semestre 2026/2 da USP com aprovação segura',
      description: 'Garantir notas seguras em Probabilidade e Estatística II e demais disciplinas sem comprometer a base da OBMU.',
      type: 'resultado',
      metric: 'questoes',
      front: 'grad',
      courseId: null,
      targetValue: 30,
      unit: 'questões',
      startDate: '2026-10-12',
      endDate: '2026-12-20',
      priority: 'alta',
      completionCriteria: 'Resolver P1 2025 e P2 2024 cronometradas e fechar todas as entregas do semestre.',
      steps: [
        'Listar tópicos das provas 3 semanas antes',
        'Resolver P1 2025 e P2 2024 cronometradas 2 semanas antes',
        'Revisar lista de erros 1 semana antes da P2',
      ],
    },
  ];

  for (const g of goalsSeed) {
    await db
      .insert(goals)
      .values({
        id: g.id,
        title: g.title,
        description: g.description,
        type: g.type,
        metric: g.metric,
        front: g.front,
        courseId: g.courseId,
        targetValue: g.targetValue,
        unit: g.unit,
        startDate: g.startDate,
        endDate: g.endDate,
        priority: g.priority,
        completionCriteria: g.completionCriteria,
      })
      .onConflictDoUpdate({
        target: goals.id,
        set: {
          title: g.title,
          description: g.description,
          targetValue: g.targetValue,
          completionCriteria: g.completionCriteria,
        },
      });

    for (let idx = 0; idx < g.steps.length; idx++) {
      const stepId = `${g.id}-step-${idx + 1}`;
      await db
        .insert(goalSteps)
        .values({
          id: stepId,
          goalId: g.id,
          title: g.steps[idx],
          completed: false,
          order: idx + 1,
        })
        .onConflictDoUpdate({
          target: goalSteps.id,
          set: { title: g.steps[idx], order: idx + 1 },
        });
    }
  }

  // 6. 8 Marcos do Protocolo (Datas estimadas entram com o marcador "a confirmar" e estimated=true)
  const milestonesSeed = [
    {
      id: 'milestone-sprint-fisico',
      title: 'Fim do Sprint Físico de 20 dias (Teste de 12 min)',
      date: '2026-11-01',
      estimated: false,
      notes: '13/10 → 01/11/2026 (confirmado no arquivo 04-CORPO-BIOHACKING.md).',
    },
    {
      id: 'milestone-fim-semestre-2026',
      title: 'Fim do semestre 2026/2, P2 e exames (a confirmar)',
      date: '2026-12-13',
      estimated: true,
      notes: 'Data estimada (Dez/2026) — a confirmar com Prof. Rosales / JúpiterWeb.',
    },
    {
      id: 'milestone-simulado-1-obmu',
      title: 'Simulado #1 OBMU + Fim do Mega-bloco de Férias',
      date: '2027-02-21',
      estimated: false,
      notes: 'Checkpoint F1b: fundação concluída + Simulado #1 (2 dias).',
    },
    {
      id: 'milestone-inicio-2027-1',
      title: 'Início do 1º semestre letivo USP 2027 (a confirmar)',
      date: '2027-02-22',
      estimated: true,
      notes: 'Data estimada (Fev/2027) — a confirmar no Calendário USP.',
    },
    {
      id: 'milestone-elon-2027',
      title: 'Competição Elon Lages Lima — 1ª fase da OBMU (a confirmar)',
      date: '2027-08-07',
      estimated: true,
      notes: 'Data estimada (Jun–set/2027) — a confirmar no site oficial da OBM.',
    },
    {
      id: 'milestone-enej-2027',
      title: 'ENEJ / Palco MEJ 2027 (a confirmar)',
      date: '2027-08-28',
      estimated: true,
      notes: 'Data estimada (Fim de ago/2027) — a confirmar com Brasil Júnior / site do ENEJ.',
    },
    {
      id: 'milestone-maratona-1fase-2027',
      title: '1ª Fase da Maratona SBC 2027 (a confirmar)',
      date: '2027-09-04',
      estimated: true,
      notes: 'Data estimada (Ago–set/2027) — a confirmar em maratona.sbc.org.br.',
    },
    {
      id: 'milestone-obmu-2027',
      title: 'Prova da OBMU 2027 — 2ª Fase / Fase Única (a confirmar)',
      date: '2027-10-07',
      estimated: true,
      notes: 'Data estimada (~07–08/10/2027) — a confirmar no calendário oficial da OBM.',
    },
  ];

  for (const m of milestonesSeed) {
    await db
      .insert(events)
      .values({
        id: m.id,
        title: m.title,
        category: 'marco',
        priority: 'alta',
        date: m.date,
        status: 'planejado',
        recurrence: 'none',
        origin: 'manual',
        estimated: m.estimated,
        notes: m.notes,
      })
      .onConflictDoUpdate({
        target: events.id,
        set: {
          title: m.title,
          date: m.date,
          estimated: m.estimated,
          notes: m.notes,
        },
      });
  }

  // 7. Materiais da Bibliografia (01-OBMU, 02-MARATONA, 06-FACULDADE e arquivos em data/)
  const materialsSeed = [
    {
      id: 'mat-putnam-beyond',
      kind: 'livro',
      front: 'obmu',
      courseId: null,
      title: 'Putnam and Beyond (2nd ed.)',
      author: 'Răzvan Gelca & Titu Andreescu',
      reference: 'Cap. 1 (métodos), §2.1-2.3 (álgebra/AL), §3.1-3.4 (análise), cap. 5 (TN), cap. 6 (combinatória)',
      fileUrl: 'data/OBM/putnam-and-beyond-2nbsped-9783319589862-9783319589886_compress.pdf',
      status: 'estudando',
      notes: 'Livro-base da fundação da OBMU (Semanas 2–19).',
    },
    {
      id: 'mat-analise-elon',
      kind: 'livro',
      front: 'obmu',
      courseId: 'course-5952020',
      title: 'Análise Real vol. 1',
      author: 'Elon Lages Lima',
      reference: 'Cap. 3, 4, 6, 7, 8',
      fileUrl: null,
      status: 'catalogado (arquivo não anexado)',
      notes: 'Revisão rigorosa de limites, continuidade, derivadas e integral de Riemann.',
    },
    {
      id: 'mat-al-elon',
      kind: 'livro',
      front: 'obmu',
      courseId: 'course-5952036',
      title: 'Álgebra Linear',
      author: 'Elon Lages Lima',
      reference: 'Espaços, transformações, determinantes, polinômio característico',
      fileUrl: null,
      status: 'catalogado (arquivo não anexado)',
      notes: 'Base teórica para o mega-bloco de férias (Semanas 10–12).',
    },
    {
      id: 'mat-engel',
      kind: 'livro',
      front: 'obmu',
      courseId: null,
      title: 'Problem-Solving Strategies',
      author: 'Arthur Engel',
      reference: 'Invariantes, princípio extremal, gavetas, jogos e combinatória',
      fileUrl: null,
      status: 'catalogado (arquivo não anexado)',
      notes: 'Consulta por técnica olímpica.',
    },
    {
      id: 'mat-func-eq-andreescu',
      kind: 'livro',
      front: 'obmu',
      courseId: null,
      title: 'Functional Equations',
      author: 'Titu Andreescu & Iurie Boreico (2007)',
      reference: 'Equações funcionais em olimpíadas',
      fileUrl: 'data/OBM/Functional Equations - Andresscru, Boreico (2007).pdf',
      status: 'estudando',
      notes: 'Foco da Semana 20 do Calendário Mestre.',
    },
    {
      id: 'mat-olympiad-comb',
      kind: 'livro',
      front: 'obmu',
      courseId: null,
      title: 'Olympiad Combinatorics',
      author: 'Pranav A. Sriram',
      reference: 'Contagem, invariantes, extremal, grafos e método probabilístico',
      fileUrl: 'data/OBM/Olympiad_Combinatorics (1).pdf',
      status: 'estudando',
      notes: 'Aprofundamento de combinatória olímpica.',
    },
    {
      id: 'mat-complex-andreescu',
      kind: 'livro',
      front: 'obmu',
      courseId: 'course-5952007',
      title: 'Números Complexos de A a Z',
      author: 'Titu Andreescu & Dorin Andrica',
      reference: 'Geometria no plano complexo e raízes da unidade',
      fileUrl: null,
      status: 'estudando',
      notes: 'Sinergia direta entre Variáveis Complexas e Semana 32 da OBMU.',
    },
    {
      id: 'mat-dantas-prob',
      kind: 'livro',
      front: 'grad',
      courseId: 'course-5952014',
      title: 'Probabilidade: um Curso Introdutório',
      author: 'Carlos A. B. Dantas',
      reference: 'Condicionamento, variáveis aleatórias e esperança',
      fileUrl: 'data/Disciplinas/Probabilidade_Estatistica_ProcessosEstocasticos/_Probabilidade um Curso Introdutório - Dantas.pdf',
      status: 'estudando',
      notes: 'Bibliografia oficial de Probabilidade e Estatística II.',
    },
    {
      id: 'mat-morettin-bussab',
      kind: 'livro',
      front: 'grad',
      courseId: 'course-5952014',
      title: 'Estatística Básica',
      author: 'Pedro A. Morettin & Wilton O. Bussab',
      reference: 'Estatística descritiva e inferência',
      fileUrl: 'data/Disciplinas/Probabilidade_Estatistica_ProcessosEstocasticos/_Estatística Básica - Morettin e Bussab.pdf',
      status: 'estudando',
      notes: 'Bibliografia oficial de Probabilidade e Estatística II.',
    },
    {
      id: 'mat-bolfarine-sandoval',
      kind: 'livro',
      front: 'grad',
      courseId: 'course-5952014',
      title: 'Introdução à Inferência Estatística',
      author: 'Heleno Bolfarine & Mônica C. Sandoval',
      reference: 'Estimadores, máxima verossimilhança e testes de hipóteses',
      fileUrl: 'data/Disciplinas/Probabilidade_Estatistica_ProcessosEstocasticos/LIVRO_Bolfarine_Sandoval.pdf',
      status: 'estudando',
      notes: 'Referência principal para P2 de Estatística.',
    },
    {
      id: 'mat-espacos-metricos-lima',
      kind: 'livro',
      front: 'grad',
      courseId: 'course-5952020',
      title: 'Espaços Métricos',
      author: 'Elon Lages Lima',
      reference: 'Projeto Euclides (305 p.)',
      fileUrl: 'data/Disciplinas/Espaços_metricos/_Espaços Métricos - Lima 305p (1).pdf',
      status: 'estudando',
      notes: 'Texto base de Espaços Métricos.',
    },
    {
      id: 'mat-boyce-diprima',
      kind: 'livro',
      front: 'grad',
      courseId: 'course-5952021',
      title: 'Equações Diferenciais Elementares e Problemas de Valores de Contorno',
      author: 'William E. Boyce & Richard C. DiPrima',
      reference: 'EDO de 1ª e 2ª ordem, séries e sistemas',
      fileUrl: null,
      status: 'estudando',
      notes: 'Texto base de EDO.',
    },
    {
      id: 'mat-hillier-po',
      kind: 'livro',
      front: 'grad',
      courseId: 'course-rad1508',
      title: 'Introdução à Pesquisa Operacional',
      author: 'Frederick S. Hillier & Gerald J. Lieberman',
      reference: 'Programação linear, simplex, transporte e programação inteira',
      fileUrl: null,
      status: 'estudando',
      notes: 'Texto base de Pesquisa Operacional.',
    },
    {
      id: 'mat-cph-laaksonen',
      kind: 'livro',
      front: 'cp',
      courseId: null,
      title: "Competitive Programmer's Handbook",
      author: 'Antti Laaksonen',
      reference: 'Grafos, programação dinâmica, estruturas de dados e matemática',
      fileUrl: 'data/Maratona_de_programação/book (1).pdf',
      status: 'estudando',
      notes: 'Livro principal da trilha Base e Intermediário da Maratona SBC.',
    },
    {
      id: 'mat-cp4-halim',
      kind: 'livro',
      front: 'cp',
      courseId: null,
      title: 'Competitive Programming 4',
      author: 'Steven Halim & Felix Halim',
      reference: 'Catálogo de estruturas e problemas de competição',
      fileUrl: null,
      status: 'catalogado (arquivo não anexado)',
      notes: 'Referência complementar da trilha da Maratona SBC.',
    },
  ];

  for (const m of materialsSeed) {
    await db
      .insert(materials)
      .values(m)
      .onConflictDoUpdate({
        target: materials.id,
        set: {
          title: m.title,
          author: m.author,
          reference: m.reference,
          fileUrl: m.fileUrl,
          status: m.status,
          notes: m.notes,
        },
      });
  }

  return {
    courses: coursesData.length,
    weeks: 52,
    pastPapers: 25,
    goals: goalsSeed.length,
    milestones: milestonesSeed.length,
    materials: materialsSeed.length,
  };
}

if (require.main === module) {
  runSeed()
    .then((summary) => {
      console.log('Seed concluído com sucesso (idempotente):', summary);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Erro no seed:', err);
      process.exit(1);
    });
}


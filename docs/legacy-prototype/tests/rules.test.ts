import { describe, it, expect } from 'vitest';
import {
  calculateCourseGrades,
  normalizeScore,
  applyQuestionAttempt,
  generateInitialErrorReviews,
  processErrorReviewResponse,
  detectScheduleConflicts,
  expandEventsInRange,
  planWeeklyStudyBlocks,
  proposeRescheduleOverdue,
  calculateGoalProgress,
  calculateMockExamTotal,
  type QuestionStateSnapshot,
} from '@/lib/rules';

describe('Regras de Médias (lib/rules/grades.ts)', () => {
  it('normaliza notas para a escala 0-10 corretamente', () => {
    expect(normalizeScore(7.5, 10)).toBeCloseTo(7.5);
    expect(normalizeScore(40, 50)).toBeCloseTo(8.0);
    expect(normalizeScore(15, 20)).toBeCloseTo(7.5);
  });

  it('calcula média ponderada, peso lançado, pendente e necessária para a meta (cálculo manual conferido)', () => {
    // Cálculo manual:
    // P1: nota 7.0 / 10, peso 2 -> x1 = 7.0, w1*x1 = 14.0
    // Lista: nota 16 / 20, peso 1 -> x2 = 8.0, w2*x2 = 8.0
    // Soma ponderada lançada = 14 + 8 = 22.0; Peso lançado = 3 -> Média parcial = 22 / 3 = 7.3333...
    // P2 pendente: peso 3 (simulação = 9.0 / 10). Peso total = 6, Peso pendente = 3.
    // Meta = 8.0 -> Necessária = (8.0 * 6 - 22) / 3 = (48 - 22) / 3 = 26 / 3 = 8.6666...
    // Projeção simulada = (22 + 3 * 9.0) / 6 = 49 / 6 = 8.1666...
    const res = calculateCourseGrades({
      avgRule: 'ponderada',
      goalAvg: 8.0,
      evaluations: [
        { name: 'P1', maxScore: 10, weight: 2, score: 7.0, done: true },
        { name: 'Lista', maxScore: 20, weight: 1, score: 16, done: true },
        { name: 'P2', maxScore: 10, weight: 3, score: null, simulation: 9.0, done: false },
      ],
    });

    expect(res.launchedWeight).toBe(3);
    expect(res.pendingWeight).toBe(3);
    expect(res.totalWeight).toBe(6);
    expect(res.partialAvg).toBeCloseTo(22 / 3, 5);
    expect(res.neededAvg).toBeCloseTo(26 / 3, 5);
    expect(res.unreachable).toBe(false);
    expect(res.simulatedAvg).toBeCloseTo(49 / 6, 5);
  });

  it('calcula média aritmética ignorando pesos diferentes (w_i = 1) e ignora simulações na média parcial', () => {
    // P1 = 6.0 (peso informado 4, mas regra é aritmética -> w=1)
    // P2 = 9.0 (peso informado 6, mas regra é aritmética -> w=1)
    // P3 pendente com simulação 10.0
    // Média parcial real = (6 + 9) / 2 = 7.5
    const res = calculateCourseGrades({
      avgRule: 'aritmetica',
      goalAvg: 8.0,
      evaluations: [
        { name: 'P1', maxScore: 10, weight: 4, score: 6.0, done: true },
        { name: 'P2', maxScore: 10, weight: 6, score: 9.0, done: true },
        { name: 'P3', maxScore: 10, weight: 2, score: null, simulation: 10.0, done: false },
      ],
    });

    expect(res.partialAvg).toBeCloseTo(7.5, 5);
    expect(res.launchedWeight).toBe(2);
    expect(res.pendingWeight).toBe(1);
    // Meta 8.0 em 3 provas: (8*3 - 15) / 1 = 9.0
    expect(res.neededAvg).toBeCloseTo(9.0, 5);
    expect(res.simulatedAvg).toBeCloseTo((6 + 9 + 10) / 3, 5);
  });

  it('sinaliza meta inalcançável quando média necessária passa de 10 e não calcula quando W_pendente = 0', () => {
    const unreachableRes = calculateCourseGrades({
      avgRule: 'ponderada',
      goalAvg: 8.5,
      evaluations: [
        { name: 'P1', maxScore: 10, weight: 1, score: 5.0, done: true },
        { name: 'P2', maxScore: 10, weight: 1, score: null, done: false },
      ],
    });
    // Necessária = (8.5 * 2 - 5) / 1 = 12.0 > 10
    expect(unreachableRes.neededAvg).toBeCloseTo(12.0, 5);
    expect(unreachableRes.unreachable).toBe(true);

    const noPendingRes = calculateCourseGrades({
      avgRule: 'ponderada',
      goalAvg: 7.0,
      evaluations: [{ name: 'P1', maxScore: 10, weight: 1, score: 8.0, done: true }],
    });
    expect(noPendingRes.pendingWeight).toBe(0);
    expect(noPendingRes.neededAvg).toBeNull();
  });
});

describe('Máquina de Estados de Questões (lib/rules/questions.ts)', () => {
  const initialSnapshot: QuestionStateSnapshot = {
    state: 'nao_iniciada',
    streak: 0,
    nextReview: null,
    attempts: [],
  };

  it('sobe o intervalo na sequência 1, 3, 7, 16, 35, 80 dias a cada acerto sozinho', () => {
    let q = initialSnapshot;
    const dates = [
      '2026-10-01',
      '2026-10-02',
      '2026-10-05',
      '2026-10-12',
      '2026-10-28',
      '2026-12-02',
    ];
    const expectedNext = [
      '2026-10-02', // +1d
      '2026-10-05', // +3d
      '2026-10-12', // +7d
      '2026-10-28', // +16d
      '2026-12-02', // +35d
      '2027-02-20', // +80d
    ];

    dates.forEach((d, idx) => {
      q = applyQuestionAttempt(q, { date: d, result: 'independente', helpUsed: 'nenhuma', hintsCount: 0 });
      expect(q.nextReview).toBe(expectedNext[idx]);
    });
  });

  it('só promove para "dominada" com 2 acertos sozinho consecutivos separados por pelo menos 3 dias', () => {
    let q = initialSnapshot;
    // 1º acerto sozinho
    q = applyQuestionAttempt(q, { date: '2026-10-01', result: 'independente' });
    expect(q.state).toBe('independente');

    // 2º acerto sozinho apenas 2 dias depois -> ainda 'independente'
    q = applyQuestionAttempt(q, { date: '2026-10-03', result: 'independente' });
    expect(q.state).toBe('independente');

    // 3º acerto sozinho 3 dias depois do anterior -> vira 'dominada'
    q = applyQuestionAttempt(q, { date: '2026-10-06', result: 'independente' });
    expect(q.state).toBe('dominada');
  });

  it('TESTE OBRIGATÓRIO: uma questão resolvida com ajuda nunca vira "dominada"', () => {
    let q = initialSnapshot;

    // Mesmo que o usuário tente enviar result='independente', se usou pista ou ajuda, é tratada como 'ajuda'
    for (const date of ['2026-10-01', '2026-10-05', '2026-10-10', '2026-10-20']) {
      q = applyQuestionAttempt(q, {
        date,
        result: 'ajuda',
        helpUsed: 'dica',
        hintsCount: 1,
      });
      expect(q.state).toBe('ajuda');
      expect(q.state).not.toBe('dominada');
      expect(q.streak).toBe(0);
    }

    // Também quando envia result='independente' mas usou pista (hintsCount > 0) ou solução completa
    let q2 = applyQuestionAttempt(initialSnapshot, {
      date: '2026-10-01',
      result: 'independente',
      helpUsed: 'nenhuma',
      hintsCount: 0,
    });
    q2 = applyQuestionAttempt(q2, {
      date: '2026-10-06',
      result: 'independente',
      helpUsed: 'dica',
      hintsCount: 1,
    });
    expect(q2.state).toBe('ajuda');
    expect(q2.state).not.toBe('dominada');
    expect(q2.streak).toBe(0);
    expect(q2.nextReview).toBe('2026-10-08'); // +2 dias
  });

  it('erro volta para revisão em 1 dia e muda estado para "revisao" (se já era independente/dominada) ou "andamento"', () => {
    let q = applyQuestionAttempt(initialSnapshot, { date: '2026-10-01', result: 'erro' });
    expect(q.state).toBe('andamento');
    expect(q.nextReview).toBe('2026-10-02');

    q = applyQuestionAttempt(q, { date: '2026-10-02', result: 'independente' });
    expect(q.state).toBe('independente');

    q = applyQuestionAttempt(q, { date: '2026-10-05', result: 'erro' });
    expect(q.state).toBe('revisao');
    expect(q.streak).toBe(0);
    expect(q.nextReview).toBe('2026-10-06');
  });
});

describe('Caderno de Erros, Metas, Conflitos, Planejador e Simulados', () => {
  it('gera revisões de erro em +3, +10 e +30 dias e reagenda para amanhã em caso de falha', () => {
    const reviews = generateInitialErrorReviews('2026-10-10');
    expect(reviews.map((r) => r.date)).toEqual(['2026-10-13', '2026-10-20', '2026-11-09']);

    const failed = processErrorReviewResponse(reviews[0], false, '2026-10-13');
    expect(failed.completed).toBe(false);
    expect(failed.date).toBe('2026-10-14');
    expect(failed.failures).toBe(1);

    const passed = processErrorReviewResponse(failed, true, '2026-10-14');
    expect(passed.completed).toBe(true);
    expect(passed.failures).toBe(1);
  });

  it('detecta conflitos de horário no mesmo dia ignorando cancelados e marcos', () => {
    const occs = expandEventsInRange(
      [
        {
          id: '1',
          title: 'Aula Prob II',
          category: 'aula',
          priority: 'alta',
          date: '2026-10-26',
          startTime: '08:00',
          endTime: '10:00',
          status: 'planejado',
        },
        {
          id: '2',
          title: 'Bloco OBMU',
          category: 'estudo',
          priority: 'alta',
          date: '2026-10-26',
          startTime: '09:30',
          endTime: '11:00',
          status: 'planejado',
        },
        {
          id: '3',
          title: 'Cancelado',
          category: 'estudo',
          priority: 'baixa',
          date: '2026-10-26',
          startTime: '08:30',
          endTime: '09:30',
          status: 'cancelado',
        },
      ],
      '2026-10-26',
      '2026-10-26'
    );

    const conflicts = detectScheduleConflicts(occs);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0][0].id).toBe('1');
    expect(conflicts[0][1].id).toBe('2');
  });

  it('planejador aloca blocos de 30-90 min sem sobrepor compromissos e reporta excedente', () => {
    const avail = {
      '0': '07:00-08:30', // 90 min na segunda
      '1': '',
      '2': '',
      '3': '',
      '4': '',
      '5': '',
      '6': '',
    };
    const res = planWeeklyStudyBlocks({
      mondayDate: '2026-10-26',
      todayDate: '2026-10-26',
      desiredHoursByFront: { obmu: 3 }, // Pede 180 min, mas só cabem 90 min
      weeklyAvailability: avail,
      existingEvents: [],
    });

    expect(res.blocks).toHaveLength(1);
    expect(res.blocks[0]).toMatchObject({
      date: '2026-10-26',
      startTime: '07:00',
      endTime: '08:30',
      front: 'obmu',
      minutes: 90,
    });
    expect(res.shortfallMinutes.obmu).toBe(90);
  });

  it('replanejamento respeita limite diário N, prioriza alta e não move aulas/provas', () => {
    const avail = {
      '0': '07:00-08:30,20:00-22:00',
      '1': '07:00-08:30,20:00-22:00',
      '2': '07:00-08:30,20:00-22:00',
      '3': '07:00-08:30,20:00-22:00',
      '4': '07:00-08:30,20:00-22:00',
      '5': '14:00-18:00',
      '6': '14:00-18:00',
    };
    const res = proposeRescheduleOverdue({
      todayDate: '2026-10-26',
      maxPerDay: 1,
      weeklyAvailability: avail,
      allEvents: [
        {
          id: 'fixa',
          title: 'Prova P1',
          category: 'prova',
          priority: 'alta',
          date: '2026-10-24',
          startTime: '10:00',
          endTime: '12:00',
          status: 'planejado',
        },
        {
          id: 'e1',
          title: 'Estudo Baixa',
          category: 'estudo',
          priority: 'baixa',
          date: '2026-10-23',
          startTime: '07:00',
          endTime: '08:00',
          status: 'planejado',
        },
        {
          id: 'e2',
          title: 'Revisão Alta',
          category: 'revisao',
          priority: 'alta',
          date: '2026-10-25',
          startTime: '07:00',
          endTime: '08:00',
          status: 'planejado',
        },
      ],
    });

    // Prova não se move; e2 (alta) vai para 2026-10-27; e1 (baixa) vai para 2026-10-28 (pois maxPerDay = 1)
    expect(res.proposals).toHaveLength(2);
    expect(res.proposals[0].event.id).toBe('e2');
    expect(res.proposals[0].newDate).toBe('2026-10-27');
    expect(res.proposals[1].event.id).toBe('e1');
    expect(res.proposals[1].newDate).toBe('2026-10-28');
  });

  it('calcula progresso de metas exclusivamente de registros reais e valida total de simulado', () => {
    const hours = calculateGoalProgress(
      {
        metric: 'horas',
        front: 'obmu',
        targetValue: 10,
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      },
      {
        sessions: [
          { date: '2026-10-12', front: 'obmu', minutes: 90 },
          { date: '2026-10-15', front: 'obmu', minutes: 60 },
          { date: '2026-10-15', front: 'cp', minutes: 120 },
        ],
        questions: [],
        mockExams: [],
      }
    );
    expect(hours).toBeCloseTo(2.5, 5);

    expect(calculateMockExamTotal([50, 40, 25, 10, 0, 50])).toBe(175);
    expect(() => calculateMockExamTotal([60, 0, 0, 0, 0, 0])).toThrow();
  });
});


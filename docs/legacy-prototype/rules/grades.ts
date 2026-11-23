export interface EvaluationInput {
  id?: string;
  name: string;
  type?: string;
  date?: string | null;
  maxScore: number;
  weight: number;
  score?: number | null;
  simulation?: number | null;
  done?: boolean;
}

export interface CourseGradeInput {
  avgRule: 'ponderada' | 'aritmetica';
  goalAvg?: number | null;
  evaluations: EvaluationInput[];
}

export interface CourseGradeResult {
  partialAvg: number | null;
  launchedWeight: number;
  pendingWeight: number;
  totalWeight: number;
  neededAvg: number | null;
  unreachable: boolean;
  goalGuaranteed: boolean;
  simulatedAvg: number | null;
  gradedEvaluations: EvaluationInput[];
  pendingEvaluations: EvaluationInput[];
}

export function normalizeScore(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return (10 * score) / maxScore;
}

export function isGraded(ev: EvaluationInput): boolean {
  if (ev.score === null || ev.score === undefined || Number.isNaN(Number(ev.score))) {
    return false;
  }
  if (ev.done === false) return false;
  return true;
}

export function calculateCourseGrades(input: CourseGradeInput): CourseGradeResult {
  const { avgRule, goalAvg, evaluations } = input;
  const getWeight = (ev: EvaluationInput) =>
    avgRule === 'aritmetica' ? 1 : Math.max(0, Number(ev.weight) || 0);

  const gradedEvaluations = evaluations.filter(isGraded);
  const pendingEvaluations = evaluations.filter((ev) => !isGraded(ev));

  const launchedWeight = gradedEvaluations.reduce((acc, ev) => acc + getWeight(ev), 0);
  const pendingWeight = pendingEvaluations.reduce((acc, ev) => acc + getWeight(ev), 0);
  const totalWeight = launchedWeight + pendingWeight;

  const weightedSum = gradedEvaluations.reduce(
    (acc, ev) => acc + getWeight(ev) * normalizeScore(Number(ev.score), ev.maxScore),
    0
  );

  const partialAvg = launchedWeight > 0 ? weightedSum / launchedWeight : null;

  // Projeção com simulações: calculada separadamente e rotulada como simulação
  const simulatedPending = pendingEvaluations.filter(
    (ev) => ev.simulation !== null && ev.simulation !== undefined && !Number.isNaN(Number(ev.simulation))
  );

  let simulatedAvg: number | null = null;
  if (simulatedPending.length > 0) {
    const simWeight = simulatedPending.reduce((acc, ev) => acc + getWeight(ev), 0);
    const simSum = simulatedPending.reduce(
      (acc, ev) => acc + getWeight(ev) * normalizeScore(Number(ev.simulation), ev.maxScore),
      0
    );
    const totalSimWeight = launchedWeight + simWeight;
    if (totalSimWeight > 0) {
      simulatedAvg = (weightedSum + simSum) / totalSimWeight;
    }
  }

  let neededAvg: number | null = null;
  let unreachable = false;
  let goalGuaranteed = false;

  if (goalAvg !== null && goalAvg !== undefined && !Number.isNaN(Number(goalAvg)) && pendingWeight > 0) {
    neededAvg = (Number(goalAvg) * totalWeight - weightedSum) / pendingWeight;
    if (neededAvg > 10) {
      unreachable = true;
    } else if (neededAvg <= 0) {
      goalGuaranteed = true;
    }
  }

  return {
    partialAvg,
    launchedWeight,
    pendingWeight,
    totalWeight,
    neededAvg,
    unreachable,
    goalGuaranteed,
    simulatedAvg,
    gradedEvaluations,
    pendingEvaluations,
  };
}


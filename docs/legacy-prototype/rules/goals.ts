export interface GoalInput {
  metric: 'horas' | 'sessoes' | 'questoes' | 'simulados' | 'manual';
  front?: string | null;
  courseId?: string | null;
  targetValue: number;
  currentValue?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface StudySessionRecord {
  date: string;
  front: string;
  courseId?: string | null;
  minutes: number;
}

export interface QuestionWithAttempts {
  id: string;
  track: string;
  courseId?: string | null;
  attempts: { date: string; result: string }[];
}

export interface MockExamRecord {
  date: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
}

export function calculateGoalProgress(
  goal: GoalInput,
  data: {
    sessions: StudySessionRecord[];
    questions: QuestionWithAttempts[];
    mockExams: { date: string }[];
  }
): number {
  const from = goal.startDate || '0000-00-00';
  const to = goal.endDate || '9999-12-31';

  if (goal.metric === 'manual') {
    return Number(goal.currentValue) || 0;
  }

  if (goal.metric === 'horas') {
    const totalMinutes = data.sessions
      .filter(
        (s) =>
          s.date >= from &&
          s.date <= to &&
          (!goal.front || s.front === goal.front) &&
          (!goal.courseId || s.courseId === goal.courseId)
      )
      .reduce((acc, s) => acc + (Number(s.minutes) || 0), 0);
    return totalMinutes / 60;
  }

  if (goal.metric === 'sessoes') {
    return data.sessions.filter(
      (s) =>
        s.date >= from &&
        s.date <= to &&
        (!goal.front || s.front === goal.front) &&
        (!goal.courseId || s.courseId === goal.courseId)
    ).length;
  }

  if (goal.metric === 'questoes') {
    return data.questions.filter(
      (q) =>
        (!goal.front || q.track === goal.front) &&
        (!goal.courseId || q.courseId === goal.courseId) &&
        q.attempts.some(
          (a) => a.result === 'independente' && a.date >= from && a.date <= to
        )
    ).length;
  }

  if (goal.metric === 'simulados') {
    return data.mockExams.filter((m) => m.date >= from && m.date <= to).length;
  }

  return 0;
}

export function calculateMockExamTotal(scores: [number, number, number, number, number, number]): number {
  for (let i = 0; i < 6; i++) {
    const val = Number(scores[i]);
    if (Number.isNaN(val) || val < 0 || val > 50) {
      throw new Error(`A nota da Q${i + 1} deve estar entre 0 e 50.`);
    }
  }
  return scores.reduce((acc, v) => acc + Number(v), 0);
}


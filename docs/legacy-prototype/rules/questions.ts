export type QuestionState =
  | 'nao_iniciada'
  | 'andamento'
  | 'ajuda'
  | 'independente'
  | 'dominada'
  | 'revisao';

export type AttemptResult = 'independente' | 'ajuda' | 'erro';
export type HelpUsed = 'nenhuma' | 'dica' | 'parcial' | 'completa';

export interface QuestionAttemptRecord {
  date: string; // YYYY-MM-DD
  result: AttemptResult;
  helpUsed?: HelpUsed;
  hintsCount?: number;
}

export interface QuestionStateSnapshot {
  state: QuestionState;
  streak: number;
  nextReview: string | null;
  attempts: QuestionAttemptRecord[];
}

export const REVIEW_INTERVALS = [1, 3, 7, 16, 35, 80] as const;

export function parseYmd(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = parseYmd(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatYmd(d);
}

export function diffDays(dateA: string, dateB: string): number {
  const a = parseYmd(dateA).getTime();
  const b = parseYmd(dateB).getTime();
  return Math.round((b - a) / 86400000);
}

export function normalizeAttemptResult(
  rawResult: AttemptResult,
  helpUsed: HelpUsed = 'nenhuma',
  hintsCount: number = 0
): AttemptResult {
  if (rawResult === 'erro') return 'erro';
  if (helpUsed !== 'nenhuma' || hintsCount > 0) {
    return 'ajuda';
  }
  return rawResult;
}

export function applyQuestionAttempt(
  current: QuestionStateSnapshot,
  attempt: QuestionAttemptRecord
): QuestionStateSnapshot {
  const effectiveResult = normalizeAttemptResult(
    attempt.result,
    attempt.helpUsed ?? 'nenhuma',
    attempt.hintsCount ?? 0
  );

  const normalizedAttempt: QuestionAttemptRecord = {
    ...attempt,
    result: effectiveResult,
  };

  const allAttempts = [...current.attempts, normalizedAttempt];
  const prevState = current.state;

  if (effectiveResult === 'independente') {
    const newStreak = (current.streak || 0) + 1;
    const intervalIdx = Math.min(newStreak - 1, REVIEW_INTERVALS.length - 1);
    const nextReview = addDays(attempt.date, REVIEW_INTERVALS[intervalIdx]);

    let nextState: QuestionState = 'independente';

    // "Dominada" só com 2 acertos sozinho consecutivos separados por pelo menos 3 dias
    if (newStreak >= 2) {
      // Verifica os últimos acertos independentes consecutivos no final da fila
      const trailingIndependent: QuestionAttemptRecord[] = [];
      for (let i = allAttempts.length - 1; i >= 0; i--) {
        if (allAttempts[i].result === 'independente') {
          trailingIndependent.unshift(allAttempts[i]);
        } else {
          break;
        }
      }
      if (trailingIndependent.length >= 2) {
        const prevIndep = trailingIndependent[trailingIndependent.length - 2];
        const currIndep = trailingIndependent[trailingIndependent.length - 1];
        if (diffDays(prevIndep.date, currIndep.date) >= 3) {
          nextState = 'dominada';
        }
      }
    }

    return {
      state: nextState,
      streak: newStreak,
      nextReview,
      attempts: allAttempts,
    };
  }

  if (effectiveResult === 'ajuda') {
    return {
      state: 'ajuda',
      streak: 0,
      nextReview: addDays(attempt.date, 2),
      attempts: allAttempts,
    };
  }

  // effectiveResult === 'erro'
  const nextState: QuestionState =
    prevState === 'independente' || prevState === 'dominada' ? 'revisao' : 'andamento';

  return {
    state: nextState,
    streak: 0,
    nextReview: addDays(attempt.date, 1),
    attempts: allAttempts,
  };
}


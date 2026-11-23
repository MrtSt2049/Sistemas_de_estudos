import { addDays } from './questions';

export interface ErrorReviewItem {
  intervalDays: 3 | 10 | 30;
  date: string;
  completed: boolean;
  failures: number;
}

export const ERROR_REVIEW_INTERVALS: readonly (3 | 10 | 30)[] = [3, 10, 30];

export function generateInitialErrorReviews(entryDate: string): ErrorReviewItem[] {
  return ERROR_REVIEW_INTERVALS.map((gap) => ({
    intervalDays: gap,
    date: addDays(entryDate, gap),
    completed: false,
    failures: 0,
  }));
}

export function processErrorReviewResponse(
  review: ErrorReviewItem,
  remembered: boolean,
  todayDate: string
): ErrorReviewItem {
  if (remembered) {
    return {
      ...review,
      completed: true,
    };
  }
  return {
    ...review,
    completed: false,
    date: addDays(todayDate, 1),
    failures: (review.failures || 0) + 1,
  };
}


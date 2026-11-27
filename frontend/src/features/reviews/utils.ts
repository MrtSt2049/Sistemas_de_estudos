import type { ReviewRating } from "@/features/reviews/api";

export const RATINGS: { rating: ReviewRating; label: string; key: string }[] = [
  { rating: "again", label: "Errei", key: "1" },
  { rating: "hard", label: "Difícil", key: "2" },
  { rating: "good", label: "Bom", key: "3" },
  { rating: "easy", label: "Fácil", key: "4" },
];

interface KeyInput {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  repeat: boolean;
  target: EventTarget | null;
}

/** Atalhos 1–4, ignorados ao digitar, com modificadores ou com a tecla presa. */
export function ratingFromKey(event: KeyInput): ReviewRating | null {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return null;
  const target = event.target as HTMLElement | null;
  if (target?.closest?.("input, textarea, select, [contenteditable='true']")) return null;
  return RATINGS.find((item) => item.key === event.key)?.rating ?? null;
}

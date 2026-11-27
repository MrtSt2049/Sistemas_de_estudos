"use client";

import { useQuery } from "@tanstack/react-query";
import { getReviewQueue } from "@/features/reviews/api";

export const reviewKeys = {
  all: ["reviews"] as const,
  queue: ["reviews", "queue"] as const,
};

export function useReviewQueue() {
  return useQuery({ queryKey: reviewKeys.queue, queryFn: getReviewQueue, staleTime: 0 });
}

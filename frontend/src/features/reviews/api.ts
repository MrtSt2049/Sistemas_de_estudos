import { apiRequest } from "@/lib/api-client";
import type { components } from "@/types/api";

type Schemas = components["schemas"];
export type ReviewItem = Schemas["ReviewItem"];
export type ReviewQueue = Schemas["ReviewQueue"];
export type ReviewOutcome = Schemas["ReviewOutcome"];
export type ReviewRating = Schemas["ReviewRatingEnum"];

export const getReviewQueue = () => apiRequest<ReviewQueue>("/reviews/queue/");

export const answerReview = ({
  id,
  rating,
  idempotencyKey,
}: {
  id: string;
  rating: ReviewRating;
  idempotencyKey: string;
}) =>
  apiRequest<ReviewOutcome>(`/reviews/${id}/answer/`, {
    method: "POST",
    body: { rating, idempotency_key: idempotencyKey },
  });

export const scheduleReview = (data: { exercise: string }) =>
  apiRequest<ReviewItem>("/reviews/schedule/", { method: "POST", body: data });

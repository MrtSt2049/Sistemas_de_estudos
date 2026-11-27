"use client";

import Link from "next/link";
import { ErrorState, Skeleton } from "@/components/feedback/states";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useReviewQueue } from "@/features/reviews/queries";

/** Fila do dia no dashboard (RF003). */
export function ReviewQueueCard() {
  const query = useReviewQueue();

  if (query.isLoading) return <Skeleton rows={1} />;
  if (query.isError || !query.data) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }
  const { count } = query.data;

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold">Fila de revisão</h2>
        {count === 0 ? (
          <p className="mt-1 text-sm text-muted">Nenhuma revisão vence hoje.</p>
        ) : (
          <p className="mt-1 text-sm text-muted">
            <span className="font-mono text-2xl text-text">{count}</span>{" "}
            {count === 1 ? "item vencido" : "itens vencidos"}
          </p>
        )}
      </div>
      {count > 0 && (
        <Link href="/review" className={buttonClasses()}>
          Iniciar revisão
        </Link>
      )}
    </Card>
  );
}

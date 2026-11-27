"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { MarkdownView } from "@/components/markdown/MarkdownView";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { answerReview, type ReviewItem, type ReviewRating } from "@/features/reviews/api";
import { reviewKeys, useReviewQueue } from "@/features/reviews/queries";
import { RATINGS, ratingFromKey } from "@/features/reviews/utils";
import { useApiMutation } from "@/lib/use-api-mutation";

export default function ReviewPage() {
  const query = useReviewQueue();
  // A sessão trabalha sobre uma foto da fila; respostas não a reordenam.
  const [items, setItems] = useState<ReviewItem[] | null>(null);

  useEffect(() => {
    if (items === null && query.data && !query.isFetching) setItems(query.data.results);
  }, [items, query.data, query.isFetching]);

  return (
    <section className="mx-auto max-w-3xl space-y-7">
      <PageHeader
        title="Revisão"
        description="Tente resolver antes de ver a solução. Teclas 1 a 4 para avaliar."
      />
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {!query.isError && items === null && <Skeleton />}
      {items?.length === 0 && (
        <EmptyState
          title="Nenhuma revisão vence hoje"
          description="Exercícios não resolvidos sozinho voltam para a fila em 3, 7 e 21 dias."
          action={
            <Link href="/exercises" className={buttonClasses()}>
              Ir para exercícios
            </Link>
          }
        />
      )}
      {items && items.length > 0 && <ReviewSession items={items} onRestart={() => setItems(null)} />}
    </section>
  );
}

function ReviewSession({ items, onRestart }: { items: ReviewItem[]; onRestart: () => void }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [summary, setSummary] = useState<ReviewRating[]>([]);
  // A mesma chave por item torna o reenvio após falha seguro.
  const keys = useRef(new Map<string, string>());
  const item = items[index];

  const mutation = useApiMutation(answerReview, {
    invalidate: [reviewKeys.all],
    onSuccess: (outcome) => {
      setSummary((current) => [...current, outcome.rating as ReviewRating]);
      setIndex((current) => current + 1);
      setRevealed(false);
    },
  });
  const { mutate, isPending } = mutation;

  const answer = useCallback(
    (rating: ReviewRating) => {
      if (!item || isPending) return;
      let key = keys.current.get(item.id);
      if (!key) {
        key = crypto.randomUUID();
        keys.current.set(item.id, key);
      }
      mutate({ id: item.id, rating, idempotencyKey: key });
    },
    [item, isPending, mutate],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const rating = ratingFromKey(event);
      if (rating) {
        event.preventDefault();
        answer(rating);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer]);

  if (!item) {
    return (
      <Card role="status">
        <h2 className="text-sm font-semibold">Resumo da sessão</h2>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {RATINGS.map(({ rating, label }) => (
            <li key={rating}>
              {label}:{" "}
              <span className="font-mono">{summary.filter((value) => value === rating).length}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onRestart}>
            Verificar a fila
          </Button>
          <Link href="/dashboard" className={buttonClasses()}>
            Voltar ao dashboard
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-mono text-xs text-muted" aria-live="polite">
        {index + 1} / {items.length}
      </p>
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted">{item.discipline_name}</p>
        <h2 className="break-words text-lg font-semibold">{item.title}</h2>
        {item.statement_md && <MarkdownView>{item.statement_md}</MarkdownView>}
        {item.exercise && (
          <Link
            href={`/exercises/${item.exercise}`}
            className="inline-block text-sm text-accent underline underline-offset-4"
          >
            Abrir ficha do exercício
          </Link>
        )}
      </Card>

      {item.solution_md &&
        (revealed ? (
          <Card>
            <h3 className="mb-3 text-sm font-semibold">Solução</h3>
            <MarkdownView>{item.solution_md}</MarkdownView>
          </Card>
        ) : (
          <Button variant="secondary" onClick={() => setRevealed(true)}>
            Mostrar solução
          </Button>
        ))}

      <div role="group" aria-label="Avaliação" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {RATINGS.map(({ rating, label, key }) => (
          <Button
            key={rating}
            variant={rating === "good" ? "primary" : "secondary"}
            disabled={isPending}
            aria-keyshortcuts={key}
            onClick={() => answer(rating)}
          >
            {label}
            <kbd className="font-mono text-xs opacity-70">{key}</kbd>
          </Button>
        ))}
      </div>
    </div>
  );
}

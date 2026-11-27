"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorState, Skeleton } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  getReviewDraft,
  METRIC_LABELS,
  saveReview,
  type GoalMetric,
  type ReviewDraft,
  type ReviewPeriodKind,
} from "@/features/goals/api";
import { GoalProgress } from "@/features/goals/components/GoalProgress";
import { fromDateKey, toDateKey } from "@/features/planning/dates";
import { useApiMutation } from "@/lib/use-api-mutation";

const QUESTIONS = [
  ["planned_text", "O que foi planejado?"],
  ["completed_text", "O que foi concluído?"],
  ["evidence_text", "Quais evidências de evolução?"],
  ["obstacles_text", "Quais obstáculos apareceram?"],
  ["adjustments_text", "O que ajustar no próximo período?"],
] as const;
type QuestionKey = (typeof QUESTIONS)[number][0];

export default function PeriodicReviewPage() {
  const [kind, setKind] = useState<ReviewPeriodKind>("weekly");
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const query = useQuery({
    queryKey: ["goals", "review", kind, date],
    queryFn: () => getReviewDraft(kind, date),
    enabled: Boolean(date),
  });

  return (
    <section className="mx-auto max-w-3xl space-y-7">
      <PageHeader
        title="Revisão do período"
        description="Os números vêm dos seus registros. Escreva apenas a análise."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Período">
          <Select value={kind} onChange={(e) => setKind(e.target.value as ReviewPeriodKind)}>
            <option value="weekly">Semana</option>
            <option value="monthly">Mês</option>
          </Select>
        </Field>
        <Field label="Qualquer dia do período">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      {query.isLoading && <Skeleton rows={4} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.data && (
        <Review key={`${query.data.kind}-${query.data.period_start}`} draft={query.data} />
      )}
    </section>
  );
}

function Review({ draft }: { draft: ReviewDraft }) {
  const [texts, setTexts] = useState<Record<QuestionKey, string>>(
    () =>
      Object.fromEntries(QUESTIONS.map(([key]) => [key, draft.review?.[key] ?? ""])) as Record<
        QuestionKey,
        string
      >,
  );
  const save = useApiMutation(saveReview, {
    invalidate: [["goals"]],
    success: "Revisão salva.",
  });
  const day = (key: string) => fromDateKey(key).toLocaleDateString("pt-BR");

  return (
    <>
      <div>
        <h2 className="mb-3 text-sm font-semibold">
          {day(draft.period_start)} a {day(draft.period_end)}
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(Object.keys(METRIC_LABELS) as GoalMetric[]).map((metric) => (
            <Card key={metric} className="sm:p-4">
              <dt className="text-xs text-muted">{METRIC_LABELS[metric]}</dt>
              <dd className="font-mono text-2xl">{draft.numbers[metric]}</dd>
            </Card>
          ))}
        </dl>
      </div>

      {draft.goals.length > 0 && (
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold">Metas do período</h2>
          {draft.goals.map((goal) => (
            <div key={goal.id}>
              <p className="mb-1 break-words text-sm">{goal.title}</p>
              <GoalProgress goal={goal} />
            </div>
          ))}
        </Card>
      )}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate({ kind: draft.kind, date: draft.period_start, ...texts });
        }}
      >
        {QUESTIONS.map(([key, question]) => (
          <Field key={key} label={question}>
            <Textarea
              maxLength={5000}
              value={texts[key]}
              onChange={(e) => setTexts((current) => ({ ...current, [key]: e.target.value }))}
            />
          </Field>
        ))}
        <Button type="submit" pending={save.isPending}>
          Salvar revisão
        </Button>
      </form>
    </>
  );
}

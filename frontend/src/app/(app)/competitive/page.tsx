"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChartCard } from "@/components/charts/ChartCard";
import { EmptyState, ErrorState, FormError, Skeleton } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonClasses } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import {
  getCpSummary,
  getUpsolving,
  importUpsolveProblem,
  syncCodeforces,
  type UpsolveItem,
} from "@/features/cp/api";
import { useDisciplines } from "@/features/disciplines/queries";
import { errorMessage, useApiMutation } from "@/lib/use-api-mutation";

const cpKeys = {
  all: ["cp"] as const,
  summary: ["cp", "summary"] as const,
  upsolving: ["cp", "upsolving"] as const,
};
const TOP_TAGS = 12;

export default function CompetitivePage() {
  const summary = useQuery({ queryKey: cpKeys.summary, queryFn: getCpSummary });
  const [handle, setHandle] = useState("");
  const savedHandle = summary.data?.handle;

  useEffect(() => {
    if (savedHandle) setHandle(savedHandle);
  }, [savedHandle]);

  const sync = useApiMutation(syncCodeforces, {
    invalidate: [cpKeys.all],
    success: "Sincronização concluída.",
    toastError: false,
  });

  if (summary.isLoading) return <Skeleton rows={4} />;
  if (summary.isError || !summary.data) {
    return <ErrorState error={summary.error} onRetry={() => summary.refetch()} />;
  }
  const data = summary.data;
  const synced = Boolean(data.last_synced_at);
  const currentRating = data.rating_history.at(-1)?.new_rating;

  return (
    <section className="mx-auto max-w-5xl space-y-7">
      <PageHeader
        title="Programação competitiva"
        description="Leitura sob demanda da API pública do Codeforces. Nenhuma senha ou chave é pedida."
      />

      <Card className="space-y-3">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (handle.trim()) sync.mutate(handle.trim());
          }}
        >
          <Field label="Handle no Codeforces" className="min-w-56 flex-1">
            <Input
              value={handle}
              maxLength={24}
              autoCapitalize="off"
              spellCheck={false}
              onChange={(e) => setHandle(e.target.value)}
            />
          </Field>
          <Button type="submit" pending={sync.isPending} disabled={!handle.trim()}>
            {sync.isPending ? "Sincronizando..." : "Sincronizar Codeforces"}
          </Button>
        </form>
        <FormError
          message={
            sync.isError
              ? `${errorMessage(sync.error)} Os dados já importados foram mantidos.`
              : undefined
          }
        />
        <p className="text-xs text-muted" aria-live="polite">
          {data.last_synced_at
            ? `Última sincronização: ${new Date(data.last_synced_at).toLocaleString("pt-BR")}`
            : "Ainda não sincronizado."}
          {savedHandle && handle.trim().toLowerCase() !== savedHandle.toLowerCase()
            ? " Trocar de handle substitui os dados importados."
            : ""}
        </p>
      </Card>

      {synced && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <p className="text-xs uppercase tracking-wide text-muted">Problemas resolvidos</p>
              <p className="font-mono text-2xl">{data.solved_count}</p>
              {data.unrated_count > 0 && (
                <p className="text-xs text-muted">{data.unrated_count} sem rating</p>
              )}
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-muted">Rating atual</p>
              <p className="font-mono text-2xl">{currentRating ?? "—"}</p>
            </Card>
          </div>

          <ChartCard
            title="Resolvidos por rating"
            labelName="Rating"
            valueName="Problemas"
            emptyText="Nenhum problema com rating resolvido."
            data={data.by_rating.map((b) => ({ label: String(b.rating), value: b.count }))}
          />
          <ChartCard
            title={`Resolvidos por tag (${TOP_TAGS} mais frequentes)`}
            labelName="Tag"
            valueName="Problemas"
            emptyText="Nenhuma tag nos problemas resolvidos."
            data={data.by_tag.slice(0, TOP_TAGS).map((b) => ({ label: b.tag, value: b.count }))}
          />
          <ChartCard
            title="Evolução do rating"
            labelName="Data"
            valueName="Rating"
            emptyText="Nenhum contest com rating."
            data={data.rating_history.map((point) => ({
              label: new Date(point.happened_at).toLocaleDateString("pt-BR"),
              value: point.new_rating,
            }))}
          />
          <Upsolving />
        </>
      )}
    </section>
  );
}

function Upsolving() {
  const query = useQuery({ queryKey: cpKeys.upsolving, queryFn: getUpsolving });
  const disciplines = useDisciplines();
  const [discipline, setDiscipline] = useState("");
  const importProblem = useApiMutation(importUpsolveProblem, {
    invalidate: [cpKeys.all, ["exercises"]],
    success: "Problema adicionado aos exercícios.",
  });

  const toExercise = (item: UpsolveItem) =>
    item.contest_id != null &&
    importProblem.mutate({
      contest_id: item.contest_id,
      problem_index: item.problem_index,
      discipline,
    });

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">Upsolving: tentados e ainda não aceitos</h2>
      {query.isLoading && <Skeleton />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.data?.count === 0 && (
        <EmptyState
          title="Nenhum problema pendente"
          description="Problemas com submissões recusadas e nenhuma aceita aparecem aqui."
        />
      )}
      {query.data && query.data.count > 0 && (
        <>
          <Field
            label="Disciplina de destino"
            hint="Necessária para adicionar um problema aos exercícios, à revisão e ao caderno de erros."
          >
            <Select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
              <option value="">Escolha</option>
              {disciplines.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <ul className="space-y-3">
            {query.data.results.map((item) => (
              <li key={`${item.contest_id}-${item.problem_index}-${item.problem_name}`}>
                <Card className="flex flex-wrap items-center gap-3 sm:p-4">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline underline-offset-4"
                        >
                          {item.contest_id}
                          {item.problem_index} · {item.problem_name}
                        </a>
                      ) : (
                        item.problem_name
                      )}
                    </p>
                    <p className="text-xs text-muted">{item.tags.join(", ")}</p>
                  </div>
                  {item.rating && <Badge>{item.rating}</Badge>}
                  <span className="font-mono text-xs text-muted">{item.attempts} tentativa(s)</span>
                  {item.exercise ? (
                    <Link
                      href={`/exercises/${item.exercise}`}
                      className={buttonClasses("secondary", "sm")}
                    >
                      Abrir exercício
                    </Link>
                  ) : (
                    item.contest_id != null && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!discipline || importProblem.isPending}
                        onClick={() => toExercise(item)}
                      >
                        Adicionar aos exercícios
                      </Button>
                    )
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

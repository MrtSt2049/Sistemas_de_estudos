"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonClasses } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { useDisciplines } from "@/features/disciplines/queries";
import { updateAttempt, type Attempt } from "@/features/exercises/api";
import { exerciseKeys, useErrorNotebook, useErrorTypes } from "@/features/exercises/queries";
import { RESULT_LABELS } from "@/features/exercises/schemas";
import { useApiMutation } from "@/lib/use-api-mutation";

export default function ErrorNotebookPage() {
  const [discipline, setDiscipline] = useState("");
  const [errorType, setErrorType] = useState("");
  const [rewritten, setRewritten] = useState("false");
  const [page, setPage] = useState(1);
  const disciplines = useDisciplines();
  const errorTypes = useErrorTypes();
  const query = useErrorNotebook({
    has_error: true,
    discipline,
    dominant_error: errorType,
    rewritten,
    page,
  });

  const filter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <section className="mx-auto max-w-4xl space-y-7">
      <PageHeader
        title="Caderno de erros"
        description="Tentativas com erro dominante. Reescreva a solução limpa e registre a técnica-chave."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Disciplina">
          <Select value={discipline} onChange={(e) => filter(setDiscipline)(e.target.value)}>
            <option value="">Todas</option>
            {disciplines.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tipo de erro">
          <Select value={errorType} onChange={(e) => filter(setErrorType)(e.target.value)}>
            <option value="">Todos</option>
            {errorTypes.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reescrita">
          <Select value={rewritten} onChange={(e) => filter(setRewritten)(e.target.value)}>
            <option value="false">Pendentes</option>
            <option value="true">Reescritas</option>
            <option value="">Todas</option>
          </Select>
        </Field>
      </div>

      {query.isLoading && <Skeleton />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.data?.count === 0 && (
        <EmptyState
          title="Nada para mostrar com esses filtros"
          description="As tentativas registradas com um erro dominante aparecem aqui."
          action={
            <Link href="/exercises" className={buttonClasses()}>
              Ir para exercícios
            </Link>
          }
        />
      )}

      <ul className="space-y-3">
        {query.data?.results.map((attempt) => (
          <li key={attempt.id}>
            <NotebookEntry attempt={attempt} />
          </li>
        ))}
      </ul>

      {query.data && (query.data.next || page > 1) && (
        <div className="flex justify-between">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <Button variant="secondary" disabled={!query.data.next} onClick={() => setPage(page + 1)}>
            Próxima
          </Button>
        </div>
      )}
    </section>
  );
}

function NotebookEntry({ attempt }: { attempt: Attempt }) {
  const [technique, setTechnique] = useState(attempt.key_technique ?? "");
  const update = useApiMutation(updateAttempt, {
    invalidate: [exerciseKeys.all],
    success: "Caderno atualizado.",
  });
  const changed = technique.trim() !== (attempt.key_technique ?? "");

  return (
    <Card className="space-y-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/exercises/${attempt.exercise}`}
          className="min-w-0 flex-1 break-words font-medium underline-offset-4 hover:underline"
        >
          {attempt.exercise_title}
        </Link>
        <Badge tone="warn">{attempt.dominant_error_name}</Badge>
        <Badge>{RESULT_LABELS[attempt.result]}</Badge>
      </div>
      <p className="font-mono text-xs text-muted">
        {new Date(attempt.attempted_at ?? "").toLocaleDateString("pt-BR")}
      </p>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          update.mutate({ id: attempt.id, data: { key_technique: technique.trim() } });
        }}
      >
        <Field label="Técnica-chave" className="min-w-56 flex-1">
          <Input value={technique} maxLength={200} onChange={(e) => setTechnique(e.target.value)} />
        </Field>
        <Button type="submit" variant="secondary" disabled={!changed} pending={update.isPending}>
          Salvar
        </Button>
      </form>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4"
          checked={attempt.rewritten ?? false}
          disabled={update.isPending}
          onChange={(e) =>
            update.mutate({ id: attempt.id, data: { rewritten: e.target.checked } })
          }
        />
        Solução reescrita limpa
      </label>
    </Card>
  );
}

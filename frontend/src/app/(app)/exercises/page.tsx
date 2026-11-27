"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { useDisciplines } from "@/features/disciplines/queries";
import { ExerciseForm } from "@/features/exercises/components/ExerciseForm";
import { useExercises, useSources } from "@/features/exercises/queries";
import { STATE_LABELS, STATE_TONES } from "@/features/exercises/schemas";

const FILTERS = ["search", "discipline", "source", "state", "difficulty", "ordering", "page"];
const PAGE_SIZE = 25;

export default function ExercisesPage() {
  // useSearchParams exige um limite de Suspense na pré-renderização.
  return (
    <Suspense fallback={<Skeleton />}>
      <ExerciseList />
    </Suspense>
  );
}

function ExerciseList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [creating, setCreating] = useState(false);
  const disciplines = useDisciplines();
  const sources = useSources();

  const params = Object.fromEntries(
    FILTERS.map((key) => [key, searchParams.get(key) ?? ""]),
  ) as Record<string, string>;
  const query = useExercises(params);
  const page = Number(params.page || "1");

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const filtering = FILTERS.some((key) => key !== "ordering" && key !== "page" && params[key]);

  return (
    <section className="mx-auto max-w-5xl space-y-7">
      <PageHeader
        title="Exercícios"
        description="Problemas, tentativas e estado de cada um."
        actions={<Button onClick={() => setCreating(true)}>Novo exercício</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Buscar">
          <Input
            type="search"
            defaultValue={params.search}
            placeholder="Título ou referência"
            onChange={(e) => setFilter("search", e.target.value)}
          />
        </Field>
        <Field label="Disciplina">
          <Select
            value={params.discipline}
            onChange={(e) => setFilter("discipline", e.target.value)}
          >
            <option value="">Todas</option>
            {disciplines.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fonte">
          <Select value={params.source} onChange={(e) => setFilter("source", e.target.value)}>
            <option value="">Todas</option>
            {sources.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={params.state} onChange={(e) => setFilter("state", e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Dificuldade">
          <Select
            value={params.difficulty}
            onChange={(e) => setFilter("difficulty", e.target.value)}
          >
            <option value="">Todas</option>
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ordenar por">
          <Select value={params.ordering} onChange={(e) => setFilter("ordering", e.target.value)}>
            <option value="">Mais recentes</option>
            <option value="title">Título</option>
            <option value="-external_ref">Referência (decrescente)</option>
            <option value="difficulty">Dificuldade</option>
          </Select>
        </Field>
      </div>

      {query.isLoading && <Skeleton rows={5} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.data && query.data.count === 0 && (
        <EmptyState
          title={filtering ? "Nenhum exercício com esses filtros" : "Nenhum exercício cadastrado"}
          description={
            filtering
              ? "Ajuste ou limpe os filtros para ver outros exercícios."
              : "Cadastre o primeiro exercício para começar a registrar tentativas."
          }
          action={
            filtering ? (
              <Button variant="secondary" onClick={() => router.replace(pathname)}>
                Limpar filtros
              </Button>
            ) : (
              <Button onClick={() => setCreating(true)}>Cadastrar o primeiro</Button>
            )
          }
        />
      )}

      {query.data && query.data.count > 0 && (
        <>
          <p className="font-mono text-xs text-muted">{query.data.count} exercício(s)</p>
          <ul className="space-y-3">
            {query.data.results.map((item) => (
              <li key={item.id}>
                <Card className="flex flex-wrap items-center gap-3 sm:p-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/exercises/${item.id}`}
                      className="break-words font-medium underline-offset-4 hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {item.discipline_name} · {item.source_name}
                      {item.external_ref ? ` · ${item.external_ref}` : ""}
                      {item.difficulty ? ` · dificuldade ${item.difficulty}` : ""}
                    </p>
                  </div>
                  <Badge tone={STATE_TONES[item.state ?? "new"]}>
                    {STATE_LABELS[item.state ?? "new"]}
                  </Badge>
                </Card>
              </li>
            ))}
          </ul>
          {query.data.count > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setFilter("page", String(page - 1))}
              >
                Anterior
              </Button>
              <span className="font-mono text-xs text-muted">
                {page} / {Math.ceil(query.data.count / PAGE_SIZE)}
              </span>
              <Button
                variant="secondary"
                disabled={!query.data.next}
                onClick={() => setFilter("page", String(page + 1))}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={creating} onOpenChange={setCreating} title="Novo exercício">
        <ExerciseForm onSaved={(saved) => router.push(`/exercises/${saved.id}`)} />
      </Dialog>
    </section>
  );
}

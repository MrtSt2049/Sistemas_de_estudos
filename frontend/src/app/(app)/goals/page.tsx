"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState, FormError, Skeleton } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { useDisciplines } from "@/features/disciplines/queries";
import {
  createGoal,
  deleteGoal,
  listGoals,
  METRIC_LABELS,
  SCOPE_LABELS,
  updateGoal,
  type Goal,
  type GoalMetric,
  type GoalScope,
} from "@/features/goals/api";
import { GoalProgress } from "@/features/goals/components/GoalProgress";
import { fromDateKey, toDateKey } from "@/features/planning/dates";
import { errorMessage, useApiMutation } from "@/lib/use-api-mutation";

const goalKeys = { all: ["goals"] as const };
type Filter = "current" | "active" | "done" | "all";
const FILTER_LABELS: Record<Filter, string> = {
  current: "Em andamento hoje",
  active: "Todas as ativas",
  done: "Concluídas",
  all: "Todas",
};
const formatDay = (key: string) => fromDateKey(key).toLocaleDateString("pt-BR");

export default function GoalsPage() {
  const [filter, setFilter] = useState<Filter>("current");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const params = {
    page,
    status: filter === "done" ? "done" : filter === "all" ? "" : "active",
    active_on: filter === "current" ? toDateKey(new Date()) : "",
  };
  const query = useQuery({
    queryKey: [...goalKeys.all, params],
    queryFn: () => listGoals(params),
    placeholderData: keepPreviousData,
  });
  const invalidate = [goalKeys.all, ["calendar"]];
  const update = useApiMutation(updateGoal, { invalidate });
  const remove = useApiMutation(deleteGoal, {
    invalidate,
    success: "Meta excluída.",
    onSuccess: () => setDeleting(null),
  });

  return (
    <section className="mx-auto max-w-4xl space-y-7">
      <PageHeader
        title="Metas"
        description="O progresso é calculado a partir do que foi registrado na plataforma."
        actions={
          <>
            <Link href="/weekly-review" className={buttonClasses("secondary")}>
              Revisão do período
            </Link>
            <Button onClick={() => setCreating(true)}>Nova meta</Button>
          </>
        }
      />
      <Field label="Mostrar" className="max-w-xs">
        <Select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as Filter);
            setPage(1);
          }}
        >
          {Object.entries(FILTER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      {query.isLoading && <Skeleton />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.data?.count === 0 && (
        <EmptyState
          title="Nenhuma meta neste filtro"
          description="Crie uma meta ou importe o calendário mestre pelo comando seed_calendar."
          action={<Button onClick={() => setCreating(true)}>Criar meta</Button>}
        />
      )}
      <ul className="space-y-3">
        {query.data?.results.map((goal) => (
          <li key={goal.id}>
            <Card className="space-y-3 sm:p-4">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-sm font-medium">{goal.title}</h2>
                  <p className="text-xs text-muted">
                    {SCOPE_LABELS[goal.scope]} · {formatDay(goal.period_start)} a{" "}
                    {formatDay(goal.period_end)}
                    {goal.discipline_name ? ` · ${goal.discipline_name}` : ""}
                  </p>
                </div>
                <Select
                  aria-label={`Situação de ${goal.title}`}
                  className="w-auto"
                  value={goal.status ?? "active"}
                  onChange={(e) =>
                    update.mutate({
                      id: goal.id,
                      data: { status: e.target.value as "active" | "done" | "abandoned" },
                    })
                  }
                >
                  <option value="active">Ativa</option>
                  <option value="done">Concluída</option>
                  <option value="abandoned">Abandonada</option>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Excluir ${goal.title}`}
                  onClick={() => setDeleting(goal)}
                >
                  <Trash2 className="size-4" strokeWidth={1.8} />
                </Button>
              </div>
              <GoalProgress goal={goal} />
            </Card>
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

      <Dialog open={creating} onOpenChange={setCreating} title="Nova meta">
        <GoalForm onDone={() => setCreating(false)} />
      </Dialog>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir meta"
        description={`"${deleting?.title}" será apagada. Seus registros de estudo não mudam.`}
        confirmLabel="Excluir"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </section>
  );
}

function GoalForm({ onDone }: { onDone: () => void }) {
  const disciplines = useDisciplines();
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<GoalScope>("weekly");
  const [metric, setMetric] = useState<GoalMetric>("study_minutes");
  const [target, setTarget] = useState("");
  const [start, setStart] = useState(toDateKey(new Date()));
  const [end, setEnd] = useState("");
  const [discipline, setDiscipline] = useState("");
  const create = useApiMutation(createGoal, {
    invalidate: [goalKeys.all, ["calendar"]],
    success: "Meta criada.",
    toastError: false,
    onSuccess: onDone,
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        create.mutate({
          title: title.trim(),
          scope,
          metric,
          target_value: Number(target),
          period_start: start,
          period_end: end,
          discipline: metric === "cp_contests" ? null : discipline || null,
        });
      }}
    >
      <FormError message={create.isError ? errorMessage(create.error) : undefined} />
      <Field label="Título">
        <Input required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Escopo">
          <Select value={scope} onChange={(e) => setScope(e.target.value as GoalScope)}>
            {Object.entries(SCOPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Métrica">
          <Select value={metric} onChange={(e) => setMetric(e.target.value as GoalMetric)}>
            {Object.entries(METRIC_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Alvo">
          <Input
            type="number"
            min={1}
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </Field>
        <Field label="Disciplina">
          <Select
            value={discipline}
            disabled={metric === "cp_contests"}
            onChange={(e) => setDiscipline(e.target.value)}
          >
            <option value="">Todas</option>
            {disciplines.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Início">
          <Input type="date" required value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Fim">
          <Input type="date" required value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      <Button type="submit" pending={create.isPending} className="w-full">
        Criar meta
      </Button>
    </form>
  );
}

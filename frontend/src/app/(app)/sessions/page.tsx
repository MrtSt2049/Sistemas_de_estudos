"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorState, FormError, Skeleton } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useDisciplines } from "@/features/disciplines/queries";
import {
  createManualSession,
  deleteSession,
  type ActivityKind,
  type StudySession,
} from "@/features/sessions/api";
import { sessionKeys, useSessions } from "@/features/sessions/queries";
import { ACTIVITY_LABELS, formatDuration } from "@/features/sessions/utils";
import { errorMessage, useApiMutation } from "@/lib/use-api-mutation";

export default function SessionsPage() {
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<StudySession | null>(null);
  const query = useSessions(page);
  const remove = useApiMutation(deleteSession, {
    invalidate: [sessionKeys.all],
    success: "Sessão excluída.",
    onSuccess: () => setDeleting(null),
  });

  return (
    <section className="mx-auto max-w-4xl space-y-7">
      <PageHeader
        title="Sessões de estudo"
        description="Histórico do cronômetro e registros manuais."
        actions={<Button onClick={() => setCreating(true)}>Registrar manualmente</Button>}
      />

      {query.isLoading && <Skeleton />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.data?.count === 0 && (
        <EmptyState
          title="Nenhuma sessão registrada"
          description="Use o botão Iniciar sessão no topo ou registre um estudo que já aconteceu."
          action={<Button onClick={() => setCreating(true)}>Registrar manualmente</Button>}
        />
      )}

      <ul className="space-y-3">
        {query.data?.results.map((item) => (
          <li key={item.id}>
            <Card className="flex flex-wrap items-center gap-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {ACTIVITY_LABELS[item.activity_kind]}
                  {item.discipline_name ? ` · ${item.discipline_name}` : ""}
                </p>
                <p className="font-mono text-xs text-muted">
                  {new Date(item.started_at).toLocaleString("pt-BR")}
                  {item.is_manual ? " · manual" : ""}
                </p>
                {item.notes && <p className="mt-1 break-words text-sm text-muted">{item.notes}</p>}
              </div>
              <span className="font-mono text-sm">
                {item.duration_seconds == null
                  ? "Em andamento"
                  : formatDuration(item.duration_seconds)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir sessão"
                onClick={() => setDeleting(item)}
              >
                <Trash2 className="size-4" strokeWidth={1.8} />
              </Button>
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

      <Dialog open={creating} onOpenChange={setCreating} title="Registrar sessão">
        <ManualSessionForm onDone={() => setCreating(false)} />
      </Dialog>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir sessão"
        description="O tempo desta sessão deixa de contar. Tentativas ligadas a ela são mantidas."
        confirmLabel="Excluir"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </section>
  );
}

function ManualSessionForm({ onDone }: { onDone: () => void }) {
  const disciplines = useDisciplines();
  const [activity, setActivity] = useState<ActivityKind>("exercises");
  const [discipline, setDiscipline] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [notes, setNotes] = useState("");
  const create = useApiMutation(createManualSession, {
    invalidate: [sessionKeys.all],
    success: "Sessão registrada.",
    toastError: false,
    onSuccess: onDone,
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        create.mutate({
          activity_kind: activity,
          discipline: discipline || null,
          // datetime-local é interpretado no fuso do navegador e enviado em UTC.
          started_at: new Date(startedAt).toISOString(),
          ended_at: new Date(endedAt).toISOString(),
          notes,
        });
      }}
    >
      <FormError message={create.isError ? errorMessage(create.error) : undefined} />
      <Field label="Atividade">
        <Select value={activity} onChange={(e) => setActivity(e.target.value as ActivityKind)}>
          {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Disciplina (opcional)">
        <Select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
          <option value="">Nenhuma</option>
          {disciplines.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Início">
          <Input
            type="datetime-local"
            required
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
          />
        </Field>
        <Field label="Fim">
          <Input
            type="datetime-local"
            required
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Notas (opcional)">
        <Textarea value={notes} maxLength={5000} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Button type="submit" pending={create.isPending} className="w-full">
        Salvar
      </Button>
    </form>
  );
}

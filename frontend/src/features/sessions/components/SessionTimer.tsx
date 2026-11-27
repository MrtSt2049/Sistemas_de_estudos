"use client";

import { Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select, Textarea } from "@/components/ui/field";
import { useDisciplines } from "@/features/disciplines/queries";
import { finishSession, startSession, type ActivityKind } from "@/features/sessions/api";
import { sessionKeys, useActiveSession } from "@/features/sessions/queries";
import { ACTIVITY_LABELS, elapsedSince, formatClock } from "@/features/sessions/utils";
import { useApiMutation } from "@/lib/use-api-mutation";

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}

/** Cronômetro no topo da interface: iniciar leva dois cliques. */
export function SessionTimer() {
  const query = useActiveSession();
  const session = query.data;
  const now = useNow(Boolean(session));
  const [dialog, setDialog] = useState<"start" | "finish" | null>(null);

  if (query.isLoading || query.isError) return null;

  return (
    <>
      {session ? (
        <div className="flex items-center gap-2">
          <span
            role="timer"
            aria-label={`Sessão em andamento: ${ACTIVITY_LABELS[session.activity_kind]}`}
            className="font-mono text-sm text-accent"
          >
            {formatClock(elapsedSince(session.elapsed_seconds, query.dataUpdatedAt, now))}
          </span>
          <Button size="sm" variant="secondary" onClick={() => setDialog("finish")}>
            <Square className="size-4" strokeWidth={1.8} aria-hidden />
            Encerrar
          </Button>
        </div>
      ) : (
        <Button size="sm" onClick={() => setDialog("start")}>
          <Play className="size-4" strokeWidth={1.8} aria-hidden />
          Iniciar sessão
        </Button>
      )}

      <Dialog open={dialog === "start"} onOpenChange={() => setDialog(null)} title="Iniciar sessão">
        <StartForm onDone={() => setDialog(null)} />
      </Dialog>
      <Dialog
        open={dialog === "finish"}
        onOpenChange={() => setDialog(null)}
        title="Encerrar sessão"
      >
        <FinishForm onDone={() => setDialog(null)} />
      </Dialog>
    </>
  );
}

function StartForm({ onDone }: { onDone: () => void }) {
  const disciplines = useDisciplines();
  const [activity, setActivity] = useState<ActivityKind>("exercises");
  const [discipline, setDiscipline] = useState("");
  const start = useApiMutation(startSession, { invalidate: [sessionKeys.all], onSuccess: onDone });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        start.mutate({ activity_kind: activity, discipline: discipline || null });
      }}
    >
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
      <Button type="submit" autoFocus pending={start.isPending} className="w-full">
        Começar
      </Button>
    </form>
  );
}

function FinishForm({ onDone }: { onDone: () => void }) {
  const [focus, setFocus] = useState("");
  const [notes, setNotes] = useState("");
  const finish = useApiMutation(finishSession, {
    invalidate: [sessionKeys.all],
    success: "Sessão registrada.",
    onSuccess: onDone,
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        finish.mutate({ notes, focus_rating: focus ? Number(focus) : null });
      }}
    >
      <Field label="Foco (opcional)">
        <Select value={focus} onChange={(e) => setFocus(e.target.value)}>
          <option value="">Não avaliar</option>
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Notas (opcional)">
        <Textarea value={notes} maxLength={5000} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Button type="submit" pending={finish.isPending} className="w-full">
        Encerrar sessão
      </Button>
    </form>
  );
}

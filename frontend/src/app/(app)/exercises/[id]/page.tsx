"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorState, Skeleton } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { MarkdownView } from "@/components/markdown/MarkdownView";
import { Button, buttonClasses } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { deleteAttempt, deleteExercise, type Attempt } from "@/features/exercises/api";
import { AttemptForm } from "@/features/exercises/components/AttemptForm";
import { ExerciseForm } from "@/features/exercises/components/ExerciseForm";
import { exerciseKeys, useExercise, useExerciseAttempts } from "@/features/exercises/queries";
import { RESULT_LABELS, STATE_LABELS, STATE_TONES } from "@/features/exercises/schemas";
import { scheduleReview } from "@/features/reviews/api";
import { reviewKeys } from "@/features/reviews/queries";
import { useApiMutation } from "@/lib/use-api-mutation";

export default function ExercisePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const query = useExercise(id);
  const attempts = useExerciseAttempts(id);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingAttempt, setDeletingAttempt] = useState<Attempt | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const remove = useApiMutation(deleteExercise, {
    invalidate: [],
    success: "Exercício excluído.",
    onSuccess: () => router.replace("/exercises"),
  });
  const schedule = useApiMutation(scheduleReview, {
    invalidate: [reviewKeys.all],
    success: "Exercício na fila de revisão.",
  });
  const removeAttempt = useApiMutation(deleteAttempt, {
    invalidate: [exerciseKeys.all],
    success: "Tentativa excluída.",
    onSuccess: () => setDeletingAttempt(null),
  });

  if (query.isLoading) return <Skeleton rows={4} />;
  if (query.isError || !query.data) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }
  const exercise = query.data;
  const state = exercise.state ?? "new";

  return (
    <section className="mx-auto max-w-3xl space-y-7">
      <PageHeader
        title={exercise.title}
        description={[exercise.discipline_name, exercise.topic_title, exercise.source_name, exercise.external_ref]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <Link href="/exercises" className={buttonClasses("secondary")}>
              Voltar
            </Link>
            <Button
              variant="secondary"
              pending={schedule.isPending}
              onClick={() => schedule.mutate({ exercise: id })}
            >
              Agendar revisão
            </Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button variant="danger" onClick={() => setDeleting(true)}>
              Excluir
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATE_TONES[state]}>{STATE_LABELS[state]}</Badge>
        {exercise.difficulty && <Badge>Dificuldade {exercise.difficulty}</Badge>}
        {exercise.url && /^https?:\/\//.test(exercise.url) && (
          <a
            href={exercise.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-accent underline underline-offset-4"
          >
            Abrir original
          </a>
        )}
      </div>

      {exercise.statement_md && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Enunciado</h2>
          <MarkdownView>{exercise.statement_md}</MarkdownView>
        </Card>
      )}

      {exercise.solution_md && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Solução</h2>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={showSolution}
              onClick={() => setShowSolution((value) => !value)}
            >
              {showSolution ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
          {showSolution && <MarkdownView>{exercise.solution_md}</MarkdownView>}
        </Card>
      )}

      <Card>
        <h2 className="mb-4 text-sm font-semibold">Registrar tentativa</h2>
        <AttemptForm exerciseId={id} />
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Histórico</h2>
        {attempts.isLoading && <Skeleton rows={2} />}
        {attempts.isError && (
          <ErrorState error={attempts.error} onRetry={() => attempts.refetch()} />
        )}
        {attempts.data?.results.length === 0 && (
          <p className="text-sm text-muted">Nenhuma tentativa registrada.</p>
        )}
        <ul className="space-y-3">
          {attempts.data?.results.map((attempt) => (
            <li key={attempt.id}>
              <Card className="space-y-2 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{RESULT_LABELS[attempt.result]}</span>
                  <span className="font-mono text-xs text-muted">
                    {new Date(attempt.attempted_at ?? "").toLocaleString("pt-BR")}
                    {attempt.duration_seconds != null &&
                      ` · ${Math.round(attempt.duration_seconds / 60)} min`}
                  </span>
                  {attempt.dominant_error_name && (
                    <Badge tone="warn">{attempt.dominant_error_name}</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    aria-label="Excluir tentativa"
                    onClick={() => setDeletingAttempt(attempt)}
                  >
                    <Trash2 className="size-4" strokeWidth={1.8} />
                  </Button>
                </div>
                {attempt.key_technique && (
                  <p className="text-sm text-muted">Técnica: {attempt.key_technique}</p>
                )}
                {attempt.notes_md && <MarkdownView>{attempt.notes_md}</MarkdownView>}
              </Card>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={editing} onOpenChange={setEditing} title="Editar exercício">
        <ExerciseForm exercise={exercise} onSaved={() => setEditing(false)} />
      </Dialog>
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Excluir exercício"
        description={`O exercício e ${attempts.data?.count ?? 0} tentativa(s) serão apagados.`}
        confirmLabel="Excluir"
        pending={remove.isPending}
        onConfirm={() => remove.mutate(id)}
      />
      <ConfirmDialog
        open={deletingAttempt !== null}
        onOpenChange={(open) => !open && setDeletingAttempt(null)}
        title="Excluir tentativa"
        description="O estado do exercício será recalculado a partir das tentativas restantes."
        confirmLabel="Excluir"
        pending={removeAttempt.isPending}
        onConfirm={() => deletingAttempt && removeAttempt.mutate(deletingAttempt.id)}
      />
    </section>
  );
}

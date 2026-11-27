"use client";

import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import {
  deleteDiscipline,
  reorderDisciplines,
  setArchived,
  type Discipline,
} from "@/features/disciplines/api";
import { DisciplineForm } from "@/features/disciplines/components/DisciplineForm";
import { disciplineKeys, useDisciplines } from "@/features/disciplines/queries";
import { KIND_LABELS } from "@/features/disciplines/schemas";
import { useApiMutation } from "@/lib/use-api-mutation";

export default function DisciplinesPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Discipline | "new" | null>(null);
  const [deleting, setDeleting] = useState<Discipline | null>(null);
  const query = useDisciplines(showArchived);
  const invalidate = [disciplineKeys.all];

  const archive = useApiMutation(setArchived, { invalidate });
  const reorder = useApiMutation(reorderDisciplines, { invalidate });
  const remove = useApiMutation(deleteDiscipline, {
    invalidate,
    success: "Disciplina excluída.",
    onSuccess: () => setDeleting(null),
  });

  const items = query.data ?? [];

  const swap = (from: number, to: number) => {
    const ids = items.map((item) => item.id);
    const [moved] = ids.splice(from, 1);
    if (moved) ids.splice(to, 0, moved);
    reorder.mutate(ids);
  };

  return (
    <section className="mx-auto max-w-5xl space-y-7">
      <PageHeader
        title="Disciplinas"
        description="Organize o que você estuda e os tópicos de cada área."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowArchived((value) => !value)}>
              {showArchived ? "Ver ativas" : "Ver arquivadas"}
            </Button>
            <Button onClick={() => setEditing("new")}>Nova disciplina</Button>
          </>
        }
      />

      {query.isLoading && <Skeleton />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.isSuccess && items.length === 0 && (
        <EmptyState
          title={showArchived ? "Nenhuma disciplina arquivada" : "Nenhuma disciplina cadastrada"}
          description="As disciplinas agrupam tópicos, exercícios e sessões de estudo."
          action={
            showArchived ? undefined : (
              <Button onClick={() => setEditing("new")}>Cadastrar a primeira</Button>
            )
          }
        />
      )}

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={item.id}>
            <Card className="flex flex-wrap items-center gap-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/disciplines/${item.id}`}
                  className="break-words font-medium text-text underline-offset-4 hover:underline"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-muted">
                  {KIND_LABELS[item.kind]}
                  {item.code ? ` · ${item.code}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {!showArchived && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Subir ${item.name}`}
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => swap(index, index - 1)}
                    >
                      <ArrowUp className="size-4" strokeWidth={1.8} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Descer ${item.name}`}
                      disabled={index === items.length - 1 || reorder.isPending}
                      onClick={() => swap(index, index + 1)}
                    >
                      <ArrowDown className="size-4" strokeWidth={1.8} />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Editar ${item.name}`}
                  onClick={() => setEditing(item)}
                >
                  <Pencil className="size-4" strokeWidth={1.8} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${showArchived ? "Reativar" : "Arquivar"} ${item.name}`}
                  onClick={() => archive.mutate({ id: item.id, archived: !showArchived })}
                >
                  {showArchived ? (
                    <ArchiveRestore className="size-4" strokeWidth={1.8} />
                  ) : (
                    <Archive className="size-4" strokeWidth={1.8} />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Excluir ${item.name}`}
                  onClick={() => setDeleting(item)}
                >
                  <Trash2 className="size-4" strokeWidth={1.8} />
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === "new" ? "Nova disciplina" : "Editar disciplina"}
      >
        <DisciplineForm
          discipline={editing === "new" || editing === null ? undefined : editing}
          onSaved={() => setEditing(null)}
        />
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir disciplina"
        description={`"${deleting?.name}" e todos os seus tópicos serão apagados. Se houver exercícios, a exclusão é bloqueada.`}
        confirmLabel="Excluir"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </section>
  );
}

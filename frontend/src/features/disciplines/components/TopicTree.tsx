"use client";

import { ArrowDown, ArrowUp, Plus, Settings2, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  createTopic,
  deleteTopic,
  moveTopic,
  updateTopic,
  type TopicNode,
  type TopicStatus,
} from "@/features/disciplines/api";
import { topicKeys, useTopicTree } from "@/features/disciplines/queries";
import { TOPIC_STATUS_LABELS } from "@/features/disciplines/schemas";
import { flattenTree, type FlatTopic } from "@/features/disciplines/utils";
import { useApiMutation } from "@/lib/use-api-mutation";

// Espelha o limite do backend apenas para ocultar a ação; a validação é do servidor.
const MAX_DEPTH = 4;

export function TopicTree({ disciplineId }: { disciplineId: string }) {
  const query = useTopicTree(disciplineId);
  const invalidate = [topicKeys.all];
  const [newTitle, setNewTitle] = useState("");
  const [childOf, setChildOf] = useState<TopicNode | null>(null);
  const [childTitle, setChildTitle] = useState("");
  const [editing, setEditing] = useState<TopicNode | null>(null);
  const [deleting, setDeleting] = useState<TopicNode | null>(null);

  const create = useApiMutation(createTopic, {
    invalidate,
    onSuccess: () => {
      setNewTitle("");
      setChildTitle("");
      setChildOf(null);
    },
  });
  const update = useApiMutation(updateTopic, { invalidate });
  const move = useApiMutation(moveTopic, { invalidate });
  const remove = useApiMutation(deleteTopic, {
    invalidate,
    success: "Tópico excluído.",
    onSuccess: () => setDeleting(null),
  });

  const submit = (title: string, parent: string | null) => (event: FormEvent) => {
    event.preventDefault();
    if (title.trim()) create.mutate({ discipline: disciplineId, title: title.trim(), parent });
  };

  if (query.isLoading) return <Skeleton />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const roots = query.data ?? [];
  const flat = flattenTree(roots);
  const siblingsOf = (node: TopicNode) =>
    node.parent ? (flat.find((f) => f.node.id === node.parent)?.node.children ?? []) : roots;

  const renderRow = ({ node, depth }: FlatTopic) => {
    const siblings = siblingsOf(node);
    const index = siblings.findIndex((sibling) => sibling.id === node.id);
    return (
      <li key={node.id} style={{ marginLeft: `${(depth - 1) * 1.25}rem` }}>
        <Card className="flex flex-wrap items-center gap-2 p-3 sm:p-3">
          <span className="min-w-40 flex-1 break-words text-sm font-medium">{node.title}</span>
          <Select
            aria-label={`Situação de ${node.title}`}
            className="w-auto"
            value={node.status}
            onChange={(event) =>
              update.mutate({
                id: node.id,
                data: { status: event.target.value as TopicStatus },
              })
            }
          >
            {Object.entries(TOPIC_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Subir ${node.title}`}
              disabled={index <= 0 || move.isPending}
              onClick={() => move.mutate({ id: node.id, parent: node.parent, position: index - 1 })}
            >
              <ArrowUp className="size-4" strokeWidth={1.8} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Descer ${node.title}`}
              disabled={index >= siblings.length - 1 || move.isPending}
              onClick={() => move.mutate({ id: node.id, parent: node.parent, position: index + 1 })}
            >
              <ArrowDown className="size-4" strokeWidth={1.8} />
            </Button>
            {depth < MAX_DEPTH && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Adicionar subtópico em ${node.title}`}
                onClick={() => setChildOf(node)}
              >
                <Plus className="size-4" strokeWidth={1.8} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${node.title}`}
              onClick={() => setEditing(node)}
            >
              <Settings2 className="size-4" strokeWidth={1.8} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${node.title}`}
              onClick={() => setDeleting(node)}
            >
              <Trash2 className="size-4" strokeWidth={1.8} />
            </Button>
          </div>
        </Card>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit(newTitle, null)} className="flex flex-wrap items-end gap-2">
        <Field label="Novo tópico principal" className="min-w-56 flex-1">
          <Input value={newTitle} maxLength={200} onChange={(e) => setNewTitle(e.target.value)} />
        </Field>
        <Button type="submit" pending={create.isPending}>
          Adicionar
        </Button>
      </form>

      {flat.length === 0 ? (
        <EmptyState
          title="Nenhum tópico ainda"
          description="Adicione o primeiro tópico no campo acima. A árvore aceita até 4 níveis."
        />
      ) : (
        <ul className="space-y-2">{flat.map(renderRow)}</ul>
      )}

      <Dialog
        open={childOf !== null}
        onOpenChange={(open) => !open && setChildOf(null)}
        title={`Novo subtópico de ${childOf?.title ?? ""}`}
      >
        <form onSubmit={submit(childTitle, childOf?.id ?? null)} className="space-y-4">
          <Field label="Título">
            <Input
              value={childTitle}
              maxLength={200}
              onChange={(e) => setChildTitle(e.target.value)}
            />
          </Field>
          <Button type="submit" pending={create.isPending} className="w-full">
            Adicionar
          </Button>
        </form>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Editar tópico"
      >
        {editing && (
          <EditTopicForm
            node={editing}
            flat={flat}
            pending={update.isPending || move.isPending}
            onSubmit={async ({ title, description, parent }) => {
              await update.mutateAsync({ id: editing.id, data: { title, description } });
              if (parent !== editing.parent) {
                // O servidor recusa ciclos e profundidade excedida.
                await move.mutateAsync({ id: editing.id, parent, position: 9999 });
              }
              setEditing(null);
            }}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir tópico"
        description={`"${deleting?.title}" e ${deleting ? flattenTree(deleting.children).length : 0} subtópico(s) serão apagados.`}
        confirmLabel="Excluir"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}

function EditTopicForm({
  node,
  flat,
  pending,
  onSubmit,
}: {
  node: TopicNode;
  flat: FlatTopic[];
  pending: boolean;
  onSubmit: (data: { title: string; description: string; parent: string | null }) => Promise<void>;
}) {
  const [title, setTitle] = useState(node.title);
  const [description, setDescription] = useState(node.description);
  const [parent, setParent] = useState(node.parent ?? "");
  const own = new Set([node.id, ...flattenTree(node.children).map((f) => f.node.id)]);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) return;
        // Erros já são exibidos pelo aviso da mutação; o diálogo permanece aberto.
        onSubmit({ title: title.trim(), description, parent: parent || null }).catch(() => {});
      }}
    >
      <Field label="Título">
        <Input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Descrição">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label="Tópico pai">
        <Select value={parent} onChange={(e) => setParent(e.target.value)}>
          <option value="">Nenhum (nível principal)</option>
          {flat
            .filter((f) => !own.has(f.node.id))
            .map((f) => (
              <option key={f.node.id} value={f.node.id}>
                {`${"— ".repeat(f.depth - 1)}${f.node.title}`}
              </option>
            ))}
        </Select>
      </Field>
      <Button type="submit" pending={pending} className="w-full">
        Salvar
      </Button>
    </form>
  );
}

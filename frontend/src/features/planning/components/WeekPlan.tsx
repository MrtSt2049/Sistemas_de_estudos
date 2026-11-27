"use client";

import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { ErrorState, Skeleton } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import {
  activateProfile,
  applyProfile,
  createBlock,
  createProfile,
  deleteBlock,
  deleteProfile,
  listProfiles,
  type WeeklyProfile,
} from "@/features/planning/api";
import { calendarKeys } from "@/features/planning/components/EventForm";
import { ACTIVITY_LABELS } from "@/features/sessions/utils";
import type { ActivityKind } from "@/features/sessions/api";
import { useApiMutation } from "@/lib/use-api-mutation";

const profileKey = ["week-profiles"] as const;
const WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export function WeekPlan({ weekStart }: { weekStart: string }) {
  const query = useQuery({ queryKey: profileKey, queryFn: listProfiles });
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<WeeklyProfile | null>(null);
  const invalidate = [profileKey];

  const create = useApiMutation(createProfile, { invalidate, onSuccess: () => setName("") });
  const activate = useApiMutation(activateProfile, { invalidate });
  const remove = useApiMutation(deleteProfile, { invalidate, onSuccess: () => setDeleting(null) });
  const apply = useApiMutation(applyProfile, {
    invalidate: [calendarKeys.all],
    success: "Semana padrão aplicada. Blocos já criados não são duplicados.",
  });
  const removeBlock = useApiMutation(deleteBlock, { invalidate });

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">Semana padrão</h2>
      {query.isLoading && <Skeleton rows={1} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) create.mutate(name.trim());
        }}
      >
        <Field label="Novo perfil de semana" className="min-w-48 flex-1">
          <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Button type="submit" variant="secondary" pending={create.isPending}>
          Criar perfil
        </Button>
      </form>

      {query.data?.map((profile) => (
        <Card key={profile.id} className="space-y-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 flex-1 break-words text-sm font-medium">{profile.name}</h3>
            {profile.is_active ? (
              <>
                <Badge tone="ok">Ativo</Badge>
                <Button
                  size="sm"
                  pending={apply.isPending}
                  disabled={profile.blocks.length === 0}
                  onClick={() => apply.mutate({ id: profile.id, weekStart })}
                >
                  Aplicar na semana exibida
                </Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => activate.mutate(profile.id)}>
                Ativar
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Excluir perfil ${profile.name}`}
              onClick={() => setDeleting(profile)}
            >
              <Trash2 className="size-4" strokeWidth={1.8} />
            </Button>
          </div>
          <ul className="space-y-1">
            {profile.blocks.map((block) => (
              <li key={block.id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 break-words">
                  {WEEKDAYS[block.weekday]} ·{" "}
                  <span className="font-mono text-xs">
                    {block.start_time.slice(0, 5)}–{block.end_time.slice(0, 5)}
                  </span>{" "}
                  · {block.label}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Excluir bloco ${block.label}`}
                  onClick={() => removeBlock.mutate(block.id)}
                >
                  <Trash2 className="size-4" strokeWidth={1.8} />
                </Button>
              </li>
            ))}
          </ul>
          <NewBlock profileId={profile.id} />
        </Card>
      ))}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir perfil"
        description={`"${deleting?.name}" e ${deleting?.blocks.length ?? 0} bloco(s) serão apagados. Eventos já criados no calendário são mantidos.`}
        confirmLabel="Excluir"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}

function NewBlock({ profileId }: { profileId: string }) {
  const [weekday, setWeekday] = useState("0");
  const [start, setStart] = useState("19:00");
  const [end, setEnd] = useState("21:00");
  const [label, setLabel] = useState("");
  const [activity, setActivity] = useState<ActivityKind>("exercises");
  const create = useApiMutation(createBlock, {
    invalidate: [profileKey],
    onSuccess: () => setLabel(""),
  });

  return (
    <details>
      <summary className="cursor-pointer text-sm text-muted">Adicionar bloco</summary>
      <form
        className="mt-3 grid gap-3 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate({
            profile: profileId,
            weekday: Number(weekday),
            start_time: start,
            end_time: end,
            label: label.trim(),
            activity_kind: activity,
          });
        }}
      >
        <Field label="Dia">
          <Select value={weekday} onChange={(e) => setWeekday(e.target.value)}>
            {WEEKDAYS.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Das">
          <Input type="time" required value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Até">
          <Input type="time" required value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
        <Field label="Nome do bloco">
          <Input
            required
            maxLength={100}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>
        <Field label="Atividade">
          <Select value={activity} onChange={(e) => setActivity(e.target.value as ActivityKind)}>
            {Object.entries(ACTIVITY_LABELS).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="secondary" pending={create.isPending} className="self-end">
          Adicionar
        </Button>
      </form>
    </details>
  );
}

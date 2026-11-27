"use client";

import { useState } from "react";
import { FormError } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useDisciplines } from "@/features/disciplines/queries";
import {
  deleteEvent,
  EVENT_KIND_LABELS,
  saveEvent,
  type CalendarEvent,
  type EventKind,
} from "@/features/planning/api";
import { toDateKey } from "@/features/planning/dates";
import { errorMessage, useApiMutation } from "@/lib/use-api-mutation";

export const calendarKeys = { all: ["calendar"] as const };

/** "AAAA-MM-DDTHH:mm" no fuso do navegador, para campos datetime-local. */
function toLocalInput(date: Date): string {
  const time = date.toTimeString().slice(0, 5);
  return `${toDateKey(date)}T${time}`;
}

export function EventForm({
  event,
  defaultDay,
  onDone,
}: {
  event?: CalendarEvent;
  defaultDay: string;
  onDone: () => void;
}) {
  const disciplines = useDisciplines();
  const start = event ? new Date(event.starts_at) : new Date(`${defaultDay}T19:00`);
  // O fim de um evento de dia inteiro é exclusivo: o último dia é o anterior.
  const end = event
    ? new Date(new Date(event.ends_at).getTime() - (event.all_day ? 1 : 0))
    : new Date(`${defaultDay}T20:00`);

  const [title, setTitle] = useState(event?.title ?? "");
  const [kind, setKind] = useState<EventKind>(event?.kind ?? "study");
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [startsAt, setStartsAt] = useState(toLocalInput(start));
  const [endsAt, setEndsAt] = useState(toLocalInput(end));
  const [discipline, setDiscipline] = useState(event?.discipline ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [every, setEvery] = useState(String(event?.recurrence_interval_weeks ?? ""));
  const [until, setUntil] = useState(event?.recurrence_until ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const save = useApiMutation(saveEvent, {
    invalidate: [calendarKeys.all],
    success: "Evento salvo.",
    toastError: false,
    onSuccess: onDone,
  });
  const remove = useApiMutation(deleteEvent, {
    invalidate: [calendarKeys.all],
    success: "Evento excluído.",
    onSuccess: onDone,
  });

  const dateOnly = (value: string) => value.slice(0, 10);

  return (
    <form
      className="space-y-4"
      onSubmit={(submit) => {
        submit.preventDefault();
        const from = allDay ? `${dateOnly(startsAt)}T00:00` : startsAt;
        const to = allDay ? `${dateOnly(endsAt)}T23:59` : endsAt;
        save.mutate({
          id: event?.id,
          data: {
            title: title.trim(),
            kind,
            all_day: allDay,
            starts_at: new Date(from).toISOString(),
            ends_at: new Date(to).toISOString(),
            discipline: discipline || null,
            description,
            recurrence_interval_weeks: every ? Number(every) : null,
            recurrence_until: every ? until || null : null,
          },
        });
      }}
    >
      <FormError message={save.isError ? errorMessage(save.error) : undefined} />
      <Field label="Título">
        <Input required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <Select value={kind} onChange={(e) => setKind(e.target.value as EventKind)}>
            {Object.entries(EVENT_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Disciplina">
          <Select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
            <option value="">Nenhuma</option>
            {disciplines.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
        />
        Dia inteiro
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Início">
          <Input
            required
            type={allDay ? "date" : "datetime-local"}
            value={allDay ? dateOnly(startsAt) : startsAt}
            onChange={(e) => setStartsAt(allDay ? `${e.target.value}T00:00` : e.target.value)}
          />
        </Field>
        <Field label="Fim">
          <Input
            required
            type={allDay ? "date" : "datetime-local"}
            value={allDay ? dateOnly(endsAt) : endsAt}
            onChange={(e) => setEndsAt(allDay ? `${e.target.value}T23:59` : e.target.value)}
          />
        </Field>
        <Field label="Repetir a cada (semanas)" hint="Vazio: não repete">
          <Input
            type="number"
            min={1}
            max={52}
            value={every}
            onChange={(e) => setEvery(e.target.value)}
          />
        </Field>
        {every && (
          <Field label="Repetir até">
            <Input type="date" required value={until} onChange={(e) => setUntil(e.target.value)} />
          </Field>
        )}
      </div>
      <Field label="Descrição">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      {event?.recurrence_interval_weeks && (
        <p className="text-xs text-muted">Alterações e exclusão valem para toda a série.</p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        {event &&
          (confirmingDelete ? (
            <Button
              variant="danger"
              pending={remove.isPending}
              onClick={() => remove.mutate(event.id)}
            >
              Confirmar exclusão
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              Excluir
            </Button>
          ))}
        <Button type="submit" pending={save.isPending}>
          Salvar
        </Button>
      </div>
    </form>
  );
}

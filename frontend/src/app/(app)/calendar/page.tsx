"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ErrorState, Skeleton } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  EVENT_KIND_LABELS,
  getCalendar,
  getEvent,
  type CalendarItem,
  type EventKind,
} from "@/features/planning/api";
import { calendarKeys, EventForm } from "@/features/planning/components/EventForm";
import { WeekPlan } from "@/features/planning/components/WeekPlan";
import {
  occursOn,
  shiftAnchor,
  startOfWeek,
  toDateKey,
  visibleDays,
  type CalendarView,
} from "@/features/planning/dates";
import { cn } from "@/lib/utils";

const VIEW_LABELS: Record<CalendarView, string> = { month: "Mês", week: "Semana", day: "Dia" };

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [creatingOn, setCreatingOn] = useState<string | null>(null);
  const [openEvent, setOpenEvent] = useState<string | null>(null);

  const days = visibleDays(view, anchor);
  const start = toDateKey(days[0] ?? anchor);
  const end = toDateKey(days.at(-1) ?? anchor);
  const query = useQuery({
    queryKey: [...calendarKeys.all, start, end],
    queryFn: () => getCalendar(start, end),
    placeholderData: keepPreviousData,
  });
  const today = toDateKey(new Date());

  const title =
    view === "month"
      ? anchor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      : view === "week"
        ? `${days[0]?.toLocaleDateString("pt-BR")} a ${days.at(-1)?.toLocaleDateString("pt-BR")}`
        : anchor.toLocaleDateString("pt-BR", { dateStyle: "full" });

  return (
    <section className="mx-auto max-w-6xl space-y-7">
      <PageHeader
        title="Calendário"
        description="Eventos, calendário mestre e prazos das metas."
        actions={<Button onClick={() => setCreatingOn(today)}>Novo evento</Button>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          aria-label="Período anterior"
          onClick={() => setAnchor(shiftAnchor(view, anchor, -1))}
        >
          <ChevronLeft className="size-4" strokeWidth={1.8} />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Próximo período"
          onClick={() => setAnchor(shiftAnchor(view, anchor, 1))}
        >
          <ChevronRight className="size-4" strokeWidth={1.8} />
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setAnchor(new Date())}>
          Hoje
        </Button>
        <h2
          className="min-w-0 flex-1 text-sm font-semibold first-letter:uppercase"
          aria-live="polite"
        >
          {title}
        </h2>
        <div role="group" aria-label="Visão" className="flex gap-1">
          {(Object.keys(VIEW_LABELS) as CalendarView[]).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={view === option ? "primary" : "secondary"}
              aria-pressed={view === option}
              onClick={() => setView(option)}
            >
              {VIEW_LABELS[option]}
            </Button>
          ))}
        </div>
      </div>

      {query.isLoading && <Skeleton rows={4} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.data && (
        // No celular os dias viram uma lista vertical.
        <ol className={cn("grid gap-2", view !== "day" && "lg:grid-cols-7")}>
          {days.map((day) => {
            const key = toDateKey(day);
            const items = query.data.filter((item) => occursOn(item, day));
            const outside = view === "month" && day.getMonth() !== anchor.getMonth();
            return (
              <li
                key={key}
                className={cn(
                  "min-w-0 rounded-control border bg-surface p-2",
                  key === today ? "border-accent" : "border-line",
                  outside && "opacity-60",
                )}
              >
                <button
                  type="button"
                  className="mb-1 min-h-11 font-mono text-xs text-muted lg:min-h-0"
                  aria-label={`Novo evento em ${day.toLocaleDateString("pt-BR")}`}
                  onClick={() => setCreatingOn(key)}
                >
                  {day.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })}
                </button>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={`${item.event ?? item.goal}-${item.starts_at}`}>
                      <CalendarEntry
                        item={item}
                        detailed={view !== "month"}
                        onOpen={() => item.event && setOpenEvent(item.event)}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      )}

      <WeekPlan weekStart={toDateKey(startOfWeek(anchor))} />

      <Dialog
        open={creatingOn !== null}
        onOpenChange={(open) => !open && setCreatingOn(null)}
        title="Novo evento"
      >
        {creatingOn && <EventForm defaultDay={creatingOn} onDone={() => setCreatingOn(null)} />}
      </Dialog>
      <Dialog
        open={openEvent !== null}
        onOpenChange={(open) => !open && setOpenEvent(null)}
        title="Editar evento"
      >
        {openEvent && <EditEvent id={openEvent} onDone={() => setOpenEvent(null)} />}
      </Dialog>
    </section>
  );
}

function EditEvent({ id, onDone }: { id: string; onDone: () => void }) {
  const query = useQuery({
    queryKey: [...calendarKeys.all, "event", id],
    queryFn: () => getEvent(id),
  });
  if (query.isLoading) return <Skeleton />;
  if (query.isError || !query.data) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }
  return <EventForm event={query.data} defaultDay="" onDone={onDone} />;
}

function CalendarEntry({
  item,
  detailed,
  onOpen,
}: {
  item: CalendarItem;
  detailed: boolean;
  onOpen: () => void;
}) {
  const time = item.all_day
    ? null
    : new Date(item.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const body = (
    <>
      {/* A cor da disciplina é reforço: o nome também aparece em texto. */}
      <span className="flex items-start gap-1">
        {item.discipline_color && (
          <span
            aria-hidden
            className="mt-1 size-2 shrink-0 rounded-full"
            style={{ background: item.discipline_color }}
          />
        )}
        <span className="min-w-0 break-words">
          {time && <span className="font-mono">{time} </span>}
          {item.title}
        </span>
      </span>
      {detailed && (
        <span className="block break-words text-muted">
          {EVENT_KIND_LABELS[item.kind as EventKind]}
          {item.discipline_name ? ` · ${item.discipline_name}` : ""}
          {item.description && (
            <span className="mt-1 block whitespace-pre-line">{item.description}</span>
          )}
        </span>
      )}
    </>
  );
  const classes = "block w-full rounded-control bg-surface-2 p-2 text-left text-xs";

  return item.source === "goal" ? (
    <Link href="/goals" className={classes}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onOpen} className={classes}>
      {body}
    </button>
  );
}

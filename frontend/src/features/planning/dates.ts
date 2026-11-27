/** Datas de calendário no fuso do navegador, como texto AAAA-MM-DD. */

export type CalendarView = "month" | "week" | "day";

export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Semana começando na segunda-feira. */
export function startOfWeek(date: Date): Date {
  return addDays(date, -((date.getDay() + 6) % 7));
}

/** Dias exibidos: o mês é completado até semanas inteiras. */
export function visibleDays(view: CalendarView, anchor: Date): Date[] {
  if (view === "day") return [anchor];
  if (view === "week") {
    const monday = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const days: Date[] = [];
  for (let day = startOfWeek(first); day <= last || day.getDay() !== 1; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

export function shiftAnchor(view: CalendarView, anchor: Date, direction: 1 | -1): Date {
  if (view === "month") {
    return new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
  }
  return addDays(anchor, direction * (view === "week" ? 7 : 1));
}

/** Um evento aparece em todo dia que ele toca, inclusive ao cruzar a meia-noite. */
export function occursOn(item: { starts_at: string; ends_at: string }, day: Date): boolean {
  const dayStart = fromDateKey(toDateKey(day));
  const dayEnd = addDays(dayStart, 1);
  const start = new Date(item.starts_at);
  const end = new Date(item.ends_at);
  return start < dayEnd && (end > dayStart || start >= dayStart);
}

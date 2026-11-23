import { addDays, parseYmd } from './questions';

export interface CalendarEventInput {
  id: string;
  title: string;
  category: string;
  priority: 'alta' | 'média' | 'baixa' | string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  status: 'planejado' | 'feito' | 'cancelado' | string;
  courseId?: string | null;
  front?: string | null;
  recurrence?: 'none' | 'daily' | 'weekly' | string;
  repeatUntil?: string | null;
  completedDates?: string[];
}

export interface ExpandedEventOccurrence extends CalendarEventInput {
  occurrenceDate: string;
  isDone: boolean;
}

export function timeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function expandEventsInRange(
  events: CalendarEventInput[],
  fromDate: string,
  toDate: string
): ExpandedEventOccurrence[] {
  const occurrences: ExpandedEventOccurrence[] = [];

  for (const ev of events) {
    const rec = ev.recurrence || 'none';
    if (rec === 'none') {
      if (ev.date >= fromDate && ev.date <= toDate) {
        occurrences.push({
          ...ev,
          occurrenceDate: ev.date,
          isDone: ev.status === 'feito',
        });
      }
    } else {
      const step = rec === 'daily' ? 1 : 7;
      const limit = ev.repeatUntil && ev.repeatUntil < toDate ? ev.repeatUntil : toDate;
      for (let d = ev.date; d <= limit; d = addDays(d, step)) {
        if (d >= fromDate) {
          occurrences.push({
            ...ev,
            occurrenceDate: d,
            isDone: (ev.completedDates || []).includes(d),
          });
        }
      }
    }
  }

  return occurrences.sort((a, b) => {
    const ka = `${a.occurrenceDate}_${a.startTime || ''}`;
    const kb = `${b.occurrenceDate}_${b.startTime || ''}`;
    return ka.localeCompare(kb);
  });
}

export function detectScheduleConflicts(
  occurrences: ExpandedEventOccurrence[]
): [ExpandedEventOccurrence, ExpandedEventOccurrence][] {
  const byDay: Record<string, ExpandedEventOccurrence[]> = {};

  for (const occ of occurrences) {
    if (occ.status === 'cancelado') continue;
    if (occ.category === 'marco') continue;
    if (!occ.startTime || !occ.endTime) continue;
    if (!byDay[occ.occurrenceDate]) byDay[occ.occurrenceDate] = [];
    byDay[occ.occurrenceDate].push(occ);
  }

  const conflicts: [ExpandedEventOccurrence, ExpandedEventOccurrence][] = [];

  for (const day of Object.keys(byDay)) {
    const list = byDay[day].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (timeToMinutes(list[j].startTime) < timeToMinutes(list[i].endTime)) {
          conflicts.push([list[i], list[j]]);
        }
      }
    }
  }

  return conflicts;
}

export function parseAvailabilityWindows(
  dateStr: string,
  weeklyAvailability: Record<string, string>
): [number, number][] {
  const wd = (parseYmd(dateStr).getUTCDay() + 6) % 7; // 0 = Monday .. 6 = Sunday
  const raw = weeklyAvailability[String(wd)] || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const [start, end] = part.split('-');
      return [timeToMinutes(start), timeToMinutes(end)] as [number, number];
    })
    .filter(([a, b]) => b > a);
}

export interface PlannedBlock {
  date: string;
  startTime: string;
  endTime: string;
  front: string;
  minutes: number;
}

export interface PlannerResult {
  blocks: PlannedBlock[];
  shortfallMinutes: Record<string, number>;
}

export function planWeeklyStudyBlocks(params: {
  mondayDate: string;
  todayDate: string;
  desiredHoursByFront: Record<string, number>;
  weeklyAvailability: Record<string, string>;
  existingEvents: CalendarEventInput[];
}): PlannerResult {
  const { mondayDate, todayDate, desiredHoursByFront, weeklyAvailability, existingEvents } = params;
  const days = Array.from({ length: 7 }, (_, i) => addDays(mondayDate, i)).filter(
    (d) => d >= todayDate
  );

  const blocks: PlannedBlock[] = [];
  const shortfallMinutes: Record<string, number> = {};

  if (days.length === 0) {
    for (const [front, hrs] of Object.entries(desiredHoursByFront)) {
      const mins = Math.round((hrs || 0) * 60);
      if (mins > 0) shortfallMinutes[front] = mins;
    }
    return { blocks, shortfallMinutes };
  }

  const weekEnd = addDays(mondayDate, 6);
  const expanded = expandEventsInRange(existingEvents, mondayDate, weekEnd);
  const extraOccupied: Record<string, [number, number][]> = {};

  const getOccupied = (dateStr: string): [number, number][] => {
    const fixed = expanded
      .filter(
        (o) =>
          o.occurrenceDate === dateStr &&
          o.status !== 'cancelado' &&
          o.category !== 'marco' &&
          o.startTime &&
          o.endTime
      )
      .map((o) => [timeToMinutes(o.startTime), timeToMinutes(o.endTime)] as [number, number]);
    return [...fixed, ...(extraOccupied[dateStr] || [])];
  };

  const findSlot = (dateStr: string, duration: number): number | null => {
    const occ = getOccupied(dateStr);
    const windows = parseAvailabilityWindows(dateStr, weeklyAvailability);
    for (const [winStart, winEnd] of windows) {
      for (let s = winStart; s + duration <= winEnd; s += 15) {
        const overlaps = occ.some(([x, y]) => s < y && s + duration > x);
        if (!overlaps) return s;
      }
    }
    return null;
  };

  let dayPointer = 0;
  const priorityOrder = ['obmu', 'grad', 'cp', 'octobit', 'fisico'];
  const fronts = [
    ...priorityOrder.filter((f) => f in desiredHoursByFront),
    ...Object.keys(desiredHoursByFront).filter((f) => !priorityOrder.includes(f)),
  ];

  for (const front of fronts) {
    let needed = Math.round((desiredHoursByFront[front] || 0) * 60);
    while (needed >= 30) {
      const duration = Math.min(90, needed);
      let placed = false;
      for (let k = 0; k < days.length && !placed; k++) {
        const d = days[(dayPointer + k) % days.length];
        const slotStart = findSlot(d, duration);
        if (slotStart !== null) {
          if (!extraOccupied[d]) extraOccupied[d] = [];
          extraOccupied[d].push([slotStart, slotStart + duration]);
          blocks.push({
            date: d,
            startTime: minutesToTime(slotStart),
            endTime: minutesToTime(slotStart + duration),
            front,
            minutes: duration,
          });
          placed = true;
          dayPointer = (dayPointer + k + 1) % days.length;
        }
      }
      if (!placed) {
        shortfallMinutes[front] = needed;
        break;
      }
      needed -= duration;
    }
  }

  return { blocks, shortfallMinutes };
}

export interface RescheduleProposal {
  event: CalendarEventInput;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
}

export interface RescheduleResult {
  proposals: RescheduleProposal[];
  unplaced: CalendarEventInput[];
}

export function proposeRescheduleOverdue(params: {
  todayDate: string;
  maxPerDay: number;
  weeklyAvailability: Record<string, string>;
  allEvents: CalendarEventInput[];
}): RescheduleResult {
  const { todayDate, maxPerDay, weeklyAvailability, allEvents } = params;

  // Apenas estudo e revisão atrasados não recorrentes são movidos; compromissos fixos e marcos nunca se movem
  const overdue = allEvents
    .filter(
      (e) =>
        (!e.recurrence || e.recurrence === 'none') &&
        e.date < todayDate &&
        e.status !== 'feito' &&
        e.status !== 'cancelado' &&
        (e.category === 'estudo' || e.category === 'revisao')
    )
    .sort((a, b) => {
      const prioRank = (p: string) => (p === 'alta' ? 0 : p === 'média' ? 1 : 2);
      const diff = prioRank(a.priority) - prioRank(b.priority);
      if (diff !== 0) return diff;
      return a.date.localeCompare(b.date);
    });

  const horizonEnd = addDays(todayDate, 14);
  const expanded = expandEventsInRange(allEvents, addDays(todayDate, 1), horizonEnd);
  const extraOccupied: Record<string, [number, number][]> = {};
  const movedCountByDay: Record<string, number> = {};

  const getOccupied = (dateStr: string): [number, number][] => {
    const fixed = expanded
      .filter(
        (o) =>
          o.occurrenceDate === dateStr &&
          o.status !== 'cancelado' &&
          o.category !== 'marco' &&
          o.startTime &&
          o.endTime
      )
      .map((o) => [timeToMinutes(o.startTime), timeToMinutes(o.endTime)] as [number, number]);
    return [...fixed, ...(extraOccupied[dateStr] || [])];
  };

  const findSlot = (dateStr: string, duration: number): number | null => {
    const occ = getOccupied(dateStr);
    const windows = parseAvailabilityWindows(dateStr, weeklyAvailability);
    for (const [winStart, winEnd] of windows) {
      for (let s = winStart; s + duration <= winEnd; s += 15) {
        const overlaps = occ.some(([x, y]) => s < y && s + duration > x);
        if (!overlaps) return s;
      }
    }
    return null;
  };

  const proposals: RescheduleProposal[] = [];
  const unplaced: CalendarEventInput[] = [];

  for (const ev of overdue) {
    const rawDur =
      ev.startTime && ev.endTime
        ? timeToMinutes(ev.endTime) - timeToMinutes(ev.startTime)
        : 60;
    const duration = Math.max(30, rawDur);
    let placed = false;

    for (let i = 1; i <= 14 && !placed; i++) {
      const d = addDays(todayDate, i);
      if ((movedCountByDay[d] || 0) >= maxPerDay) continue;
      const slotStart = findSlot(d, duration);
      if (slotStart !== null) {
        if (!extraOccupied[d]) extraOccupied[d] = [];
        extraOccupied[d].push([slotStart, slotStart + duration]);
        movedCountByDay[d] = (movedCountByDay[d] || 0) + 1;
        proposals.push({
          event: ev,
          newDate: d,
          newStartTime: minutesToTime(slotStart),
          newEndTime: minutesToTime(slotStart + duration),
        });
        placed = true;
      }
    }

    if (!placed) {
      unplaced.push(ev);
    }
  }

  return { proposals, unplaced };
}


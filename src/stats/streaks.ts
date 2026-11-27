import type { DayLevel, HistoryData } from "./types";

/** Rachas, calendario y avisos (011). Puro: las fechas entran como argumento. */

export const dayKey = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Días seguidos con práctica, contando hoy o, si hoy aún no, desde ayer. */
export function streak(days: Record<string, number>, today: Date = new Date()): number {
  const d = new Date(today);
  if (!(days[dayKey(d)] > 0)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[dayKey(d)] > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

const parseKey = (k: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null;
};

/** La racha más larga de días consecutivos con práctica (FR-010, research R5). */
export function bestStreak(days: Record<string, number>): number {
  const keys = new Set(Object.keys(days).filter((k) => days[k] > 0 && parseKey(k)));
  let best = 0;
  for (const k of keys) {
    const d = parseKey(k)!;
    d.setDate(d.getDate() - 1);
    if (keys.has(dayKey(d))) continue; // no es el comienzo de una racha
    let n = 1;
    d.setDate(d.getDate() + 2);
    while (keys.has(dayKey(d))) {
      n++;
      d.setDate(d.getDate() + 1);
    }
    best = Math.max(best, n);
  }
  return best;
}

/** Minutos que separan «poca» de «mucha» sin objetivo diario (aclaración Q4). */
export const DEFAULT_MUCH_MIN = 10;

export const goalMet = (seconds: number, goalMin: number): boolean => goalMin > 0 && seconds >= goalMin * 60;

export function dayLevel(seconds: number, goalMin: number): DayLevel {
  if (!(seconds > 0)) return 0;
  return seconds >= (goalMin || DEFAULT_MUCH_MIN) * 60 ? 2 : 1;
}

export interface CalendarDay {
  key: string;
  date: Date;
  seconds: number;
  level: DayLevel;
  goal: boolean;
  future: boolean;
}

/** Rejilla por semanas (lunes a domingo); la última columna es la semana de `today`. */
export function calendar(days: Record<string, number>, goalMin: number, today: Date = new Date(), weeks = 13): CalendarDay[][] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 7 * (weeks - 1));
  const todayKey = dayKey(today);
  let past = true;
  const cols: CalendarDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + i);
      const key = dayKey(date);
      const future = !past;
      if (key === todayKey) past = false;
      const seconds = future ? 0 : (days[key] ?? 0);
      col.push({ key, date, seconds, level: dayLevel(seconds, goalMin), goal: goalMet(seconds, goalMin), future });
    }
    cols.push(col);
  }
  return cols;
}

export type Milestone = "record" | "goal";

/** Avisos tras sumar práctica: nuevo récord de racha u objetivo cumplido, una vez al día (research R6). */
export function milestones(
  before: Record<string, number>,
  after: Record<string, number>,
  goalMin: number,
  today: Date,
  cheered: HistoryData["cheered"],
): Milestone[] {
  const key = dayKey(today);
  const out: Milestone[] = [];
  const current = streak(after, today);
  const best = bestStreak(after);
  if (cheered.record !== key && current >= 2 && current === best && best > bestStreak(before)) out.push("record");
  if (cheered.goal !== key && goalMin > 0 && !goalMet(before[key] ?? 0, goalMin) && goalMet(after[key] ?? 0, goalMin)) out.push("goal");
  return out;
}

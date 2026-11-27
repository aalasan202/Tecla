import { dayKey } from "./streaks";
import type { Attempt, HistoryData, Origin, Period } from "./types";

/** Estadísticas por periodo (011, FR-014–018, research R9). Puro. */

export interface PieceStat {
  key: string;
  title: string;
  src: Origin;
}

export interface PeriodStats {
  seconds: number;
  daysPracticed: number;
  attempts: Record<Origin, number>;
  /** Nota media en Tocar (sin fragmentos), 0–1; null sin datos. */
  avgPlay: Record<Origin, number | null>;
  series: { label: string; title: string; seconds: number }[];
  /** «día», «semana» o «mes»: cómo se agrupa `series`. */
  unit: "day" | "week" | "month";
  top: (PieceStat & { attempts: number })[];
  improved: (PieceStat & { from: number; to: number })[];
  empty: boolean;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const WEEKDAYS = ["D", "L", "M", "X", "J", "V", "S"];
const DAY_MS = 86_400_000;

const atNoon = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
const keyToDate = (k: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

function firstDay(days: Record<string, number>, attempts: Attempt[], today: Date): Date {
  let first = today;
  for (const [k, s] of Object.entries(days)) {
    const d = keyToDate(k);
    if (d && s > 0 && d < first) first = d;
  }
  for (const a of attempts) {
    const d = atNoon(new Date(a.at));
    if (d < first) first = d;
  }
  return first;
}

export function periodStats(period: Period, days: Record<string, number>, h: Pick<HistoryData, "attempts" | "pieces">, today: Date = new Date()): PeriodStats {
  const end = atNoon(today);
  const start = period === "7d" ? addDays(end, -6) : period === "30d" ? addDays(end, -29) : firstDay(days, h.attempts, end);
  const startMs = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endMs = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1).getTime();

  // tiempo por día del periodo
  const perDay: { date: Date; seconds: number }[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) perDay.push({ date: d, seconds: Math.max(0, days[dayKey(d)] ?? 0) });
  const seconds = perDay.reduce((a, d) => a + d.seconds, 0);
  const daysPracticed = perDay.filter((d) => d.seconds > 0).length;

  // intentos del periodo; los de fecha futura (reloj cambiado) se ignoran
  const list = h.attempts.filter((a) => a.at >= startMs && a.at < endMs);
  const attempts: Record<Origin, number> = { song: 0, course: 0 };
  const sum: Record<Origin, [number, number]> = { song: [0, 0], course: [0, 0] };
  for (const a of list) {
    attempts[a.src]++;
    if (a.mode === "play" && !a.frag) {
      sum[a.src][0] += a.score;
      sum[a.src][1]++;
    }
  }
  const avg = (o: Origin) => (sum[o][1] ? sum[o][0] / sum[o][1] : null);

  // serie de tiempo
  let unit: PeriodStats["unit"] = "day";
  let series: PeriodStats["series"];
  if (period !== "all") {
    series = perDay.map((d) => ({
      label: period === "7d" ? WEEKDAYS[d.date.getDay()] : String(d.date.getDate()),
      title: fmt(d.date),
      seconds: d.seconds,
    }));
  } else {
    const weeks = Math.floor((mondayOf(end).getTime() - mondayOf(start).getTime()) / (7 * DAY_MS) + 0.5) + 1;
    unit = weeks <= 26 ? "week" : "month";
    const buckets = new Map<string, { label: string; title: string; seconds: number }>();
    for (const d of perDay) {
      const b = unit === "week" ? mondayOf(d.date) : new Date(d.date.getFullYear(), d.date.getMonth(), 1, 12);
      const k = dayKey(b);
      const label = unit === "week" ? fmt(b) : `${MONTHS[b.getMonth()]} ${String(b.getFullYear()).slice(2)}`;
      const title = unit === "week" ? `Semana del ${fmt(b)}` : `${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
      const prev = buckets.get(k) ?? { label, title, seconds: 0 };
      prev.seconds += d.seconds;
      buckets.set(k, prev);
    }
    series = [...buckets.values()];
  }

  // más practicadas y más mejoradas
  let top: PeriodStats["top"];
  let improved: PeriodStats["improved"];
  if (period === "all") {
    const entries = Object.entries(h.pieces);
    top = entries.map(([key, p]) => ({ key, title: p.title, src: p.src, attempts: p.count }));
    improved = entries
      .filter(([, p]) => p.first && p.best && p.best.score > p.first.score)
      .map(([key, p]) => ({ key, title: p.title, src: p.src, from: p.first!.score, to: p.best!.score }));
  } else {
    const by = new Map<string, { stat: PieceStat; n: number; first?: number; best?: number }>();
    for (const a of [...list].sort((x, y) => x.at - y.at)) {
      const e = by.get(a.key) ?? { stat: { key: a.key, title: a.title, src: a.src }, n: 0 };
      e.stat.title = a.title;
      e.n++;
      if (a.counts) {
        if (e.first === undefined) e.first = a.score;
        e.best = Math.max(e.best ?? 0, a.score);
      }
      by.set(a.key, e);
    }
    top = [...by.values()].map((e) => ({ ...e.stat, attempts: e.n }));
    improved = [...by.values()]
      .filter((e) => e.first !== undefined && e.best !== undefined && e.best > e.first)
      .map((e) => ({ ...e.stat, from: e.first!, to: e.best! }));
  }
  top = top.filter((t) => t.attempts > 0).sort((a, b) => b.attempts - a.attempts).slice(0, 3);
  improved = improved.sort((a, b) => b.to - b.from - (a.to - a.from)).slice(0, 3);

  return {
    seconds,
    daysPracticed,
    attempts,
    avgPlay: { song: avg("song"), course: avg("course") },
    series,
    unit,
    top,
    improved,
    empty: seconds === 0 && list.length === 0,
  };
}

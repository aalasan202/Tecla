import { createStore } from "./store";
import type { HandChoice, Mode } from "../engine/lesson";
import { dayKey, milestones, streak } from "../stats/streaks";
import { forgetHistory, history, notice } from "./history";
import { settings } from "./settings";

export { dayKey, streak };

export interface LastSession {
  songId: string;
  mode: Mode;
  hands: HandChoice;
  /** 0–1: hasta dónde llegaste la última vez. */
  progress: number;
  at: number;
}

export interface ProgressData {
  /** Mejores estrellas (0–3) por canción, en el modo Tocar. */
  best: Record<string, number>;
  last: LastSession | null;
  /** Segundos de práctica por día local (AAAA-MM-DD). */
  days: Record<string, number>;
}

export const progress = createStore<ProgressData>("tecla-progress", { best: {}, last: null, days: {} }, (raw) => {
  // la versión 0.2 guardaba solo las estrellas en "tecla-best"
  void raw;
  try {
    const old = JSON.parse(localStorage.getItem("tecla-best") || "null");
    return old && typeof old === "object" ? { best: old as Record<string, number> } : {};
  } catch {
    return {};
  }
});

export function recordStars(songId: string, stars: number): void {
  progress.set((p) => ((p.best[songId] ?? 0) >= stars ? {} : { best: { ...p.best, [songId]: stars } }));
}

export function recordSession(session: Omit<LastSession, "at">): void {
  progress.set({ last: { ...session, at: Date.now() } });
}

/** Suma tiempo de práctica al día de hoy (se ignoran sesiones absurdas) y avisa de récord u objetivo (011). */
export function addPractice(seconds: number, now: Date = new Date()): void {
  if (!(seconds > 1)) return;
  const key = dayKey(now);
  const s = Math.min(seconds, 3600);
  const before = progress.get().days;
  progress.set((p) => ({ days: { ...p.days, [key]: (p.days[key] ?? 0) + s } }));
  const after = progress.get().days;
  for (const m of milestones(before, after, settings.get().dailyGoal, now, history.get().cheered)) {
    history.set((h) => ({ cheered: { ...h.cheered, [m]: key } }));
    notice.push(m === "record" ? { kind: m, text: `¡Nueva mejor racha: ${streak(after, now)} días!` } : { kind: m, text: "¡Objetivo de hoy cumplido!" });
  }
}

/** Los últimos 7 días, del más antiguo a hoy. */
export function lastWeek(days: Record<string, number>, today: Date = new Date()): { key: string; date: Date; seconds: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    const key = dayKey(date);
    return { key, date, seconds: days[key] ?? 0 };
  });
}

export function formatDuration(seconds: number): string {
  if (seconds > 0 && seconds < 60) return "< 1 min";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}

/** Olvida las estrellas de una pieza y «Continuar» si apuntaba a ella (al borrar una importada). */
export function forgetSong(id: string): void {
  progress.set((p) => {
    const best = { ...p.best };
    delete best[id];
    return { best, last: p.last?.songId === id ? null : p.last };
  });
  forgetHistory(`song:${id}`);
}

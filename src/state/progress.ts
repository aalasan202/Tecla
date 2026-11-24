import { createStore } from "./store";
import type { HandChoice, Mode } from "../engine/lesson";

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

export const dayKey = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function recordStars(songId: string, stars: number): void {
  progress.set((p) => ((p.best[songId] ?? 0) >= stars ? {} : { best: { ...p.best, [songId]: stars } }));
}

export function recordSession(session: Omit<LastSession, "at">): void {
  progress.set({ last: { ...session, at: Date.now() } });
}

/** Suma tiempo de práctica al día de hoy (se ignoran sesiones absurdas). */
export function addPractice(seconds: number): void {
  if (!(seconds > 1)) return;
  const key = dayKey();
  const s = Math.min(seconds, 3600);
  progress.set((p) => ({ days: { ...p.days, [key]: (p.days[key] ?? 0) + s } }));
}

/** Días seguidos con práctica, contando hoy o, si hoy aún no, desde ayer. */
export function streak(days: Record<string, number>, today: Date = new Date()): number {
  const d = new Date(today);
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[dayKey(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
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
}

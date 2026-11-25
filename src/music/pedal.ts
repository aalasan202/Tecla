import type { PedalSpan, SongDef } from "./types";
import { TICKS, meterOf, pitchesOf, tracksOf } from "./score";

/**
 * Pedal de resonancia (009). Funciones puras: sonido sostenido, qué dibujar, recorte al bucle,
 * ajuste de lo importado y validación. Todo en pulsos de negra.
 */

/**
 * Pulso en el que deja de sonar una nota que empieza en `s` y dura `d`: si su fin cae dentro de
 * un tramo (from < s + d < to), el fin del tramo; si no, s + d.
 */
export function sustainedEnd(s: number, d: number, pedals: readonly PedalSpan[]): number {
  const end = s + d;
  const eps = 1e-9;
  for (const [from, to] of pedals) if (from < end - eps && end < to - eps) return to;
  return end;
}

/** Tramos encadenados (un cambio en cada punto): chain(0, 4, 8) → [[0, 4], [4, 8]]. */
export const chain = (...points: number[]): PedalSpan[] => points.slice(1).map((to, i) => [points[i], to]);

/** Tramos encadenados cada `step` pulsos de `from` a `to`. */
export const every = (step: number, from: number, to: number): PedalSpan[] =>
  chain(...Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => from + i * step));

export type PedalMark =
  | { kind: "down"; at: number }
  | { kind: "change"; at: number }
  | { kind: "up"; at: number }
  | { kind: "line"; from: number; to: number };

const same = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/** Qué dibujar, en pulsos: gancho al pisar, «V» en cada cambio, gancho al levantar y las líneas. */
export function pedalMarks(pedals: readonly PedalSpan[]): PedalMark[] {
  const out: PedalMark[] = [];
  pedals.forEach(([from, to], i) => {
    const prev = pedals[i - 1];
    const next = pedals[i + 1];
    if (!prev || !same(prev[1], from)) out.push({ kind: "down", at: from });
    out.push({ kind: "line", from, to });
    out.push(next && same(next[0], to) ? { kind: "change", at: to } : { kind: "up", at: to });
  });
  return out;
}

/** Tramos limitados a [from, to) en pulsos (fragmento del bucle); los de fuera se descartan. */
export function clipPedals(pedals: readonly PedalSpan[], from: number, to: number): PedalSpan[] {
  return pedals
    .map(([a, b]): PedalSpan => [Math.max(a, from), Math.min(b, to)])
    .filter(([a, b]) => b - a > 1e-9);
}

/** Inicios de nota (en ticks, ordenados) y final de la pieza redondeado al compás (ticks). */
function timeline(song: Omit<SongDef, "id" | "level">): { onsets: number[]; total: number } {
  const { bar } = meterOf(song as SongDef);
  const onsets = new Set<number>();
  let length = 0;
  for (const [, track] of tracksOf(song as SongDef)) {
    let at = 0;
    let tiedKey: string | null = null;
    for (const [nota, dur, opts] of track) {
      const key = pitchesOf(nota).map((p) => p.m).join(",");
      // una nota ligada a la anterior no empieza de nuevo
      if (key !== "" && key !== tiedKey) onsets.add(at);
      tiedKey = opts?.tie && key !== "" ? key : null;
      at += Math.round(dur * TICKS);
    }
    length = Math.max(length, at);
  }
  const barT = bar * TICKS;
  return { onsets: [...onsets].sort((a, b) => a - b), total: Math.ceil(length / barT) * barT };
}

const nearest = (list: number[], t: number): number =>
  list.reduce((best, x) => (Math.abs(x - t) < Math.abs(best - t) ? x : best), list[0]);

/**
 * Ajusta tramos leídos de un archivo a la pieza ya convertida: cada extremo al inicio de nota
 * más cercano (el fin también puede ir al final de la pieza), sin tramos vacíos y fusionando
 * solapes. Nunca lanza.
 */
export function fitPedals(spans: readonly [number, number][], song: Omit<SongDef, "id" | "level">): PedalSpan[] {
  const { onsets, total } = timeline(song);
  if (!onsets.length) return [];
  const ends = [...onsets, total];
  const fitted = spans
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .map(([a, b]): [number, number] => [nearest(onsets, a * TICKS), nearest(ends, Math.min(b, total / TICKS) * TICKS)])
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);
  const merged: [number, number][] = [];
  for (const span of fitted) {
    const last = merged[merged.length - 1];
    if (last && span[0] < last[1]) last[1] = Math.max(last[1], span[1]);
    else merged.push([...span]);
  }
  return merged.map(([a, b]): PedalSpan => [a / TICKS, b / TICKS]);
}

/** Reglas del pedal de una pieza (data-model, reglas 1–4); vacío si es válido. */
export function validatePedal(song: SongDef): string[] {
  if (!song.pedal) return [];
  const errors: string[] = [];
  const { onsets, total } = timeline(song);
  const starts = new Set(onsets);
  let prevTo = -Infinity;
  song.pedal.forEach(([from, to], i) => {
    const where = `pedal, tramo ${i + 1}`;
    const ft = from * TICKS;
    const tt = to * TICKS;
    if (Math.abs(ft - Math.round(ft)) > 1e-6 || Math.abs(tt - Math.round(tt)) > 1e-6) {
      errors.push(`${where}: extremos no múltiplos de 1/48 de negra`);
      return;
    }
    const f = Math.round(ft);
    const t = Math.round(tt);
    if (!(f < t)) errors.push(`${where}: exige from < to`);
    if (from < prevTo - 1e-9) errors.push(`${where}: desordenado o se solapa con el anterior`);
    if (!starts.has(f)) errors.push(`${where}: from no cae en un inicio de nota`);
    if (t > total) errors.push(`${where}: to fuera de la pieza`);
    else if (!starts.has(t) && t !== total) errors.push(`${where}: to no cae en un inicio de nota o el final de la pieza`);
    prevTo = Math.max(prevTo, to);
  });
  return errors;
}

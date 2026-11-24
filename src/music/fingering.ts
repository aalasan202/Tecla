import type { ScoreNote } from "./types";
import { staffStep } from "./theory";

interface Options {
  /** -1 para la mano izquierda: el pulgar queda en la nota más aguda. */
  sign: 1 | -1;
  /** Ventanas por compás que admiten hasta una octava (arpegios). */
  arpeggio?: boolean;
  /** Cortar la ventana tras una nota que dura un compás entero (fin de frase). */
  phraseBreaks?: boolean;
  bar: number;
}

/**
 * Digitación sugerida, por eventos de una mano (una nota o un acorde) en orden temporal.
 * Agrupa eventos seguidos en "posiciones de mano" de cinco dedos y asigna a cada tecla de la
 * posición un dedo creciente (research R9). Un acorde más abierto que una posición se queda
 * en una posición propia y reparte los dedos según la distancia. Escribe el resultado en note.f.
 */
export function assignFingering(events: ScoreNote[][], { sign, arpeggio = false, phraseBreaks = false, bar }: Options): void {
  const steps = events.map((e) => e.map((n) => sign * staffStep(n.m)));
  const maxSpan = arpeggio ? 7 : 4;
  let i = 0;
  while (i < events.length) {
    let j = i;
    let lo = Math.min(...steps[i]);
    let hi = Math.max(...steps[i]);
    const keys = new Set(steps[i]);
    // un acorde más abierto que la posición marca su propio límite
    const limit = Math.max(maxSpan, hi - lo);
    while (j + 1 < events.length) {
      const next = events[j + 1];
      if (phraseBreaks && events[j][0].d >= bar) break;
      if (arpeggio && Math.floor(next[0].s / bar) !== Math.floor(events[i][0].s / bar)) break;
      const a = Math.min(lo, ...steps[j + 1]);
      const b = Math.max(hi, ...steps[j + 1]);
      const union = new Set([...keys, ...steps[j + 1]]);
      if (b - a > limit || union.size > 5) break;
      // la posición de un acorde abierto solo admite repetir sus mismas teclas
      if (limit > maxSpan && union.size > keys.size) break;
      j++;
      lo = a;
      hi = b;
      steps[j].forEach((v) => keys.add(v));
    }
    const span = hi - lo;
    const sorted = [...keys].sort((a, b) => a - b);
    const fingerOf = new Map<number, number>();
    let prev = 0;
    sorted.forEach((v, k) => {
      let f = span <= 4 ? v - lo + 1 : Math.round(1 + ((v - lo) / span) * 4);
      f = Math.min(Math.max(f, prev + 1), 5 - (sorted.length - 1 - k));
      fingerOf.set(v, f);
      prev = f;
    });
    for (let k = i; k <= j; k++) events[k].forEach((n, x) => (n.f = fingerOf.get(steps[k][x])!));
    i = j + 1;
  }
}

/** Agrupa las notas de una mano (ya en orden temporal) en eventos por `unit`. */
export function eventsOf(notes: ScoreNote[]): ScoreNote[][] {
  const byUnit = new Map<number, ScoreNote[]>();
  for (const n of notes) {
    const list = byUnit.get(n.unit);
    if (list) list.push(n);
    else byUnit.set(n.unit, [n]);
  }
  return [...byUnit.values()];
}

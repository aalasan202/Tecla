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
 * Digitación sugerida. Agrupa notas seguidas en "posiciones de mano" de cinco dedos
 * y asigna a cada tecla de la posición un dedo creciente. Escribe el resultado en note.f.
 */
export function assignFingering(notes: ScoreNote[], { sign, arpeggio = false, phraseBreaks = false, bar }: Options): void {
  const steps = notes.map((n) => sign * staffStep(n.m));
  const maxSpan = arpeggio ? 7 : 4;
  let i = 0;
  while (i < notes.length) {
    let j = i;
    let lo = steps[i];
    let hi = steps[i];
    const keys = new Set([steps[i]]);
    while (j + 1 < notes.length) {
      const next = notes[j + 1];
      const v = steps[j + 1];
      if (phraseBreaks && notes[j].d >= bar) break;
      if (arpeggio && Math.floor(next.s / bar) !== Math.floor(notes[i].s / bar)) break;
      const a = Math.min(lo, v);
      const b = Math.max(hi, v);
      if (b - a > maxSpan || (!keys.has(v) && keys.size >= 5)) break;
      j++;
      lo = a;
      hi = b;
      keys.add(v);
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
    for (let k = i; k <= j; k++) notes[k].f = fingerOf.get(steps[k])!;
    i = j + 1;
  }
}

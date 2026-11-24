import type { Hand, KeyChange, Spell, Spelled } from "./types";
import type { Notation } from "./theory";

/** Alteración que se dibuja delante de una cabeza. */
export type Acc = "#" | "b" | "n" | "##" | "bb";

export interface SpelledPitch extends Spelled {
  octave: number;
}

const BY_PC: Record<number, string> = { 0: "C", 2: "D", 4: "E", 5: "F", 7: "G", 9: "A", 11: "B" };
const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];
const ALTER_OF: Record<Spell, number> = { "#": 1, b: -1, n: 0, "##": 2, bb: -2 };
/** Posición en el círculo de quintas de cada sostenido (Fa♯ = 6 … La♯ = 10). */
const SHARP_FIFTHS: Record<number, number> = { 6: 6, 1: 7, 8: 8, 3: 9, 10: 10 };

const pcOf = (m: number) => ((m % 12) + 12) % 12;

/** Alteración que la armadura da a una nota (C…B). */
export function keyAlter(step: string, key: number): number {
  if (key > 0 && SHARP_ORDER.indexOf(step) < key) return 1;
  if (key < 0 && FLAT_ORDER.indexOf(step) < -key) return -1;
  return 0;
}

/**
 * Ortografía de una altura. Las teclas blancas se escriben naturales; las negras, con sostenido
 * en Do y en las tonalidades con sostenidos, y con bemol en las de bemoles (salvo la sensible
 * de la relativa menor: Do♯ en Re menor). `override` manda (Mi♯, Si♯, Do♭ y Fa♭ solo así).
 */
export function spell(m: number, key = 0, override?: Spell): SpelledPitch {
  const pc = pcOf(m);
  let step: string | undefined;
  let alter = 0;
  if (override) {
    alter = ALTER_OF[override];
    step = BY_PC[pcOf(pc - alter)];
  }
  if (!step) {
    if (pc in BY_PC) {
      step = BY_PC[pc];
      alter = 0;
    } else if (key < 0 && SHARP_FIFTHS[pc] !== key + 8) {
      step = BY_PC[pcOf(pc + 1)];
      alter = -1;
    } else {
      step = BY_PC[pcOf(pc - 1)];
      alter = 1;
    }
  }
  return { step, alter, octave: Math.floor((m - alter) / 12) - 1 };
}

const LATIN: Record<string, string> = { C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };
const SYMBOL: Record<number, string> = { [-2]: "𝄫", [-1]: "♭", 0: "", 1: "♯", 2: "𝄪" };

/** Nombre de la nota con su alteración real: «Fa♯», «Si♭», «F♯». */
export function noteLabel(spelled: Spelled, notation: Notation = "latin"): string {
  return (notation === "english" ? spelled.step : LATIN[spelled.step]) + SYMBOL[spelled.alter];
}

const ACC_OF: Record<number, Acc> = { [-2]: "bb", [-1]: "b", 0: "n", 1: "#", 2: "##" };

/** Armadura vigente en un compás. */
export function keyAt(keys: KeyChange[], measure: number): number {
  let key = 0;
  for (const k of keys) if (k.at <= measure) key = k.key;
  return key;
}

/** Lo que `accidentals` necesita de cada nota. */
export interface AccNote {
  id: number;
  m: number;
  s: number;
  h: Hand;
  spell: Spelled;
}

/**
 * Qué alteraciones se dibujan: por mano y compás, solo cuando la nota se aparta de la armadura o
 * de una alteración anterior en el mismo compás y la misma octava; becuadro para anular.
 */
export function accidentals(notes: AccNote[], keys: KeyChange[], bar: number): Map<number, Acc> {
  const out = new Map<number, Acc>();
  for (const hand of ["R", "L"] as const) {
    const own = notes.filter((n) => n.h === hand).sort((a, b) => a.s - b.s || a.id - b.id);
    let measure = -1;
    let key = 0;
    let state = new Map<string, number>();
    for (const n of own) {
      const i = Math.floor(n.s / bar + 1e-9);
      if (i !== measure) {
        measure = i;
        key = keyAt(keys, i);
        state = new Map();
      }
      const { step, alter } = n.spell;
      const octave = Math.floor((n.m - alter) / 12) - 1;
      const id = `${step}${octave}`;
      const current = state.has(id) ? state.get(id)! : keyAlter(step, key);
      if (alter !== current) {
        out.set(n.id, ACC_OF[alter]);
        state.set(id, alter);
      }
    }
  }
  return out;
}

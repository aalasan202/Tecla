import type { SongDef, Spell, Track } from "../music/types";
import type { ScaleSpec, ScaleTonic } from "./types";

/**
 * Escalas de una octava generadas (012, research R4): suben y bajan en negras, con la
 * digitación estándar de cada tonalidad y mano. La digitación se enseña, no se puntúa.
 */

interface ScaleData {
  /** Tónica de la mano derecha (octava 4); la izquierda va una octava más abajo. */
  midi: number;
  /** Armadura, −7 … +7. */
  key: number;
  name: string;
  /** Dedos al subir (8 notas); al bajar, invertidos. */
  fingers: { R: number[]; L: number[] };
}

const STD_R = [1, 2, 3, 1, 2, 3, 4, 5];
const STD_L = [5, 4, 3, 2, 1, 3, 2, 1];

/** Clave: tónica + modo (`Am`, `Em` para las menores). */
export type ScaleKey = ScaleTonic | "Am" | "Em";

export const SCALE_TABLE: Record<ScaleKey, ScaleData> = {
  C: { midi: 60, key: 0, name: "Do mayor", fingers: { R: STD_R, L: STD_L } },
  G: { midi: 67, key: 1, name: "Sol mayor", fingers: { R: STD_R, L: STD_L } },
  F: { midi: 65, key: -1, name: "Fa mayor", fingers: { R: [1, 2, 3, 4, 1, 2, 3, 4], L: STD_L } },
  D: { midi: 62, key: 2, name: "Re mayor", fingers: { R: STD_R, L: STD_L } },
  A: { midi: 69, key: 0, name: "La mayor", fingers: { R: STD_R, L: STD_L } },
  E: { midi: 64, key: 4, name: "Mi mayor", fingers: { R: STD_R, L: STD_L } },
  Bb: { midi: 70, key: -2, name: "Si bemol mayor", fingers: { R: [4, 1, 2, 3, 1, 2, 3, 4], L: [3, 2, 1, 4, 3, 2, 1, 3] } },
  Am: { midi: 69, key: 0, name: "La menor", fingers: { R: STD_R, L: STD_L } },
  Em: { midi: 64, key: 1, name: "Mi menor", fingers: { R: STD_R, L: STD_L } },
};

const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12];
/** Menor armónica: la sensible (7.º grado) sube medio tono. */
const HARMONIC_MINOR = [0, 2, 3, 5, 7, 8, 11, 12];

export const scaleKey = (s: Pick<ScaleSpec, "tonic" | "mode">): ScaleKey => (s.mode === "minor" ? (`${s.tonic}m` as ScaleKey) : s.tonic);

export const scaleName = (s: Pick<ScaleSpec, "tonic" | "mode">): string => SCALE_TABLE[scaleKey(s)].name;

export const scaleId = (s: Pick<ScaleSpec, "tonic" | "mode" | "hand">): string =>
  `escala-${s.tonic.toLowerCase()}${s.mode === "minor" ? "m" : ""}-${s.hand}`;

/** Alturas y dedos de la escala completa: 8 notas al subir y 7 al bajar. */
export function scaleNotes(s: Pick<ScaleSpec, "tonic" | "mode" | "hand">): { m: number; f: number; spell?: Spell }[] {
  const d = SCALE_TABLE[scaleKey(s)];
  const base = d.midi - (s.hand === "L" ? 12 : 0);
  const steps = s.mode === "minor" ? HARMONIC_MINOR : MAJOR;
  const fingers = d.fingers[s.hand];
  const up = steps.map((st, i) => ({ m: base + st, f: fingers[i], ...(s.mode === "minor" && i === 6 ? { spell: "#" as Spell } : {}) }));
  const down = up.slice(0, 7).reverse();
  return [...up, ...down];
}

/** La escala como pieza: 4 compases de 4/4 (15 negras y un silencio). */
export function scale(spec: ScaleSpec, tempo: number): SongDef {
  const d = SCALE_TABLE[scaleKey(spec)];
  const track: Track = scaleNotes(spec).map(({ m, f, spell }) => [m, 1, spell ? { f, spell } : { f }]);
  track.push([0, 1]);
  const hand = spec.hand === "R" ? "mano derecha" : "mano izquierda";
  const base: SongDef = {
    id: `${scaleId(spec)}@${tempo}`,
    title: `Escala de ${d.name} · ${hand}`,
    level: "Curso · Técnica",
    origin: "Ejercicio del proyecto",
    tempo,
    key: d.key,
  };
  return spec.hand === "R" ? { ...base, n: track } : { ...base, r: [[0, 4], [0, 4], [0, 4], [0, 4]], l: track };
}

/** Notas donde la mano cambia de posición (paso del pulgar o cruce de dedo): dedos no contiguos entre notas vecinas. */
export function thumbPasses(spec: Pick<ScaleSpec, "tonic" | "mode" | "hand">): number[] {
  const ns = scaleNotes(spec);
  const out = new Set<number>();
  for (let i = 1; i < ns.length; i++) if (Math.abs(ns[i].f - ns[i - 1].f) !== 1) out.add(ns[i].m);
  return [...out];
}

/** Escalón de tempo propuesto: el primero sin 3★ (el objetivo si todos las tienen). */
export function tempoStep(best: Record<string, number>, id: string): 0 | 1 | 2 {
  for (const i of [0, 1, 2] as const) if ((best[`${id}@${i}`] ?? 0) < 3) return i;
  return 2;
}

/** Escalón al que cuenta un intento a `used` ppm: el más alto cuyo tempo no supera el usado; −1 si es más lento que el inicial. */
export function stepForTempo(tempos: [number, number, number], used: number): 0 | 1 | 2 | -1 {
  for (const i of [2, 1, 0] as const) if (used >= tempos[i]) return i;
  return -1;
}

/** Una escala está dominada con 2★ o más en el tempo objetivo (FR-016). */
export const scaleMastered = (best: Record<string, number>, id: string): boolean => (best[`${id}@2`] ?? 0) >= 2;

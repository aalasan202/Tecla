import type { SongDef, Track } from "../music/types";
import { SCALE_TABLE, scaleKey, scaleNotes } from "./scales";
import type { ScaleTonic } from "./types";

/**
 * Independencia de manos (012, FR-017): cada mano hace algo distinto. Exigen teclado MIDI
 * (constitución 1.1.0, Principio III); no cuentan para abrir niveles.
 */

const origin = "Ejercicio del proyecto";
const two = (id: string, title: string, level: 2 | 3 | 4, tempo: number, r: Track, l: Track, key = 0): SongDef => ({
  id: `indep-${level}-${id}`,
  title,
  level: `Nivel ${level} · Curso · Dos manos`,
  origin,
  tempo,
  key,
  r,
  l,
});

/** Escala a dos manos en movimiento paralelo, una octava de distancia (nivel 4). */
function handsTogetherScale(tonic: ScaleTonic, tempo: number): SongDef {
  const track = (hand: "R" | "L"): Track => [
    ...scaleNotes({ tonic, mode: "major", hand }).map(({ m, f }): Track[number] => [m, 1, { f }]),
    [0, 1],
  ];
  const d = SCALE_TABLE[scaleKey({ tonic, mode: "major" })];
  return two(`escala-${tonic.toLowerCase()}`, `Escala de ${d.name} · dos manos`, 4, tempo, track("R"), track("L"), d.key);
}

/** Ocho corcheas de un compás alternando dos notas. */
const eighths = (a: number, b: number): Track => Array.from({ length: 8 }, (_, i) => [i % 2 ? b : a, 0.5] as [number, number]);

export const INDEPENDENCE: Record<2 | 3 | 4, SongDef[]> = {
  2: [
    two(
      "notas-largas",
      "Melodía sobre notas largas",
      2,
      72,
      [[60, 1], [62, 1], [64, 1], [65, 1], [67, 2], [67, 2], [65, 1], [64, 1], [62, 1], [64, 1], [60, 4]],
      [[48, 4], [48, 4], [43, 4], [48, 4]],
    ),
    two(
      "blancas-izquierda",
      "Blancas en la mano izquierda",
      2,
      72,
      [[64, 1], [65, 1], [67, 1], [64, 1], [65, 1], [64, 1], [62, 2], [62, 1], [64, 1], [65, 1], [62, 1], [60, 4]],
      [[48, 2], [52, 2], [53, 2], [52, 2], [50, 2], [47, 2], [48, 4]],
    ),
  ],
  3: [
    two(
      "blancas-negras",
      "Blancas contra negras",
      3,
      72,
      [[64, 2], [62, 2], [60, 2], [62, 2], [64, 2], [64, 2], [64, 4]],
      [[48, 1], [52, 1], [55, 1], [52, 1], [48, 1], [52, 1], [55, 1], [52, 1], [48, 1], [52, 1], [55, 1], [52, 1], [48, 4]],
    ),
    two(
      "negras-corcheas",
      "Negras contra corcheas",
      3,
      66,
      [[67, 1], [65, 1], [64, 1], [62, 1], [60, 1], [62, 1], [64, 2], [64, 1], [62, 1], [60, 1], [62, 1], [60, 4]],
      [...eighths(48, 55), ...eighths(48, 55), ...eighths(43, 50), [48, 4]],
    ),
  ],
  4: [
    two(
      "puntillo-pulso",
      "Puntillo contra pulso",
      4,
      72,
      [[72, 1.5], [71, 0.5], [69, 1], [67, 1], [65, 1.5], [64, 0.5], [62, 2], [64, 1.5], [65, 0.5], [67, 1], [69, 1], [72, 4]],
      [[48, 1], [55, 1], [52, 1], [55, 1], [43, 1], [50, 1], [47, 1], [50, 1], [41, 1], [48, 1], [45, 1], [48, 1], [48, 4]],
    ),
    two(
      "sincopa",
      "Síncopa sobre blancas",
      4,
      66,
      [[67, 0.5], [67, 1], [67, 0.5], [69, 1], [67, 1], [65, 0.5], [65, 1], [65, 0.5], [64, 2], [62, 0.5], [64, 1], [65, 0.5], [67, 1], [64, 1], [60, 4]],
      [[48, 2], [43, 2], [41, 2], [48, 2], [43, 2], [47, 2], [48, 4]],
    ),
    handsTogetherScale("C", 66),
    handsTogetherScale("G", 66),
  ],
};

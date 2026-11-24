import type { RawTrack, SongDef } from "../types";
import type { Level, Metrics } from "./types";

/** Umbrales del nivel sugerido (research R5); un test los fija contra las 12 piezas del repertorio. */
export const LEVEL_RULES = {
  /** Nivel 4: dos manos que empiezan nota a la vez en al menos esta proporción de los inicios… */
  simultaneous4: 0.4,
  /** …o con más de esta proporción de corcheas. */
  eighths4: 0.25,
  /** Nivel 2: más corcheas que esta proporción… */
  eighths2: 0.1,
  /** …o la mano derecha abarca más teclas blancas que una posición de cinco dedos. */
  span2: 5,
} as const;

const BLACK = new Set([1, 3, 6, 8, 10]);
const WHITE_INDEX = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
/** Tecla blanca n.º …; una negra cuenta como la blanca de debajo. */
const white = (m: number) => Math.floor(m / 12) * 7 + WHITE_INDEX[m % 12];

function onsets(track: RawTrack): Set<number> {
  const out = new Set<number>();
  let at = 0;
  for (const [m, d] of track) {
    if (m !== 0) out.add(at);
    at += d;
  }
  return out;
}

export function measure(song: Omit<SongDef, "id" | "level">): Metrics {
  // en 6/8 el compás dura 3 negras
  const bar = song.time === "6/8" ? 3 : song.bar ?? 4;
  const twoHands = !!song.l;
  const tracks = twoHands ? [song.r ?? [], song.l ?? []] : [song.n ?? []];
  // una entrada por altura (las de un acorde cuentan por separado)
  const flat = (t: RawTrack) => t.flatMap(([m, d]) => (Array.isArray(m) ? m : m === 0 ? [] : [m]).map((p) => [p, d] as const));
  const notes = tracks.flatMap(flat);
  const right = flat(tracks[0]).map(([m]) => white(m));
  const length = Math.max(...tracks.map((t) => t.reduce((a, [, d]) => a + d, 0)));

  let simultaneousShare = 0;
  if (twoHands) {
    const [r, l] = tracks.map(onsets);
    const any = new Set([...r, ...l]);
    const both = [...r].filter((t) => l.has(t)).length;
    simultaneousShare = any.size ? both / any.size : 0;
  }

  return {
    bar,
    bars: Math.ceil(length / bar),
    notes: notes.length,
    twoHands,
    accidentals: notes.filter(([m]) => BLACK.has(m % 12)).length,
    rightSpan: right.length ? Math.max(...right) - Math.min(...right) + 1 : 0,
    eighthShare: notes.length ? notes.filter(([, d]) => d === 0.5).length / notes.length : 0,
    simultaneousShare,
  };
}

/** El nivel más alto cuyo criterio se cumple (FR-006). */
export function suggestLevel(m: Metrics): Level {
  if (m.twoHands && (m.simultaneousShare >= LEVEL_RULES.simultaneous4 || m.eighthShare > LEVEL_RULES.eighths4)) return 4;
  if (m.bar === 3 || m.accidentals > 0 || m.twoHands) return 3;
  if (m.rightSpan > LEVEL_RULES.span2 || m.eighthShare > LEVEL_RULES.eighths2) return 2;
  return 1;
}

/**
 * Nivel de la versión completa (research R11): las reglas de 006 y además armadura distinta de
 * Do o 6/8 → al menos 3; acordes de 3 o más notas, semicorcheas o tresillos en más del 10 % de
 * los eventos → 4.
 */
export function suggestFullLevel(song: Omit<SongDef, "id" | "level">): Level {
  let level = suggestLevel(measure(song));
  if ((song.key ?? 0) !== 0 || song.keyChanges?.length || song.time === "6/8") level = Math.max(level, 3) as Level;
  const tracks = song.l ? [song.r ?? [], song.l] : [song.n ?? []];
  const events = tracks.flat().filter(([m]) => m !== 0);
  const rich = events.filter(([m, d]) => (Array.isArray(m) && m.length >= 3) || Math.abs(d * 2 - Math.round(d * 2)) > 1e-9);
  if (events.length && rich.length / events.length > 0.1) level = 4;
  return level;
}

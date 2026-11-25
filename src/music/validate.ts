import type { SongDef } from "./types";
import { TICKS, meterOf, pitchesOf, tracksOf } from "./score";
import { validatePedal } from "./pedal";

/**
 * Comprueba una pieza con las reglas del modelo de datos (FR-017). Devuelve la lista de errores,
 * vacía si es válida; cada mensaje nombra la regla incumplida.
 */
export function validateSong(song: SongDef): string[] {
  const errors: string[] = [];
  const { bar } = meterOf(song);
  const barT = bar * TICKS;
  const lengths: number[] = [];

  if (song.time !== undefined && song.time !== "6/8") errors.push(`compás no admitido: ${song.time}`);
  if (song.kind === "rhythm" && (song.time !== undefined || bar !== 4)) errors.push("un ejercicio de ritmo (kind rhythm) va en 4/4");
  const keyOk = (k: number) => Number.isInteger(k) && k >= -7 && k <= 7;
  if (song.key !== undefined && !keyOk(song.key)) errors.push(`armadura fuera de −7…7: ${song.key}`);

  for (const [h, track] of tracksOf(song)) {
    let at = 0;
    let prevPitches: string | null = null;
    let prevTie = false;
    let slurOpen = false;
    track.forEach(([nota, dur, opts], i) => {
      const where = `mano ${h}, evento ${i + 1}`;
      const t = Math.round(dur * TICKS);
      if (!(dur > 0) || Math.abs(t - dur * TICKS) > 1e-6) errors.push(`${where}: duración no múltiplo de 1/48 de negra o no positiva (${dur})`);
      const list = Array.isArray(nota) ? nota : nota === 0 ? [] : [nota];
      if (Array.isArray(nota) && (nota.length < 2 || nota.length > 6)) errors.push(`${where}: un acorde tiene de 2 a 6 alturas`);
      if (new Set(list).size !== list.length) errors.push(`${where}: un acorde no repite altura`);
      if (list.some((m) => !Number.isInteger(m) || m < 21 || m > 108)) errors.push(`${where}: altura fuera de 21–108`);
      if (Array.isArray(opts?.spell) && opts.spell.length !== list.length) errors.push(`${where}: spell necesita una alteración por altura`);
      const key = pitchesOf(nota).map((p) => p.m).join(",");
      if (prevTie && (key === "" || key !== prevPitches)) errors.push(`${where}: tie solo une un evento con el siguiente de exactamente las mismas alturas`);
      if (opts?.tie && !list.length) errors.push(`${where}: un silencio no lleva tie`);
      if (opts?.slur === "start") {
        if (slurOpen) errors.push(`${where}: slur start sin cerrar el anterior (sin anidar)`);
        slurOpen = true;
      } else if (opts?.slur === "end") {
        if (!slurOpen) errors.push(`${where}: slur end sin start en la misma mano`);
        slurOpen = false;
      }
      prevPitches = key;
      prevTie = !!opts?.tie;
      at += t;
    });
    if (prevTie) errors.push(`mano ${h}: tie en el último evento`);
    if (slurOpen) errors.push(`mano ${h}: slur start sin end`);
    if (at % barT !== 0) errors.push(`mano ${h}: no llena compases completos (${at / TICKS} pulsos)`);
    if (song.time === "6/8" && at % (3 * TICKS) !== 0) errors.push(`mano ${h}: en 6/8 cada mano suma múltiplos de 3 negras`);
    lengths.push(at);
  }
  if (new Set(lengths).size > 1) errors.push("las dos manos no duran lo mismo");

  const total = Math.max(0, ...lengths) / barT;
  let prevAt = -1;
  for (const c of song.keyChanges ?? []) {
    if (!keyOk(c.key)) errors.push(`armadura fuera de −7…7 en keyChanges: ${c.key}`);
    if (!Number.isInteger(c.at) || c.at <= prevAt) errors.push("keyChanges desordenado");
    if (c.at < 0 || c.at >= total) errors.push(`keyChanges con at fuera de la pieza: ${c.at}`);
    prevAt = c.at;
  }
  errors.push(...validatePedal(song));
  return errors;
}

/** Duraciones de la versión simplificada (006). */
const SIMPLE_DURATIONS = [0.5, 1, 1.5, 2, 3, 4];

/**
 * La pieza usa algo que la versión simplificada de 006 no representa: acordes, ligaduras,
 * ortografía forzada, 6/8 o notas sin figura propia en 006 (semicorcheas, tresillos…); los
 * silencios pueden durar lo que sea.
 */
export function needsFullNotation(song: Omit<SongDef, "id" | "level">): boolean {
  if (song.time) return true;
  const tracks = song.l ? [song.r ?? [], song.l] : [song.n ?? []];
  return tracks.some((t) => t.some(([m, d, opts]) => Array.isArray(m) || !!opts?.tie || !!opts?.slur || !!opts?.spell || (m !== 0 && !SIMPLE_DURATIONS.includes(d))));
}

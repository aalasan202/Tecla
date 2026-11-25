import type { SongDef } from "../music/types";
import { validateSong } from "../music/validate";
import { buildScore } from "../music/score";
import type { Block, Unit } from "./types";

/** Palabras de un texto del Curso (las marcas {60} cuentan como una palabra). */
export const wordCount = (text: string): number => text.split(/\s+/).filter(Boolean).length;

/** Los 13 consejos de FR-005. */
export const REQUIRED_TIPS = [
  "consejo-postura", "consejo-mano", "consejo-dedos", "consejo-do", "consejo-sin-golpear", "consejo-poco-a-menudo",
  "consejo-lento", "consejo-contar", "consejo-ojos", "consejo-adelantado", "consejo-brazo", "consejo-bucle", "consejo-metronomo",
];
/** Consejos que llevan ilustración propia (FR-026). */
export const ILLUSTRATED_TIPS = ["consejo-postura", "consejo-mano", "consejo-dedos", "consejo-do", "consejo-sin-golpear", "consejo-brazo", "consejo-ojos"];

const FORBIDDEN = /pantalla|rat[oó]n|t[aá]ctil/i;

/** Segundos que dura un ejercicio a su tempo. */
export function exerciseSeconds(song: SongDef): number {
  const s = buildScore(song);
  return (s.total / s.pulse) * (60 / song.tempo);
}

/**
 * Comprobaciones de estructura del Curso (FR-002, FR-005, FR-006, FR-034, FR-035).
 * Devuelve la lista de errores, vacía si todo está bien.
 */
export function checkCourse(units: Unit[], repertoireIds: Set<string>): string[] {
  const errors: string[] = [];
  const items = units.flatMap((u) => u.items);
  const ids = items.map((i) => i.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) errors.push(`ids repetidos: ${dup.join(", ")}`);

  for (const i of items) if (i.type === "milestone" && !repertoireIds.has(i.songId)) errors.push(`${i.id}: la pieza ${i.songId} no está en el repertorio`);

  const lessons = items.flatMap((i) => (i.type === "lesson" ? [i.lesson] : []));
  if (lessons.length < 12 || lessons.length > 16) errors.push(`hay ${lessons.length} lecciones (deben ser 12–16)`);
  const perBlock = (b: Block) => lessons.filter((l) => l.block === b).length;
  for (const b of ["reading", "rhythm", "position", "chords"] as Block[]) if (perBlock(b) < 2) errors.push(`bloque ${b}: ${perBlock(b)} lecciones (mínimo 2)`);

  for (const t of REQUIRED_TIPS) if (!ids.includes(t)) errors.push(`falta el consejo ${t}`);
  const firstLesson = ids.findIndex((id) => items.find((i) => i.id === id)?.type === "lesson");
  for (const t of ["consejo-postura", "consejo-mano"]) if (ids.indexOf(t) > firstLesson) errors.push(`${t} debe ir antes de la primera lección`);

  for (const i of items) {
    if (i.type !== "tip") continue;
    const words = wordCount(i.tip.text);
    if (words > 60) errors.push(`${i.id}: ${words} palabras (máximo 60)`);
    if (FORBIDDEN.test(i.tip.text) || FORBIDDEN.test(i.tip.title)) errors.push(`${i.id}: menciona el teclado en pantalla`);
    if (ILLUSTRATED_TIPS.includes(i.id) && i.tip.art?.kind !== "illustration") errors.push(`${i.id}: necesita ilustración propia`);
  }

  const exercises = [...lessons.map((l) => l.exercise), ...units.flatMap((u) => u.test ?? [])];
  for (const e of exercises) errors.push(...checkExercise(e));
  for (const l of lessons) {
    if (l.pages.length < 1 || l.pages.length > 2) errors.push(`${l.id}: ${l.pages.length} pantallas de explicación (1–2)`);
    l.pages.forEach((p, k) => {
      const words = wordCount(p.text);
      if (words > 80) errors.push(`${l.id}, pantalla ${k + 1}: ${words} palabras (máximo 80)`);
      if (!p.staff && !p.keys?.length) errors.push(`${l.id}, pantalla ${k + 1}: sin partitura ni teclas`);
      if (p.staff) errors.push(...validateSong(p.staff).map((e) => `${l.id}, pantalla ${k + 1}: ${e}`));
    });
  }
  for (const u of units.slice(1)) if (!u.test?.length) errors.push(`${u.id}: falta la prueba de nivel`);
  return errors;
}

/** Un ejercicio: válido, corto (≤ 8 compases y ≤ 30 s), ritmo en 4/4 y acordes de tres notas. */
export function checkExercise(e: SongDef): string[] {
  const errors = validateSong(e).map((m) => `${e.id}: ${m}`);
  if (errors.length) return errors;
  const s = buildScore(e);
  const bars = s.total / s.bar;
  if (bars > 8) errors.push(`${e.id}: ${bars} compases (máximo 8)`);
  const secs = exerciseSeconds(e);
  if (secs > 30 + 1e-9) errors.push(`${e.id}: dura ${secs.toFixed(1)} s (máximo 30)`);
  if (e.kind === "rhythm" && (e.time !== undefined || (e.bar ?? 4) !== 4)) errors.push(`${e.id}: un ejercicio de ritmo va en 4/4`);
  if (e.kind === "chords") {
    const tracks = [e.n, e.r, e.l].filter(Boolean).flat();
    if (!tracks.some((ev) => Array.isArray(ev![0]) && ev![0].length === 3)) errors.push(`${e.id}: sin acordes de tres notas`);
    if (tracks.some((ev) => Array.isArray(ev![0]) && ev![0].length !== 3)) errors.push(`${e.id}: los acordes deben ser de tres notas`);
  }
  return errors;
}

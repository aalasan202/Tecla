import type { SongDef } from "../music/types";
import { validateSong } from "../music/validate";
import { buildScore } from "../music/score";
import type { Block, CourseItem, Level } from "./types";

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
 * Comprobaciones de estructura del Curso (010, FR-002/005/006/034/035; 012, FR-012/017/021/022, SC-005).
 * Devuelve la lista de errores, vacía si todo está bien.
 */
export function checkCourse(levels: Level[], repertoireIds: Set<string>): string[] {
  const errors: string[] = [];
  const all: CourseItem[] = levels.flatMap((l) => [...l.lessons, ...l.technique, ...l.songs]);
  const ids = all.map((i) => i.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) errors.push(`ids repetidos: ${dup.join(", ")}`);

  for (const i of all) if (i.type === "song" && !repertoireIds.has(i.songId)) errors.push(`${i.id}: la pieza ${i.songId} no está en el repertorio`);

  const lessonsOf = (ls: Level[]) => ls.flatMap((l) => l.lessons.flatMap((i) => (i.type === "lesson" ? [i.lesson] : [])));
  const tipsOf = (l: Level) => l.lessons.flatMap((i) => (i.type === "tip" ? [i] : []));

  // niveles 1 y 2: la ruta de 010
  const base = lessonsOf(levels.slice(0, 2));
  if (base.length < 12 || base.length > 16) errors.push(`niveles 1–2: ${base.length} lecciones (deben ser 12–16)`);
  const perBlock = (b: Block) => base.filter((l) => l.block === b).length;
  for (const b of ["reading", "rhythm", "position", "chords"] as Block[]) if (perBlock(b) < 2) errors.push(`bloque ${b}: ${perBlock(b)} lecciones (mínimo 2)`);
  for (const t of REQUIRED_TIPS) if (!ids.includes(t)) errors.push(`falta el consejo ${t}`);
  const first = levels[0]?.lessons ?? [];
  const firstLesson = first.findIndex((i) => i.type === "lesson");
  for (const t of ["consejo-postura", "consejo-mano"]) {
    const at = first.findIndex((i) => i.id === t);
    if (at < 0 || at > firstLesson) errors.push(`${t} debe ir antes de la primera lección`);
  }

  // niveles 3 y 4: contenido nuevo (FR-021)
  for (const l of levels.slice(2)) {
    const n = lessonsOf([l]).length;
    const t = tipsOf(l).length;
    if (n < 4 || n > 6) errors.push(`nivel ${l.n}: ${n} lecciones (deben ser 4–6)`);
    if (t < 3 || t > 4) errors.push(`nivel ${l.n}: ${t} consejos (deben ser 3–4)`);
  }

  for (const i of all) {
    if (i.type !== "tip") continue;
    const words = wordCount(i.tip.text);
    if (words > 60) errors.push(`${i.id}: ${words} palabras (máximo 60)`);
    if (FORBIDDEN.test(i.tip.text) || FORBIDDEN.test(i.tip.title)) errors.push(`${i.id}: menciona el teclado en pantalla`);
    if (ILLUSTRATED_TIPS.includes(i.id) && i.tip.art?.kind !== "illustration") errors.push(`${i.id}: necesita ilustración propia`);
  }

  const lessons = lessonsOf(levels);
  const exercises = [...lessons.map((l) => l.exercise), ...levels.flatMap((l) => l.test ?? [])];
  for (const e of exercises) errors.push(...checkExercise(e));
  for (const l of lessons) {
    if (l.pages.length < 1 || l.pages.length > 2) errors.push(`${l.id}: ${l.pages.length} pantallas de explicación (1–2)`);
    l.pages.forEach((p, k) => {
      const words = wordCount(p.text);
      if (words > 80) errors.push(`${l.id}, pantalla ${k + 1}: ${words} palabras (máximo 80)`);
      if (FORBIDDEN.test(p.text)) errors.push(`${l.id}, pantalla ${k + 1}: menciona el teclado en pantalla`);
      if (!p.staff && !p.keys?.length) errors.push(`${l.id}, pantalla ${k + 1}: sin partitura ni teclas`);
      if (p.staff) errors.push(...validateSong(p.staff).map((e) => `${l.id}, pantalla ${k + 1}: ${e}`));
    });
  }

  // pruebas (FR-022)
  for (const l of levels.slice(1)) if (!l.test?.length) errors.push(`nivel ${l.n}: falta la prueba de nivel`);
  const t3 = levels[2]?.test ?? [];
  if (t3.length && !t3.some((e) => e.kind === "chords" || e.id.endsWith("-chords"))) errors.push("nivel 3: la prueba debe incluir acordes");

  // técnica (FR-012, FR-017, SC-005)
  for (const l of levels) {
    const scales = l.technique.flatMap((i) => (i.type === "scale" ? [i.scale] : []));
    const min = l.n === 1 ? 1 : 2;
    for (const hand of ["R", "L"] as const) {
      const k = scales.filter((s) => s.hand === hand).length;
      if (k < min) errors.push(`nivel ${l.n}: ${k} escalas de la mano ${hand} (mínimo ${min})`);
    }
    for (const s of scales) if (!(s.tempos[0] < s.tempos[1] && s.tempos[1] < s.tempos[2])) errors.push(`nivel ${l.n}: tempos de escala no crecientes`);
    const indep = l.technique.flatMap((i) => (i.type === "independence" ? [i] : []));
    if (l.n >= 2 && indep.length < 2) errors.push(`nivel ${l.n}: ${indep.length} ejercicios de independencia (mínimo 2)`);
    for (const i of indep) {
      errors.push(...validateSong(i.song).map((e) => `${i.id}: ${e}`));
      if (!i.song.r || !i.song.l) errors.push(`${i.id}: debe ser a dos manos`);
    }
  }
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

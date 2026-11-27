import type { CourseItem, CourseProgress, CourseState, ItemState, Level, LevelN, LevelState, Path } from "./types";
import { scaleId, scaleMastered, tempoStep } from "./scales";
import { recommend } from "./recommend";

/** Estrellas necesarias para superar una lección, una canción o un ejercicio. */
export const PASS_STARS = 2;

export const PATHS: Path[] = ["lessons", "technique", "songs"];

export const itemsOf = (level: Level, path: Path): CourseItem[] =>
  path === "lessons" ? level.lessons : path === "technique" ? level.technique : level.songs;

/** Nivel abierto por prueba: la nueva (`tests`) o, para el nivel 2, las de 010 (`skipped`). */
const byTest = (cp: CourseProgress, n: LevelN): boolean =>
  !!cp.tests?.[String(n) as "2" | "3" | "4"] || (n === 2 && !!(cp.skipped.u1 || cp.skipped.u2));

/**
 * Estado del Curso (012, data-model reglas 1–7). Puro: el progreso, las estrellas de
 * Canciones y si hay teclado MIDI entran como argumentos.
 */
export function courseState(
  levels: Level[],
  cp: CourseProgress,
  songBest: Record<string, number>,
  midiOk: boolean,
  /** Solo para desarrollo: abre todos los niveles sin tocar el progreso guardado. */
  unlockAll = false,
): CourseState {
  const lessonsPassed = (lv: Level) => lv.lessons.every((i) => i.type !== "lesson" || (cp.best[i.id] ?? 0) >= PASS_STARS);

  // apertura: nivel 1 siempre; N por lecciones del anterior o por prueba; abrir uno abre los de antes
  const open: Record<number, boolean> = {};
  levels.forEach((lv, i) => {
    open[lv.n] = unlockAll || lv.n === 1 || byTest(cp, lv.n) || (i > 0 && open[levels[i - 1].n] && lessonsPassed(levels[i - 1]));
  });
  for (let i = levels.length - 2; i >= 0; i--) if (open[levels[i + 1].n]) open[levels[i].n] = true;

  const items: Record<string, ItemState> = {};
  const stateOf = (item: CourseItem, isOpen: boolean): ItemState => {
    switch (item.type) {
      case "lesson": {
        const stars = cp.best[item.id];
        return { status: !isOpen ? "locked" : (stars ?? 0) >= PASS_STARS ? "done" : "available", ...(stars !== undefined ? { stars } : {}) };
      }
      case "tip":
        return { status: !isOpen ? "locked" : cp.seen[item.id] ? "done" : "available" };
      case "scale": {
        const id = scaleId(item.scale);
        const step = tempoStep(cp.best, id);
        const stars = cp.best[`${id}@${step}`];
        return {
          status: !isOpen ? "locked" : scaleMastered(cp.best, id) ? "done" : "available",
          tempoStep: step,
          ...(stars !== undefined ? { stars } : {}),
        };
      }
      case "independence": {
        const stars = cp.best[item.id];
        const done = (stars ?? 0) >= PASS_STARS;
        return { status: !isOpen ? "locked" : done ? "done" : midiOk ? "available" : "needsMidi", ...(stars !== undefined ? { stars } : {}) };
      }
      case "song": {
        const stars = songBest[item.songId];
        return { status: !isOpen ? "locked" : (stars ?? 0) >= PASS_STARS ? "done" : "available", ...(stars !== undefined ? { stars } : {}) };
      }
    }
  };

  const levelStates = {} as Record<LevelN, LevelState>;
  for (const lv of levels) {
    const progress = {} as LevelState["progress"];
    for (const path of PATHS) {
      // sin MIDI, los ejercicios que lo exigen no cuentan (FR-006, FR-019)
      const list = itemsOf(lv, path).filter((it) => midiOk || it.type !== "independence");
      for (const it of itemsOf(lv, path)) items[it.id] = stateOf(it, open[lv.n]);
      progress[path] = { done: list.filter((it) => items[it.id].status === "done").length, total: list.length };
    }
    levelStates[lv.n] = { open: open[lv.n], byTest: byTest(cp, lv.n), progress };
  }

  const current = [...levels].reverse().find((lv) => open[lv.n])?.n ?? 1;
  const base = { levels: levelStates, items, current };
  return { ...base, recommended: recommend(levels, base, cp.recent ?? [], midiOk) };
}

export function findItem(levels: Level[], itemId: string): { level: Level; path: Path; item: CourseItem; index: number } | null {
  for (const level of levels)
    for (const path of PATHS) {
      const list = itemsOf(level, path);
      const index = list.findIndex((i) => i.id === itemId);
      if (index >= 0) return { level, path, item: list[index], index };
    }
  return null;
}

/** Estrellas de las lecciones (no cuentan canciones, técnica ni pruebas): 010, FR-037. */
export function courseStars(levels: Level[], cp: CourseProgress): { stars: number; max: number } {
  const lessons = levels.flatMap((l) => l.lessons.filter((i) => i.type === "lesson"));
  return { stars: lessons.reduce((a, l) => a + (cp.best[l.id] ?? 0), 0), max: lessons.length * 3 };
}

/** Lecciones superadas y total de un nivel (tarjeta de Inicio). */
export function lessonProgress(level: Level, st: CourseState): { done: number; total: number } {
  const lessons = level.lessons.filter((i) => i.type === "lesson");
  return { done: lessons.filter((i) => st.items[i.id]?.status === "done").length, total: lessons.length };
}

const BLOCKS = ["reading", "rhythm", "position", "chords"] as const;
type Block = (typeof BLOCKS)[number];
const blockOf = (exerciseId: string): Block => BLOCKS.find((b) => exerciseId.endsWith(`-${b}`)) ?? "reading";

/** Prueba de nivel: aprobada con 2★ o más en todos; si no, el bloque con menos estrellas. */
export function testOutcome(exerciseIds: string[], stars: Record<string, number>): { passed: boolean; weakest: Block | null } {
  let weakest: string | null = null;
  for (const id of exerciseIds) {
    const s = stars[id] ?? 0;
    if (s < PASS_STARS && (weakest === null || s < (stars[weakest] ?? 0))) weakest = id;
  }
  return weakest === null ? { passed: true, weakest: null } : { passed: false, weakest: blockOf(weakest) };
}

/** «Continuar» en Inicio: el Curso si fue lo último practicado y hay algo recomendado; si no, la pieza. */
export function continueTarget(
  courseLast: { itemId: string; at: number } | null,
  songLast: { at: number } | null,
  next: string | null,
): { kind: "course"; itemId: string } | { kind: "song" } {
  if (courseLast && next && (!songLast || courseLast.at > songLast.at)) return { kind: "course", itemId: next };
  return { kind: "song" };
}

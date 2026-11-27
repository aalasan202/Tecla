import { createStore } from "./store";
import type { CourseProgress } from "../course/types";

/** Progreso del Curso (010, ampliado en 012): estrellas, consejos vistos, pruebas y recientes. */
export const course = createStore<CourseProgress>("tecla-course", { best: {}, seen: {}, skipped: {}, last: null, tests: {}, recent: [] });

/** Cuántos elementos recientes se guardan para la recomendación (012, research R9). */
export const RECENT_MAX = 6;

export function recordCourseStars(id: string, stars: number): void {
  course.set((p) => ((p.best[id] ?? 0) >= stars ? {} : { best: { ...p.best, [id]: stars } }));
}

/** Estrellas de una escala en un escalón de tempo (0 inicial, 1 intermedio, 2 objetivo). */
export function recordScaleStars(id: string, step: 0 | 1 | 2, stars: number): void {
  recordCourseStars(`${id}@${step}`, stars);
}

export function markSeen(tipId: string): void {
  course.set((p) => (p.seen[tipId] ? {} : { seen: { ...p.seen, [tipId]: true } }));
}

/** Nivel abierto por prueba (012). */
export function markLevelTest(level: 2 | 3 | 4): void {
  course.set((p) => ({ tests: { ...p.tests, [String(level)]: true } }));
}

/** Último elemento del Curso abierto o practicado («Continuar») y lista de recientes. */
export function touchCourse(itemId: string): void {
  course.set((p) => {
    const recent = p.recent ?? [];
    const next = recent[recent.length - 1] === itemId ? recent : [...recent, itemId].slice(-RECENT_MAX);
    return { last: { itemId, at: Date.now() }, recent: next };
  });
}

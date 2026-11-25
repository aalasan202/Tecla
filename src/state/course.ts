import { createStore } from "./store";
import type { CourseProgress } from "../course/types";

/** Progreso del Curso (010): estrellas de lecciones y pruebas, consejos vistos, unidades saltadas. */
export const course = createStore<CourseProgress>("tecla-course", { best: {}, seen: {}, skipped: {}, last: null });

export function recordCourseStars(id: string, stars: number): void {
  course.set((p) => ((p.best[id] ?? 0) >= stars ? {} : { best: { ...p.best, [id]: stars } }));
}

export function markSeen(tipId: string): void {
  course.set((p) => (p.seen[tipId] ? {} : { seen: { ...p.seen, [tipId]: true } }));
}

export function markSkipped(unitIds: string[]): void {
  course.set((p) => ({ skipped: { ...p.skipped, ...Object.fromEntries(unitIds.map((id) => [id, true as const])) } }));
}

/** Último elemento del Curso abierto o practicado (para «Continuar»). */
export function touchCourse(itemId: string): void {
  course.set({ last: { itemId, at: Date.now() } });
}

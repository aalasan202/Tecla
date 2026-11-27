import { describe, expect, it } from "vitest";
import { courseState, findItem } from "./state";
import type { CourseItem, CourseProgress, Level, LevelN } from "./types";
import type { SongDef } from "../music/types";

const ex: SongDef = { id: "x", title: "x", level: "Curso", tempo: 80, n: [[60, 4]] };
const L = (id: string): Extract<CourseItem, { type: "lesson" }> => ({ type: "lesson", id, lesson: { id, block: "reading", title: id, pages: [], exercise: ex } });
const S = (id: string): Extract<CourseItem, { type: "song" }> => ({ type: "song", id, songId: id, recommended: false });
const I = (id: string): Extract<CourseItem, { type: "independence" }> => ({ type: "independence", id, song: ex, needsMidi: true });
const SC = (id: string): Extract<CourseItem, { type: "scale" }> => ({ type: "scale", id, scale: { tonic: "C", mode: "major", hand: "R", tempos: [60, 80, 100] } });
const lv = (n: LevelN, over: Partial<Level> = {}): Level => ({ n, title: `N${n}`, lessons: [], technique: [], songs: [], test: n > 1 ? [ex] : null, ...over });

const LV: Level[] = [
  lv(1, { lessons: [L("a"), L("b"), L("c")], technique: [I("i1"), SC("escala-c-R")], songs: [S("s1"), S("s2")] }),
  lv(2, { lessons: [L("d")] }),
];
const cp = (over: Partial<CourseProgress> = {}): CourseProgress => ({ best: {}, seen: {}, skipped: {}, last: null, ...over });
const rec = (p: CourseProgress, midi = false, songs: Record<string, number> = {}) => courseState(LV, p, songs, midi).recommended;

describe("Siguiente recomendado (FR-008–010)", () => {
  it("alumno nuevo: la primera lección del nivel 1", () => {
    expect(rec(cp())).toEqual({ itemId: "a", level: 1, path: "lessons", reason: "Sigue con las lecciones del nivel 1." });
  });

  it("tras dos lecciones seguidas, otro camino", () => {
    const r = rec(cp({ best: { a: 2, b: 2 }, recent: ["a", "b"] }));
    expect(r?.path).not.toBe("lessons");
    expect(r?.level).toBe(1);
  });

  it("sin MIDI nunca propone independencia; con MIDI sí puede", () => {
    const p = cp({ best: { a: 2, b: 2 }, recent: ["a", "b"] });
    expect(rec(p, false)?.itemId).toBe("escala-c-R");
    expect(rec(p, true)?.itemId).toBe("i1");
  });

  it("si el camino evitado es el único con pendientes, lo propone igual", () => {
    const p = cp({ best: { a: 2, "escala-c-R@2": 2 }, recent: ["a", "b"] });
    expect(rec(p, false, { s1: 2, s2: 2 })?.itemId).toBe("b");
  });

  it("nivel completo: se abre el siguiente y se recomienda su primera lección (FR-009, regla 4)", () => {
    const one: Level[] = [lv(1, { lessons: [L("a")] }), lv(2, { lessons: [L("d")] })];
    expect(courseState(one, cp({ best: { a: 2 } }), {}, false).recommended).toMatchObject({ itemId: "d", level: 2 });
  });

  it("todo hecho: nada que recomendar", () => {
    const done = cp({ best: { a: 2, b: 2, c: 2, d: 2, i1: 2, "escala-c-R@2": 2 } });
    expect(rec(done, true, { s1: 2, s2: 2 })).toBeNull();
  });

  it("seguir la recomendación 6 veces pasa por al menos 2 caminos (SC-004)", () => {
    let p = cp({ recent: [] });
    const songs: Record<string, number> = {};
    const paths = new Set<string>();
    for (let i = 0; i < 6; i++) {
      const r = rec(p, false, songs);
      if (!r) break;
      paths.add(r.path);
      const f = findItem(LV, r.itemId)!;
      const best = { ...p.best };
      if (f.item.type === "song") songs[f.item.songId] = 2;
      else if (f.item.type === "scale") best[`${f.item.id}@2`] = 2;
      else best[r.itemId] = 2;
      p = { ...p, best, recent: [...(p.recent ?? []), r.itemId].slice(-6) };
    }
    expect(paths.size).toBeGreaterThanOrEqual(2);
  });
});

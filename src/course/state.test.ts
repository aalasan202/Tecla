import { describe, expect, it } from "vitest";
import { courseState, findItem, lessonProgress } from "./state";
import { LEVELS } from "./content";
import type { CourseItem, CourseProgress, Level, LevelN } from "./types";
import type { SongDef } from "../music/types";

const ex: SongDef = { id: "x", title: "x", level: "Curso", tempo: 80, n: [[60, 4]] };
const L = (id: string): Extract<CourseItem, { type: "lesson" }> => ({ type: "lesson", id, lesson: { id, block: "reading", title: id, pages: [], exercise: ex } });
const T = (id: string): Extract<CourseItem, { type: "tip" }> => ({ type: "tip", id, tip: { id, level: 1, title: id, text: "", art: null } });
const S = (id: string, songId: string): Extract<CourseItem, { type: "song" }> => ({ type: "song", id, songId, recommended: false });
const I = (id: string): Extract<CourseItem, { type: "independence" }> => ({ type: "independence", id, song: ex, needsMidi: true });
const SC: Extract<CourseItem, { type: "scale" }> = { type: "scale", id: "escala-c-R", scale: { tonic: "C", mode: "major", hand: "R", tempos: [60, 80, 100] } };

const lv = (n: LevelN, over: Partial<Level> = {}): Level => ({ n, title: `N${n}`, lessons: [], technique: [], songs: [], test: n > 1 ? [ex] : null, ...over });
const LV: Level[] = [
  lv(1, { lessons: [T("t1"), L("a"), L("b")], technique: [SC], songs: [S("s1", "cinco")] }),
  lv(2, { lessons: [L("c")], technique: [I("i2")], songs: [S("s2", "jingle")] }),
  lv(3, { lessons: [L("d")] }),
  lv(4, { lessons: [L("e")] }),
];
const cp = (over: Partial<CourseProgress> = {}): CourseProgress => ({ best: {}, seen: {}, skipped: {}, last: null, ...over });

describe("courseState: apertura de niveles (FR-004, FR-005)", () => {
  it("alumno nuevo: solo el nivel 1 abierto y todo disponible dentro", () => {
    const s = courseState(LV, cp(), {}, true);
    expect([1, 2, 3, 4].map((n) => s.levels[n as LevelN].open)).toEqual([true, false, false, false]);
    expect(["t1", "a", "b", "escala-c-R", "s1"].map((id) => s.items[id].status)).toEqual(["available", "available", "available", "available", "available"]);
    expect(s.items.c.status).toBe("locked");
    expect(s.current).toBe(1);
  });

  it("el desbloqueo de desarrollo abre todos los niveles sin marcarlos como superados", () => {
    const s = courseState(LV, cp(), {}, true, true);
    expect([1, 2, 3, 4].map((n) => s.levels[n as LevelN].open)).toEqual([true, true, true, true]);
    expect(["c", "d", "e"].map((id) => s.items[id].status)).toEqual(["available", "available", "available"]);
    expect(s.levels[4].byTest).toBe(false);
  });

  it("las lecciones del nivel 1 con 2★ abren el 2; técnica y canciones no influyen", () => {
    expect(courseState(LV, cp({ best: { a: 2 } }), { cinco: 3 }, true).levels[2].open).toBe(false);
    const s = courseState(LV, cp({ best: { a: 2, b: 3 } }), {}, true);
    expect(s.levels[2].open).toBe(true);
    expect(s.current).toBe(2);
  });

  it("superar la prueba del nivel 3 abre los niveles 1 a 3", () => {
    const s = courseState(LV, cp({ tests: { "3": true } }), {}, true);
    expect([1, 2, 3, 4].map((n) => s.levels[n as LevelN].open)).toEqual([true, true, true, false]);
    expect(s.levels[3].byTest).toBe(true);
  });

  it("datos de 010: cualquier prueba antigua abre solo los niveles 1 y 2 (aclaración Q3)", () => {
    const olds: Record<string, true>[] = [{ u1: true }, { u1: true, u2: true }];
    for (const skipped of olds) {
      const s = courseState(LV, cp({ skipped, best: { "prueba-u3-reading": 2 } }), {}, true);
      expect([1, 2, 3].map((n) => s.levels[n as LevelN].open)).toEqual([true, true, false]);
    }
  });
});

describe("courseState: elementos y avance (FR-006)", () => {
  it("consejos vistos, lecciones y canciones superadas quedan hechos", () => {
    const s = courseState(LV, cp({ seen: { t1: true }, best: { a: 3, b: 1 } }), { cinco: 2 }, true);
    expect(s.items.t1.status).toBe("done");
    expect(s.items.a).toEqual({ status: "done", stars: 3 });
    expect(s.items.b).toEqual({ status: "available", stars: 1 });
    expect(s.items.s1).toEqual({ status: "done", stars: 2 });
    expect(s.levels[1].progress).toEqual({ lessons: { done: 2, total: 3 }, technique: { done: 0, total: 1 }, songs: { done: 1, total: 1 } });
  });

  it("escala: escalón de tempo y dominada con 2★ en el objetivo", () => {
    expect(courseState(LV, cp({ best: { "escala-c-R@0": 3 } }), {}, true).items["escala-c-R"]).toMatchObject({ status: "available", tempoStep: 1 });
    expect(courseState(LV, cp({ best: { "escala-c-R@2": 2 } }), {}, true).items["escala-c-R"].status).toBe("done");
  });

  it("sin MIDI, la independencia queda pendiente de MIDI y no cuenta en el avance (FR-019)", () => {
    const open2 = cp({ best: { a: 2, b: 2 } });
    const withMidi = courseState(LV, open2, {}, true);
    expect(withMidi.items.i2.status).toBe("available");
    expect(withMidi.levels[2].progress.technique).toEqual({ done: 0, total: 1 });
    const noMidi = courseState(LV, open2, {}, false);
    expect(noMidi.items.i2.status).toBe("needsMidi");
    expect(noMidi.levels[2].progress.technique).toEqual({ done: 0, total: 0 });
  });

  it("sin MIDI se pueden abrir todos los niveles solo con lecciones (SC-003)", () => {
    const s = courseState(LV, cp({ best: { a: 2, b: 2, c: 2, d: 2 } }), {}, false);
    expect(s.levels[4].open).toBe(true);
  });
});

describe("Curso real (FR-023, FR-024)", () => {
  it("la U1 es el nivel 1 y las U2 y U3 forman el nivel 2, con sus ids", () => {
    expect(findItem(LEVELS, "l-posicion-do")?.level.n).toBe(1);
    expect(findItem(LEVELS, "l-puntillo")?.level.n).toBe(2);
    expect(findItem(LEVELS, "l-cambios")?.level.n).toBe(2);
    expect(findItem(LEVELS, "consejo-metronomo")?.level.n).toBe(2);
    expect(findItem(LEVELS, "hito-oda")).toMatchObject({ path: "songs", level: { n: 1 }, item: { recommended: true } });
  });

  it("el progreso de 010 se conserva", () => {
    const old = cp({ best: { "l-pulso": 3, "prueba-u3-reading": 2 }, seen: { "consejo-postura": true }, skipped: { u1: true, u2: true } });
    const s = courseState(LEVELS, old, { oda: 2 }, false);
    expect(s.items["l-pulso"]).toEqual({ status: "done", stars: 3 });
    expect(s.items["consejo-postura"].status).toBe("done");
    expect(s.items["hito-oda"].status).toBe("done");
    expect(s.levels[2].open).toBe(true);
    expect(s.levels[3].open).toBe(false);
  });

  it("el nivel 1 tiene 5 lecciones y la tarjeta de Inicio las cuenta", () => {
    const s = courseState(LEVELS, cp({ best: { "l-pulso": 2 } }), {}, false);
    expect(lessonProgress(LEVELS[0], s)).toEqual({ done: 1, total: 5 });
  });
});

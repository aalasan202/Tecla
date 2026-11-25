import { describe, expect, it } from "vitest";
import { continueTarget, courseStars, findItem, pathState, testOutcome } from "./path";
import type { CourseProgress, Lesson, PathItem, Tip, Unit } from "./types";
import type { SongDef } from "../music/types";

const ex = (id: string): SongDef => ({ id: `curso-${id}`, title: id, level: "Nivel 1 · Curso", tempo: 80, n: [[60, 4]] });
const lesson = (id: string, block: Lesson["block"] = "reading"): PathItem => ({
  type: "lesson",
  id,
  lesson: { id, block, title: id, pages: [{ text: "x", keys: [{ m: 60 }] }], exercise: ex(id) },
});
const tip = (id: string): PathItem => ({ type: "tip", id, tip: { id, level: 1, title: id, text: "x", art: null } as Tip });
const hito = (songId: string): PathItem => ({ type: "milestone", id: `hito-${songId}`, songId });

// u1: t1 t2 a b H(cinco) t3 | u2: t4 c H(oda) d
const UNITS: Unit[] = [
  { id: "u1", title: "U1", level: 1, test: null, items: [tip("t1"), tip("t2"), lesson("a"), lesson("b", "rhythm"), hito("cinco"), tip("t3")] },
  {
    id: "u2",
    title: "U2",
    level: 2,
    test: [ex("prueba-u2-reading"), ex("prueba-u2-rhythm")],
    items: [tip("t4"), lesson("c", "position"), hito("oda"), lesson("d", "chords")],
  },
];

const cp = (p: Partial<CourseProgress> = {}): CourseProgress => ({ best: {}, seen: {}, skipped: {}, last: null, ...p });
const status = (s: ReturnType<typeof pathState>, id: string) => s.items[id].status;

describe("pathState: desde cero", () => {
  const s = pathState(UNITS, cp(), {});
  it("abre el primer puntuable y los consejos que lo preceden", () => {
    expect(status(s, "t1")).toBe("available");
    expect(status(s, "t2")).toBe("available");
    expect(status(s, "a")).toBe("available");
  });
  it("bloquea el resto", () => {
    for (const id of ["b", "hito-cinco", "t3", "t4", "c", "hito-oda", "d"]) expect(status(s, id)).toBe("locked");
  });
  it("next apunta al primer consejo no visto antes del disponible", () => {
    expect(s.next).toBe("t1");
  });
  it("la unidad 1 está en curso y la 2 bloqueada", () => {
    expect(s.units).toEqual({ u1: "current", u2: "locked" });
  });
  it("summary da la unidad actual con superados y total", () => {
    expect(s.summary).toEqual({ unitId: "u1", done: 0, total: 6 });
  });
});

describe("pathState: avance lineal", () => {
  it("2★ en una lección abre la siguiente", () => {
    const s = pathState(UNITS, cp({ best: { a: 2 } }), {});
    expect(status(s, "a")).toBe("passed");
    expect(s.items.a.stars).toBe(2);
    expect(status(s, "b")).toBe("available");
  });
  it("1★ no abre la siguiente", () => {
    const s = pathState(UNITS, cp({ best: { a: 1 } }), {});
    expect(status(s, "a")).toBe("available");
    expect(s.items.a.stars).toBe(1);
    expect(status(s, "b")).toBe("locked");
  });
  it("los consejos no bloquean: sin verlos, el avance es el mismo", () => {
    const s = pathState(UNITS, cp({ best: { a: 3, b: 2 } }), {});
    expect(status(s, "hito-cinco")).toBe("available");
    expect(status(s, "t1")).toBe("available");
  });
  it("next salta a la lección si los consejos anteriores ya se vieron", () => {
    const s = pathState(UNITS, cp({ seen: { t1: true, t2: true } }), {});
    expect(status(s, "t1")).toBe("seen");
    expect(s.next).toBe("a");
  });
  it("marcar consejos no cambia ningún puntuable", () => {
    const a = pathState(UNITS, cp({ best: { a: 2 } }), {});
    const b = pathState(UNITS, cp({ best: { a: 2 }, seen: { t1: true, t3: true, t4: true } }), {});
    for (const id of ["a", "b", "hito-cinco", "c", "hito-oda", "d"]) expect(status(b, id)).toBe(status(a, id));
  });
  it("un consejo antes de un puntuable bloqueado está bloqueado", () => {
    const s = pathState(UNITS, cp({ best: { a: 2 } }), {});
    expect(status(s, "t3")).toBe("locked");
    expect(status(s, "t4")).toBe("locked");
  });
  it("superada la unidad 1, la 2 queda en curso y su consejo inicial disponible", () => {
    const s = pathState(UNITS, cp({ best: { a: 2, b: 2 } }), { cinco: 2 });
    expect(s.units).toEqual({ u1: "passed", u2: "current" });
    expect(status(s, "t3")).toBe("available");
    expect(status(s, "t4")).toBe("available");
    expect(status(s, "c")).toBe("available");
  });
  it("ruta terminada: next es null y todo superado", () => {
    const s = pathState(UNITS, cp({ best: { a: 3, b: 3, c: 2, d: 2 }, seen: { t1: true, t2: true, t3: true, t4: true } }), { cinco: 3, oda: 2 });
    expect(s.next).toBeNull();
    expect(s.units).toEqual({ u1: "passed", u2: "passed" });
    expect(s.summary).toBeNull();
  });
});

describe("pathState: hitos y progreso previo", () => {
  it("un hito con 2★ en Canciones abre todo lo anterior y marca opcional lo no superado", () => {
    const s = pathState(UNITS, cp(), { cinco: 2 });
    expect(status(s, "hito-cinco")).toBe("passed");
    expect(status(s, "a")).toBe("optional");
    expect(status(s, "b")).toBe("optional");
    expect(status(s, "c")).toBe("available");
  });
  it("manda el hito superado más avanzado aunque haya huecos", () => {
    const s = pathState(UNITS, cp(), { oda: 3 });
    expect(status(s, "hito-cinco")).toBe("optional");
    expect(status(s, "c")).toBe("optional");
    expect(status(s, "hito-oda")).toBe("passed");
    expect(status(s, "d")).toBe("available");
    expect(s.units).toEqual({ u1: "passed", u2: "current" });
  });
  it("un hito con 1★ no mueve la frontera", () => {
    const s = pathState(UNITS, cp(), { oda: 1 });
    expect(status(s, "a")).toBe("available");
    expect(status(s, "hito-oda")).toBe("locked");
  });
  it("las estrellas del hito salen de Canciones, nunca del progreso del Curso", () => {
    const s = pathState(UNITS, cp({ best: { "hito-cinco": 3, cinco: 3 } }), {});
    expect(status(s, "hito-cinco")).toBe("locked");
  });
});

describe("prueba de nivel", () => {
  it("testOutcome aprueba con 2★ en todos", () => {
    expect(testOutcome(["curso-prueba-u2-reading", "curso-prueba-u2-rhythm"], { "curso-prueba-u2-reading": 2, "curso-prueba-u2-rhythm": 3 })).toEqual({
      passed: true,
      weakest: null,
    });
  });
  it("testOutcome suspende e indica el bloque más flojo", () => {
    expect(testOutcome(["curso-prueba-u2-reading", "curso-prueba-u2-rhythm"], { "curso-prueba-u2-reading": 3, "curso-prueba-u2-rhythm": 1 })).toEqual({
      passed: false,
      weakest: "rhythm",
    });
    expect(testOutcome(["curso-prueba-u2-position"], {})).toEqual({ passed: false, weakest: "position" });
  });
  it("una unidad saltada por prueba deja sus puntuables opcionales y abre la siguiente", () => {
    const s = pathState(UNITS, cp({ skipped: { u1: true } }), {});
    expect(s.units).toEqual({ u1: "skipped", u2: "current" });
    expect(status(s, "a")).toBe("optional");
    expect(status(s, "hito-cinco")).toBe("optional");
    expect(status(s, "c")).toBe("available");
  });
});

describe("estrellas y Continuar", () => {
  it("courseStars cuenta solo lecciones", () => {
    expect(courseStars(UNITS, cp({ best: { a: 3, b: 1, "curso-prueba-u2-reading": 3 } }))).toEqual({ stars: 4, max: 12 });
  });
  it("findItem localiza un elemento y su unidad", () => {
    const f = findItem(UNITS, "hito-oda");
    expect(f?.unit.id).toBe("u2");
    expect(f?.index).toBe(2);
    expect(findItem(UNITS, "nada")).toBeNull();
  });
  it("continueTarget va al Curso si lo último fue el Curso y queda algo", () => {
    expect(continueTarget({ itemId: "a", at: 20 }, { at: 10 }, "b")).toEqual({ kind: "course", itemId: "b" });
    expect(continueTarget({ itemId: "a", at: 20 }, null, "b")).toEqual({ kind: "course", itemId: "b" });
  });
  it("continueTarget va a Canciones en los demás casos", () => {
    expect(continueTarget(null, { at: 10 }, "b")).toEqual({ kind: "song" });
    expect(continueTarget({ itemId: "a", at: 5 }, { at: 10 }, "b")).toEqual({ kind: "song" });
    expect(continueTarget({ itemId: "a", at: 20 }, { at: 10 }, null)).toEqual({ kind: "song" });
  });
});

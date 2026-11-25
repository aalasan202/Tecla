import { describe, expect, it } from "vitest";
import { COURSE } from "./content";
import { checkCourse, checkExercise, exerciseSeconds, wordCount } from "./checks";
import { SONGS } from "../music/songs";
import { pathState } from "./path";

const REPERTOIRE = new Set(SONGS.map((s) => s.id));

describe("estructura del Curso (FR-034, FR-035)", () => {
  it("el Curso real cumple todas las reglas", () => {
    expect(checkCourse(COURSE, REPERTOIRE)).toEqual([]);
  });

  it("tiene 3 unidades, 14 lecciones, 7 hitos y 13 consejos", () => {
    const items = COURSE.flatMap((u) => u.items);
    expect(COURSE.map((u) => u.id)).toEqual(["u1", "u2", "u3"]);
    expect(items.filter((i) => i.type === "lesson")).toHaveLength(14);
    expect(items.filter((i) => i.type === "milestone")).toHaveLength(7);
    expect(items.filter((i) => i.type === "tip")).toHaveLength(13);
  });

  it("detecta un hito que no existe y un consejo demasiado largo", () => {
    const broken = structuredClone(COURSE);
    broken[0].items.push({ type: "milestone", id: "hito-nada", songId: "nada" });
    const t = broken[0].items.find((i) => i.type === "tip")!;
    if (t.type === "tip") t.tip.text = "palabra ".repeat(61) + "en pantalla";
    const errs = checkCourse(broken, REPERTOIRE).join(" | ");
    expect(errs).toMatch(/nada no está en el repertorio/);
    expect(errs).toMatch(/palabras \(máximo 60\)/);
    expect(errs).toMatch(/teclado en pantalla/);
  });

  it("detecta un ejercicio largo o de ritmo fuera de 4/4", () => {
    const long = { id: "curso-x", title: "x", level: "Nivel 1 · Curso", tempo: 40, n: Array.from({ length: 9 }, () => [60, 4] as [number, number]) };
    expect(checkExercise(long).join(" | ")).toMatch(/compases \(máximo 8\)/);
    const waltz = { id: "curso-y", title: "y", level: "Nivel 1 · Curso", tempo: 80, bar: 3, kind: "rhythm" as const, n: [[60, 3]] as [number, number][] };
    expect(checkExercise(waltz).join(" | ")).toMatch(/4\/4/);
  });

  it("cuenta palabras y segundos", () => {
    expect(wordCount("Pulsa el {C} central")).toBe(4);
    expect(exerciseSeconds({ id: "curso-z", title: "z", level: "Nivel 1 · Curso", tempo: 60, n: [[60, 4]] })).toBe(4);
  });

  it("con el progreso vacío, lo primero es el consejo de postura", () => {
    const s = pathState(COURSE, { best: {}, seen: {}, skipped: {}, last: null }, {});
    expect(s.next).toBe("consejo-postura");
    expect(s.items["l-posicion-do"].status).toBe("available");
    expect(s.items["hito-cinco"].status).toBe("locked");
  });
});

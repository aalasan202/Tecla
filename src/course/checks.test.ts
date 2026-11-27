import { describe, expect, it } from "vitest";
import { LEVELS } from "./content";
import { checkCourse, checkExercise, exerciseSeconds, wordCount } from "./checks";
import { SONGS } from "../music/songs";

const REPERTOIRE = new Set(SONGS.map((s) => s.id));

describe("estructura del Curso (010 FR-034/035; 012 FR-021/022, SC-005)", () => {
  it("el Curso real cumple todas las reglas", () => {
    expect(checkCourse(LEVELS, REPERTOIRE)).toEqual([]);
  });

  it("los niveles 1 y 2 conservan las 14 lecciones, 7 hitos y 13 consejos de 010", () => {
    const base = LEVELS.slice(0, 2);
    const lessons = base.flatMap((l) => l.lessons);
    expect(LEVELS.map((l) => l.n)).toEqual([1, 2, 3, 4]);
    expect(lessons.filter((i) => i.type === "lesson")).toHaveLength(14);
    expect(lessons.filter((i) => i.type === "tip")).toHaveLength(13);
    expect(base.flatMap((l) => l.songs).filter((s) => s.recommended)).toHaveLength(7);
  });

  it("detecta una canción que no existe, un consejo largo y un nivel sin prueba", () => {
    const broken = structuredClone(LEVELS);
    broken[0].songs.push({ type: "song", id: "hito-nada", songId: "nada", recommended: true });
    const t = broken[0].lessons.find((i) => i.type === "tip")!;
    if (t.type === "tip") t.tip.text = "palabra ".repeat(61) + "en pantalla";
    broken[3].test = null;
    const errs = checkCourse(broken, REPERTOIRE).join(" | ");
    expect(errs).toMatch(/nada no está en el repertorio/);
    expect(errs).toMatch(/palabras \(máximo 60\)/);
    expect(errs).toMatch(/teclado en pantalla/);
    expect(errs).toMatch(/nivel 4: falta la prueba/);
  });

  it("detecta técnica insuficiente", () => {
    const broken = structuredClone(LEVELS);
    broken[2].technique = [];
    const errs = checkCourse(broken, REPERTOIRE).join(" | ");
    expect(errs).toMatch(/nivel 3: 0 escalas de la mano R/);
    expect(errs).toMatch(/nivel 3: 0 ejercicios de independencia/);
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
});

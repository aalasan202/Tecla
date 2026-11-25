import { describe, expect, it } from "vitest";
import { chain, clipPedals, every, fitPedals, pedalMarks, sustainedEnd, validatePedal } from "./pedal";
import type { SongDef } from "./types";

describe("sustainedEnd", () => {
  it("sostiene la nota hasta que se levanta el pedal", () => {
    expect(sustainedEnd(0, 1, [[0, 4]])).toBe(4);
  });
  it("una nota que termina con el tramo acaba ahí", () => {
    expect(sustainedEnd(0, 4, [[0, 4]])).toBe(4);
  });
  it("una nota que termina fuera del tramo no se toca", () => {
    expect(sustainedEnd(2, 4, [[0, 4]])).toBe(6);
  });
  it("el cambio de pedal apaga la nota", () => {
    expect(sustainedEnd(0, 1, [[0, 2], [2, 4]])).toBe(2);
  });
  it("sin pedal, la duración escrita", () => {
    expect(sustainedEnd(3, 1, [])).toBe(4);
  });
  it("una nota que acaba justo al pisar no se sostiene", () => {
    expect(sustainedEnd(0, 2, [[2, 4]])).toBe(2);
  });
});

describe("chain y every", () => {
  it("encadenan tramos con un cambio en cada punto", () => {
    expect(chain(0, 4, 6)).toEqual([[0, 4], [4, 6]]);
    expect(every(3, 3, 12)).toEqual([[3, 6], [6, 9], [9, 12]]);
  });
});

describe("pedalMarks", () => {
  it("un cambio: gancho, línea, V, línea, gancho", () => {
    expect(pedalMarks([[0, 2], [2, 4]])).toEqual([
      { kind: "down", at: 0 },
      { kind: "line", from: 0, to: 2 },
      { kind: "change", at: 2 },
      { kind: "line", from: 2, to: 4 },
      { kind: "up", at: 4 },
    ]);
  });
  it("tramos separados: cada uno con sus dos ganchos", () => {
    expect(pedalMarks([[0, 2], [3, 4]])).toEqual([
      { kind: "down", at: 0 },
      { kind: "line", from: 0, to: 2 },
      { kind: "up", at: 2 },
      { kind: "down", at: 3 },
      { kind: "line", from: 3, to: 4 },
      { kind: "up", at: 4 },
    ]);
  });
  it("sin tramos, nada", () => {
    expect(pedalMarks([])).toEqual([]);
  });
});

describe("clipPedals", () => {
  it("recorta al fragmento", () => {
    expect(clipPedals([[0, 4], [4, 8]], 3, 6)).toEqual([[3, 4], [4, 6]]);
  });
  it("descarta lo que queda fuera", () => {
    expect(clipPedals([[0, 2]], 4, 8)).toEqual([]);
    expect(clipPedals([[0, 4]], 4, 8)).toEqual([]);
  });
});

describe("fitPedals", () => {
  // notas en 0, 2, 4 y 6; total 8
  const song: Omit<SongDef, "id" | "level"> = { title: "t", tempo: 80, n: [[60, 2], [62, 2], [64, 2], [65, 2]] };

  it("ajusta los extremos al inicio de nota más cercano", () => {
    expect(fitPedals([[0.1, 3.9]], song)).toEqual([[0, 4]]);
  });
  it("el fin puede ir al final de la pieza", () => {
    expect(fitPedals([[4, 7.9]], song)).toEqual([[4, 8]]);
    expect(fitPedals([[4, 50]], song)).toEqual([[4, 8]]);
  });
  it("fusiona solapes y conserva los cambios contiguos", () => {
    expect(fitPedals([[0, 4], [3.8, 6.2]], song)).toEqual([[0, 4], [4, 6]]);
    expect(fitPedals([[0, 4], [2, 6]], song)).toEqual([[0, 6]]);
  });
  it("descarta los tramos que quedan vacíos o no son números", () => {
    expect(fitPedals([[0.2, 0.4], [Number.NaN, 2], [6, 2]], song)).toEqual([]);
  });
  it("nunca lanza, aunque la pieza esté vacía", () => {
    expect(fitPedals([[0, 4]], { title: "t", tempo: 80, n: [] })).toEqual([]);
    expect(fitPedals([[-3, 2]], song)).toEqual([[0, 2]]);
  });
});

describe("validatePedal", () => {
  const base: SongDef = { id: "t", title: "t", level: "Nivel 3", tempo: 80, r: [[60, 2], [62, 2], [64, 4]], l: [[48, 4], [43, 4]] };
  const errs = (pedal: SongDef["pedal"]) => validatePedal({ ...base, pedal }).join(" | ");

  it("acepta tramos coherentes (también cambios y fin de pieza)", () => {
    expect(errs([[0, 2], [2, 4], [4, 8]])).toBe("");
    expect(errs(undefined)).toBe("");
  });
  it("exige múltiplos de 1/48 de negra", () => {
    expect(errs([[0, 2.01]])).toMatch(/1\/48/);
  });
  it("exige from < to", () => {
    expect(errs([[2, 2]])).toMatch(/from < to/);
  });
  it("exige orden y sin solapes", () => {
    expect(errs([[0, 4], [2, 8]])).toMatch(/solapa/);
    expect(errs([[4, 8], [0, 2]])).toMatch(/solapa/);
  });
  it("from en el inicio de una nota", () => {
    expect(errs([[1, 2]])).toMatch(/from .*inicio de nota/);
  });
  it("to en el inicio de una nota o el final", () => {
    expect(errs([[0, 3]])).toMatch(/to .*inicio de nota o el final/);
  });
  it("to dentro de la pieza", () => {
    expect(errs([[4, 12]])).toMatch(/fuera de la pieza/);
  });
});

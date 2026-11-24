import { describe, expect, it } from "vitest";
import { SONGS } from "../songs";
import type { RawTrack } from "../types";
import { measure, suggestFullLevel, suggestLevel } from "./level";
import { needsFullNotation } from "../validate";

/** Las reglas de 006 se fijaron con las piezas que la versión simplificada representa. */
const SIMPLE = SONGS.filter((s) => !needsFullNotation(s));

const levelNumber = (level: string) => Number(/Nivel (\d+)/.exec(level)![1]);
const one = (n: RawTrack, bar?: number) => suggestLevel(measure({ title: "x", tempo: 90, n, ...(bar ? { bar } : {}) }));

describe("nivel sugerido (SC-003)", () => {
  it.each(SIMPLE.map((s) => [s.id, s] as const))("%s coincide con su nivel", (_id, s) => {
    expect(suggestLevel(measure(s))).toBe(levelNumber(s.level));
  });

  it("una mano de Do a Sol en negras → 1", () => {
    expect(one([[60, 1], [62, 1], [64, 1], [67, 1]])).toBe(1);
  });

  it("una mano de Do a La → 2", () => {
    expect(one([[60, 1], [62, 1], [64, 1], [69, 1]])).toBe(2);
  });

  it("compás de 3/4 → 3", () => {
    expect(one([[60, 1], [62, 1], [64, 1]], 3)).toBe(3);
  });

  it("el 2/4 no sube el nivel: la misma melodía da lo mismo en 2/4 y en 4/4", () => {
    const melody: RawTrack = [[60, 1], [62, 1], [64, 1], [65, 1]];
    expect(one(melody, 2)).toBe(one(melody));
    expect(one(melody, 2)).toBe(1);
  });

  it("dos manos con la mitad de los inicios a la vez → 4", () => {
    const r: RawTrack = [[60, 1], [62, 1], [64, 1], [65, 1]];
    const l: RawTrack = [[48, 2], [0, 1], [50, 1]];
    const m = measure({ title: "x", tempo: 90, r, l });
    expect(m.simultaneousShare).toBe(0.5);
    expect(suggestLevel(m)).toBe(4);
  });
});

describe("nivel de la versión completa (007, research R11)", () => {
  const base = { title: "x", tempo: 80 };

  it("armadura distinta de Do o 6/8 → al menos 3", () => {
    expect(suggestFullLevel({ ...base, n: [[60, 1], [62, 1], [64, 1], [67, 1]] })).toBe(1);
    expect(suggestFullLevel({ ...base, key: 1, n: [[60, 1], [62, 1], [64, 1], [67, 1]] })).toBe(3);
    expect(suggestFullLevel({ ...base, time: "6/8", n: [[60, 1.5], [62, 1.5]] })).toBe(3);
  });

  it("acordes de 3 notas, semicorcheas o tresillos en más del 10 % → 4", () => {
    expect(suggestFullLevel({ ...base, r: [[64, 4]], l: [[[48, 52, 55], 4]] })).toBe(4);
    expect(suggestFullLevel({ ...base, n: [[60, 0.25], [62, 0.25], [64, 0.5], [65, 3]] })).toBe(4);
    expect(suggestFullLevel({ ...base, n: [[60, 1 / 3], [62, 1 / 3], [64, 1 / 3], [65, 3]] })).toBe(4);
    // una corchea con puntillo y una semicorchea entre 19 negras: 2 de 21, menos del 10 %
    const long: RawTrack = [...Array.from({ length: 19 }, () => [60, 1] as [number, number]), [62, 0.25], [64, 0.75]];
    expect(suggestFullLevel({ ...base, n: long })).toBe(1);
  });
});

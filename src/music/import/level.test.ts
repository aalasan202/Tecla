import { describe, expect, it } from "vitest";
import { SONGS } from "../songs";
import type { RawTrack } from "../types";
import { measure, suggestLevel } from "./level";

const levelNumber = (level: string) => Number(/Nivel (\d+)/.exec(level)![1]);
const one = (n: RawTrack, bar?: number) => suggestLevel(measure({ title: "x", tempo: 90, n, ...(bar ? { bar } : {}) }));

describe("nivel sugerido (SC-003)", () => {
  it.each(SONGS.map((s) => [s.id, s] as const))("%s coincide con su nivel", (_id, s) => {
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

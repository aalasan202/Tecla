import { describe, expect, it } from "vitest";
import { scale, scaleId, scaleMastered, scaleNotes, stepForTempo, tempoStep, thumbPasses } from "./scales";
import { buildScore } from "../music/score";
import { validateSong } from "../music/validate";
import type { ScaleSpec } from "./types";

const T: [number, number, number] = [60, 80, 100];
const spec = (tonic: ScaleSpec["tonic"], mode: ScaleSpec["mode"], hand: ScaleSpec["hand"]): ScaleSpec => ({ tonic, mode, hand, tempos: T });

/** Las 7 escalas del Curso (FR-012) × 2 manos. */
const ALL: ScaleSpec[] = (
  [
    ["C", "major"],
    ["G", "major"],
    ["F", "major"],
    ["D", "major"],
    ["A", "minor"],
    ["E", "minor"],
    ["Bb", "major"],
  ] as const
).flatMap(([t, m]) => [spec(t, m, "R"), spec(t, m, "L")]);

const up = (s: ScaleSpec) => scaleNotes(s).slice(0, 8);

describe("escalas generadas (research R4)", () => {
  it.each(ALL.map((s) => [scaleId(s), s] as const))("%s es válida, de 4 compases y 15 notas", (_id, s) => {
    const song = scale(s, 80);
    expect(validateSong(song)).toEqual([]);
    const sc = buildScore(song);
    expect(sc.total).toBe(16);
    expect(sc.notes).toHaveLength(15);
  });

  it("alturas de las mayores y de las menores armónicas", () => {
    expect(up(spec("C", "major", "R")).map((n) => n.m)).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    expect(up(spec("Bb", "major", "R")).map((n) => n.m)).toEqual([70, 72, 74, 75, 77, 79, 81, 82]);
    expect(up(spec("A", "minor", "R")).map((n) => n.m)).toEqual([69, 71, 72, 74, 76, 77, 80, 81]);
    expect(up(spec("E", "minor", "L")).map((n) => n.m)).toEqual([52, 54, 55, 57, 59, 60, 63, 64]);
  });

  it("la izquierda va una octava abajo, en clave de fa", () => {
    const song = scale(spec("C", "major", "L"), 60);
    expect(song.l?.[0][0]).toBe(48);
    expect(song.n).toBeUndefined();
    expect(buildScore(song).twoHands).toBe(true);
  });

  it("armaduras y sensibles alteradas", () => {
    expect(scale(spec("G", "major", "R"), 60).key).toBe(1);
    expect(scale(spec("F", "major", "R"), 60).key).toBe(-1);
    expect(scale(spec("D", "major", "R"), 60).key).toBe(2);
    expect(scale(spec("Bb", "major", "R"), 60).key).toBe(-2);
    expect(scale(spec("E", "minor", "R"), 60).key).toBe(1);
    const am = buildScore(scale(spec("A", "minor", "R"), 60)).notes.find((n) => n.m === 80)!;
    expect(am.spell).toEqual({ step: "G", alter: 1 });
    const em = buildScore(scale(spec("E", "minor", "R"), 60)).notes.find((n) => n.m === 75)!;
    expect(em.spell).toEqual({ step: "D", alter: 1 });
  });

  it("digitación estándar al subir (SC-006)", () => {
    const f = (s: ScaleSpec) => up(s).map((n) => n.f);
    expect(f(spec("C", "major", "R"))).toEqual([1, 2, 3, 1, 2, 3, 4, 5]);
    expect(f(spec("C", "major", "L"))).toEqual([5, 4, 3, 2, 1, 3, 2, 1]);
    expect(f(spec("F", "major", "R"))).toEqual([1, 2, 3, 4, 1, 2, 3, 4]);
    expect(f(spec("Bb", "major", "R"))).toEqual([4, 1, 2, 3, 1, 2, 3, 4]);
    expect(f(spec("Bb", "major", "L"))).toEqual([3, 2, 1, 4, 3, 2, 1, 3]);
    // el resto usa la digitación habitual de cada mano
    const special = (s: ScaleSpec) => s.tonic === "Bb" || (s.tonic === "F" && s.hand === "R");
    for (const s of ALL.filter((x) => !special(x))) expect(f(s)).toEqual(s.hand === "R" ? [1, 2, 3, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 3, 2, 1]);
  });

  it("al bajar, la digitación es la de subir invertida, y la partitura la muestra", () => {
    const ns = scaleNotes(spec("C", "major", "R"));
    expect(ns.slice(7).map((n) => n.f)).toEqual([5, 4, 3, 2, 1, 3, 2, 1]);
    expect(buildScore(scale(spec("C", "major", "R"), 60)).notes.map((n) => n.f)).toEqual(ns.map((n) => n.f));
  });

  it("paso del pulgar", () => {
    expect(thumbPasses(spec("C", "major", "R"))).toEqual([65, 64]); // sube al Fa con el 1; baja al Mi con el 3
    expect(thumbPasses(spec("C", "major", "L"))).toEqual([57, 55]); // sube al La con el 3; baja al Sol con el 1
  });
});

describe("tempos (FR-016)", () => {
  it("propone el primer escalón sin 3★", () => {
    expect(tempoStep({}, "e")).toBe(0);
    expect(tempoStep({ "e@0": 3 }, "e")).toBe(1);
    expect(tempoStep({ "e@0": 3, "e@1": 2 }, "e")).toBe(1);
    expect(tempoStep({ "e@0": 3, "e@1": 3, "e@2": 3 }, "e")).toBe(2);
  });
  it("cuenta el intento en el escalón más alto que no supera el tempo usado", () => {
    expect(stepForTempo(T, 85)).toBe(1);
    expect(stepForTempo(T, 100)).toBe(2);
    expect(stepForTempo(T, 120)).toBe(2);
    expect(stepForTempo(T, 50)).toBe(-1);
  });
  it("dominada con 2★ en el tempo objetivo", () => {
    expect(scaleMastered({ "e@2": 2 }, "e")).toBe(true);
    expect(scaleMastered({ "e@1": 3 }, "e")).toBe(false);
  });
});

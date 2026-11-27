import { describe, expect, it } from "vitest";
import { INDEPENDENCE } from "./independence";
import { validateSong } from "../music/validate";
import { buildScore } from "../music/score";

const all = Object.values(INDEPENDENCE).flat();

describe("independencia de manos (FR-017)", () => {
  it("al menos 2 ejercicios en los niveles 2, 3 y 4", () => {
    for (const n of [2, 3, 4] as const) expect(INDEPENDENCE[n].length).toBeGreaterThanOrEqual(2);
  });

  it.each(all.map((s) => [s.id, s] as const))("%s es válido y a dos manos", (_id, s) => {
    expect(validateSong(s)).toEqual([]);
    expect(s.r?.some(([m]) => m !== 0)).toBe(true);
    expect(s.l?.some(([m]) => m !== 0)).toBe(true);
    expect(buildScore(s).twoHands).toBe(true);
  });

  it("en el nivel 2, la mano izquierda solo hace notas largas (blancas o redondas)", () => {
    for (const s of INDEPENDENCE[2]) for (const [, d] of s.l!) expect(d).toBeGreaterThanOrEqual(2);
  });

  it("el nivel 4 incluye las escalas de Do y Sol mayor a dos manos, con dedos fijos", () => {
    const ids = INDEPENDENCE[4].map((s) => s.id);
    expect(ids).toContain("indep-4-escala-c");
    expect(ids).toContain("indep-4-escala-g");
    const c = buildScore(INDEPENDENCE[4].find((s) => s.id === "indep-4-escala-c")!);
    expect(c.notes.filter((n) => n.h === "R").map((n) => n.f).slice(0, 8)).toEqual([1, 2, 3, 1, 2, 3, 4, 5]);
    expect(c.notes.filter((n) => n.h === "L").map((n) => n.f).slice(0, 8)).toEqual([5, 4, 3, 2, 1, 3, 2, 1]);
  });
});

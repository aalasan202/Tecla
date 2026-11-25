import { describe, expect, it } from "vitest";
import { EXERCISES } from "./exercises";
import { validateSong } from "../music/validate";

describe("ejercicios del Curso", () => {
  it.each(EXERCISES.map((e) => [e.id, e] as const))("%s pasa la validación del repertorio", (_id, e) => {
    expect(validateSong(e)).toEqual([]);
  });

  it("los ids son únicos y empiezan por «curso-»", () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith("curso-")).toBe(true);
  });
});

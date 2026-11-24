import { describe, expect, it } from "vitest";
import { accidentals, keyAlter, noteLabel, spell, type AccNote } from "./spelling";
import type { Hand } from "./types";

/** Notas de prueba: [midi, pulso, mano?], deletreadas en `key`. */
const notes = (list: [number, number, Hand?][], key = 0): AccNote[] =>
  list.map(([m, s, h = "R"], id) => ({ id, m, s, h, spell: spell(m, key) }));
const accOf = (list: [number, number, Hand?][], key = 0) =>
  [...accidentals(notes(list, key), [{ at: 0, key }], 4).entries()].sort((a, b) => a[0] - b[0]);

describe("spell", () => {
  it("escribe las negras con sostenido en Do y en tonalidades con sostenidos", () => {
    expect(spell(61, 0)).toEqual({ step: "C", alter: 1, octave: 4 });
    expect(spell(66, 1)).toEqual({ step: "F", alter: 1, octave: 4 });
  });

  it("escribe las negras con bemol en tonalidades con bemoles", () => {
    expect(spell(70, -1)).toEqual({ step: "B", alter: -1, octave: 4 });
    expect(spell(63, -3)).toEqual({ step: "E", alter: -1, octave: 4 });
  });

  it("respeta la sensible de la relativa menor (Do♯ en Re menor)", () => {
    expect(spell(61, -1)).toEqual({ step: "C", alter: 1, octave: 4 });
    expect(spell(66, -2)).toEqual({ step: "F", alter: 1, octave: 4 });
  });

  it("obedece la ortografía forzada", () => {
    expect(spell(61, 0, "b")).toEqual({ step: "D", alter: -1, octave: 4 });
    expect(spell(65, 0, "#")).toEqual({ step: "E", alter: 1, octave: 4 });
    expect(spell(60, 0, "#")).toEqual({ step: "B", alter: 1, octave: 3 });
    expect(spell(71, 0, "b")).toEqual({ step: "C", alter: -1, octave: 5 });
    expect(spell(67, 0, "##")).toEqual({ step: "F", alter: 2, octave: 4 });
  });

  it("Mi♯, Si♯, Do♭ y Fa♭ solo con ortografía forzada", () => {
    expect(spell(65, 6).step).toBe("F");
    expect(spell(60, 7).step).toBe("C");
    expect(spell(71, -7).step).toBe("B");
    expect(spell(64, -7).step).toBe("E");
  });

  it("una ortografía imposible se ignora", () => {
    expect(spell(61, 0, "n")).toEqual({ step: "C", alter: 1, octave: 4 });
  });
});

describe("keyAlter", () => {
  it("sigue el orden de sostenidos y bemoles", () => {
    expect(keyAlter("F", 1)).toBe(1);
    expect(keyAlter("C", 1)).toBe(0);
    expect(keyAlter("B", 7)).toBe(1);
    expect(keyAlter("B", -1)).toBe(-1);
    expect(keyAlter("E", -1)).toBe(0);
    expect(keyAlter("F", -7)).toBe(-1);
  });
});

describe("noteLabel", () => {
  it("nombra con la alteración real en latín y en inglés", () => {
    expect(noteLabel({ step: "C", alter: 1 })).toBe("Do♯");
    expect(noteLabel({ step: "B", alter: -1 })).toBe("Si♭");
    expect(noteLabel({ step: "G", alter: 0 }, "latin")).toBe("Sol");
    expect(noteLabel({ step: "F", alter: 1 }, "english")).toBe("F♯");
    expect(noteLabel({ step: "B", alter: -1 }, "english")).toBe("B♭");
  });
});

describe("accidentals en Do", () => {
  it("una alteración vale para el resto del compás", () => {
    expect(accOf([[61, 0], [61, 1], [61, 2]])).toEqual([[0, "#"]]);
  });

  it("un Do natural tras un Do♯ lleva becuadro", () => {
    expect(accOf([[61, 0], [60, 1]])).toEqual([[0, "#"], [1, "n"]]);
  });

  it("el compás siguiente vuelve a empezar", () => {
    expect(accOf([[61, 0], [61, 4]])).toEqual([[0, "#"], [1, "#"]]);
    expect(accOf([[61, 0], [60, 4]])).toEqual([[0, "#"]]);
  });

  it("cada octava lleva su alteración", () => {
    expect(accOf([[61, 0], [73, 1]])).toEqual([[0, "#"], [1, "#"]]);
  });

  it("la mano izquierda no hereda las alteraciones de la derecha", () => {
    expect(accOf([[61, 0, "R"], [61, 1, "L"], [60, 2, "L"]])).toEqual([[0, "#"], [1, "#"], [2, "n"]]);
  });
});

describe("accidentals con armadura (historia 2)", () => {
  const acc = (list: [number, number][], keys: { at: number; key: number }[]) => {
    const notes: AccNote[] = list.map(([m, s], id) => {
      const key = [...keys].reverse().find((k) => k.at <= Math.floor(s / 4))!.key;
      return { id, m, s, h: "R", spell: spell(m, key) };
    });
    return list.map((_, id) => accidentals(notes, keys, 4).get(id) ?? "-");
  };

  it("en Sol mayor los Fa♯ no llevan alteración; un Fa natural lleva becuadro y el Fa♯ siguiente, sostenido", () => {
    expect(acc([[66, 0], [67, 1], [66, 2], [65, 3]], [{ at: 0, key: 1 }])).toEqual(["-", "-", "-", "n"]);
    expect(acc([[65, 0], [66, 1]], [{ at: 0, key: 1 }])).toEqual(["n", "#"]);
  });

  it("en Fa mayor el Si♭ no lleva alteración y el Si natural lleva becuadro", () => {
    expect(acc([[70, 0], [71, 1], [70, 2]], [{ at: 0, key: -1 }])).toEqual(["-", "n", "b"]);
  });

  it("con 7 sostenidos o 7 bemoles las notas de la armadura no llevan alteración", () => {
    // Do♯ mayor: Do♯ Re♯ Mi♯ Fa♯ Sol♯ La♯ Si♯ (Mi♯ y Si♯ con ortografía forzada)
    const cs: AccNote[] = [
      { id: 0, m: 61, s: 0, h: "R", spell: spell(61, 7) },
      { id: 1, m: 65, s: 1, h: "R", spell: spell(65, 7, "#") },
      { id: 2, m: 72, s: 2, h: "R", spell: spell(72, 7, "#") },
    ];
    expect(accidentals(cs, [{ at: 0, key: 7 }], 4).size).toBe(0);
    const cb: AccNote[] = [
      { id: 0, m: 70, s: 0, h: "R", spell: spell(70, -7) },
      { id: 1, m: 71, s: 1, h: "R", spell: spell(71, -7, "b") },
      { id: 2, m: 64, s: 2, h: "R", spell: spell(64, -7, "b") },
    ];
    expect(accidentals(cb, [{ at: 0, key: -7 }], 4).size).toBe(0);
  });

  it("un cambio de armadura rige desde su compás", () => {
    // compás 0 en Sol (Fa♯ sin alteración); compás 1 en Fa: Fa y Si♭ sin alteración, Do♯ (sensible de Re menor) con sostenido
    expect(acc([[66, 0], [65, 4], [61, 5], [70, 6]], [{ at: 0, key: 1 }, { at: 1, key: -1 }])).toEqual(["-", "-", "#", "-"]);
  });
});

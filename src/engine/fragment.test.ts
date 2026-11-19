import { describe, expect, it } from "vitest";
import { canNudge, emptySelection, nudge, rangeOf, tapMeasure, toggleLoop, type FragmentSelection } from "./fragment";

const on = (a: number | null = null, b: number | null = null): FragmentSelection => ({ on: true, a, b });

describe("selección del fragmento", () => {
  it("empieza desactivada y vacía", () => {
    expect(emptySelection).toEqual({ on: false, a: null, b: null });
    expect(rangeOf(emptySelection)).toBeNull();
  });

  it("activar deja la selección vacía y desactivar la borra", () => {
    expect(toggleLoop(emptySelection, true)).toEqual(on());
    expect(toggleLoop(on(2, 3), false)).toEqual(emptySelection);
  });

  it("sin bucle activado, tocar un compás no hace nada", () => {
    expect(tapMeasure(emptySelection, 3)).toBe(emptySelection);
  });

  it("dos toques forman el rango ordenado", () => {
    const one = tapMeasure(on(), 5);
    expect(one).toEqual(on(5, null));
    expect(rangeOf(one)).toBeNull();
    const two = tapMeasure(one, 2);
    expect(rangeOf(two)).toEqual({ from: 2, to: 5 });
  });

  it("el mismo compás dos veces es un fragmento de un compás", () => {
    expect(rangeOf(tapMeasure(tapMeasure(on(), 4), 4))).toEqual({ from: 4, to: 4 });
  });

  it("con un fragmento completo, un toque empieza otro", () => {
    expect(tapMeasure(on(2, 5), 7)).toEqual(on(7, null));
  });

  it("rangeOf es null si falta un extremo o el bucle está desactivado", () => {
    expect(rangeOf(on(1, null))).toBeNull();
    expect(rangeOf({ on: false, a: 1, b: 2 })).toBeNull();
  });

  it("nudge mueve inicio y fin un compás respetando los límites", () => {
    const measures = 8;
    expect(rangeOf(nudge(on(3, 4), "to", 1, measures))).toEqual({ from: 3, to: 5 });
    expect(rangeOf(nudge(on(4, 3), "from", -1, measures))).toEqual({ from: 2, to: 4 });
    // no sale por el principio
    expect(canNudge(on(0, 0), "from", -1, measures)).toBe(false);
    expect(nudge(on(0, 0), "from", -1, measures)).toEqual(on(0, 0));
    // no sale por el final
    expect(canNudge(on(6, 7), "to", 1, measures)).toBe(false);
    // no cruza inicio y fin
    const s = nudge(on(2, 3), "from", 1, measures);
    expect(rangeOf(s)).toEqual({ from: 3, to: 3 });
    expect(canNudge(s, "from", 1, measures)).toBe(false);
    expect(nudge(s, "from", 1, measures)).toEqual(s);
    expect(canNudge(s, "to", -1, measures)).toBe(false);
  });

  it("nudge sin fragmento completo no hace nada", () => {
    const s = on(2, null);
    expect(canNudge(s, "to", 1, 8)).toBe(false);
    expect(nudge(s, "to", 1, 8)).toBe(s);
  });
});

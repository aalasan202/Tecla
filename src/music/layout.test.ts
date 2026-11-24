import { describe, expect, it } from "vitest";
import { keyWidth, layoutScore, minPx, STAFF_LEFT } from "./layout";
import { buildScore } from "./score";
import { SONGS } from "./songs";

const quarters = (n: number) => Array.from({ length: n }, (_, i) => i);

describe("layoutScore", () => {
  it("usa 50 px por negra por defecto y compases seguidos", () => {
    const l = layoutScore({ bar: 4, total: 8, onsets: quarters(8), keys: [{ at: 0, key: 0 }] });
    expect(l.px).toBe(50);
    expect(l.left).toBe(STAFF_LEFT);
    expect(l.measures.map((m) => m.start)).toEqual([0, 4]);
    expect(l.measures[1].x).toBe(l.measures[0].x + l.measures[0].width);
    expect(l.xAt(1) - l.xAt(0)).toBe(50);
  });

  it("interpola linealmente entre dos inicios", () => {
    const l = layoutScore({ bar: 4, total: 4, onsets: [0, 2], keys: [{ at: 0, key: 0 }] });
    expect(l.xAt(1)).toBeCloseTo((l.xAt(0) + l.xAt(2)) / 2);
  });

  it("xAt es estrictamente creciente en todas las piezas y xAt(n.s) === n.x", () => {
    for (const song of SONGS) {
      const score = buildScore(song);
      let prev = -Infinity;
      for (let b = -1; b <= score.total + 1; b += 1 / 12) {
        const x = score.layout.xAt(b);
        expect(x).toBeGreaterThan(prev);
        prev = x;
      }
      for (const n of score.notes) expect(score.layout.xAt(n.s)).toBe(n.x);
    }
  });

  it("el margen inicial crece con la armadura", () => {
    const left = (key: number) => layoutScore({ bar: 4, total: 4, onsets: [0], keys: [{ at: 0, key }] }).left;
    expect(left(0)).toBe(STAFF_LEFT);
    expect(left(1)).toBe(STAFF_LEFT + keyWidth(1));
    expect(left(-7)).toBeGreaterThan(left(1));
    expect(left(7)).toBe(left(-7));
  });

  it("deja sitio a la alteración de la primera nota de un compás", () => {
    const plain = layoutScore({ bar: 4, total: 8, onsets: [0, 4], keys: [{ at: 0, key: 0 }] });
    const acc = layoutScore({ bar: 4, total: 8, onsets: [0, 4], keys: [{ at: 0, key: 0 }], accFirst: new Set([1]) });
    expect(acc.measures[1].pad).toBeGreaterThan(plain.measures[1].pad);
    expect(acc.xAt(4) - acc.measures[1].x).toBeGreaterThan(plain.xAt(4) - plain.measures[1].x);
  });

  it("measureAt devuelve el compás bajo una x, recortado a la pieza", () => {
    const l = layoutScore({ bar: 3, total: 9, onsets: quarters(9), keys: [{ at: 0, key: 0 }] });
    expect(l.measureAt(l.measures[1].x + 3)).toBe(1);
    expect(l.measureAt(l.measures[2].x + 1)).toBe(1);
    expect(l.measureAt(-100)).toBe(0);
    expect(l.measureAt(1e6)).toBe(2);
  });

  it("sube px para que dos inicios seguidos queden a ≥ 26 px", () => {
    expect(minPx([0, 0.5, 1], 50)).toBe(52);
    expect(minPx([0, 1, 2], 50)).toBe(50);
    expect(minPx([0, 0.25, 0.5], 50)).toBe(104);
    expect(minPx([0, 1 / 3, 2 / 3], 50)).toBe(78);
    expect(minPx([0, 0.25], 120)).toBe(120);
    const l = layoutScore({ bar: 4, total: 4, onsets: [0, 0.25, 0.5, 0.75, 1], keys: [{ at: 0, key: 0 }] });
    expect(l.xAt(0.25) - l.xAt(0)).toBeGreaterThanOrEqual(26);
  });

  it("respeta el px de la pieza si ya cumple el mínimo", () => {
    expect(buildScore(SONGS.find((s) => s.id === "minueto")!).px).toBe(64);
  });
});

describe("layout · armaduras (historia 2)", () => {
  it("un cambio de armadura deja sitio en su compás sin tapar la primera nota", () => {
    const plain = layoutScore({ bar: 4, total: 12, onsets: [0, 4, 8], keys: [{ at: 0, key: 0 }] });
    const change = layoutScore({ bar: 4, total: 12, onsets: [0, 4, 8], keys: [{ at: 0, key: 2 }, { at: 2, key: -3 }] });
    const pad = (l: typeof plain, i: number) => l.xAt(l.measures[i].start) - l.measures[i].x;
    expect(pad(change, 2)).toBeGreaterThanOrEqual(pad(plain, 2) + 5 * 10);
    expect(pad(change, 1)).toBe(pad(plain, 1));
  });

  it("con 7 alteraciones la primera nota queda tras la armadura", () => {
    const l = layoutScore({ bar: 4, total: 4, onsets: [0], keys: [{ at: 0, key: -7 }] });
    expect(l.xAt(0)).toBeGreaterThan(STAFF_LEFT + 7 * 10);
  });
});

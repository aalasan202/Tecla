import { describe, expect, it } from "vitest";
import { COUNT_IN, Lesson } from "../engine/lesson";
import { fakeHost } from "../engine/testHost";
import { MORE } from "./repertoire";
import { buildScore } from "./score";
import { ORDER, SONGS } from "./songs";
import { staffStep } from "./theory";
import type { SongDef } from "./types";

const levelOf = (s: SongDef): number => Number(/^Nivel (\d+)/.exec(s.level)?.[1]);
const NEW = new Set(MORE.map((s) => s.id));
const isWhite = (m: number) => ![1, 3, 6, 8, 10].includes(m % 12);

/** Toca en «Tocar» cada nota exactamente a tiempo, a tempo de la pieza, con las manos pedidas. */
function perfect(song: SongDef, hands: "both" | "R" | "L") {
  const score = buildScore(song);
  const { host, clock } = fakeHost();
  const l = new Lesson(score, "play", hands, song.tempo, host);
  l.start();
  const ms = l.spb * 1000;
  const presses = score.notes
    .filter((n) => hands === "both" || n.h === hands)
    .map((n) => ({ m: n.m, t: (COUNT_IN * score.pulse + n.s) * ms }))
    .sort((a, b) => a.t - b.t);
  for (const p of presses) {
    clock.t = p.t;
    l.input(p.m);
  }
  const r = l.result();
  l.stop();
  return r.stars;
}

describe("repertorio incluido (008)", () => {
  it("ORDER contiene cada pieza una vez y Inicio sigue proponiendo «Cinco dedos»", () => {
    expect(new Set(ORDER).size).toBe(ORDER.length);
    expect(SONGS.map((s) => s.id)).toEqual([...ORDER]);
    expect(SONGS[0].id).toBe("cinco");
  });

  it("los niveles no retroceden a lo largo de la lista (FR-009)", () => {
    const levels = SONGS.map(levelOf);
    expect(levels.every((lv) => lv >= 1 && lv <= 4)).toBe(true);
    expect([...levels].sort((a, b) => a - b)).toEqual(levels);
  });

  it("toda pieza incluida documenta su origen (FR-004, SC-003)", () => {
    for (const s of SONGS) expect(s.origin?.trim(), s.id).toBeTruthy();
  });

  it("cada nivel tiene al menos 6 piezas y 3 nuevas; al menos 12 nuevas (FR-001, FR-002)", () => {
    expect(MORE.length).toBeGreaterThanOrEqual(12);
    expect(SONGS.length).toBeGreaterThanOrEqual(27);
    for (const lv of [1, 2, 3, 4]) {
      const inLevel = SONGS.filter((s) => levelOf(s) === lv);
      expect(inLevel.length, `nivel ${lv}`).toBeGreaterThanOrEqual(6);
      expect(inLevel.filter((s) => NEW.has(s.id)).length, `nuevas del nivel ${lv}`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe.each(MORE.map((s) => [s.id, s] as const))("pieza nueva %s", (_id, song) => {
  const score = buildScore(song);
  const lv = levelOf(song);

  it("no pasa de 32 compases (FR-011)", () => {
    expect(score.total / score.bar).toBeLessThanOrEqual(32);
  });

  it("respeta las manos de su nivel (FR-005)", () => {
    if (lv <= 2) expect(song.n && !song.r && !song.l).toBeTruthy();
    if (lv === 4) expect(score.twoHands).toBe(true);
  });

  it("tiene digitación en todas las notas (FR-007)", () => {
    for (const n of score.notes) expect(n.f).toBeGreaterThanOrEqual(1);
  });

  if (lv === 1) {
    it("nivel 1: teclas blancas dentro de cinco notas y cada altura con el mismo dedo", () => {
      const ms = score.notes.map((n) => n.m);
      expect(ms.every(isWhite)).toBe(true);
      const steps = ms.map(staffStep);
      expect(Math.max(...steps) - Math.min(...steps)).toBeLessThanOrEqual(4);
      const finger = new Map<number, number>();
      for (const n of score.notes) {
        if (!finger.has(n.m)) finger.set(n.m, n.f);
        expect(n.f, `altura ${n.m}`).toBe(finger.get(n.m));
      }
    });
  }

  it("tocada sin fallos da 3 estrellas (SC-004)", () => {
    expect(perfect(song, "both")).toBe(3);
    if (score.twoHands) {
      expect(perfect(song, "R")).toBe(3);
      expect(perfect(song, "L")).toBe(3);
    }
  });
});

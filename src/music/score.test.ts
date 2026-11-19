import { describe, expect, it } from "vitest";
import { SONGS } from "./songs";
import { STAFF_LEFT, buildScore, measureAt } from "./score";
import { staffStep } from "./theory";
import type { SongDef } from "./types";

const byId = (id: string) => SONGS.find((s) => s.id === id)!;

describe("canciones", () => {
  it("tienen ids únicos", () => {
    expect(new Set(SONGS.map((s) => s.id)).size).toBe(SONGS.length);
  });

  it.each(SONGS.map((s) => [s.id, s] as const))("%s: cada mano llena compases completos y ambas duran lo mismo", (_id, song) => {
    const bar = song.bar ?? 4;
    const tracks = song.l ? [song.r!, song.l] : [song.n!];
    const lengths = tracks.map((t) => t.reduce((a, [, d]) => a + d, 0));
    lengths.forEach((len) => expect(len % bar).toBe(0));
    expect(new Set(lengths).size).toBe(1);
  });

  it.each(SONGS.map((s) => [s.id, s] as const))("%s: notas dentro del rango del piano", (_id, song) => {
    const notes = [...(song.n ?? []), ...(song.r ?? []), ...(song.l ?? [])].filter(([m]) => m !== 0);
    notes.forEach(([m, d]) => {
      expect(m).toBeGreaterThanOrEqual(21);
      expect(m).toBeLessThanOrEqual(108);
      expect(d).toBeGreaterThan(0);
    });
  });
});

describe("buildScore", () => {
  it("posiciona las notas y calcula los compases", () => {
    const score = buildScore(byId("cinco"));
    expect(score.notes).toHaveLength(10);
    expect(score.total).toBe(16);
    expect(score.notes[4]).toMatchObject({ m: 67, s: 4, d: 4 });
    expect(score.notes[1].x - score.notes[0].x).toBe(score.px);
  });

  it("ordena por tiempo con la mano derecha primero", () => {
    const score = buildScore(byId("oda2"));
    expect(score.twoHands).toBe(true);
    expect(score.notes[0].h).toBe("R");
    expect(score.notes[1]).toMatchObject({ h: "L", s: 0 });
    score.notes.forEach((n, i) => expect(n.id).toBe(i));
  });

  it("parte los silencios en la barra de compás", () => {
    const score = buildScore(byId("pregunta"));
    const left = score.rests.filter((r) => r.h === "L");
    expect(left.map((r) => r.d)).toEqual([4, 4]);
  });

  it("respeta el compás de 3/4", () => {
    const score = buildScore(byId("minueto"));
    expect(score.bar).toBe(3);
    expect(score.total).toBe(24);
  });
});

describe("digitación", () => {
  const fingers = (song: SongDef, hand: "R" | "L" = "R") => buildScore(song).notes.filter((n) => n.h === hand).map((n) => n.f);

  it("usa la posición de Do en el Himno: Do=1 … Sol=5", () => {
    const score = buildScore(byId("oda"));
    for (const n of score.notes) expect(n.f).toBe(staffStep(n.m) - staffStep(60) + 1);
  });

  it("coloca la mano en Sol para el inicio del Minueto", () => {
    expect(fingers(byId("minueto")).slice(0, 6)).toEqual([5, 1, 2, 3, 4, 5]);
  });

  it("da la digitación clásica al motivo de Para Elisa", () => {
    expect(fingers(byId("elisa")).slice(0, 9)).toEqual([5, 4, 5, 4, 5, 2, 4, 3, 1]);
  });

  it("siempre devuelve dedos del 1 al 5", () => {
    for (const song of SONGS)
      for (const n of buildScore(song).notes) {
        expect(n.f).toBeGreaterThanOrEqual(1);
        expect(n.f).toBeLessThanOrEqual(5);
      }
  });

  it("en la mano izquierda el pulgar va en la nota más aguda", () => {
    const score = buildScore(byId("oda2"));
    const left = score.notes.filter((n) => n.h === "L");
    const top = left.reduce((a, b) => (b.m > a.m ? b : a));
    expect(top.f).toBe(1);
  });
});

describe("measureAt", () => {
  it("convierte una x de la partitura en compás (4/4)", () => {
    const score = buildScore(byId("cinco")); // px 50
    expect(measureAt(score, STAFF_LEFT + 2)).toBe(0);
    expect(measureAt(score, STAFF_LEFT + 4 * 50 + 1)).toBe(0);
    expect(measureAt(score, STAFF_LEFT + 4 * 50 + 3)).toBe(1);
  });

  it("usa la duración del compás (3/4)", () => {
    const score = buildScore(byId("minueto")); // px 64
    expect(measureAt(score, STAFF_LEFT + 3 * 64 + 1)).toBe(0);
    expect(measureAt(score, STAFF_LEFT + 3 * 64 + 3)).toBe(1);
  });

  it("recorta a los extremos de la pieza", () => {
    const score = buildScore(byId("cinco"));
    expect(measureAt(score, -50)).toBe(0);
    expect(measureAt(score, 1e6)).toBe(score.total / score.bar - 1);
  });
});

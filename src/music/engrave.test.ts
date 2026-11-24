import { describe, expect, it } from "vitest";
import { engrave, type Engraving, type Figure } from "./engrave";
import { TICKS, buildScore } from "./score";
import { SONGS } from "./songs";
import type { SongDef, Track } from "./types";

const piece = (n: Track, extra: Partial<SongDef> = {}): SongDef => ({ id: "t", title: "t", level: "", tempo: 80, n, ...extra });
const fig = (f: Figure) => `${f.kind === "rest" ? "r" : ""}${f.dur}${f.dots ? "." : ""}`;
/** Figuras de la mano derecha por compás, como «q 8 8.». */
const figs = (e: Engraving, h = 0) => e.hands[h].measures.map((m) => m.figures.map(fig).join(" "));

/** Cada compás de figuras suma exactamente su compás. */
function expectFull(song: SongDef) {
  const score = buildScore(song);
  const e = engrave(score);
  for (const hand of e.hands)
    for (const m of hand.measures) expect(m.figures.reduce((a, f) => a + f.ticks, 0)).toBe(score.bar * TICKS);
  return e;
}

describe("engrave · lo que ya existe", () => {
  it.each(SONGS.map((s) => [s.id, s] as const))("%s: cada compás suma exacto y cada nota aparece", (_id, song) => {
    const e = expectFull(song);
    const ids = new Set(e.hands.flatMap((h) => h.measures.flatMap((m) => m.figures.flatMap((f) => f.keys.map((k) => k.noteId)))));
    expect(ids.size).toBe(buildScore(song).notes.length);
  });

  it("parte un silencio largo en la barra; un compás vacío es un silencio de compás", () => {
    const e = expectFull(piece([[0, 6], [60, 2]]));
    expect(figs(e)).toEqual(["rw", "rh h"]);
    expect(e.hands[0].measures[0].figures[0].full).toBe(true);
  });

  it("une con barra las corcheas del mismo pulso", () => {
    const e = expectFull(piece([[60, 0.5], [62, 0.5], [64, 0.5], [65, 0.5], [67, 1], [69, 0.5], [71, 0.5]]));
    expect(e.hands[0].measures[0].beams).toEqual([[0, 1], [2, 3], [5, 6]]);
  });

  it("una corchea seguida de un silencio no lleva barra", () => {
    const e = expectFull(piece([[60, 0.5], [0, 0.5], [64, 3]]));
    expect(e.hands[0].measures[0].beams).toEqual([]);
  });

  it("escribe la alteración solo donde hace falta", () => {
    const e = expectFull(piece([[61, 1], [61, 1], [60, 1], [61, 1]]));
    const accs = e.hands[0].measures[0].figures.map((f) => f.keys[0].acc ?? "-");
    expect(accs).toEqual(["#", "-", "n", "#"]);
  });

  it("clave de sol para la derecha y de fa para la izquierda; armadura en el compás 0", () => {
    const e = engrave(buildScore(SONGS.find((s) => s.id === "oda2")!));
    expect(e.hands.map((h) => h.clef)).toEqual(["treble", "bass"]);
    expect(e.hands[0].measures[0].key).toBe(0);
    expect(e.hands[0].measures[1].key).toBeUndefined();
  });

  it("es determinista", () => {
    const song = SONGS.find((s) => s.id === "elisa")!;
    expect(engrave(buildScore(song))).toEqual(engrave(buildScore(song)));
  });

  it("figuras con puntillo: Himno (negra con puntillo + corchea)", () => {
    const e = expectFull(SONGS.find((s) => s.id === "oda")!);
    expect(figs(e)[3]).toBe("q. 8 h");
  });
});

describe("engrave · acordes (historia 1)", () => {
  it("un acorde es una sola figura con varias alturas, de grave a aguda", () => {
    const e = expectFull(piece([[[67, 60, 64], 2], [60, 2]]));
    const [first] = e.hands[0].measures[0].figures;
    expect(first.keys.map((k) => `${k.step}${k.octave}`)).toEqual(["C4", "E4", "G4"]);
    expect(e.hands[0].measures[0].figures).toHaveLength(2);
  });

  it("un acorde con segunda conserva las dos alturas", () => {
    const e = expectFull(piece([[[60, 62], 4]]));
    expect(e.hands[0].measures[0].figures[0].keys.map((k) => k.step)).toEqual(["C", "D"]);
  });

  it("cada altura del acorde lleva su alteración", () => {
    const e = expectFull(piece([[[61, 64, 68], 4]]));
    expect(e.hands[0].measures[0].figures[0].keys.map((k) => k.acc ?? "-")).toEqual(["#", "-", "#"]);
  });
});

describe("engrave · armaduras (historia 2)", () => {
  it("la armadura va en el compás 0 y en los compases donde cambia", () => {
    const e = expectFull(piece([[60, 4], [60, 4], [60, 4]], { key: 1, keyChanges: [{ at: 2, key: -2 }] }));
    expect(e.hands[0].measures.map((m) => m.key)).toEqual([1, undefined, -2]);
  });

  it("Minueto en Sol: un sostenido de armadura y ningún Fa con sostenido propio", () => {
    const e = expectFull(SONGS.find((s) => s.id === "minueto")!);
    expect(e.hands[0].measures[0].key).toBe(1);
    const fs = e.hands[0].measures.flatMap((m) => m.figures.flatMap((f) => f.keys)).filter((k) => k.step === "F");
    expect(fs.length).toBeGreaterThan(0);
    expect(fs.every((k) => k.alter === 1 && !k.acc)).toBe(true);
  });
});

describe("engrave · ligaduras (historia 3)", () => {
  it("3 pulsos desde el pulso 3 de un 4/4: blanca ligada a negra en el compás siguiente", () => {
    const e = expectFull(piece([[60, 2], [64, 3], [62, 3]]));
    expect(figs(e)).toEqual(["h h", "q h."]);
    const [m0, m1] = e.hands[0].measures;
    expect(m0.figures[1].tieToNext).toEqual([true]);
    expect(m1.figures[0].tieToNext).toBeUndefined();
    expect(m1.figures[0].keys[0].noteId).toBe(m0.figures[1].keys[0].noteId);
  });

  it("2,5 pulsos en el pulso 1: blanca + corchea ligadas", () => {
    // el Re de 1,5 empieza fuera de pulso: corchea ligada a negra, sin cruzar el pulso
    const e = expectFull(piece([[64, 2.5], [62, 1.5]]));
    expect(figs(e)).toEqual(["h 8 8 q"]);
    expect(e.hands[0].measures[0].figures.map((f) => !!f.tieToNext)).toEqual([true, false, true, false]);
  });

  it("1,5 en el pulso 2 de un 4/4: negra con puntillo", () => {
    expect(figs(expectFull(piece([[60, 1], [62, 1.5], [64, 0.5], [65, 1]])))).toEqual(["q q. 8 q"]);
  });

  it("fuera de pulso, una figura no cruza el pulso siguiente: corchea + corchea ligadas", () => {
    const e = expectFull(piece([[60, 0.5], [62, 1], [64, 0.5], [65, 2]]));
    expect(figs(e)).toEqual(["8 8 8 8 h"]);
    expect(e.hands[0].measures[0].figures[1].tieToNext).toEqual([true]);
  });

  it("un acorde ligado lleva tieToNext por altura y la alteración solo en la primera figura", () => {
    const e = expectFull(piece([[60, 2], [[61, 65], 3], [62, 3]]));
    const [m0, m1] = e.hands[0].measures;
    expect(m0.figures[1].tieToNext).toEqual([true, true]);
    expect(m0.figures[1].keys[0].acc).toBe("#");
    expect(m1.figures[0].keys[0].acc).toBeUndefined();
  });

  it("la ligadura de expresión marca la primera y la última figura", () => {
    const e = expectFull(piece([[60, 1, { slur: "start" }], [62, 1], [64, 1], [65, 1, { slur: "end" }]]));
    expect(e.hands[0].measures[0].figures.map((f) => f.slur ?? "-")).toEqual(["start", "-", "-", "end"]);
  });
});

describe("engrave · tresillos, semicorcheas y 6/8 (historia 6)", () => {
  it("tres corcheas en un pulso forman un tresillo con barra", () => {
    const e = expectFull(piece([[60, 1 / 3], [62, 1 / 3], [64, 1 / 3], [65, 3]]));
    const m = e.hands[0].measures[0];
    expect(figs(e)).toEqual(["8 8 8 h."]);
    expect(m.tuplets).toEqual([{ figures: [0, 1, 2], num: 3 }]);
    expect(m.beams).toEqual([[0, 1, 2]]);
  });

  it("un tresillo con un silencio dentro lo incluye en el grupo", () => {
    const e = expectFull(piece([[60, 1 / 3], [0, 1 / 3], [64, 1 / 3], [65, 3]]));
    expect(figs(e)).toEqual(["8 r8 8 h."]);
    expect(e.hands[0].measures[0].tuplets).toEqual([{ figures: [0, 1, 2], num: 3 }]);
  });

  it("tresillo de negras en dos pulsos", () => {
    const e = expectFull(piece([[60, 2 / 3], [62, 2 / 3], [64, 2 / 3], [65, 2]]));
    expect(figs(e)).toEqual(["q q q h"]);
    expect(e.hands[0].measures[0].tuplets).toEqual([{ figures: [0, 1, 2], num: 3 }]);
  });

  it("semicorcheas unidas por pulso; corchea con puntillo + semicorchea", () => {
    const e = expectFull(piece([[60, 0.25], [62, 0.25], [64, 0.25], [65, 0.25], [67, 0.75], [65, 0.25], [64, 2]]));
    expect(figs(e)).toEqual(["16 16 16 16 8. 16 h"]);
    expect(e.hands[0].measures[0].beams).toEqual([[0, 1, 2, 3], [4, 5]]);
  });

  it("6/8: corcheas de tres en tres y negra con puntillo por pulso", () => {
    const e = expectFull(piece([[60, 0.5], [62, 0.5], [64, 0.5], [65, 1.5], [67, 1], [65, 0.5], [64, 1.5]], { time: "6/8" }));
    expect(figs(e)).toEqual(["8 8 8 q.", "q 8 q."]);
    expect(e.hands[0].measures[0].beams).toEqual([[0, 1, 2]]);
  });

  it("6/8: una nota de dos negras se escribe negra con puntillo + corchea ligadas", () => {
    const e = expectFull(piece([[60, 2], [62, 1]], { time: "6/8" }));
    expect(figs(e)).toEqual(["q. 8 q"]);
  });
});

import { describe, expect, it } from "vitest";
import { SONGS } from "./songs";
import { buildScore, measureAt } from "./score";
import { staffStep } from "./theory";
import type { SongDef } from "./types";
import { validateSong } from "./validate";

const byId = (id: string) => SONGS.find((s) => s.id === id)!;

describe("canciones", () => {
  it("tienen ids únicos", () => {
    expect(new Set(SONGS.map((s) => s.id)).size).toBe(SONGS.length);
  });

  it.each(SONGS.map((s) => [s.id, s] as const))("%s: cumple las reglas del modelo de datos (FR-017)", (_id, song) => {
    expect(validateSong(song)).toEqual([]);
  });
});

describe("validateSong", () => {
  const base = { id: "t", title: "t", level: "t", tempo: 80 };
  const errs = (song: Omit<SongDef, "id" | "title" | "level" | "tempo">) => validateSong({ ...base, ...song }).join(" | ");

  it("exige duraciones en ticks y positivas", () => {
    expect(errs({ n: [[60, 0.1], [60, 3.9]] })).toMatch(/1\/48/);
    expect(errs({ n: [[60, 0], [60, 4]] })).toMatch(/1\/48/);
  });

  it("exige compases completos y manos de igual duración", () => {
    expect(errs({ n: [[60, 3]] })).toMatch(/compases completos/);
    expect(errs({ r: [[60, 4]], l: [[48, 4], [48, 4]] })).toMatch(/no duran lo mismo/);
  });

  it("exige alturas 21–108 y acordes sin repetir altura", () => {
    expect(errs({ n: [[20, 4]] })).toMatch(/21–108/);
    expect(errs({ n: [[[60, 60, 64], 4]] })).toMatch(/no repite altura/);
    expect(errs({ n: [[[60], 4]] })).toMatch(/2 a 6/);
  });

  it("tie solo entre eventos consecutivos con las mismas alturas", () => {
    expect(errs({ n: [[60, 2, { tie: true }], [60, 2]] })).toBe("");
    expect(errs({ n: [[60, 2, { tie: true }], [62, 2]] })).toMatch(/mismas alturas/);
    expect(errs({ n: [[60, 2, { tie: true }], [0, 2]] })).toMatch(/mismas alturas/);
    expect(errs({ n: [[[60, 64], 2, { tie: true }], [[64, 60], 2]] })).toBe("");
    expect(errs({ n: [[60, 4, { tie: true }]] })).toMatch(/último evento/);
  });

  it("slur start y end emparejados, sin anidar", () => {
    expect(errs({ n: [[60, 1, { slur: "start" }], [62, 1], [64, 1], [65, 1, { slur: "end" }]] })).toBe("");
    expect(errs({ n: [[60, 1, { slur: "start" }], [62, 1, { slur: "start" }], [64, 1, { slur: "end" }], [65, 1]] })).toMatch(/sin anidar/);
    expect(errs({ n: [[60, 1], [62, 1], [64, 1], [65, 1, { slur: "end" }]] })).toMatch(/sin start/);
    expect(errs({ n: [[60, 1, { slur: "start" }], [62, 1], [64, 1], [65, 1]] })).toMatch(/sin end/);
  });

  it("armaduras en −7…7, cambios ordenados y dentro de la pieza", () => {
    expect(errs({ key: 8, n: [[60, 4]] })).toMatch(/−7…7/);
    expect(errs({ keyChanges: [{ at: 1, key: -8 }], n: [[60, 4], [60, 4]] })).toMatch(/−7…7/);
    expect(errs({ keyChanges: [{ at: 1, key: 1 }, { at: 1, key: 2 }], n: [[60, 4], [60, 4]] })).toMatch(/desordenado/);
    expect(errs({ keyChanges: [{ at: 2, key: 1 }], n: [[60, 4], [60, 4]] })).toMatch(/fuera de la pieza/);
  });

  it("en 6/8 cada mano suma múltiplos de 3 negras", () => {
    expect(errs({ time: "6/8", n: [[60, 1.5], [62, 1.5]] })).toBe("");
    expect(errs({ time: "6/8", n: [[60, 2]] })).toMatch(/6\/8/);
  });
});

describe("buildScore", () => {
  it("posiciona las notas y calcula los compases", () => {
    const score = buildScore(byId("cinco"));
    expect(score.notes).toHaveLength(10);
    expect(score.total).toBe(16);
    expect(score.notes[4]).toMatchObject({ m: 67, s: 4, d: 4 });
    expect(score.notes[1].x - score.notes[0].x).toBe(score.px);
    for (const n of score.notes) expect(n.x).toBe(score.layout.xAt(n.s));
  });

  it("acepta eventos con opciones y el formato de siempre", () => {
    const a = buildScore({ id: "a", title: "a", level: "", tempo: 80, n: [[60, 1], [62, 3]] });
    const b = buildScore({ id: "b", title: "b", level: "", tempo: 80, n: [[60, 1, {}], [62, 3, {}]] });
    expect(b.notes.map(({ m, d, s }) => [m, d, s])).toEqual(a.notes.map(({ m, d, s }) => [m, d, s]));
  });

  it("trabaja en ticks: tercios y cuartos de negra, y rechaza lo que no cae en un tick", () => {
    const tri = buildScore({ id: "t", title: "t", level: "", tempo: 80, n: [[60, 1 / 3], [62, 1 / 3], [64, 1 / 3], [65, 0.25], [67, 0.75], [60, 2]] });
    expect(tri.notes.map((n) => n.s)).toEqual([0, 1 / 3, 2 / 3, 1, 1.25, 2]);
    expect(() => buildScore({ id: "x", title: "x", level: "", tempo: 80, n: [[60, 0.1], [60, 3.9]] })).toThrow(/1\/48/);
  });

  it("da a cada evento suelto su propio unit", () => {
    const score = buildScore(byId("oda2"));
    expect(new Set(score.notes.map((n) => n.unit)).size).toBe(score.notes.length);
  });

  it("sin armadura ni compás especial: Do, pulso de negra y cifra x/4", () => {
    const score = buildScore(byId("elisa"));
    expect(score.keys).toEqual([{ at: 0, key: 0 }]);
    expect(score.pulse).toBe(1);
    expect(score.time).toEqual({ beats: 3, unit: 4 });
    expect(buildScore(byId("cinco")).time).toEqual({ beats: 4, unit: 4 });
  });

  it("escribe las teclas negras con sostenido en Do", () => {
    const score = buildScore({ id: "t", title: "t", level: "", tempo: 80, n: [[61, 4]] });
    expect(score.notes[0].spell).toEqual({ step: "C", alter: 1 });
  });

  it("ordena por tiempo con la mano derecha primero", () => {
    const score = buildScore(byId("oda2"));
    expect(score.twoHands).toBe(true);
    expect(score.notes[0].h).toBe("R");
    expect(score.notes[1]).toMatchObject({ h: "L", s: 0 });
    score.notes.forEach((n, i) => expect(n.id).toBe(i));
  });

  it("guarda los silencios sin partir, con su inicio", () => {
    const score = buildScore(byId("pregunta"));
    expect(score.rests.filter((r) => r.h === "L")).toEqual([{ h: "L", s: 0, d: 8 }]);
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

  const chordFingers = (track: SongDef["n"], hand: "R" | "L") => {
    const song: SongDef = hand === "R" ? { id: "c", title: "c", level: "", tempo: 80, n: track } : { id: "c", title: "c", level: "", tempo: 80, r: [[0, 4]], l: track };
    return buildScore(song).notes.filter((n) => n.h === hand).map((n) => n.f);
  };

  it("tríada Do–Mi–Sol: 1-3-5 en la derecha y 5-3-1 en la izquierda (FR-014)", () => {
    expect(chordFingers([[[60, 64, 67], 4]], "R")).toEqual([1, 3, 5]);
    expect(chordFingers([[[48, 52, 55], 4]], "L")).toEqual([5, 3, 1]);
  });

  it("acorde de octava: 1-5 en la derecha y 5-1 en la izquierda", () => {
    expect(chordFingers([[[60, 72], 4]], "R")).toEqual([1, 5]);
    expect(chordFingers([[[48, 60], 4]], "L")).toEqual([5, 1]);
  });

  it("cada nota de un acorde lleva un dedo distinto", () => {
    for (const chord of [[60, 62, 64], [60, 65, 69], [55, 60, 64, 67], [48, 52, 55, 60]]) {
      const f = chordFingers([[chord, 4]], "R");
      expect(new Set(f).size).toBe(chord.length);
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
    const [m0, m1] = score.layout.measures;
    expect(measureAt(score, m0.x + 2)).toBe(0);
    expect(measureAt(score, m1.x + 1)).toBe(0);
    expect(measureAt(score, m1.x + 3)).toBe(1);
    expect(m1.x - m0.x).toBe(4 * 50);
  });

  it("usa la duración del compás (3/4)", () => {
    const score = buildScore(byId("minueto")); // px 64
    const [m0, m1] = score.layout.measures;
    expect(m1.start).toBe(3);
    expect(measureAt(score, m1.x + 1)).toBe(0);
    expect(measureAt(score, m1.x + 3)).toBe(1);
    expect(m1.x - m0.x).toBeGreaterThanOrEqual(3 * 64);
  });

  it("recorta a los extremos de la pieza", () => {
    const score = buildScore(byId("cinco"));
    expect(measureAt(score, -50)).toBe(0);
    expect(measureAt(score, 1e6)).toBe(score.total / score.bar - 1);
  });
});

describe("digitación de acordes seguidos", () => {
  it("Himno con acordes: Do mayor 5-3-1 y Sol mayor (Si–Re–Sol) 5-3-1 en cada compás", () => {
    const score = buildScore(byId("oda-acordes"));
    const left = score.notes.filter((n) => n.h === "L");
    const byUnit = new Map<number, number[]>();
    for (const n of left) byUnit.set(n.unit, [...(byUnit.get(n.unit) ?? []), n.f]);
    for (const f of byUnit.values()) expect(f).toEqual([5, 3, 1]);
  });
});

describe("ligaduras (historia 3)", () => {
  const one = (n: SongDef["n"]) => buildScore({ id: "t", title: "t", level: "", tempo: 80, n });

  it("una nota ligada a la siguiente de la misma altura es una sola nota", () => {
    const score = one([[60, 2], [64, 2, { tie: true }], [64, 1], [62, 3]]);
    expect(score.notes.map(({ m, s, d }) => [m, s, d])).toEqual([[60, 0, 2], [64, 2, 3], [62, 5, 3]]);
  });

  it("un acorde ligado se une altura por altura", () => {
    const score = one([[[60, 64], 3, { tie: true }], [[60, 64], 1]]);
    expect(score.notes.map(({ m, d }) => [m, d])).toEqual([[60, 4], [64, 4]]);
    expect(score.notes[0].unit).toBe(score.notes[1].unit);
  });

  it("una duración sin figura propia se puede escribir sin tie", () => {
    const score = one([[64, 2.5], [62, 1.5]]);
    expect(score.notes.map((n) => n.d)).toEqual([2.5, 1.5]);
    expect(validateSong({ id: "t", title: "t", level: "", tempo: 80, n: [[64, 2.5], [62, 1.5]] })).toEqual([]);
  });

  it("la ligadura de expresión llega a las notas sin cambiar alturas ni tiempos", () => {
    const plain = one([[60, 1], [62, 1], [64, 1], [65, 1]]);
    const slurred = one([[60, 1, { slur: "start" }], [62, 1], [64, 1], [65, 1, { slur: "end" }]]);
    expect(slurred.notes.map(({ m, s, d }) => [m, s, d])).toEqual(plain.notes.map(({ m, s, d }) => [m, s, d]));
    expect(slurred.notes.map((n) => n.slur ?? "-")).toEqual(["start", "-", "-", "end"]);
  });
});

describe("ritmo: 6/8, semicorcheas y tresillos (historia 6)", () => {
  const one = (n: SongDef["n"], extra: Partial<SongDef> = {}) => buildScore({ id: "t", title: "t", level: "", tempo: 60, n, ...extra });

  it("6/8: compás de 3 negras, pulso de negra con puntillo y cifra 6/8", () => {
    const score = one([[60, 1.5], [62, 1.5]], { time: "6/8" });
    expect(score.bar).toBe(3);
    expect(score.pulse).toBe(1.5);
    expect(score.time).toEqual({ beats: 6, unit: 8 });
  });

  it("6/8: cada mano suma múltiplos de 3 negras", () => {
    expect(validateSong({ id: "t", title: "t", level: "", tempo: 60, time: "6/8", n: [[60, 1.5], [62, 1.5]] })).toEqual([]);
    expect(validateSong({ id: "t", title: "t", level: "", tempo: 60, time: "6/8", n: [[60, 4.5]] }).join()).toMatch(/6\/8/);
  });

  it("recorta el margen de las semicorcheas a la mitad de la distancia, y no el de las corcheas", () => {
    const score = one([[60, 0.25], [62, 0.25], [64, 0.5], [65, 0.5], [67, 2.5]]);
    expect(score.notes[1].win).toEqual({ hit: 0.125, perfect: 0.125 });
    expect(score.notes[3].win).toEqual({ hit: 0.45, perfect: 0.18 });
  });

  it("los tresillos caen en ticks exactos", () => {
    const score = one([[60, 1 / 3], [62, 1 / 3], [64, 1 / 3], [65, 3]]);
    expect(score.notes.map((n) => Math.round(n.s * 48))).toEqual([0, 16, 32, 48]);
    expect(score.notes[1].win.hit).toBeCloseTo(1 / 6);
  });
});

describe("pedal (009)", () => {
  const song = (level: string): SongDef => ({ id: "t", title: "t", level, tempo: 80, n: [[60, 2], [62, 2], [64, 4]], pedal: [[0, 2], [2, 4]] });

  it("validateSong rechaza tramos solapados", () => {
    expect(validateSong({ ...song("Nivel 3"), pedal: [[0, 4], [2, 4]] }).join()).toMatch(/solapa/);
    expect(validateSong(song("Nivel 3"))).toEqual([]);
  });

  it("buildScore solo usa el pedal desde el nivel 3", () => {
    expect(buildScore(song("Nivel 2 · Importada de MIDI")).pedals).toEqual([]);
    expect(buildScore(song("Nivel 3 · Importada de MIDI")).pedals).toEqual([[0, 2], [2, 4]]);
    expect(buildScore(song("Nivel 4 · Bach")).pedals).toEqual([[0, 2], [2, 4]]);
  });
});

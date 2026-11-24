import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Lesson, COUNT_IN } from "../engine/lesson";
import { fakeHost } from "../engine/testHost";
import { buildScore } from "./score";
import { SONGS } from "./songs";

/**
 * Red de seguridad de la partitura profesional (007): las 12 piezas de antes del cambio deben
 * dar las mismas notas, dedos y puntuación. El JSON se generó con el código anterior a 007; con
 * UPDATE_BASELINE=1 se escribe si falta (no se sobrescribe).
 */
const FILE = new URL("./__fixtures__/baseline.json", import.meta.url);
const BASELINE_IDS = ["cinco", "oda", "estrellita", "martinillo", "luna", "minueto", "elisa", "pregunta", "oda2", "estrellita2", "canon", "preludio"];

interface Snapshot {
  notes: [number, number, number, string, number][];
  play: { score: number | null; stars: number };
  playL?: { score: number | null; stars: number };
}

/** Tocar a tempo 60 con una secuencia fija: derecha exacta, izquierda +0,3, cada quinta omitida. */
function play(id: string, hands: "both" | "L") {
  const score = buildScore(SONGS.find((s) => s.id === id)!);
  const { host, clock } = fakeHost();
  const l = new Lesson(score, "play", hands, 60, host);
  l.start();
  const presses = score.notes
    .filter((_, i) => i % 5 !== 4)
    .map((n) => ({ m: n.m, t: (COUNT_IN + n.s + (n.h === "L" ? 0.3 : 0)) * 1000 }))
    .sort((a, b) => a.t - b.t);
  for (const p of presses) {
    clock.t = p.t;
    l.input(p.m);
  }
  const r = l.result();
  l.stop();
  return { score: r.score === null ? null : Math.round(r.score * 1e6) / 1e6, stars: r.stars };
}

function snapshot(id: string): Snapshot {
  const score = buildScore(SONGS.find((s) => s.id === id)!);
  const snap: Snapshot = {
    notes: score.notes.map((n) => [n.m, n.d, n.s, n.h, n.f]),
    play: play(id, "both"),
  };
  if (score.twoHands) snap.playL = play(id, "L");
  return snap;
}

if (process.env.UPDATE_BASELINE && !existsSync(FILE)) {
  const all = Object.fromEntries(BASELINE_IDS.map((id) => [id, snapshot(id)]));
  writeFileSync(FILE, JSON.stringify(all) + "\n");
}

describe("no regresión de las 12 piezas (007)", () => {
  const baseline = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, Snapshot>;

  it("la línea base cubre las 12 piezas", () => {
    expect(Object.keys(baseline).sort()).toEqual([...BASELINE_IDS].sort());
  });

  for (const id of BASELINE_IDS) {
    it(`${id}: mismas notas, dedos y puntuación`, () => {
      expect(snapshot(id)).toEqual(baseline[id]);
    });
  }
});

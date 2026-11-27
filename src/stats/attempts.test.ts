import { describe, expect, it } from "vitest";
import { addAttempt, makeAttempt, validAttempts } from "./attempts";
import type { Attempt, AttemptSource, HistoryData } from "./types";

const src: AttemptSource = { key: "song:oda", src: "song", title: "Himno a la alegría" };
const base = { source: src, mode: "play" as const, hands: "both" as const, twoHands: true, tempo: 80, score: 0.8, stars: 2 };
const at = (a: Omit<Attempt, "at">, t: number): Attempt => ({ ...a, at: t });
const empty = (): Pick<HistoryData, "attempts" | "pieces"> => ({ attempts: [], pieces: {} });

describe("makeAttempt: qué cuenta para la evolución (FR-007)", () => {
  it("Tocar con las dos manos y la pieza entera cuenta", () => {
    expect(makeAttempt(base).counts).toBe(true);
  });
  it("Aprender no cuenta", () => {
    expect(makeAttempt({ ...base, mode: "learn" }).counts).toBe(false);
  });
  it("un fragmento no cuenta", () => {
    const a = makeAttempt({ ...base, frag: { from: 3, to: 4, reps: 2 } });
    expect(a.counts).toBe(false);
    expect(a.frag).toEqual({ from: 3, to: 4, reps: 2 });
  });
  it("una mano en pieza a dos manos no cuenta", () => {
    expect(makeAttempt({ ...base, hands: "R" }).counts).toBe(false);
  });
  it("una mano en pieza de una sola mano sí cuenta", () => {
    expect(makeAttempt({ ...base, hands: "R", twoHands: false }).counts).toBe(true);
  });
  it("guarda la unidad solo si la hay y acota la nota", () => {
    expect("unit" in makeAttempt(base)).toBe(false);
    expect(makeAttempt({ ...base, source: { ...src, unit: "Unidad 1 · Primeros pasos" } }).unit).toBe("Unidad 1 · Primeros pasos");
    expect(makeAttempt({ ...base, score: 1.2 }).score).toBe(1);
  });
});

describe("addAttempt", () => {
  it("añade al final sin mutar la entrada", () => {
    const d = empty();
    const next = addAttempt(d, at(makeAttempt(base), 1));
    expect(d.attempts).toHaveLength(0);
    expect(next.attempts).toHaveLength(1);
  });

  it("recorta los más antiguos pero el resumen sigue contando", () => {
    let d = empty();
    for (let i = 0; i < 1200; i++) d = addAttempt(d, at(makeAttempt(base), i));
    expect(d.attempts).toHaveLength(1000);
    expect(d.attempts[0].at).toBe(200);
    expect(d.pieces["song:oda"].count).toBe(1200);
  });

  it("first y best solo cambian con intentos que cuentan; last siempre", () => {
    let d = empty();
    d = addAttempt(d, at(makeAttempt({ ...base, mode: "learn", score: 0.95 }), 1));
    expect(d.pieces["song:oda"].first).toBeUndefined();
    expect(d.pieces["song:oda"].best).toBeUndefined();
    d = addAttempt(d, at(makeAttempt({ ...base, score: 0.5 }), 2));
    d = addAttempt(d, at(makeAttempt({ ...base, score: 0.9 }), 3));
    d = addAttempt(d, at(makeAttempt({ ...base, score: 0.9 }), 4)); // empate: se queda el primero
    d = addAttempt(d, at(makeAttempt({ ...base, hands: "R", score: 1 }), 5));
    const s = d.pieces["song:oda"];
    expect(s.first).toEqual({ at: 2, score: 0.5 });
    expect(s.best).toEqual({ at: 3, score: 0.9 });
    expect(s.last).toEqual({ at: 5, score: 1, mode: "play" });
    expect(s.count).toBe(5);
  });
});

describe("validAttempts", () => {
  it("descarta entradas mal formadas", () => {
    const good = at(makeAttempt(base), 1);
    const raw = [good, { ...good, key: "" }, { ...good, at: "x" }, { ...good, score: 2 }, null, 3];
    expect(validAttempts(raw)).toEqual([good]);
    expect(validAttempts("basura")).toEqual([]);
  });
});

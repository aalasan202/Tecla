import { describe, expect, it } from "vitest";
import { periodStats } from "./period";
import { addAttempt, makeAttempt } from "./attempts";
import { dayKey } from "./streaks";
import type { Attempt, AttemptSource, HistoryData } from "./types";

const day = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);
const today = day(2026, 11, 27);
const oda: AttemptSource = { key: "song:oda", src: "song", title: "Himno" };
const lec: AttemptSource = { key: "course:l-pulso", src: "course", title: "El pulso", unit: "Unidad 1 · Primeros pasos" };

function build(list: [AttemptSource, Date, Partial<Parameters<typeof makeAttempt>[0]>?][]): Pick<HistoryData, "attempts" | "pieces"> {
  let h: Pick<HistoryData, "attempts" | "pieces"> = { attempts: [], pieces: {} };
  for (const [source, at, over] of list) {
    const a: Attempt = { ...makeAttempt({ source, mode: "play", hands: "both", twoHands: false, tempo: 80, score: 0.5, stars: 1, ...over }), at: at.getTime() };
    h = addAttempt(h, a);
  }
  return h;
}

describe("periodStats", () => {
  const days = {
    [dayKey(day(2026, 11, 27))]: 600,
    [dayKey(day(2026, 11, 21))]: 300, // dentro de 7 días (21–27)
    [dayKey(day(2026, 11, 20))]: 120, // fuera de 7 días, dentro de 30
    [dayKey(day(2026, 5, 1))]: 60, // solo en «Todo»
  };
  const h = build([
    [oda, day(2026, 11, 27), { score: 0.4 }],
    [oda, day(2026, 11, 27, 13), { score: 0.9 }],
    [oda, day(2026, 11, 26), { mode: "learn", score: 1 }],
    [oda, day(2026, 11, 26, 14), { frag: { from: 1, to: 2, reps: 3 }, score: 1 }],
    [lec, day(2026, 11, 25), { score: 0.6 }],
    [lec, day(2026, 11, 10), { score: 0.2 }],
    [oda, day(2026, 12, 5), { score: 1 }], // futuro: se ignora
  ]);

  it("7 días incluye hoy y cuadra con los datos", () => {
    const s = periodStats("7d", days, h, today);
    expect(s.seconds).toBe(900);
    expect(s.daysPracticed).toBe(2);
    expect(s.series).toHaveLength(7);
    expect(s.series[6]).toMatchObject({ label: "V", seconds: 600 });
    expect(s.attempts).toEqual({ song: 4, course: 1 });
  });

  it("la nota media solo cuenta Tocar sin fragmentos y separa Canciones y Curso", () => {
    const s = periodStats("7d", days, h, today);
    expect(s.avgPlay.song).toBeCloseTo(0.65);
    expect(s.avgPlay.course).toBeCloseTo(0.6);
    expect(periodStats("7d", {}, { attempts: [], pieces: {} }, today).avgPlay).toEqual({ song: null, course: null });
  });

  it("30 días: serie diaria de 30 puntos", () => {
    const s = periodStats("30d", days, h, today);
    expect(s.series).toHaveLength(30);
    expect(s.seconds).toBe(1020);
    expect(s.attempts).toEqual({ song: 4, course: 2 });
  });

  it("más practicadas y más mejoradas", () => {
    const s = periodStats("30d", days, h, today);
    expect(s.top.map((t) => [t.key, t.attempts])).toEqual([
      ["song:oda", 4],
      ["course:l-pulso", 2],
    ]);
    expect(s.improved).toEqual([
      { key: "song:oda", title: "Himno", src: "song", from: 0.4, to: 0.9 },
      { key: "course:l-pulso", title: "El pulso", src: "course", from: 0.2, to: 0.6 },
    ]);
  });

  it("mejora necesita al menos dos intentos que cuenten", () => {
    expect(periodStats("7d", days, h, today).improved.map((i) => i.key)).toEqual(["song:oda"]);
  });

  it("Todo: desde el primer día, por mes si pasan de 26 semanas, con los resúmenes", () => {
    const s = periodStats("all", days, h, today);
    expect(s.unit).toBe("month");
    expect(s.series[0]).toMatchObject({ label: "may 26", seconds: 60 });
    expect(s.series.at(-1)).toMatchObject({ label: "nov 26", seconds: 1020 });
    expect(s.seconds).toBe(1080);
    expect(s.top[0]).toMatchObject({ key: "song:oda", attempts: 5 }); // el resumen incluye el futuro
  });

  it("Todo: por semanas si el primer día es reciente", () => {
    const s = periodStats("all", { [dayKey(day(2026, 11, 10))]: 60 }, { attempts: [], pieces: {} }, today);
    expect(s.unit).toBe("week");
    expect(s.series).toHaveLength(3);
  });

  it("un periodo sin datos está vacío", () => {
    expect(periodStats("7d", { [dayKey(day(2026, 5, 1))]: 60 }, { attempts: [], pieces: {} }, today).empty).toBe(true);
    expect(periodStats("7d", days, h, today).empty).toBe(false);
  });

  it("rendimiento: 1000 intentos y 400 días en menos de 50 ms", () => {
    const many: Record<string, number> = {};
    for (let i = 0; i < 400; i++) many[dayKey(new Date(2025, 9, 23 + i, 12))] = 60;
    let big: Pick<HistoryData, "attempts" | "pieces"> = { attempts: [], pieces: {} };
    for (let i = 0; i < 1000; i++) {
      const a: Attempt = { ...makeAttempt({ source: { ...oda, key: `song:p${i % 30}` }, mode: "play", hands: "both", twoHands: false, tempo: 80, score: (i % 10) / 10, stars: 1 }), at: today.getTime() - i * 3_600_000 };
      big = addAttempt(big, a);
    }
    const t0 = performance.now();
    for (const p of ["7d", "30d", "all"] as const) periodStats(p, many, big, today);
    expect(performance.now() - t0).toBeLessThan(50);
  });
});

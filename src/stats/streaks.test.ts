import { describe, expect, it } from "vitest";
import { bestStreak, calendar, dayKey, dayLevel, goalMet, milestones } from "./streaks";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
const k = (y: number, m: number, d: number) => dayKey(day(y, m, d));
const run = (y: number, m: number, d: number, n: number, s = 60) => {
  const out: Record<string, number> = {};
  for (let i = 0; i < n; i++) out[dayKey(new Date(y, m - 1, d + i, 12))] = s;
  return out;
};

describe("bestStreak", () => {
  it("sin días es 0", () => expect(bestStreak({})).toBe(0));
  it("días sueltos son rachas de 1", () => expect(bestStreak({ [k(2026, 1, 1)]: 60, [k(2026, 1, 3)]: 60 })).toBe(1));
  it("elige la racha más larga aunque no sea la actual", () => {
    expect(bestStreak({ ...run(2026, 10, 1, 9), ...run(2026, 11, 20, 3) })).toBe(9);
  });
  it("cruza meses y años", () => {
    expect(bestStreak(run(2025, 12, 30, 4))).toBe(4);
  });
  it("los días a 0 segundos y las claves raras no cuentan", () => {
    expect(bestStreak({ ...run(2026, 1, 1, 2), [k(2026, 1, 3)]: 0, [k(2026, 1, 4)]: 60, basura: 60 })).toBe(2);
  });
  it("no depende del orden de las claves", () => {
    const days = run(2026, 3, 1, 5);
    const reversed = Object.fromEntries(Object.entries(days).reverse());
    expect(bestStreak(reversed)).toBe(5);
  });
});

describe("niveles del día y objetivo", () => {
  it("sin objetivo, mucha es 10 min o más", () => {
    expect(dayLevel(0, 0)).toBe(0);
    expect(dayLevel(599, 0)).toBe(1);
    expect(dayLevel(600, 0)).toBe(2);
  });
  it("con objetivo, mucha es cumplirlo", () => {
    expect(dayLevel(299, 5)).toBe(1);
    expect(dayLevel(300, 5)).toBe(2);
    expect(dayLevel(900, 20)).toBe(1);
  });
  it("sin objetivo nunca se cumple", () => {
    expect(goalMet(10_000, 0)).toBe(false);
    expect(goalMet(600, 10)).toBe(true);
  });
});

describe("calendar", () => {
  const today = day(2026, 11, 27); // viernes
  const cols = calendar({ [k(2026, 11, 27)]: 700, [k(2026, 11, 24)]: 100, [k(2026, 9, 1)]: 60 }, 0, today);
  it("13 semanas de lunes a domingo, la última con hoy", () => {
    expect(cols).toHaveLength(13);
    cols.forEach((c) => expect(c).toHaveLength(7));
    expect(cols[12][0].key).toBe("2026-11-23");
    expect(cols[12][0].date.getDay()).toBe(1);
    expect(cols[12][4].key).toBe("2026-11-27");
    expect(cols[0][0].key).toBe("2026-08-31");
  });
  it("marca los días futuros y los niveles", () => {
    expect(cols[12][4].future).toBe(false);
    expect(cols[12][5].future).toBe(true);
    expect(cols[12][4].level).toBe(2);
    expect(cols[12][1].level).toBe(1);
    expect(cols[12][0].level).toBe(0);
    expect(cols[0][1].level).toBe(1); // 1 de septiembre
  });
  it("marca el objetivo cumplido", () => {
    const g = calendar({ [k(2026, 11, 27)]: 600 }, 10, today);
    expect(g[12][4].goal).toBe(true);
    expect(calendar({ [k(2026, 11, 27)]: 599 }, 10, today)[12][4].goal).toBe(false);
  });
});

describe("milestones", () => {
  const today = day(2026, 11, 27);
  const t = k(2026, 11, 27);

  it("récord: la racha actual supera la mejor anterior", () => {
    const before = { ...run(2026, 10, 1, 2), ...run(2026, 11, 25, 2) };
    const after = { ...before, [t]: 30 };
    expect(milestones(before, after, 0, today, {})).toEqual(["record"]);
  });
  it("no felicita con racha de 1 ni si ya se felicitó hoy", () => {
    expect(milestones({}, { [t]: 30 }, 0, today, {})).toEqual([]);
    const before = run(2026, 11, 25, 2);
    expect(milestones(before, { ...before, [t]: 30 }, 0, today, { record: t })).toEqual([]);
  });
  it("no felicita si solo iguala el récord", () => {
    const before = { ...run(2026, 10, 1, 3), ...run(2026, 11, 25, 2) };
    expect(milestones(before, { ...before, [t]: 30 }, 0, today, {})).toEqual([]);
  });
  it("objetivo: solo al cruzar el umbral", () => {
    expect(milestones({ [t]: 500 }, { [t]: 600 }, 10, today, {})).toEqual(["goal"]);
    expect(milestones({ [t]: 600 }, { [t]: 700 }, 10, today, {})).toEqual([]);
    expect(milestones({ [t]: 500 }, { [t]: 900 }, 0, today, {})).toEqual([]);
    expect(milestones({ [t]: 500 }, { [t]: 600 }, 10, today, { goal: t })).toEqual([]);
  });
});

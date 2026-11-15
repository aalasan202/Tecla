import { describe, expect, it, vi } from "vitest";
import { Lesson, groupByTime, starsFor, type LessonHost, type LessonResult } from "./lesson";
import { buildScore } from "../music/score";
import { SONGS } from "../music/songs";

function fakeHost(clock = { t: 0 }) {
  const finished: LessonResult[] = [];
  const host: LessonHost = {
    mark: vi.fn(),
    guide: vi.fn(),
    status: vi.fn(),
    playhead: vi.fn(),
    scrollTo: vi.fn(),
    flash: vi.fn(),
    tone: vi.fn(),
    click: vi.fn(),
    finish: (r) => finished.push(r),
    now: () => clock.t,
    frame: () => 0,
    cancelFrame: () => {},
  };
  return { host, finished, clock };
}

const song = (id: string) => buildScore(SONGS.find((s) => s.id === id)!);

describe("Aprender", () => {
  it("avanza solo con la nota correcta y cuenta los fallos", () => {
    vi.useFakeTimers();
    const { host, finished } = fakeHost();
    const score = song("cinco");
    const l = new Lesson(score, "learn", "both", 80, host);
    l.start();
    l.input(61); // fallo
    for (const n of score.notes) l.input(n.m);
    vi.runAllTimers();
    expect(finished).toHaveLength(1);
    expect(finished[0].score).toBeCloseTo(10 / 11);
    expect(finished[0].stars).toBe(3);
    vi.useRealTimers();
  });

  it("con una sola mano, solo pide las notas de esa mano", () => {
    const { host } = fakeHost();
    const score = song("oda2");
    const l = new Lesson(score, "learn", "L", 80, host);
    expect(score.notes.filter((n) => l.isAuto(n)).every((n) => n.h === "R")).toBe(true);
  });
});

describe("Tocar", () => {
  it("puntúa por cercanía al pulso", () => {
    const { host, clock } = fakeHost();
    const score = song("cinco");
    const l = new Lesson(score, "play", "both", 60, host); // 1 pulso = 1000 ms
    l.start();
    clock.t = 4000; // fin de la cuenta atrás: pulso 0
    l.input(60); // perfecta
    clock.t = 5300; // pulso 1.3: buena
    l.input(62);
    clock.t = 5350;
    l.input(70); // nota de más
    const r = l.result();
    const expected = (1 + 0.7 - 0.25) / score.notes.length;
    expect(r.score).toBeCloseTo(expected);
    l.stop();
  });
});

describe("utilidades", () => {
  it("agrupa las notas simultáneas", () => {
    const groups = groupByTime(song("oda2").notes);
    expect(groups[0]).toHaveLength(2);
    expect(groups[1]).toHaveLength(1);
  });

  it("convierte porcentajes en estrellas", () => {
    expect([0.2, 0.4, 0.7, 0.9].map(starsFor)).toEqual([0, 1, 2, 3]);
  });
});

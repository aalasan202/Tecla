import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Lesson, groupByTime, starsFor, type LessonHost, type LessonResult } from "./lesson";
import { STAFF_LEFT, buildScore } from "../music/score";
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

/** Host con bucle controlado a mano: tick(ms) avanza el reloj y ejecuta un fotograma. */
function tempoHost() {
  const clock = { t: 0 };
  const { host, finished } = fakeHost(clock);
  let next: (() => void) | null = null;
  const xs: (number | null)[] = [];
  host.frame = (cb) => {
    next = cb;
    return 1;
  };
  host.playhead = (x) => {
    xs.push(x);
  };
  const tick = (ms: number) => {
    clock.t += ms;
    vi.advanceTimersByTime(ms);
    const cb = next;
    next = null;
    cb?.();
  };
  return { host, finished, clock, tick, xs };
}

/** Posición del cursor en pulsos a partir del último playhead. */
const beatOf = (xs: (number | null)[], px: number) => ((xs[xs.length - 1] ?? NaN) - STAFF_LEFT - 16) / px;

describe("Aprender a tempo", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("atTempo se ignora fuera de Aprender", () => {
    const { host } = fakeHost();
    expect(new Lesson(song("cinco"), "play", "both", 80, host, { atTempo: true }).atTempo).toBe(false);
    expect(new Lesson(song("cinco"), "learn", "both", 80, host, { atTempo: true }).atTempo).toBe(true);
    expect(new Lesson(song("cinco"), "learn", "both", 80, host).atTempo).toBe(false);
  });

  it("tocando cada nota a su tiempo el cursor no se detiene", () => {
    const { host, finished, clock, tick, xs } = tempoHost();
    const score = song("cinco");
    const l = new Lesson(score, "learn", "both", 60, host, { atTempo: true });
    l.start();
    let i = 0;
    let prev = -1;
    while (!finished.length && clock.t < 30000) {
      while (i < score.notes.length && score.notes[i].s * 1000 <= clock.t) l.input(score.notes[i++].m);
      tick(100);
      if (finished.length) break;
      const b = beatOf(xs, score.px);
      expect(b).toBeGreaterThan(prev);
      prev = b;
    }
    expect(finished).toHaveLength(1);
    expect(finished[0].mode).toBe("learn");
    expect(Math.abs(clock.t - (score.total + 0.6) * 1000)).toBeLessThanOrEqual(1000);
  });

  it("sin tocar, el cursor se detiene en la nota pendiente y reanuda al tocarla", () => {
    const { host, tick, xs } = tempoHost();
    const score = song("cinco");
    const l = new Lesson(score, "learn", "both", 60, host, { atTempo: true });
    l.start();
    l.input(60);
    tick(1000);
    expect(beatOf(xs, score.px)).toBeCloseTo(1);
    tick(500);
    tick(500);
    expect(beatOf(xs, score.px)).toBeCloseTo(1);
    l.input(62);
    tick(100);
    expect(beatOf(xs, score.px)).toBeCloseTo(1.1);
    l.stop();
  });

  it("tecla equivocada cuenta fallo y no avanza", () => {
    const { host, finished, tick, xs } = tempoHost();
    const score = song("cinco");
    const l = new Lesson(score, "learn", "both", 60, host, { atTempo: true });
    l.start();
    l.input(60);
    tick(1000);
    l.input(61);
    expect(host.flash).toHaveBeenCalledWith(61, "wrong", 350);
    tick(500);
    expect(beatOf(xs, score.px)).toBeCloseTo(1);
    for (const n of score.notes.slice(1)) l.input(n.m);
    for (let k = 0; k < 40 && !finished.length; k++) tick(500);
    expect(finished).toHaveLength(1);
    expect(finished[0].score).toBeCloseTo(score.notes.length / (score.notes.length + 1));
  });

  it("una nota tocada antes de tiempo cuenta y el cursor no se detiene en ella", () => {
    const { host, tick, xs } = tempoHost();
    const score = song("cinco");
    const l = new Lesson(score, "learn", "both", 60, host, { atTempo: true });
    l.start();
    l.input(60);
    tick(500);
    l.input(62); // pulso 1, por adelantado
    expect(host.mark).toHaveBeenCalledWith(score.notes[1].id, "hit");
    tick(600);
    expect(beatOf(xs, score.px)).toBeCloseTo(1.1);
    const before = (host.flash as ReturnType<typeof vi.fn>).mock.calls.length;
    l.input(65); // la del pulso 3, con la del pulso 2 aún pendiente
    expect((host.flash as ReturnType<typeof vi.fn>).mock.calls.slice(before)).toContainEqual([65, "wrong", 350]);
    l.stop();
  });

  it("cambiar el tempo cambia la velocidad sin salto", () => {
    const { host, tick, xs } = tempoHost();
    const score = song("cinco");
    const l = new Lesson(score, "learn", "both", 60, host, { atTempo: true });
    l.start();
    l.input(60);
    l.input(62);
    tick(500);
    expect(beatOf(xs, score.px)).toBeCloseTo(0.5);
    l.tempo = 30;
    tick(1000);
    expect(beatOf(xs, score.px)).toBeCloseTo(1);
    l.stop();
  });

  it("el acompañamiento no suena por delante de la nota pendiente", () => {
    const { host, tick, xs } = tempoHost();
    const score = song("oda2");
    const tone = host.tone as ReturnType<typeof vi.fn>;
    const toned = (m: number) => tone.mock.calls.some((c) => c[0] === m);
    const l = new Lesson(score, "learn", "R", 60, host, { atTempo: true });
    l.start();
    tick(500);
    expect(beatOf(xs, score.px)).toBeCloseTo(0);
    expect(toned(48)).toBe(false); // la izquierda del pulso 0 espera a la derecha
    l.input(64);
    tick(16);
    expect(toned(48)).toBe(true);
    for (const m of [64, 65, 67]) l.input(m); // pulsos 1, 2 y 3
    tick(5000);
    expect(beatOf(xs, score.px)).toBeCloseTo(4);
    expect(toned(55)).toBe(false); // la izquierda del pulso 4
    l.input(67);
    tick(16);
    expect(toned(55)).toBe(true);
    l.stop();
  });

  it("un acorde a medias mantiene el cursor detenido", () => {
    const { host, tick, xs } = tempoHost();
    const score = song("oda2");
    const l = new Lesson(score, "learn", "both", 60, host, { atTempo: true });
    l.start();
    l.input(64);
    tick(1000);
    expect(beatOf(xs, score.px)).toBeCloseTo(0);
    l.input(48);
    tick(500);
    expect(beatOf(xs, score.px)).toBeCloseTo(0.5);
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

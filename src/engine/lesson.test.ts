import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COUNT_IN, Lesson, groupByTime, starsFor, type LessonHost, type LessonResult } from "./lesson";
import { STAFF_LEFT, buildScore } from "../music/score";
import { SONGS } from "../music/songs";
import type { SongDef } from "../music/types";

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

describe("Bucle — límites", () => {
  it("ordena y recorta el fragmento", () => {
    const { host } = fakeHost();
    const score = song("cinco");
    const measures = score.total / score.bar;
    expect(new Lesson(score, "learn", "both", 80, host, { loop: { from: 3, to: 1 } }).loop).toEqual({ from: 1, to: 3 });
    expect(new Lesson(score, "play", "both", 80, host, { loop: { from: -2, to: 99 } }).loop).toEqual({ from: 0, to: measures - 1 });
    expect(new Lesson(score, "listen", "both", 80, host).loop).toBeNull();
  });
});

/** Notas de un fragmento (compases from…to, base 0). */
const inLoop = (score: ReturnType<typeof song>, from: number, to: number) =>
  score.notes.filter((n) => n.s >= from * score.bar && n.s < (to + 1) * score.bar);
type Mock = ReturnType<typeof vi.fn>;
const lastCall = (fn: unknown) => (fn as Mock).mock.calls[(fn as Mock).mock.calls.length - 1];
const statusTexts = (host: LessonHost) => (host.status as Mock).mock.calls.map((c) => c[0] as string);
const EMPTY = ["No hay notas de esta mano en el fragmento", "Elige otros compases u otra mano"] as const;
/** Avanza fotogramas de 50 ms hasta el instante t (ms), cayendo exactamente en él. */
const runTo = (host: LessonHost, tick: (ms: number) => void, t: number) => {
  while (host.now() + 50 < t) tick(50);
  if (host.now() < t) tick(t - host.now());
};

describe("Bucle — Aprender", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("solo pide notas del fragmento y, tras la última, vuelve a la primera", () => {
    const { host, finished } = fakeHost();
    const score = song("cinco");
    const frag = inLoop(score, 2, 2);
    const l = new Lesson(score, "learn", "both", 80, host, { loop: { from: 2, to: 2 } });
    l.start();
    expect(l.running).toBe(true);
    expect(lastCall(host.guide)[0]).toEqual([frag[0]]);
    for (const n of frag) l.input(n.m);
    vi.runAllTimers();
    expect(lastCall(host.guide)[0]).toEqual([frag[0]]);
    for (const n of frag) expect(host.mark).toHaveBeenCalledWith(n.id, null);
    const guided = (host.guide as Mock).mock.calls.flatMap((c) => c[0] as { s: number }[]);
    expect(guided.every((n) => n.s >= 8 && n.s < 12)).toBe(true);
    expect(finished).toHaveLength(0);
    l.stop();
  });

  it("una tecla que no es la esperada cuenta como fallo", () => {
    const { host } = fakeHost();
    const score = song("cinco");
    const l = new Lesson(score, "learn", "both", 80, host, { loop: { from: 2, to: 2 } });
    l.start();
    l.input(67); // nota del compás 2, fuera del fragmento
    expect(host.flash).toHaveBeenCalledWith(67, "wrong", 350);
    expect(l.result().score).toBeCloseTo(4 / 5);
    l.stop();
  });

  it("un fragmento sin notas de la mano elegida no arranca", () => {
    const { host } = fakeHost();
    const l = new Lesson(song("pregunta"), "learn", "L", 80, host, { loop: { from: 0, to: 1 } });
    l.start();
    expect(l.running).toBe(false);
    expect(host.status).toHaveBeenLastCalledWith(...EMPTY);
  });

  it("«A tempo»: al pasar el final del fragmento el cursor vuelve al inicio", () => {
    const { host, tick, xs } = tempoHost();
    const score = song("cinco");
    const frag = inLoop(score, 2, 2);
    const l = new Lesson(score, "learn", "both", 60, host, { atTempo: true, loop: { from: 2, to: 2 } });
    l.start();
    tick(16);
    expect(beatOf(xs, score.px)).toBeCloseTo(8, 1);
    for (const n of frag) l.input(n.m);
    let wrapped = false;
    let prev = 8;
    for (let k = 0; k < 50 && !wrapped; k++) {
      tick(100);
      const b = beatOf(xs, score.px);
      if (b < prev) wrapped = true;
      prev = b;
    }
    expect(wrapped).toBe(true);
    expect(prev).toBeLessThan(8.2);
    expect(lastCall(host.guide)[0]).toEqual([frag[0]]);
    l.stop();
  });
});

describe("Bucle — Escuchar y Tocar", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("Escuchar: solo suena el fragmento, una vez por vuelta", () => {
    const { host, tick } = tempoHost();
    const score = song("cinco");
    const frag = inLoop(score, 2, 2);
    const l = new Lesson(score, "listen", "both", 60, host, { loop: { from: 2, to: 2 } });
    l.start();
    runTo(host, tick, 300 + 3 * 4000 - 50);
    const tones = (host.tone as Mock).mock.calls.map((c) => c[0] as number);
    const once = frag.map((n) => n.m);
    expect(tones).toEqual([...once, ...once, ...once]);
    l.stop();
  });

  it("Tocar: cuenta atrás una vez, compás de descanso con clics y sin finish", () => {
    const { host, finished, tick } = tempoHost();
    const score = song("cinco");
    const l = new Lesson(score, "play", "both", 60, host, { loop: { from: 2, to: 2 } }); // L 4, P 8
    l.start();
    runTo(host, tick, (COUNT_IN + 2 * 8) * 1000 + 100);
    const clicks = (host.click as Mock).mock.calls.map((c) => c[0] as boolean);
    expect(clicks).toHaveLength(COUNT_IN + 2 * 8 + 1);
    clicks.forEach((strong, i) => expect(strong).toBe(i % 4 === 0));
    expect(statusTexts(host)).toContain("Otra vez… 3");
    expect(finished).toHaveLength(0);
    l.stop();
  });

  it("Tocar: la 2.ª repetición se puntúa en su pulso, también por adelantado", () => {
    for (const at of [COUNT_IN + 8, COUNT_IN + 8 - 0.3]) {
      const { host, tick } = tempoHost();
      const score = song("cinco");
      const frag = inLoop(score, 2, 2);
      const l = new Lesson(score, "play", "both", 60, host, { loop: { from: 2, to: 2 } });
      l.start();
      runTo(host, tick, at * 1000);
      (host.mark as Mock).mockClear();
      l.input(frag[0].m);
      expect(host.mark).toHaveBeenCalledWith(frag[0].id, "hit");
      l.stop();
    }
  });

  it("Tocar: un fragmento sin notas de la mano elegida no arranca", () => {
    const { host } = fakeHost();
    const l = new Lesson(song("pregunta"), "play", "L", 80, host, { loop: { from: 0, to: 1 } });
    l.start();
    expect(l.running).toBe(false);
    expect(host.status).toHaveBeenLastCalledWith(...EMPTY);
    expect(host.click).not.toHaveBeenCalled();
  });

  it("una mano: el acompañamiento se limita al fragmento y se repite", () => {
    const { host, tick } = tempoHost();
    const score = song("oda2");
    const autos = inLoop(score, 1, 1).filter((n) => n.h === "L");
    expect(autos.length).toBeGreaterThan(0);
    const l = new Lesson(score, "play", "R", 60, host, { loop: { from: 1, to: 1 } });
    l.start();
    runTo(host, tick, (COUNT_IN + 2 * 8) * 1000 - 100);
    const tones = (host.tone as Mock).mock.calls.map((c) => c[0] as number);
    expect(tones).toEqual([...autos, ...autos].map((n) => n.m));
    l.stop();
  });

  it("el sonido de una nota que cruza el final del fragmento se recorta", () => {
    const def: SongDef = { id: "x", title: "x", level: "x", tempo: 60, n: [[60, 6], [62, 2]] };
    const score = buildScore(def);
    const { host, tick } = tempoHost();
    const l = new Lesson(score, "listen", "both", 60, host, { loop: { from: 0, to: 0 } });
    l.start();
    tick(400);
    expect(host.tone).toHaveBeenCalledTimes(1);
    expect(lastCall(host.tone)[1]).toBeLessThanOrEqual(4 * 0.95 + 1e-9);
    l.stop();
  });
});

describe("Bucle — repeticiones", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("Aprender: estado con repetición y resultado anterior, y resumen", () => {
    const { host } = fakeHost();
    const score = song("cinco");
    const frag = inLoop(score, 2, 2);
    const l = new Lesson(score, "learn", "both", 80, host, { loop: { from: 2, to: 2 } });
    l.start();
    expect(l.loopSummary()).toBeNull();
    expect(lastCall(host.status)[0]).toMatch(/^Repetición 1 · /);
    l.input(61); // un fallo en la 1.ª
    for (let rep = 0; rep < 3; rep++) {
      for (const n of frag) l.input(n.m);
      vi.runAllTimers();
    }
    expect(statusTexts(host).some((t) => t.startsWith("Repetición 2 · anterior 80 %"))).toBe(true);
    expect(lastCall(host.status)[0]).toMatch(/^Repetición 4 · anterior 100 %/);
    const sum = l.loopSummary()!;
    expect(sum.reps).toBe(3);
    expect(sum.best.score).toBe(1);
    expect(sum.last.score).toBe(1);
    l.stop();
  });

  it("Escuchar: solo el número de repetición y sin resumen", () => {
    const { host, tick } = tempoHost();
    const l = new Lesson(song("cinco"), "listen", "both", 60, host, { loop: { from: 2, to: 2 } });
    l.start();
    runTo(host, tick, 300 + 4000 + 500);
    expect(lastCall(host.status)[0]).toBe("Repetición 2 · Compás 3 de 4");
    expect(l.loopSummary()).toBeNull();
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

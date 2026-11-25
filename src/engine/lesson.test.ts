import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COUNT_IN, Lesson, groupByTime, starsFor, type LessonHost } from "./lesson";
import { buildScore } from "../music/score";
import { SONGS } from "../music/songs";
import type { Score, SongDef } from "../music/types";
import { fakeHost } from "./testHost";

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
const beatOf = (xs: (number | null)[], score: Score) => {
  const x = xs[xs.length - 1] ?? NaN;
  // inversa de layout.xAt (estrictamente creciente) por bisección
  let lo = -20;
  let hi = score.total + 20;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (score.layout.xAt(mid) < x) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

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
      const b = beatOf(xs, score);
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
    expect(beatOf(xs, score)).toBeCloseTo(1);
    tick(500);
    tick(500);
    expect(beatOf(xs, score)).toBeCloseTo(1);
    l.input(62);
    tick(100);
    expect(beatOf(xs, score)).toBeCloseTo(1.1);
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
    expect(beatOf(xs, score)).toBeCloseTo(1);
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
    expect(beatOf(xs, score)).toBeCloseTo(1.1);
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
    expect(beatOf(xs, score)).toBeCloseTo(0.5);
    l.tempo = 30;
    tick(1000);
    expect(beatOf(xs, score)).toBeCloseTo(1);
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
    expect(beatOf(xs, score)).toBeCloseTo(0);
    expect(toned(48)).toBe(false); // la izquierda del pulso 0 espera a la derecha
    l.input(64);
    tick(16);
    expect(toned(48)).toBe(true);
    for (const m of [64, 65, 67]) l.input(m); // pulsos 1, 2 y 3
    tick(5000);
    expect(beatOf(xs, score)).toBeCloseTo(4);
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
    expect(beatOf(xs, score)).toBeCloseTo(0);
    l.input(48);
    tick(500);
    expect(beatOf(xs, score)).toBeCloseTo(0.5);
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
    expect(beatOf(xs, score)).toBeCloseTo(8, 1);
    for (const n of frag) l.input(n.m);
    let wrapped = false;
    let prev = 8;
    for (let k = 0; k < 50 && !wrapped; k++) {
      tick(100);
      const b = beatOf(xs, score);
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

describe("posiciones y tempo desde la partitura (007)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("segundos por negra = 60 / (tempo · pulso)", () => {
    const { host } = fakeHost();
    const l = new Lesson(song("minueto"), "play", "both", 90, host);
    expect(l.spb).toBeCloseTo(60 / 90);
  });

  it("en Tocar el cursor pasa por layout.xAt(pulso)", () => {
    const { host, clock, tick, xs } = tempoHost();
    const score = song("minueto");
    const l = new Lesson(score, "play", "both", 60, host);
    l.start();
    for (const beat of [0, 1.5, 4, 7.25]) {
      clock.t = (COUNT_IN + beat) * 1000 - 16;
      tick(16);
      expect(xs[xs.length - 1]).toBeCloseTo(score.layout.xAt(beat));
    }
    l.stop();
  });
});

describe("acordes (007, historia 1)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  // Do–Mi–Sol de blanca y luego Re de blanca, a una mano
  const chord = () => buildScore({ id: "ac", title: "ac", level: "", tempo: 60, n: [[[60, 64, 67], 2], [62, 2]] });
  const markOf = (host: LessonHost, id: number) => {
    const calls = (host.mark as Mock).mock.calls.filter((c) => c[0] === id);
    return calls.length ? calls[calls.length - 1][1] : undefined;
  };

  it("Aprender espera todas las notas del acorde, en cualquier orden", () => {
    const { host } = fakeHost();
    const score = chord();
    const l = new Lesson(score, "learn", "both", 60, host);
    l.start();
    const [c, e, g, d] = score.notes;
    l.input(67);
    l.input(60);
    expect(markOf(host, g.id)).toBe("hit");
    expect(markOf(host, c.id)).toBe("hit");
    expect(markOf(host, e.id)).toBe("now");
    expect(markOf(host, d.id)).toBe(null);
    l.input(64);
    expect(markOf(host, e.id)).toBe("hit");
    expect(markOf(host, d.id)).toBe("now");
    l.stop();
  });

  it("Tocar: el acorde con sus tres notas cuenta como un acierto", () => {
    const { host, clock } = fakeHost();
    const score = chord();
    const l = new Lesson(score, "play", "both", 60, host);
    l.start();
    clock.t = COUNT_IN * 1000;
    l.input(60);
    l.input(64);
    clock.t += 100;
    l.input(67);
    clock.t = (COUNT_IN + 2) * 1000;
    l.input(62);
    // dos unidades (acorde y Re), las dos perfectas
    expect(l.result().score).toBeCloseTo(1);
    l.stop();
  });

  it("Tocar: si falta una nota, el acorde es un fallo y esa nota se marca fallada", () => {
    const { host, clock, tick } = tempoHost();
    const score = chord();
    const l = new Lesson(score, "play", "both", 60, host);
    l.start();
    clock.t = COUNT_IN * 1000;
    l.input(60);
    l.input(64);
    l.input(61); // nota equivocada: no anula las acertadas
    runTo(host, tick, (COUNT_IN + 1) * 1000);
    const [c, e, g] = score.notes;
    expect(markOf(host, c.id)).toBe("hit");
    expect(markOf(host, e.id)).toBe("hit");
    expect(markOf(host, g.id)).toBe("miss");
    clock.t = (COUNT_IN + 2) * 1000;
    l.input(62);
    // acorde fallado (0) + Re perfecto (1), menos la nota de más; entre dos unidades
    expect(l.result().score).toBeCloseTo((1 - 0.25) / 2);
    l.stop();
  });

  it("Escuchar: las notas del acorde se marcan a la vez", () => {
    const { host, tick } = tempoHost();
    const score = chord();
    const l = new Lesson(score, "listen", "both", 60, host);
    l.start();
    tick(400);
    const [c, e, g] = score.notes;
    expect([markOf(host, c.id), markOf(host, e.id), markOf(host, g.id)]).toEqual(["now", "now", "now"]);
    l.stop();
  });
});

describe("notas ligadas (007, historia 3)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  // compás 0: Do blanca + Mi blanca ligada a Mi negra del compás 1; luego Re + Do
  const tied = () =>
    buildScore({ id: "tie", title: "tie", level: "", tempo: 60, n: [[60, 2], [64, 2, { tie: true }], [64, 1], [62, 1], [60, 2]] });

  it("Aprender: la nota ligada se toca una vez", () => {
    const { host, finished } = fakeHost();
    const score = tied();
    expect(score.notes).toHaveLength(4);
    const l = new Lesson(score, "learn", "both", 60, host);
    l.start();
    for (const m of [60, 64, 62, 60]) l.input(m);
    vi.runAllTimers();
    expect(finished).toHaveLength(1);
    expect(finished[0].score).toBe(1);
  });

  it("Tocar: la nota ligada cuenta como una sola nota acertada", () => {
    const { host, clock } = fakeHost();
    const score = tied();
    const l = new Lesson(score, "play", "both", 60, host);
    l.start();
    for (const n of score.notes) {
      clock.t = (COUNT_IN + n.s) * 1000;
      l.input(n.m);
    }
    expect(l.result().score).toBe(1);
    l.stop();
  });

  it("un bucle que empieza donde continúa una ligada no la exige", () => {
    const { host, finished } = fakeHost();
    const score = tied();
    const l = new Lesson(score, "learn", "both", 60, host, { loop: { from: 1, to: 1 } });
    l.start();
    // el fragmento empieza en Re (pulso 5): la continuación de Mi no se pide
    expect(lastCall(host.guide)[0].map((n: { m: number }) => n.m)).toEqual([62]);
    l.stop();
    expect(finished).toHaveLength(0);
  });

  it("una ligada que sale del fragmento suena solo hasta su final", () => {
    const { host, tick } = tempoHost();
    const score = tied();
    const l = new Lesson(score, "listen", "both", 60, host, { loop: { from: 0, to: 0 } });
    l.start();
    tick(400);
    tick(2000);
    const tone = (host.tone as Mock).mock.calls.find((c) => c[0] === 64);
    // Mi dura 3 pulsos, pero el fragmento acaba en el pulso 4: suena 2 s (≈ 0,95 · 2)
    expect(tone?.[1]).toBeCloseTo(2 * 0.95);
    l.stop();
  });
});

describe("6/8 y ritmos rápidos (007, historia 6)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const sixEight = () =>
    buildScore({ id: "68", title: "68", level: "", tempo: 60, time: "6/8", n: [[60, 1.5], [62, 1.5], [64, 0.5], [65, 0.5], [67, 0.5], [69, 1.5]] });

  it("6/8: el tempo va en negras con puntillo (60 → 2/3 s por negra)", () => {
    const { host } = fakeHost();
    expect(new Lesson(sixEight(), "play", "both", 60, host).spb).toBeCloseTo(2 / 3);
  });

  it("6/8: dos clics por compás, fuerte en el primero; la cuenta atrás son 4 pulsos", () => {
    const { host, tick } = tempoHost();
    const score = sixEight();
    const l = new Lesson(score, "play", "both", 60, host); // 1 pulso (♩.) = 1000 ms
    l.start();
    runTo(host, tick, 8000);
    const clicks = (host.click as Mock).mock.calls.map((c) => c[0]);
    // 4 de cuenta atrás + 4 de la pieza (2 compases)
    expect(clicks).toEqual([true, false, true, false, true, false, true, false]);
    l.stop();
  });

  it("en 4/4 el metrónomo sigue marcando cada negra", () => {
    const { host, tick } = tempoHost();
    const l = new Lesson(song("cinco"), "play", "both", 60, host);
    l.start();
    runTo(host, tick, 6000);
    // 4 de cuenta atrás y los pulsos 0, 1 y 2 de la pieza (el 2 cae justo en 6000 ms)
    expect((host.click as Mock).mock.calls.map((c) => c[0])).toEqual([true, false, false, false, true, false, false]);
    l.stop();
  });

  it("un tresillo se espera a un tercio de pulso del anterior", () => {
    const { host, clock } = fakeHost();
    const score = buildScore({ id: "t", title: "t", level: "", tempo: 60, n: [[60, 1 / 3], [62, 1 / 3], [64, 1 / 3], [65, 3]] });
    const l = new Lesson(score, "play", "both", 60, host);
    l.start();
    for (const [m, beat] of [[60, 0], [62, 1 / 3], [64, 2 / 3], [65, 1]] as const) {
      clock.t = (COUNT_IN + beat) * 1000;
      l.input(m);
    }
    expect(l.result().score).toBe(1);
    l.stop();
  });

  it("corchea con puntillo y semicorchea: a 0,75 y 0,25, con el margen recortado", () => {
    const { host, clock } = fakeHost();
    const score = buildScore({ id: "t", title: "t", level: "", tempo: 60, n: [[60, 0.75], [62, 0.25], [64, 3]] });
    const l = new Lesson(score, "play", "both", 60, host);
    l.start();
    // la semicorchea tocada 0,2 pulsos tarde ya no vale (margen 0,125)
    clock.t = COUNT_IN * 1000;
    l.input(60);
    clock.t = (COUNT_IN + 0.95) * 1000;
    l.input(62);
    clock.t = (COUNT_IN + 1) * 1000;
    l.input(64);
    expect(l.result().score).toBeCloseTo((1 + 0 + 1 - 0.25) / 3);
    l.stop();
  });
});

describe("Greensleeves (SC-007)", () => {
  it("tocada a tempo con las dos manos da 3 estrellas", () => {
    const { host, clock } = fakeHost();
    const score = song("greensleeves");
    const l = new Lesson(score, "play", "both", score.song.tempo, host);
    l.start();
    const presses = [...score.notes].sort((a, b) => a.s - b.s);
    for (const n of presses) {
      clock.t = (COUNT_IN * score.pulse + n.s) * l.spb * 1000;
      l.input(n.m);
    }
    expect(l.result().stars).toBe(3);
    expect(l.result().score).toBe(1);
    l.stop();
  });
});

describe("pedal (009)", () => {
  const base: SongDef = { id: "p", title: "p", level: "Nivel 3 · Pedal", tempo: 60, n: [[60, 1], [62, 1], [64, 1], [65, 1], [67, 4]] };
  const withPedal: SongDef = { ...base, pedal: [[0, 4], [4, 8]] };

  /** Toca en «Tocar» una secuencia fija: notas a destiempo, una omitida y una de más. */
  function playFixed(def: SongDef) {
    const score = buildScore(def);
    const { host, clock } = fakeHost();
    const l = new Lesson(score, "play", "both", 60, host);
    l.start();
    const presses: [number, number][] = [[60, 4000], [62, 5250], [61, 5600], [65, 7100], [67, 8000]];
    for (const [m, t] of presses) {
      clock.t = t;
      l.input(m);
    }
    clock.t = 20000;
    const r = l.result();
    l.stop();
    return r;
  }

  it("el resultado de Tocar es idéntico con y sin pedal (FR-007)", () => {
    expect(buildScore(withPedal).pedals.length).toBe(2);
    expect(playFixed(withPedal)).toEqual(playFixed(base));
  });

  it("el resultado de Aprender es idéntico con y sin pedal (FR-007)", () => {
    vi.useFakeTimers();
    const learn = (def: SongDef) => {
      const { host, finished } = fakeHost();
      const l = new Lesson(buildScore(def), "learn", "both", 60, host);
      l.start();
      l.input(61);
      for (const [m] of def.n!) l.input(m as number);
      vi.runAllTimers();
      return finished[0];
    };
    expect(learn(withPedal)).toEqual(learn(base));
    vi.useRealTimers();
  });

  describe("sonido", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    /** Duración pedida para cada altura en Escuchar (primera vez que suena). */
    function listen(def: SongDef, loop?: { from: number; to: number }, ms = 9000) {
      const { host, tick } = tempoHost();
      const release = vi.fn();
      host.release = release;
      const l = new Lesson(buildScore(def), "listen", "both", 60, host, loop ? { loop } : {});
      l.start();
      for (let t = 0; t < ms; t += 100) tick(100);
      const tone = host.tone as ReturnType<typeof vi.fn>;
      const first = new Map<number, number>();
      for (const [m, s] of tone.mock.calls as [number, number][]) if (!first.has(m)) first.set(m, s);
      return { l, first, release };
    }

    it("en Escuchar, la nota se sostiene hasta que se levanta o cambia el pedal (FR-008)", () => {
      const { first } = listen(withPedal);
      expect(first.get(60)).toBeCloseTo(4 * 0.95);
      expect(first.get(64)).toBeCloseTo(2 * 0.95);
      expect(first.get(65)).toBeCloseTo(1 * 0.95);
      expect(first.get(67)).toBeCloseTo(4 * 0.95);
    });

    it("sin pedal (o en nivel 2), la duración escrita", () => {
      expect(listen(base).first.get(60)).toBeCloseTo(0.95);
      expect(listen({ ...withPedal, level: "Nivel 2" }).first.get(60)).toBeCloseTo(0.95);
    });

    it("con bucle, nada suena más allá del fragmento", () => {
      const { first } = listen({ ...base, pedal: [[0, 8]] }, { from: 0, to: 0 }, 3000);
      expect(first.get(60)).toBeCloseTo(4 * 0.95);
      expect(first.get(62)).toBeCloseTo(3 * 0.95);
    });

    it("stop() y cada repetición del bucle liberan el sonido (FR-010)", () => {
      const { l, release } = listen(withPedal, { from: 0, to: 0 }, 9000);
      const reps = release.mock.calls.length;
      expect(reps).toBeGreaterThanOrEqual(2);
      l.stop();
      expect(release.mock.calls.length).toBe(reps + 1);
    });

    it("un host sin release sigue funcionando", () => {
      const { host, tick } = tempoHost();
      const l = new Lesson(buildScore(withPedal), "listen", "both", 60, host);
      l.start();
      tick(1000);
      expect(() => l.stop()).not.toThrow();
    });
  });
});

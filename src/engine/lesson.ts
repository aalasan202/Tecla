import type { Hand, Score, ScoreNote } from "../music/types";
import { noteName } from "../music/theory";
import { STAFF_LEFT } from "../music/score";

export type Mode = "listen" | "learn" | "play";
export type HandChoice = "both" | Hand;
export type NoteMark = "now" | "hit" | "miss" | null;
export type KeyFlash = "down" | "ok" | "wrong";

export interface LessonResult {
  mode: Mode;
  /** 0–1; null en Escuchar. */
  score: number | null;
  stars: number;
  message: string;
}

/** Lo que el motor necesita del mundo exterior (interfaz, audio, reloj). */
export interface LessonHost {
  mark(id: number, mark: NoteMark): void;
  guide(notes: ScoreNote[]): void;
  status(text: string, next: string): void;
  playhead(x: number | null): void;
  scrollTo(x: number, smooth: boolean): void;
  flash(m: number, kind: KeyFlash, ms?: number): void;
  tone(m: number, seconds: number, volume?: number): void;
  click(strong: boolean): void;
  finish(result: LessonResult): void;
  now(): number;
  frame(cb: () => void): number;
  cancelFrame(id: number): void;
  /** Nombre de una nota en la notación elegida (Do o C). */
  name?(m: number): string;
}

/** Pulsos de cuenta atrás antes de Tocar. */
export const COUNT_IN = 4;
/** Ventana (en pulsos) para aceptar una nota en Tocar, y para considerarla "perfecta". */
export const HIT_WINDOW = 0.45;
export const PERFECT_WINDOW = 0.18;

interface Runtime {
  auto: boolean;
  played: boolean;
  done: boolean;
  judged: "perfect" | "good" | "miss" | null;
}

/**
 * Motor de una lección: Escuchar (la pieza suena sola), Aprender (espera cada nota)
 * y Tocar (a tempo, con puntuación). No toca el DOM: todo pasa por LessonHost.
 */
export class Lesson {
  running = false;
  private rt: Runtime[] = [];
  private groups: ScoreNote[][] = [];
  private gi = 0;
  private mistakes = 0;
  private extra = 0;
  private lastTick = -99;
  private lastBeat = 0;
  private t0 = 0;
  private raf = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    readonly score: Score,
    readonly mode: Mode,
    readonly hands: HandChoice,
    public tempo: number,
    private host: LessonHost,
  ) {
    this.reset();
  }

  /** Segundos por pulso. */
  get spb(): number {
    return 60 / this.tempo;
  }

  isAuto(n: ScoreNote): boolean {
    return this.score.twoHands && this.hands !== "both" && n.h !== this.hands;
  }

  private active(): ScoreNote[] {
    return this.score.notes.filter((n) => !this.rt[n.id].auto);
  }

  reset(): void {
    this.rt = this.score.notes.map((n) => ({ auto: this.isAuto(n), played: false, done: false, judged: null }));
    this.score.notes.forEach((n) => this.host.mark(n.id, null));
    this.host.guide([]);
    this.host.playhead(null);
  }

  start(): void {
    this.stop();
    this.reset();
    this.running = true;
    this.gi = 0;
    this.mistakes = 0;
    this.extra = 0;
    this.lastTick = -99;
    this.lastBeat = 0;
    if (this.mode === "learn") {
      this.groups = groupByTime(this.active());
      if (!this.groups.length) return this.complete();
      const first = this.groups[0][0].s;
      const accompanimentFirst = first > 0 && this.score.notes.some((n) => this.rt[n.id].auto && n.s < first);
      if (accompanimentFirst) {
        this.playAutos(0, first);
        this.host.status("Escucha la otra mano…", "");
        this.later(() => this.showGroup(), first * this.spb * 1000);
      } else this.showGroup();
      return;
    }
    this.t0 = this.host.now() + (this.mode === "listen" ? 300 : 0);
    this.loop();
  }

  stop(): void {
    this.running = false;
    this.host.cancelFrame(this.raf);
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.host.guide([]);
  }

  /** Una tecla pulsada (pantalla, teclado del ordenador o MIDI). */
  input(m: number): void {
    if (this.running && this.mode === "learn") return this.inputLearn(m);
    if (this.running && this.mode === "play") return this.inputPlay(m);
    this.host.tone(m, 0.5);
    this.host.flash(m, "down", 180);
  }

  private inputLearn(m: number): void {
    const group = this.groups[this.gi];
    if (!group) return;
    const hit = group.find((n) => n.m === m && !this.rt[n.id].done);
    if (hit) {
      this.host.tone(m, hit.d * 0.5);
      this.rt[hit.id].done = true;
      this.host.flash(m, "ok");
      this.host.mark(hit.id, "hit");
      if (group.every((n) => this.rt[n.id].done)) {
        const from = group[0].s;
        this.gi++;
        const to = this.gi < this.groups.length ? this.groups[this.gi][0].s : this.score.total;
        this.playAutos(from, to);
        if (this.gi >= this.groups.length) {
          this.later(() => this.complete(), Math.max(300, (to - from) * this.spb * 1000));
          return;
        }
        this.showGroup();
      } else this.host.guide(group.filter((n) => !this.rt[n.id].done));
    } else if (!group.some((n) => n.m === m)) {
      this.host.tone(m, 0.3, 0.22);
      this.mistakes++;
      this.host.flash(m, "wrong", 350);
      this.learnStatus();
    } else this.host.tone(m, 0.3);
  }

  private inputPlay(m: number): void {
    this.host.tone(m, 0.4);
    const beat = this.beat();
    let best: ScoreNote | null = null;
    let bestDist = Infinity;
    for (const n of this.active()) {
      if (this.rt[n.id].judged || n.m !== m) continue;
      const d = Math.abs(n.s - beat);
      if (d <= HIT_WINDOW && d < bestDist) {
        bestDist = d;
        best = n;
      }
    }
    if (best) {
      this.rt[best.id].judged = bestDist <= PERFECT_WINDOW ? "perfect" : "good";
      this.host.mark(best.id, "hit");
      this.host.flash(m, "ok");
    } else {
      this.extra++;
      this.host.flash(m, "wrong", 300);
    }
  }

  private beat(): number {
    return (this.host.now() - this.t0) / 1000 / this.spb - (this.mode === "play" ? COUNT_IN : 0);
  }

  private later(fn: () => void, ms: number): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private sound(n: ScoreNote): void {
    this.host.tone(n.m, n.d * this.spb * 0.95, n.h === "L" ? 0.26 : 0.32);
    this.host.flash(n.m, "down", Math.min(n.d * this.spb * 900, 700));
  }

  private playAutos(from: number, to: number): void {
    for (const n of this.score.notes) {
      if (!this.rt[n.id].auto || n.s < from || n.s >= to) continue;
      this.later(() => {
        this.sound(n);
        this.host.mark(n.id, "now");
        this.later(() => this.host.mark(n.id, null), n.d * this.spb * 900);
      }, (n.s - from) * this.spb * 1000);
    }
  }

  private showGroup(): void {
    const g = this.groups[this.gi];
    g.forEach((n) => this.host.mark(n.id, "now"));
    this.host.guide(g);
    this.host.scrollTo(g[0].x, true);
    this.learnStatus();
  }

  private learnStatus(): void {
    const total = this.groups.length;
    const step = Math.min(this.gi + 1, total);
    const next = this.gi < total ? `Toca: ${this.label(this.groups[this.gi])}` : "";
    this.host.status(`Paso ${step} de ${total} · ${this.mistakes} ${this.mistakes === 1 ? "fallo" : "fallos"}`, next);
  }

  label(group: ScoreNote[]): string {
    const name = (m: number) => this.host.name?.(m) ?? noteName(m);
    return group.map((n) => name(n.m) + (this.score.twoHands ? (n.h === "L" ? " (MI)" : " (MD)") : "")).join(" + ");
  }

  private loop = (): void => {
    const { score, mode } = this;
    const beat = this.beat();
    this.lastBeat = Math.max(this.lastBeat, beat);
    const x = STAFF_LEFT + beat * score.px + 16;
    this.host.playhead(x);
    this.host.scrollTo(x, false);

    for (const n of score.notes) {
      const r = this.rt[n.id];
      if ((mode === "listen" || r.auto) && !r.played && beat >= n.s) {
        r.played = true;
        this.sound(n);
        this.host.mark(n.id, "now");
        this.later(() => {
          if (!r.judged) this.host.mark(n.id, null);
        }, n.d * this.spb * 900);
      }
    }

    if (mode === "play") {
      const bi = Math.floor(beat);
      if (bi > this.lastTick && bi < score.total) {
        this.lastTick = bi;
        this.host.click(((bi % score.bar) + score.bar) % score.bar === 0);
      }
      const act = this.active();
      for (const n of act) {
        const r = this.rt[n.id];
        if (!r.judged && beat > n.s + HIT_WINDOW) {
          r.judged = "miss";
          this.host.mark(n.id, "miss");
        }
      }
      const pending = act.filter((n) => !this.rt[n.id].judged && n.s - beat < 1.2);
      const first = pending.length ? Math.min(...pending.map((n) => n.s)) : null;
      const upcoming = pending.filter((n) => n.s === first);
      this.host.guide(upcoming);
      const text =
        beat < 0
          ? `Preparados… ${-Math.floor(beat)}`
          : `Aciertos ${act.filter((n) => this.rt[n.id].judged && this.rt[n.id].judged !== "miss").length} de ${act.length}`;
      this.host.status(text, upcoming.length ? `Siguiente: ${this.label(upcoming)}` : "");
    } else {
      const measures = score.total / score.bar;
      this.host.status(`Compás ${Math.min(Math.floor(Math.max(beat, 0) / score.bar) + 1, measures)} de ${measures}`, "");
    }

    if (beat > score.total + 0.6) return this.complete();
    this.raf = this.host.frame(this.loop);
  };

  private complete(): void {
    this.stop();
    this.host.playhead(null);
    this.host.finish(this.result());
  }

  /** Fracción (0–1) de la pieza recorrida en el último intento. */
  progress(): number {
    if (this.mode === "learn") return this.groups.length ? Math.min(1, this.gi / this.groups.length) : 0;
    return Math.min(1, Math.max(0, this.lastBeat / this.score.total));
  }

  result(): LessonResult {
    if (this.mode === "listen") {
      return { mode: "listen", score: null, stars: 0, message: "Ya conoces cómo suena. Ahora apréndela nota a nota." };
    }
    const act = this.active();
    const n = act.length || 1;
    let pct: number;
    if (this.mode === "learn") pct = n / (n + this.mistakes);
    else {
      const points = act.reduce((a, x) => a + (this.rt[x.id].judged === "perfect" ? 1 : this.rt[x.id].judged === "good" ? 0.7 : 0), 0);
      pct = Math.max(0, (points - this.extra * 0.25) / n);
    }
    const stars = starsFor(pct);
    let message = [
      "Repite el paso de Aprender antes de tocar a tempo.",
      "Vas por buen camino. Prueba a bajar el tempo.",
      "Muy bien. Un par de repasos más y será perfecta.",
      "¡Excelente! La tienes dominada.",
    ][stars];
    if (this.score.twoHands && this.hands !== "both" && stars >= 2) message += " Prueba ahora con la otra mano o con las dos.";
    else if (this.mode === "learn" && stars >= 2) message += " Ya puedes pasar a Tocar.";
    return { mode: this.mode, score: pct, stars, message };
  }
}

export const starsFor = (pct: number): number => (pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0);

/** Agrupa las notas que empiezan a la vez (acordes o las dos manos). */
export function groupByTime(notes: ScoreNote[]): ScoreNote[][] {
  const map = new Map<number, ScoreNote[]>();
  for (const n of notes) {
    const list = map.get(n.s) ?? [];
    list.push(n);
    map.set(n.s, list);
  }
  return [...map.keys()].sort((a, b) => a - b).map((k) => map.get(k)!);
}

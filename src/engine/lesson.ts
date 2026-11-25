import type { Hand, Score, ScoreNote, Spelled } from "../music/types";
import { noteLabel } from "../music/spelling";
import { HIT_WINDOW, PERFECT_WINDOW } from "../music/score";
import { sustainedEnd } from "../music/pedal";

export { HIT_WINDOW, PERFECT_WINDOW };

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
  /** Apaga todo lo que suena (al parar y al empezar cada repetición del bucle). */
  release?(): void;
  click(strong: boolean): void;
  finish(result: LessonResult): void;
  now(): number;
  frame(cb: () => void): number;
  cancelFrame(id: number): void;
  /** Nombre de una nota en la notación elegida (Do o C), con su ortografía si se conoce. */
  name?(m: number, spell?: Spelled): string;
}

/** Fragmento que se repite en bucle: compases de inicio y fin, base 0, inclusivos. */
export interface LoopRange {
  from: number;
  to: number;
}

/** Resumen de una práctica en bucle, al pararla. */
export interface LoopSummary {
  /** Repeticiones completas. */
  reps: number;
  best: LessonResult;
  last: LessonResult;
}

export interface LessonOptions {
  /** Solo en Aprender: la partitura avanza a tempo y espera las notas pendientes. */
  atTempo?: boolean;
  /** Repite solo estos compases, indefinidamente, en cualquier paso. */
  loop?: LoopRange;
  /** Tocar (010): cualquier tecla vale; solo se evalúa el momento de cada golpe. */
  rhythm?: boolean;
  /**
   * Tocar (010): segundos para completar un acorde ya empezado, según de dónde venga la
   * pulsación. Sin él, cada nota del acorde se juzga por separado como siempre.
   */
  chordSpread?: number | ((via: InputVia) => number);
}

/** De dónde viene una pulsación: pantalla táctil, ratón, teclado MIDI o letras del ordenador. */
export type InputVia = "screen-touch" | "screen-mouse" | "midi" | "computer-keys";

/** Pulsos de metrónomo de cuenta atrás antes de Tocar. */
export const COUNT_IN = 4;
/** Ritmo (010): pulsaciones más juntas que esto (s) cuentan como un solo golpe. */
export const RHYTHM_MERGE = 0.08;
/** Con bucle en Tocar, la repetición se cierra este margen (en pulsos) tras el final del fragmento. */
const LOOP_CLOSE = HIT_WINDOW + 0.15;

const EMPTY_FRAGMENT: [string, string] = ["No hay notas de esta mano en el fragmento", "Elige otros compases u otra mano"];

interface Runtime {
  auto: boolean;
  played: boolean;
  done: boolean;
  judged: "perfect" | "good" | "miss" | null;
}

/**
 * Motor de una lección: Escuchar (la pieza suena sola), Aprender (espera cada nota)
 * y Tocar (a tempo, con puntuación). No toca el DOM: todo pasa por LessonHost.
 * Con `options.loop`, cualquiera de los tres pasos repite solo ese fragmento hasta `stop()`.
 */
export class Lesson {
  running = false;
  /** Aprender a tempo (ver LessonOptions). */
  readonly atTempo: boolean;
  /** Fragmento en bucle, ya ordenado y recortado a la pieza; null sin bucle. */
  readonly loop: LoopRange | null;
  /** Pulsos donde empieza y acaba lo que se practica (la pieza entera sin bucle). */
  private readonly start0: number;
  private readonly end: number;
  private rt: Runtime[] = [];
  private groups: ScoreNote[][] = [];
  private gi = 0;
  private mistakes = 0;
  private extra = 0;
  private lastTick = -99;
  private lastBeat = 0;
  private t0 = 0;
  /** Aprender a tempo: posición del cursor en pulsos y hora del último fotograma. */
  private pos = 0;
  private lastFrame = 0;
  /** Bucle: repetición en curso (desde 1), repeticiones cerradas y sus resultados. */
  private rep = 1;
  private closed = 0;
  private reps: LessonResult[] = [];
  private raf = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  /** Ritmo (010): cualquier tecla vale. */
  private readonly rhythm: boolean;
  /** Ritmo: hora (ms) del último golpe contado, para fundir pulsaciones simultáneas. */
  private lastPress = -Infinity;
  /** Acordes (010): ventana para completar un acorde según el origen de la pulsación. */
  private readonly chordSpread: ((via: InputVia) => number) | null;
  /** Acorde empezado: su `unit`, hasta cuándo (ms) se aceptan sus notas y el juicio de la primera. */
  private openChord: { unit: number; until: number; judged: "perfect" | "good" } | null = null;
  /** Acordes estropeados por una nota ajena: no puntúan. */
  private spoiled = new Set<number>();

  constructor(
    readonly score: Score,
    readonly mode: Mode,
    readonly hands: HandChoice,
    public tempo: number,
    private host: LessonHost,
    options: LessonOptions = {},
  ) {
    this.atTempo = mode === "learn" && options.atTempo === true;
    this.loop = options.loop ? normalizeLoop(options.loop, score.total / score.bar) : null;
    this.start0 = this.loop ? this.loop.from * score.bar : 0;
    this.end = this.loop ? (this.loop.to + 1) * score.bar : score.total;
    this.rhythm = options.rhythm === true;
    const spread = options.chordSpread;
    this.chordSpread = spread === undefined ? null : typeof spread === "number" ? () => spread : spread;
    this.reset();
  }

  /** Segundos por negra: el tempo va en pulsos por minuto (negras con puntillo en 6/8). */
  get spb(): number {
    return 60 / (this.tempo * this.score.pulse);
  }

  isAuto(n: ScoreNote): boolean {
    return this.score.twoHands && this.hands !== "both" && n.h !== this.hands;
  }

  /** La nota empieza dentro de lo que se practica (siempre cierto sin bucle). */
  private inRange(n: ScoreNote): boolean {
    return n.s >= this.start0 && n.s < this.end;
  }

  private active(): ScoreNote[] {
    return this.score.notes.filter((n) => !this.rt[n.id].auto && this.inRange(n));
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
    this.gi = 0;
    this.mistakes = 0;
    this.extra = 0;
    this.lastTick = -99;
    this.lastBeat = 0;
    this.rep = 1;
    this.closed = 0;
    this.reps = [];
    this.resetJudging();
    if (this.loop && this.mode !== "listen" && !this.active().length) {
      this.host.status(...EMPTY_FRAGMENT);
      return;
    }
    this.running = true;
    if (this.mode === "learn") {
      this.groups = groupByTime(this.active());
      if (!this.groups.length) return this.complete();
      if (this.atTempo) {
        this.pos = this.start0;
        this.lastFrame = this.host.now();
        this.markPending();
        this.loopLearnTempo();
        return;
      }
      this.learnFrom();
      return;
    }
    this.t0 = this.host.now() + (this.mode === "listen" ? 300 : 0);
    this.loop_();
  }

  stop(): void {
    this.running = false;
    this.host.cancelFrame(this.raf);
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.host.guide([]);
    this.host.release?.();
  }

  /** Una tecla pulsada (pantalla, teclado del ordenador o MIDI) y, si se sabe, de dónde viene. */
  input(m: number, via?: InputVia): void {
    if (this.running && this.mode === "learn") return this.inputLearn(m);
    if (this.running && this.mode === "play") return this.inputPlay(m, via);
    this.host.tone(m, 0.5);
    this.host.flash(m, "down", 180);
  }

  private resetJudging(): void {
    this.lastPress = -Infinity;
    this.openChord = null;
    this.spoiled = new Set();
  }

  /** Notas de un acorde (mismo `unit`) dentro de lo que se practica. */
  private chordNotes(unit: number): ScoreNote[] {
    return this.active().filter((n) => n.unit === unit);
  }

  /** Acordes (010): el acorde abierto sigue aceptando notas. */
  private chordOpen(unit: number): boolean {
    return this.openChord !== null && this.openChord.unit === unit && this.host.now() <= this.openChord.until;
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
        if (this.atTempo) {
          // el bucle mueve el cursor, hace sonar el acompañamiento y termina la pieza
          this.gi++;
          this.markPending();
          return;
        }
        const from = group[0].s;
        this.gi++;
        const to = this.gi < this.groups.length ? this.groups[this.gi][0].s : this.end;
        this.playAutos(from, to);
        if (this.gi >= this.groups.length) {
          const wait = Math.max(300, (to - from) * this.spb * 1000);
          this.later(() => (this.loop ? this.nextRepetition() : this.complete()), wait);
          return;
        }
        this.showGroup();
      } else this.host.guide(group.filter((n) => !this.rt[n.id].done));
    } else if (!group.some((n) => n.m === m)) {
      this.host.tone(m, 0.3, 0.22);
      this.mistakes++;
      this.host.flash(m, "wrong", 350);
      if (!this.atTempo) this.learnStatus();
    } else this.host.tone(m, 0.3);
  }

  private inputPlay(m: number, via: InputVia = "screen-mouse"): void {
    const now = this.host.now();
    // ritmo: varias teclas a la vez son un solo golpe (ni acierto ni sobrante de más)
    if (this.rhythm && (now - this.lastPress) / 1000 < RHYTHM_MERGE) {
      this.host.tone(m, 0.4);
      this.host.flash(m, "ok");
      return;
    }
    // acordes: un acorde empezado acepta sus notas que faltan durante la ventana
    const open = this.openChord;
    if (open && now <= open.until) {
      const n = this.chordNotes(open.unit).find((x) => x.m === m && !this.rt[x.id].judged);
      if (n) {
        this.rt[n.id].judged = open.judged;
        this.host.tone(m, n.d * this.spb * 0.95);
        this.host.mark(n.id, "hit");
        this.host.flash(m, "ok");
        if (this.chordNotes(open.unit).every((x) => this.rt[x.id].judged)) this.openChord = null;
        return;
      }
    }

    const beat = this.loop ? this.where().b : this.beat();
    let best: ScoreNote | null = null;
    let bestDist = Infinity;
    for (const n of this.active()) {
      if (this.rt[n.id].judged || (!this.rhythm && n.m !== m)) continue;
      const d = Math.abs(n.s - beat);
      if (d <= n.win.hit && d < bestDist) {
        bestDist = d;
        best = n;
      }
    }
    if (best) {
      const judged = bestDist <= best.win.perfect ? "perfect" : "good";
      this.rt[best.id].judged = judged;
      this.lastPress = now;
      this.host.mark(best.id, "hit");
      this.host.flash(m, "ok");
      const chord = this.chordSpread ? this.chordNotes(best.unit) : [];
      if (chord.length > 1) {
        // las notas del acorde siguen sonando mientras se completa
        this.host.tone(m, best.d * this.spb * 0.95);
        if (!this.openChord || this.openChord.unit !== best.unit)
          this.openChord = { unit: best.unit, until: now + this.chordSpread!(via) * 1000, judged };
      } else this.host.tone(m, 0.4);
      return;
    }
    this.host.tone(m, 0.4);
    this.extra++;
    this.lastPress = now;
    this.host.flash(m, "wrong", 300);
    // una nota ajena con un acorde abierto lo estropea; el acorde sigue abierto para que sus
    // notas restantes no cuenten además como sobrantes
    if (open && now <= open.until) this.spoiled.add(open.unit);
  }

  private beat(): number {
    return (this.host.now() - this.t0) / 1000 / this.spb - (this.mode === "play" ? COUNT_IN * this.score.pulse : 0);
  }

  /** Bucle en Escuchar/Tocar: período en pulsos (en Tocar, con un compás de descanso). */
  private get period(): number {
    const len = this.end - this.start0;
    return this.mode === "play" ? len + this.score.bar : len;
  }

  /**
   * Bucle en Escuchar/Tocar: `g` pulsos desde el comienzo, vuelta `k`, posición `local` dentro
   * de la vuelta y pulso `b` de la partitura con el que se comparan las notas. Cerrada la
   * repetición `k` (ya en el descanso), `b` mira a la siguiente: queda antes de `start`.
   */
  private where(): { g: number; k: number; local: number; b: number } {
    const g = this.beat();
    if (g < 0) return { g, k: -1, local: g, b: this.start0 + g };
    const k = Math.floor(g / this.period);
    const local = g - k * this.period;
    return { g, k, local, b: this.start0 + (this.closed > k ? local - this.period : local) };
  }

  private later(fn: () => void, ms: number): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private sound(n: ScoreNote): void {
    // con bucle, nada suena más allá del final del fragmento
    const d = Math.min(n.d, this.end - n.s) * this.spb;
    // el pedal (009) solo alarga el sonido; la tecla se ilumina lo que dura la figura
    const held = (Math.min(sustainedEnd(n.s, n.d, this.score.pedals), this.end) - n.s) * this.spb;
    this.host.tone(n.m, held * 0.95, n.h === "L" ? 0.26 : 0.32);
    this.host.flash(n.m, "down", Math.min(d * 900, 700));
  }

  private playAutos(from: number, to: number): void {
    for (const n of this.score.notes) {
      if (!this.rt[n.id].auto || !this.inRange(n) || n.s < from || n.s >= to) continue;
      this.later(() => {
        this.sound(n);
        this.host.mark(n.id, "now");
        this.later(() => this.host.mark(n.id, null), n.d * this.spb * 900);
      }, (n.s - from) * this.spb * 1000);
    }
  }

  /** Aprender (espera libre): empieza por el primer grupo, o deja sonar antes la otra mano. */
  private learnFrom(): void {
    const first = this.groups[0][0].s;
    const accompanimentFirst =
      first > this.start0 && this.score.notes.some((n) => this.rt[n.id].auto && this.inRange(n) && n.s < first);
    if (accompanimentFirst) {
      this.playAutos(this.start0, first);
      this.host.status("Escucha la otra mano…", "");
      this.later(() => this.showGroup(), (first - this.start0) * this.spb * 1000);
    } else this.showGroup();
  }

  /** Bucle: cierra la repetición en curso y deja el fragmento listo para la siguiente. */
  private nextRepetition(): void {
    if (this.mode !== "listen") this.reps.push(this.result());
    // no se arrastra la resonancia del final del fragmento al principio
    this.host.release?.();
    this.rep++;
    for (const n of this.score.notes) {
      if (!this.inRange(n)) continue;
      const r = this.rt[n.id];
      r.played = false;
      r.done = false;
      r.judged = null;
      this.host.mark(n.id, null);
    }
    this.mistakes = 0;
    this.extra = 0;
    this.gi = 0;
    this.resetJudging();
    if (this.mode === "learn") {
      if (this.atTempo) {
        this.pos = this.start0;
        this.markPending();
      } else this.learnFrom();
    }
  }

  /** Bucle: «Repetición k · » y, desde la 2.ª, el resultado de la anterior (no en Escuchar). */
  private repPrefix(): string {
    if (!this.loop) return "";
    const last = this.reps[this.reps.length - 1];
    const prev = last && last.score !== null ? ` · anterior ${Math.round(last.score * 100)} %` : "";
    return `Repetición ${this.rep}${prev} · `;
  }

  private measureLabel(beat: number): string {
    const measures = this.score.total / this.score.bar;
    return `Compás ${Math.min(Math.floor(Math.max(beat, 0) / this.score.bar) + 1, measures)} de ${measures}`;
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
    const fails = `${this.mistakes} ${this.mistakes === 1 ? "fallo" : "fallos"}`;
    this.host.status(`${this.repPrefix()}Paso ${step} de ${total} · ${fails}`, next);
  }

  /** Aprender a tempo: resalta y guía el grupo pendiente (o limpia la guía si no queda). */
  private markPending(): void {
    const g = this.groups[this.gi];
    if (!g) return this.host.guide([]);
    g.forEach((n) => this.host.mark(n.id, "now"));
    this.host.guide(g.filter((n) => !this.rt[n.id].done));
  }

  /**
   * Aprender a tempo: el cursor avanza al tempo vigente y se detiene en el pulso de la primera
   * nota pendiente. El acompañamiento solo suena por detrás de esa nota.
   */
  private loopLearnTempo = (): void => {
    const { score } = this;
    const now = this.host.now();
    const pending = this.gi < this.groups.length ? this.groups[this.gi][0].s : Infinity;
    this.pos = Math.min(this.pos + Math.max(0, now - this.lastFrame) / 1000 / this.spb, pending);
    this.lastFrame = now;
    if (this.loop && this.gi >= this.groups.length && this.pos >= this.end) this.nextRepetition();
    const x = score.layout.xAt(this.pos);
    this.host.playhead(x);
    this.host.scrollTo(x, false);

    const limit = this.gi < this.groups.length ? this.groups[this.gi][0].s : Infinity;
    for (const n of score.notes) {
      const r = this.rt[n.id];
      if (r.auto && !r.played && this.inRange(n) && n.s <= this.pos && n.s < limit) {
        r.played = true;
        this.sound(n);
        this.host.mark(n.id, "now");
        this.later(() => this.host.mark(n.id, null), n.d * this.spb * 900);
      }
    }

    const fails = `${this.mistakes} ${this.mistakes === 1 ? "fallo" : "fallos"}`;
    const next = this.gi < this.groups.length ? `Toca: ${this.label(this.groups[this.gi])}` : "";
    this.host.status(`${this.repPrefix()}${this.measureLabel(this.pos)} · ${fails}`, next);

    if (!this.loop && this.gi >= this.groups.length && this.pos > score.total + 0.6) return this.complete();
    this.raf = this.host.frame(this.loopLearnTempo);
  };

  label(group: ScoreNote[]): string {
    const name = (n: ScoreNote) => this.host.name?.(n.m, n.spell) ?? noteLabel(n.spell);
    return group.map((n) => name(n) + (this.score.twoHands ? (n.h === "L" ? " (MI)" : " (MD)") : "")).join(" + ");
  }

  /** Bucle de fotogramas de Escuchar y Tocar. */
  private loop_ = (): void => {
    const { score, mode } = this;
    let beat: number;
    let cursor: number;
    let resting = false;
    let restLeft = 0;
    let strong: boolean;
    let g: number;
    if (this.loop) {
      let w = this.where();
      if (w.k >= 0) {
        // Escuchar cierra al empezar cada vuelta; Tocar, ya dentro del compás de descanso
        const len = this.end - this.start0;
        if (w.k > this.closed || (mode === "play" && w.k === this.closed && w.local >= len + LOOP_CLOSE)) {
          this.nextRepetition();
          this.closed = mode === "play" && w.local >= len + LOOP_CLOSE ? w.k + 1 : w.k;
          w = this.where();
        }
        resting = mode === "play" && w.local >= len;
        restLeft = Math.ceil((this.period - w.local) / score.pulse);
      }
      g = w.g;
      beat = w.b;
      cursor = w.g < 0 || resting ? this.start0 : w.b;
      strong = w.k < 0 ? isStrong(Math.floor(g / score.pulse), score) : isStrong(Math.floor(w.local / score.pulse + 1e-9), score);
    } else {
      g = beat = cursor = this.beat();
      strong = isStrong(Math.floor(beat / score.pulse), score);
    }
    this.lastBeat = Math.max(this.lastBeat, beat);
    const x = score.layout.xAt(cursor);
    this.host.playhead(x);
    this.host.scrollTo(x, false);

    for (const n of score.notes) {
      const r = this.rt[n.id];
      if ((mode === "listen" || r.auto) && !r.played && this.inRange(n) && beat >= n.s) {
        r.played = true;
        this.sound(n);
        this.host.mark(n.id, "now");
        this.later(() => {
          if (!r.judged) this.host.mark(n.id, null);
        }, n.d * this.spb * 900);
      }
    }

    if (mode === "play") {
      // un clic por pulso del metrónomo (negra, o negra con puntillo en 6/8)
      const bi = Math.floor(g / score.pulse + 1e-9);
      if (bi > this.lastTick && (this.loop || bi * score.pulse < score.total)) {
        this.lastTick = bi;
        this.host.click(strong);
      }
      const act = this.active();
      for (const n of act) {
        const r = this.rt[n.id];
        // un acorde abierto (010) aún puede completarse: no se da por fallado
        if (!r.judged && beat > n.s + n.win.hit && !this.chordOpen(n.unit)) {
          r.judged = "miss";
          this.host.mark(n.id, "miss");
        }
      }
      const pending = act.filter((n) => !this.rt[n.id].judged && n.s - beat < 1.2);
      const first = pending.length ? Math.min(...pending.map((n) => n.s)) : null;
      const upcoming = pending.filter((n) => n.s === first);
      this.host.guide(upcoming);
      const hits = act.filter((n) => this.rt[n.id].judged && this.rt[n.id].judged !== "miss").length;
      const text =
        g < 0
          ? `Preparados… ${-Math.floor(g / score.pulse)}`
          : resting
            ? `Otra vez… ${restLeft}`
            : `${this.repPrefix()}Aciertos ${hits} de ${act.length}`;
      this.host.status(text, upcoming.length ? `Siguiente: ${this.label(upcoming)}` : "");
    } else {
      this.host.status(`${this.repPrefix()}${this.measureLabel(beat)}`, "");
    }

    if (!this.loop && beat > score.total + 0.6) return this.complete();
    this.raf = this.host.frame(this.loop_);
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

  /** Bucle: repeticiones completas con la mejor y la última; null en Escuchar o si no hay. */
  loopSummary(): LoopSummary | null {
    if (!this.loop || this.mode === "listen" || !this.reps.length) return null;
    const best = this.reps.reduce((a, b) => ((b.score ?? 0) > (a.score ?? 0) ? b : a));
    return { reps: this.reps.length, best, last: this.reps[this.reps.length - 1] };
  }

  /** Invariante (009, FR-007): el resultado no depende de `score.pedals`, que solo usa `sound()`. */
  result(): LessonResult {
    if (this.mode === "listen") {
      return { mode: "listen", score: null, stars: 0, message: "Ya conoces cómo suena. Ahora apréndela nota a nota." };
    }
    // cada evento (nota suelta o acorde) cuenta una vez (research R6)
    const units = new Map<number, ScoreNote[]>();
    for (const x of this.active()) {
      const list = units.get(x.unit);
      if (list) list.push(x);
      else units.set(x.unit, [x]);
    }
    const n = units.size || 1;
    let pct: number;
    if (this.mode === "learn") pct = n / (n + this.mistakes);
    else {
      let points = 0;
      for (const [unit, notes] of units) {
        if (this.spoiled.has(unit)) continue;
        const judged = notes.map((x) => this.rt[x.id].judged);
        if (judged.every((j) => j === "perfect")) points += 1;
        else if (judged.every((j) => j === "perfect" || j === "good")) points += 0.7;
      }
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

/** El pulso `bi` (base 0, en pulsos de metrónomo) abre un compás. */
function isStrong(bi: number, score: Score): boolean {
  const perBar = Math.round(score.bar / score.pulse);
  return ((bi % perBar) + perBar) % perBar === 0;
}

export const starsFor = (pct: number): number => (pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0);

/** Ordena el fragmento y lo recorta a los compases de la pieza. */
function normalizeLoop(loop: LoopRange, measures: number): LoopRange {
  const clamp = (i: number) => Math.min(Math.max(Math.round(i), 0), measures - 1);
  const a = clamp(loop.from);
  const b = clamp(loop.to);
  return { from: Math.min(a, b), to: Math.max(a, b) };
}

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

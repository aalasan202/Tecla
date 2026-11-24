import type { Hand, Score, ScoreNote } from "./types";
import { TICKS } from "./score";
import { accidentals, keyAt, type Acc } from "./spelling";

/** Figura escrita: redonda, blanca, negra, corchea, semicorchea. */
export type Dur = "w" | "h" | "q" | "8" | "16";

export interface EngravedKey {
  noteId: number;
  step: string;
  alter: number;
  octave: number;
  /** Alteración que se dibuja (solo cuando hace falta escribirla). */
  acc?: Acc;
}

export interface Figure {
  kind: "note" | "rest";
  /** Pulso de inicio. */
  s: number;
  /** Duración real en ticks (en un tresillo, 2/3 de la figura escrita). */
  ticks: number;
  dur: Dur;
  dots: 0 | 1;
  /** De grave a agudo; vacío en un silencio. */
  keys: EngravedKey[];
  /** Ligadura de prolongación a la figura siguiente, por altura. */
  tieToNext?: boolean[];
  slur?: "start" | "end";
  /** Índice del tresillo del compás al que pertenece. */
  tuplet?: number;
  /** Silencio de compás entero (se dibuja como redonda centrada). */
  full?: boolean;
}

export interface EngravedMeasure {
  index: number;
  /** Armadura, solo en el compás 0 y donde cambia. */
  key?: number;
  figures: Figure[];
  /** Grupos de figuras unidas por barra (índices en `figures`). */
  beams: number[][];
  tuplets: { figures: number[]; num: 3 }[];
}

export interface HandStaff {
  h: Hand;
  clef: "treble" | "bass";
  measures: EngravedMeasure[];
}

export interface Engraving {
  hands: HandStaff[];
}

/** Figuras representables, de mayor a menor: [ticks, figura, puntillo]. */
const FIGURES: [number, Dur, 0 | 1][] = [
  [192, "w", 0], [144, "h", 1], [96, "h", 0], [72, "q", 1], [48, "q", 0], [36, "8", 1], [24, "8", 0], [12, "16", 0],
];
const TRIPLET_DUR: Record<number, Dur> = { 16: "8", 32: "q", 64: "h" };

interface Segment {
  st: number;
  dt: number;
  notes: ScoreNote[];
  slur?: "start" | "end";
}

interface Window {
  start: number;
  end: number;
  /** Ticks de la unidad del tresillo: 16 (corchea) o 32 (negra). */
  unit: number;
}

/**
 * Convierte la partitura lógica en figuras dibujables, por mano y compás (research R5): parte
 * notas y silencios en la barra y en figuras representables unidas por ligaduras, sin cruzar el
 * pulso cuando se puede evitar; detecta tresillos; agrupa las barras por pulso; los acordes son
 * una figura con varias alturas. Puro y determinista.
 */
export function engrave(score: Score): Engraving {
  const barT = Math.round(score.bar * TICKS);
  const compound = score.time.unit === 8;
  const beatT = compound ? 72 : 48;
  const count = Math.round(score.total / score.bar);
  const acc = accidentals(score.notes, score.keys, score.bar);
  const hands: Hand[] = score.twoHands ? ["R", "L"] : ["R"];

  return {
    hands: hands.map((h) => {
      const segments = segmentsOf(score, h, count * barT);
      const measures: EngravedMeasure[] = [];
      for (let i = 0; i < count; i++) {
        const m = engraveMeasure(segments, i, barT, beatT, compound, acc);
        const key = keyAt(score.keys, i);
        if (i === 0 || key !== keyAt(score.keys, i - 1)) m.key = key;
        measures.push(m);
      }
      return { h, clef: h === "L" ? "bass" : "treble", measures };
    }),
  };
}

/** Eventos de una mano (notas agrupadas por `unit`) y huecos como silencios, en ticks. */
function segmentsOf(score: Score, h: Hand, totalT: number): (Segment | { st: number; dt: number; rest: true })[] {
  const byUnit = new Map<number, ScoreNote[]>();
  for (const n of score.notes) {
    if (n.h !== h) continue;
    const list = byUnit.get(n.unit) ?? [];
    list.push(n);
    byUnit.set(n.unit, list);
  }
  const notes: Segment[] = [...byUnit.values()].map((list) => {
    const sorted = [...list].sort((a, b) => a.m - b.m);
    return {
      st: Math.round(sorted[0].s * TICKS),
      dt: Math.round(sorted[0].d * TICKS),
      notes: sorted,
      slur: sorted.find((n) => n.slur)?.slur,
    };
  });
  notes.sort((a, b) => a.st - b.st);
  const out: (Segment | { st: number; dt: number; rest: true })[] = [];
  let at = 0;
  for (const seg of notes) {
    if (seg.st > at) out.push({ st: at, dt: seg.st - at, rest: true });
    out.push(seg);
    at = Math.max(at, seg.st + seg.dt);
  }
  if (at < totalT) out.push({ st: at, dt: totalT - at, rest: true });
  return out;
}

interface Piece {
  /** Inicio dentro del compás y duración, en ticks. */
  o: number;
  len: number;
  seg: Segment | null;
  /** El evento empezó en un compás anterior / sigue en el siguiente. */
  fromBefore: boolean;
  toAfter: boolean;
}

function engraveMeasure(
  segments: (Segment | { st: number; dt: number; rest: true })[],
  index: number,
  barT: number,
  beatT: number,
  compound: boolean,
  acc: Map<number, Acc>,
): EngravedMeasure {
  const mStart = index * barT;
  const mEnd = mStart + barT;
  const pieces: Piece[] = [];
  for (const seg of segments) {
    const a = Math.max(seg.st, mStart);
    const b = Math.min(seg.st + seg.dt, mEnd);
    if (b <= a) continue;
    pieces.push({
      o: a - mStart,
      len: b - a,
      seg: "rest" in seg ? null : seg,
      fromBefore: seg.st < mStart,
      toAfter: seg.st + seg.dt > mEnd,
    });
  }

  const windows = compound ? [] : tripletWindows(pieces, barT);
  const figures: Figure[] = [];
  const tuplets: { figures: number[]; num: 3 }[] = windows.map(() => ({ figures: [], num: 3 }));

  for (const p of pieces) {
    if (!p.seg && p.o === 0 && p.len === barT) {
      figures.push({ kind: "rest", s: mStart / TICKS, ticks: barT, dur: "w", dots: 0, keys: [], full: true });
      continue;
    }
    const parts = splitPiece(p, barT, beatT, compound, windows);
    parts.forEach((part, k) => {
      const first = k === 0;
      const last = k === parts.length - 1;
      const fig: Figure = {
        kind: p.seg ? "note" : "rest",
        s: (mStart + part.pos) / TICKS,
        ticks: part.ticks,
        dur: part.dur,
        dots: part.dots,
        keys: (p.seg?.notes ?? []).map((n) => {
          const key: { noteId: number; step: string; alter: number; octave: number; acc?: Acc } = {
            noteId: n.id,
            step: n.spell.step,
            alter: n.spell.alter,
            octave: Math.floor((n.m - n.spell.alter) / 12) - 1,
          };
          const a = acc.get(n.id);
          if (a && first && !p.fromBefore) key.acc = a;
          return key;
        }),
      };
      if (part.window !== undefined) {
        fig.tuplet = part.window;
        tuplets[part.window].figures.push(figures.length);
      }
      if (p.seg) {
        const tie = !last || p.toAfter;
        if (tie) fig.tieToNext = p.seg.notes.map(() => true);
        if (p.seg.slur === "start" && first && !p.fromBefore) fig.slur = "start";
        if (p.seg.slur === "end" && last && !p.toAfter) fig.slur = "end";
      }
      figures.push(fig);
    });
  }

  return { index, figures, beams: beamsOf(figures, mStart, beatT), tuplets: tuplets.filter((t) => t.figures.length) };
}

/**
 * Ventanas de tresillo del compás: dos pulsos con inicios en tercios (tresillo de negras) o un
 * pulso con inicios en tercios (tresillo de corcheas). Lanza si un ritmo no es representable.
 */
function tripletWindows(pieces: Piece[], barT: number): Window[] {
  const bounds = new Set<number>();
  for (const p of pieces) {
    bounds.add(p.o);
    bounds.add(p.o + p.len);
  }
  const inside = (a: number, b: number) => [...bounds].filter((t) => t > a && t < b);
  const windows: Window[] = [];
  const covered = new Set<number>();
  for (let b = 0; b + 96 <= barT; b += 48) {
    const ins = inside(b, b + 96);
    if (ins.length && ins.every((t) => t === b + 32 || t === b + 64)) {
      windows.push({ start: b, end: b + 96, unit: 32 });
      covered.add(b).add(b + 48);
      b += 48;
    }
  }
  for (let b = 0; b < barT; b += 48) {
    if (covered.has(b)) continue;
    const ins = inside(b, b + 48);
    if (ins.some((t) => t % 12 !== 0)) {
      if (!ins.every((t) => t === b + 16 || t === b + 32)) throw new Error(`Ritmo no representable en el pulso ${b / 48 + 1}`);
      windows.push({ start: b, end: b + 48, unit: 16 });
    }
  }
  windows.sort((a, b) => a.start - b.start);
  for (const t of bounds) if (t % 12 !== 0 && !windows.some((w) => t >= w.start && t <= w.end)) throw new Error("Ritmo no representable");
  return windows;
}

interface Part {
  pos: number;
  ticks: number;
  dur: Dur;
  dots: 0 | 1;
  window?: number;
}

/** Parte un trozo de evento en figuras representables (research R5). */
function splitPiece(p: Piece, barT: number, beatT: number, compound: boolean, windows: Window[]): Part[] {
  const parts: Part[] = [];
  let pos = p.o;
  let rem = p.len;
  while (rem > 0) {
    const wi = windows.findIndex((w) => pos >= w.start && pos < w.end);
    if (wi >= 0) {
      const w = windows[wi];
      const cap = Math.min(rem, w.end - pos);
      const t = cap >= 2 * w.unit ? 2 * w.unit : w.unit;
      if (t > cap || (pos - w.start) % w.unit !== 0) throw new Error("Tresillo no representable");
      parts.push({ pos, ticks: t, dur: TRIPLET_DUR[t], dots: 0, window: wi });
      pos += t;
      rem -= t;
      continue;
    }
    const nextWindow = windows.find((w) => w.start > pos)?.start ?? barT;
    let cap = Math.min(rem, nextWindow - pos, barT - pos);
    const onBeat = pos % beatT === 0;
    // fuera de pulso, una figura no cruza el pulso siguiente
    if (!onBeat) cap = Math.min(cap, beatT - (pos % beatT));
    const fit = FIGURES.find(([t]) => t <= cap && (!onBeat || !compound || t <= beatT || t % beatT === 0));
    if (!fit) throw new Error(`Duración no representable (${cap} ticks)`);
    parts.push({ pos, ticks: fit[0], dur: fit[1], dots: fit[2] });
    pos += fit[0];
    rem -= fit[0];
  }
  return parts;
}

/** Barras: corcheas y semicorcheas seguidas del mismo pulso (o del mismo tresillo). */
function beamsOf(figures: Figure[], mStart: number, beatT: number): number[][] {
  const beams: number[][] = [];
  let run: number[] = [];
  let group: string | null = null;
  const flush = () => {
    if (run.length >= 2) beams.push(run);
    run = [];
    group = null;
  };
  figures.forEach((f, i) => {
    const beamable = f.kind === "note" && (f.dur === "8" || f.dur === "16");
    if (!beamable) return flush();
    const pos = Math.round(f.s * TICKS) - mStart;
    const g = f.tuplet !== undefined ? `t${f.tuplet}` : `b${Math.floor(pos / beatT)}`;
    if (g !== group) flush();
    group = g;
    run.push(i);
  });
  flush();
  return beams;
}

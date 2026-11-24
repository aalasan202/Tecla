import type { EventOpts, Hand, KeyChange, Rest, Score, ScoreNote, SongDef, Spell, Track } from "./types";
import { assignFingering, eventsOf } from "./fingering";
import { layoutScore } from "./layout";
import { accidentals, keyAt, spell } from "./spelling";

/** Ticks por negra: divisible por 2, 3, 4, 8, 12 y 16 (research R3). */
export const TICKS = 48;
/** Ventana (en pulsos) para aceptar una nota en Tocar, y para considerarla «perfecta». */
export const HIT_WINDOW = 0.45;
export const PERFECT_WINDOW = 0.18;

/** Duración en pulsos → ticks enteros; lanza si no cae en un tick o no es positiva. */
export function toTicks(d: number): number {
  const t = Math.round(d * TICKS);
  if (!(d > 0) || t <= 0 || Math.abs(t - d * TICKS) > 1e-6) throw new Error(`Duración no válida: ${d} (debe ser múltiplo de 1/48 de negra)`);
  return t;
}

/** Compás, pulso del metrónomo y cifra de compás de una pieza. */
export function meterOf(song: SongDef): { bar: number; pulse: number; time: Score["time"] } {
  if (song.time === "6/8") return { bar: 3, pulse: 1.5, time: { beats: 6, unit: 8 } };
  const bar = song.bar ?? 4;
  return { bar, pulse: 1, time: { beats: bar, unit: 4 } };
}

/** Armaduras por compás, ordenadas y con la del compás 0. */
export function keysOf(song: SongDef): KeyChange[] {
  const map = new Map<number, number>([[0, song.key ?? 0]]);
  for (const c of song.keyChanges ?? []) map.set(c.at, c.key);
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([at, key]) => ({ at, key }));
}

export const tracksOf = (song: SongDef): [Hand, Track][] =>
  song.l ? [["R", song.r ?? []], ["L", song.l]] : [["R", song.n ?? []]];

/** Alturas de un evento (vacío si es silencio), con su ortografía forzada. */
export function pitchesOf(nota: number | number[], opts?: EventOpts): { m: number; spell?: Spell }[] {
  const list = Array.isArray(nota) ? nota : nota === 0 ? [] : [nota];
  const spells = opts?.spell === undefined ? [] : Array.isArray(opts.spell) ? opts.spell : list.map(() => opts.spell as Spell);
  return list.map((m, i) => ({ m, spell: spells[i] })).sort((a, b) => a.m - b.m);
}

interface Draft {
  m: number;
  /** Inicio y duración en ticks. */
  st: number;
  dt: number;
  h: Hand;
  unit: number;
  override?: Spell;
  slur?: "start" | "end";
}

/**
 * Convierte la definición de una canción en notas, silencios, digitación y posiciones.
 * Une las notas ligadas en una sola, da a las alturas de un acorde el mismo `unit` y recorta el
 * margen de acierto de las notas muy seguidas. Lanza Error si alguna duración no cae en un tick.
 */
export function buildScore(song: SongDef): Score {
  const { bar, pulse, time } = meterOf(song);
  const keys = keysOf(song);
  const twoHands = !!song.l;
  const drafts: Draft[] = [];
  const restDrafts: { h: Hand; st: number; dt: number }[] = [];
  let unit = 0;
  let lengthT = 0;

  for (const [h, track] of tracksOf(song)) {
    let at = 0;
    // evento anterior con `tie`: sus alturas y los borradores que se prolongan
    let tied: { key: string; drafts: Draft[] } | null = null;
    for (const [nota, dur, opts] of track) {
      const t = toTicks(dur);
      const pitches = pitchesOf(nota, opts);
      if (!pitches.length) {
        restDrafts.push({ h, st: at, dt: t });
        tied = null;
      } else {
        const key = pitches.map((p) => p.m).join(",");
        let own: Draft[];
        if (tied && tied.key === key) {
          own = tied.drafts;
          own.forEach((d) => {
            d.dt += t;
            if (opts?.slur && !d.slur) d.slur = opts.slur;
          });
        } else {
          const u = unit++;
          own = pitches.map((p) => ({ m: p.m, st: at, dt: t, h, unit: u, override: p.spell, slur: opts?.slur }));
          drafts.push(...own);
        }
        tied = opts?.tie ? { key, drafts: own } : null;
      }
      at += t;
    }
    lengthT = Math.max(lengthT, at);
  }

  // orden temporal; a igual tiempo, mano derecha primero (y de grave a agudo en un acorde)
  drafts.sort((a, b) => a.st - b.st || (a.h === b.h ? 0 : a.h === "R" ? -1 : 1));
  const barT = bar * TICKS;
  const totalT = Math.ceil(lengthT / barT) * barT;
  const total = totalT / TICKS;

  const notes: ScoreNote[] = drafts.map((d, id) => {
    const s = d.st / TICKS;
    const sp = spell(d.m, keyAt(keys, Math.floor(d.st / barT)), d.override);
    const n: ScoreNote = {
      id, m: d.m, d: d.dt / TICKS, s, h: d.h, x: 0, f: 0, unit: d.unit,
      win: { hit: HIT_WINDOW, perfect: PERFECT_WINDOW }, spell: { step: sp.step, alter: sp.alter },
    };
    if (d.slur) n.slur = d.slur;
    return n;
  });
  const rests: Rest[] = restDrafts.map((r) => ({ h: r.h, s: r.st / TICKS, d: r.dt / TICKS }));

  clipWindows(notes);
  assignFingering(eventsOf(notes.filter((n) => n.h === "R")), { sign: 1, arpeggio: !!song.arpFingering, phraseBreaks: true, bar });
  assignFingering(eventsOf(notes.filter((n) => n.h === "L")), { sign: -1, bar });

  const acc = accidentals(notes, keys, bar);
  const accFirst = new Set<number>();
  for (const n of notes) if (acc.has(n.id) && Math.round(n.s * TICKS) % barT === 0) accFirst.add(Math.round(n.s * TICKS) / barT);
  const layout = layoutScore({ bar, total, onsets: [...notes.map((n) => n.s), ...rests.map((r) => r.s)], px: song.px, keys, accFirst });
  for (const n of notes) n.x = layout.xAt(n.s);

  return { song, notes, rests, total, bar, px: layout.px, pulse, time, keys, twoHands, layout };
}

/**
 * Margen de acierto por nota (research R7): si el inicio anterior o siguiente de la misma mano
 * está a menos de una corchea, el margen pasa a la mitad de esa distancia.
 */
function clipWindows(notes: ScoreNote[]): void {
  for (const h of ["R", "L"] as const) {
    const onsets = [...new Set(notes.filter((n) => n.h === h).map((n) => Math.round(n.s * TICKS)))].sort((a, b) => a - b);
    const gapAt = new Map<number, number>();
    onsets.forEach((t, i) => {
      const prev = i > 0 ? t - onsets[i - 1] : Infinity;
      const next = i < onsets.length - 1 ? onsets[i + 1] - t : Infinity;
      gapAt.set(t, Math.min(prev, next) / TICKS);
    });
    for (const n of notes) {
      if (n.h !== h) continue;
      const gap = gapAt.get(Math.round(n.s * TICKS))!;
      if (gap < 0.5) n.win = { hit: Math.min(HIT_WINDOW, gap / 2), perfect: Math.min(PERFECT_WINDOW, gap / 2) };
    }
  }
}

export const measureCount = (score: Score): number => score.total / score.bar;

/** Compás (base 0) bajo la coordenada x de la partitura, recortado a la pieza. */
export function measureAt(score: Score, x: number): number {
  return score.layout.measureAt(x);
}

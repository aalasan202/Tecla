import type { EventOpts, KeyChange, SongDef, Spell, Track } from "../types";
import { buildScore } from "../score";
import { engrave } from "../engrave";
import { spell } from "../spelling";
import { validateSong } from "../validate";
import { SLACK, clampTempo, meterOfTime, splitHands } from "./convert";
import { suggestFullLevel } from "./level";
import type { FullCheck, RawNote, RawPiece, Warning, WarningKind } from "./types";

/** Solapes y diferencias de final menores que esto son legato o imprecisión, no otra voz. */
const LEGATO = 0.25;
const ORDER: WarningKind[] = ["handsSplit", "durations", "grace"];
const SPELL_OF: Record<number, Spell> = { [-2]: "bb", [-1]: "b", 0: "n", 1: "#", 2: "##" };

const okPitch = (p: number) => Number.isInteger(p) && p >= 21 && p <= 108;
const okNote = (n: RawNote) => okPitch(n.pitch) && Number.isFinite(n.start) && n.start >= 0 && Number.isFinite(n.dur) && n.dur > 0;

class Voices extends Error {}

/** El punto más cercano de la rejilla de semicorchea o, si se admiten, de tercio de negra. */
function snap(x: number, thirds: boolean): number {
  const q = Math.round(x * 4) / 4;
  if (!thirds) return q;
  const t = Math.round(x * 3) / 3;
  return Math.abs(t - x) < Math.abs(q - x) - 1e-9 ? t : q;
}

interface Chord {
  s: number;
  e: number;
  notes: RawNote[];
}

/**
 * Una mano sin simplificar: acordes por inicio, duraciones exactas en la rejilla. Lanza Voices si
 * hay notas que empiezan juntas con finales muy distintos o que se solapan con la siguiente.
 */
function toChords(notes: RawNote[], thirds: boolean, marks: Set<WarningKind>): Chord[] {
  const groups = new Map<number, Chord>();
  for (const n of notes) {
    const s = snap(n.start, thirds);
    let e = snap(n.start + n.dur, thirds);
    if (e <= s) e = s + (Math.abs(s * 4 - Math.round(s * 4)) > 1e-9 ? 1 / 3 : 1 / 4);
    if (Math.abs(s - n.start) > SLACK || Math.abs(e - n.start - n.dur) > SLACK) marks.add("durations");
    const key = Math.round(s * 48);
    const g = groups.get(key);
    if (!g) groups.set(key, { s, e, notes: [n] });
    else {
      if (Math.abs(g.e - e) > LEGATO) throw new Voices();
      if (g.e !== e) marks.add("durations");
      g.e = Math.max(g.e, e);
      if (!g.notes.some((o) => o.pitch === n.pitch)) g.notes.push(n);
    }
  }
  const chords = [...groups.values()].sort((a, b) => a.s - b.s);
  chords.forEach((c, i) => {
    const next = chords[i + 1];
    if (next && c.e > next.s + 1e-9) {
      if (c.e - next.s > LEGATO) throw new Voices();
      c.e = next.s;
      marks.add("durations");
    }
  });
  return chords;
}

/** Armaduras por compás a partir de las del archivo (en pulsos). */
function keysOf(raw: RawPiece, bar: number, measures: number): { key: number; keyChanges: KeyChange[] } {
  const byMeasure = new Map<number, number>();
  for (const k of raw.keys ?? []) byMeasure.set(Math.max(0, Math.floor(k.at / bar + 1e-6)), k.key);
  const key = byMeasure.get(0) ?? 0;
  const keyChanges: KeyChange[] = [];
  let prev = key;
  for (const [at, k] of [...byMeasure.entries()].sort((a, b) => a[0] - b[0])) {
    if (at === 0 || at >= measures || k === prev) continue;
    keyChanges.push({ at, key: k });
    prev = k;
  }
  return { key, keyChanges };
}

/** Duración en pulsos redondeada al tick (1/48 de negra): sin restos de coma flotante. */
const span = (a: number, b: number) => Math.round((b - a) * 48) / 48;

/** Pista con silencios en los huecos; cada acorde lleva su ortografía si el original la fija. */
function toTrack(chords: Chord[], total: number, keyAt: (beat: number) => number): Track {
  const out: Track = [];
  let at = 0;
  for (const c of chords) {
    if (c.s > at + 1e-9) out.push([0, span(at, c.s)]);
    const notes = [...c.notes].sort((a, b) => a.pitch - b.pitch);
    const key = keyAt(c.s);
    // solo se fuerza la ortografía cuando la del original no es la que saldría por defecto
    const spells = notes.map((n) => {
      if (!n.spell) return undefined;
      const want = spell(n.pitch, key, n.spell);
      const def = spell(n.pitch, key);
      return want.step === def.step && want.alter === def.alter ? undefined : n.spell;
    });
    const opts: EventOpts = {};
    // en un acorde, una alteración por altura: la de por defecto donde no se fuerza
    if (spells.some(Boolean)) opts.spell = notes.length === 1 ? spells[0]! : notes.map((n, i) => spells[i] ?? SPELL_OF[spell(n.pitch, key).alter]);
    const nota = notes.length > 1 ? notes.map((n) => n.pitch) : notes[0].pitch;
    out.push(Object.keys(opts).length ? [nota, span(c.s, c.e), opts] : [nota, span(c.s, c.e)]);
    at = c.e;
  }
  if (total > at + 1e-9) out.push([0, span(at, total)]);
  return out;
}

/**
 * Convierte el original sin simplificar (research R11): reparte las manos como 006, cuantiza a
 * semicorchea o tercio de pulso, conserva acordes, duraciones, armadura y ortografía. Si algo no
 * se puede representar (varias voces en una mano, compás no admitido o cambiante) lo dice.
 * Nunca lanza.
 */
export function convertFull(raw: RawPiece): FullCheck {
  try {
    return convert(raw, true);
  } catch (e) {
    if (e instanceof Voices) return { ok: false, reason: "voices" };
    return { ok: false, reason: "unreadable" };
  }
}

function convert(raw: RawPiece, thirds: boolean): FullCheck {
  const parts = raw.parts.filter((p) => p.notes.length > 0);
  if (!parts.length || raw.notPiano || parts.length > 2 || parts.some((p) => p.notes.some((n) => !okNote(n)))) return { ok: false, reason: "unreadable" };
  if (new Set(raw.times.map((t) => `${t.beats}/${t.beatType}`)).size > 1) return { ok: false, reason: "timeChange" };
  const meter = meterOfTime(raw.times[0]);
  if (!meter) return { ok: false, reason: "timeSignature" };
  const { bar, pulse, six } = meter;

  const marks = new Set<WarningKind>();
  const hands = splitHands(parts);
  if (hands.split) marks.add("handsSplit");
  if (raw.ignored.grace + raw.ignored.cue > 0) marks.add("grace");
  // en 6/8 no hay tresillos de corchea: solo la rejilla de semicorchea
  const useThirds = thirds && !six;
  const right = hands.right.length ? toChords(hands.right, useThirds, marks) : [];
  const left = hands.left ? toChords(hands.left, useThirds, marks) : null;
  const end = Math.max(0, ...right.map((c) => c.e), ...(left ?? []).map((c) => c.e));
  if (!right.length && !left?.length) return { ok: false, reason: "unreadable" };
  const measures = Math.max(1, Math.ceil(end / bar - 1e-9));
  const total = measures * bar;
  const { key, keyChanges } = keysOf(raw, bar, measures);
  const keyAt = (beat: number) => {
    const m = Math.floor(beat / bar + 1e-9);
    let k = key;
    for (const c of keyChanges) if (c.at <= m) k = c.key;
    return k;
  };

  const song: Omit<SongDef, "id" | "level"> = {
    title: raw.title?.trim() || "Pieza importada",
    tempo: clampTempo(raw.tempo === undefined ? undefined : raw.tempo / pulse),
    ...(six ? { time: "6/8" as const } : bar !== 4 ? { bar } : {}),
    ...(key ? { key } : {}),
    ...(keyChanges.length ? { keyChanges } : {}),
    ...(left ? { r: toTrack(right, total, keyAt), l: toTrack(left, total, keyAt) } : { n: toTrack(right, total, keyAt) }),
  };

  // que la partitura la pueda escribir: si no (tresillos mezclados con semicorcheas en un pulso),
  // se vuelve a intentar solo con la rejilla de semicorchea
  const full = { ...song, id: "full", level: "" } as SongDef;
  try {
    if (validateSong(full).length) throw new Error("no válida");
    engrave(buildScore(full));
  } catch (e) {
    if (e instanceof Voices) throw e;
    if (useThirds) {
      const retry = convert(raw, false);
      return retry.ok ? { ...retry, warnings: withKind(retry.warnings, "durations") } : retry;
    }
    return { ok: false, reason: "unreadable" };
  }

  const warnings: Warning[] = ORDER.filter((k) => marks.has(k)).map((kind) => ({ kind, bars: [] }));
  return { ok: true, song, level: suggestFullLevel(song), warnings };
}

const withKind = (ws: Warning[], kind: WarningKind): Warning[] =>
  ws.some((w) => w.kind === kind) ? ws : ORDER.filter((k) => k === kind || ws.some((w) => w.kind === k)).map((k) => ws.find((w) => w.kind === k) ?? { kind: k, bars: [] });

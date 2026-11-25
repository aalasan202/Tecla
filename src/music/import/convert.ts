import type { RawTrack, SongDef } from "../types";
import { measure, suggestLevel } from "./level";
import { fitPedals } from "../pedal";
import type { ImportCheck, RawNote, RawPart, RawPiece, Warning, WarningKind } from "./types";

/** Duraciones de nota que dibuja la partitura, en pulsos de negra. */
export const DURATIONS: readonly number[] = [0.5, 1, 1.5, 2, 3, 4];
/** Por encima de esto la pieza puede ir lenta: se avisa, pero se puede añadir (FR-011). */
export const HEAVY = { bars: 300, notes: 1500 };
/** Rango de tempo de la lección. */
const TEMPO = { min: 40, max: 140, step: 5, fallback: 90 };
/** Do central: desde aquí hacia arriba, mano derecha al repartir una sola pista. */
const MIDDLE_C = 60;
/** Desviación de la rejilla que se considera imprecisión de interpretación y no se avisa. */
export const SLACK = 0.05;
const GRID = 0.5;
/** Compases admitidos en negras: 4/4, 3/4 y 2/4 (clarificación 2026-11-24); y 6/8 (007, FR-020). */
const BEATS: readonly number[] = [2, 3, 4];

/** Compás admitido → negras por compás y pulso del metrónomo; null si no se admite. */
export function meterOfTime(t: { beats: number; beatType: number } | undefined): { bar: number; pulse: number; six: boolean } | null {
  if (!t) return { bar: 4, pulse: 1, six: false };
  if (t.beatType === 4 && BEATS.includes(t.beats)) return { bar: t.beats, pulse: 1, six: false };
  if (t.beatType === 8 && t.beats === 6) return { bar: 3, pulse: 1.5, six: true };
  return null;
}

const SIMPLIFICATIONS: WarningKind[] = ["chords", "durations", "cutAtBar", "dropped"];
const ORDER: WarningKind[] = ["handsSplit", "chords", "durations", "cutAtBar", "dropped", "grace", "farFromOriginal"];

type Side = "R" | "L";
type Marks = Map<WarningKind, Set<number>>;

const quantize = (x: number) => Math.round(x / GRID) * GRID;
const okPitch = (p: number) => Number.isInteger(p) && p >= 21 && p <= 108;
const okNote = (n: RawNote) => okPitch(n.pitch) && Number.isFinite(n.start) && n.start >= 0 && Number.isFinite(n.dur) && n.dur > 0;
const uniqSorted = (xs: Iterable<number>) => [...new Set(xs)].sort((a, b) => a - b);

function mark(marks: Marks, kind: WarningKind, bar?: number) {
  const set = marks.get(kind) ?? new Set<number>();
  if (bar !== undefined) set.add(bar);
  marks.set(kind, set);
}

function hasSimultaneous(notes: RawNote[]): boolean {
  const at = new Map<number, number>();
  for (const n of notes) {
    const q = quantize(n.start);
    if (at.has(q) && at.get(q) !== n.pitch) return true;
    at.set(q, n.pitch);
  }
  return false;
}

/** Una mano: una nota cada vez, en la rejilla de corchea, sin cruzar barras y con duraciones dibujables. */
function toHand(notes: RawNote[], side: Side, bar: number, marks: Marks): { s: number; d: number; m: number }[] {
  const barOf = (s: number) => Math.floor(s / bar) + 1;
  const groups = new Map<number, { pitch: number; end: number }[]>();
  for (const n of notes) {
    const s = quantize(n.start);
    const e = quantize(n.start + n.dur);
    if (Math.abs(s - n.start) > SLACK || Math.abs(e - n.start - n.dur) > SLACK) mark(marks, "durations", barOf(s));
    groups.set(s, [...(groups.get(s) ?? []), { pitch: n.pitch, end: e }]);
  }
  const starts = [...groups.keys()].sort((a, b) => a - b);
  const out: { s: number; d: number; m: number }[] = [];
  starts.forEach((s, i) => {
    const group = groups.get(s)!;
    const pick = group.reduce((a, b) => (side === "R" ? b.pitch > a.pitch : b.pitch < a.pitch) ? b : a);
    if (new Set(group.map((g) => g.pitch)).size > 1) mark(marks, "chords", barOf(s));
    const next = starts[i + 1] ?? Infinity;
    const barEnd = (Math.floor(s / bar) + 1) * bar;
    if (pick.end > barEnd && barEnd <= next) mark(marks, "cutAtBar", barOf(s));
    const limit = Math.min(next, barEnd);
    let end = Math.min(pick.end, limit);
    if (end - s < GRID) {
      if (s + GRID > limit) {
        mark(marks, "dropped", barOf(s));
        return;
      }
      end = s + GRID;
      mark(marks, "durations", barOf(s));
    }
    const d = end - s;
    const shown = [...DURATIONS].reverse().find((x) => x <= d + 1e-9)!;
    if (Math.abs(shown - d) > 1e-9) mark(marks, "durations", barOf(s));
    out.push({ s, d: shown, m: pick.pitch });
  });
  return out;
}

/** Notas posicionadas → pista con silencios en los huecos, completada hasta `total`. */
function toTrack(hand: { s: number; d: number; m: number }[], total: number): RawTrack {
  const out: RawTrack = [];
  let at = 0;
  for (const { s, d, m } of hand) {
    if (s > at) out.push([0, s - at]);
    out.push([m, d]);
    at = s + d;
  }
  if (total > at) out.push([0, total - at]);
  return out;
}

/** Tempo de la lección (pulsos por minuto, en pasos de 5) a partir de negras por minuto. */
export const clampTempo = (t: number | undefined) => {
  if (t === undefined || !Number.isFinite(t) || t <= 0) return TEMPO.fallback;
  return Math.min(TEMPO.max, Math.max(TEMPO.min, Math.round(t / TEMPO.step) * TEMPO.step));
};

/**
 * Reparte las partes en manos (006): dos partes por pentagrama o por altura media; una sola parte
 * con notas simultáneas se parte por el Do central.
 */
export function splitHands(parts: RawPart[]): { right: RawNote[]; left: RawNote[] | null; split: boolean } {
  if (parts.length === 2) {
    const avg = (ns: RawNote[]) => ns.reduce((a, n) => a + n.pitch, 0) / ns.length;
    const [a, b] = parts;
    const aRight = a.staff && b.staff ? a.staff < b.staff : avg(a.notes) >= avg(b.notes);
    return aRight ? { right: a.notes, left: b.notes, split: false } : { right: b.notes, left: a.notes, split: false };
  }
  const only = parts[0];
  if (only.staff === 2) return { right: [], left: only.notes, split: false };
  if (hasSimultaneous(only.notes)) {
    const hi = only.notes.filter((n) => n.pitch >= MIDDLE_C);
    const lo = only.notes.filter((n) => n.pitch < MIDDLE_C);
    return lo.length ? { right: hi, left: lo, split: true } : { right: hi, left: null, split: false };
  }
  return { right: only.notes, left: null, split: false };
}

/** Comprueba y convierte una pieza leída en una propuesta de SongDef. Nunca lanza. */
/**
 * Pedal del archivo ajustado a las notas ya convertidas (009). Si no queda ningún tramo, la
 * pieza no lleva `pedal`. Si se ve o no lo decide su nivel, al construir la partitura.
 */
export function addPedal(song: Omit<SongDef, "id" | "level">, raw: RawPiece): void {
  const pedal = raw.pedal ? fitPedals(raw.pedal, song) : [];
  if (pedal.length) song.pedal = pedal;
}

export function convertPiece(raw: RawPiece): ImportCheck {
  try {
    return convert(raw);
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}

function convert(raw: RawPiece): ImportCheck {
  // 1 · rechazos, en el orden de FR-003
  const parts = raw.parts.filter((p) => p.notes.length > 0);
  if (!parts.length) return { ok: false, reason: "empty" };
  if (raw.notPiano) return { ok: false, reason: "notPiano" };
  if (parts.length > 2) return { ok: false, reason: "tooManyParts" };
  const firstBar = meterOfTime(raw.times[0])?.bar ?? 4;
  const bad = parts.flatMap((p) => p.notes).filter((n) => !okNote(n));
  if (bad.length) {
    const bars = uniqSorted(bad.filter((n) => Number.isFinite(n.start) && n.start >= 0).map((n) => Math.floor(n.start / firstBar) + 1));
    return { ok: false, reason: "badNotes", detail: { count: bad.length, bars } };
  }
  const signatures = new Set(raw.times.map((t) => `${t.beats}/${t.beatType}`));
  const meter = meterOfTime(raw.times[0]);
  if (signatures.size > 1 || !meter) return { ok: false, reason: "timeSignature" };
  const { bar, pulse, six } = meter;

  // 2 · manos
  const marks: Marks = new Map();
  const hands = splitHands(parts);
  if (hands.split) mark(marks, "handsSplit");
  const { right, left } = hands;

  // 3–5 · rejilla, una nota por mano, duraciones
  const r = toHand(right, "R", bar, marks);
  const l = left ? toHand(left, "L", bar, marks) : null;
  const end = Math.max(...[...r, ...(l ?? [])].map((n) => n.s + n.d), 0);
  if (!r.length && !l?.length) return { ok: false, reason: "empty" };

  // 6 · silencios y final en compás completo
  const total = Math.max(1, Math.ceil(end / bar - 1e-9)) * bar;
  const eighths = [...r, ...(l ?? [])].filter((n) => n.d === 0.5).length / (r.length + (l?.length ?? 0));
  const song: Omit<SongDef, "id" | "level"> = {
    title: raw.title?.trim() || "Pieza importada",
    tempo: clampTempo(raw.tempo === undefined ? undefined : raw.tempo / pulse),
    ...(six ? { time: "6/8" as const } : bar !== 4 ? { bar } : {}),
    px: eighths > 0.25 ? 60 : 50,
    ...(l ? { r: toTrack(r, total), l: toTrack(l, total) } : { n: toTrack(r, total) }),
  };

  // 7 · avisos
  if (raw.ignored.grace + raw.ignored.cue > 0) mark(marks, "grace");
  const bars = total / bar;
  const touched = new Set(SIMPLIFICATIONS.flatMap((k) => [...(marks.get(k) ?? [])]));
  if (touched.size > bars / 2) mark(marks, "farFromOriginal");
  const warnings: Warning[] = ORDER.filter((k) => marks.has(k)).map((kind) => ({ kind, bars: uniqSorted(marks.get(kind)!) }));

  addPedal(song, raw);
  const metrics = measure(song);
  return {
    ok: true,
    proposal: {
      song,
      metrics,
      level: suggestLevel(metrics),
      warnings,
      heavy: metrics.bars > HEAVY.bars || metrics.notes > HEAVY.notes,
    },
  };
}

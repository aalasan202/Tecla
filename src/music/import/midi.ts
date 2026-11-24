import { ImportError } from "./errors";
import type { RawNote, RawPart, RawPiece } from "./types";

export type MidiEvent =
  | { tick: number; type: "on"; channel: number; note: number; velocity: number }
  | { tick: number; type: "off"; channel: number; note: number }
  | { tick: number; type: "program"; channel: number; program: number }
  | { tick: number; type: "tempo"; usPerQuarter: number }
  | { tick: number; type: "time"; beats: number; beatType: number }
  | { tick: number; type: "key"; key: number }
  | { tick: number; type: "name"; text: string }
  | { tick: number; type: "end" };

export interface MidiTrack {
  name?: string;
  events: MidiEvent[];
}

export interface MidiFile {
  format: number;
  /** Ticks por negra. */
  division: number;
  tracks: MidiTrack[];
}

const unreadable = () => new ImportError("unreadable");

/** UTF-8 sin depender de APIs del navegador; si no es UTF-8 válido, Latin-1. */
function decodeText(b: Uint8Array): string {
  let out = "";
  for (let i = 0; i < b.length; ) {
    const c = b[i];
    const n = c < 0x80 ? 0 : c >> 5 === 6 ? 1 : c >> 4 === 14 ? 2 : c >> 3 === 30 ? 3 : -1;
    if (n < 0 || i + n >= b.length + (n === 0 ? 1 : 0) || [...b.subarray(i + 1, i + 1 + n)].some((x) => x >> 6 !== 2)) {
      return String.fromCharCode(...b);
    }
    let cp = n === 0 ? c : c & (0x3f >> n);
    for (let k = 1; k <= n; k++) cp = (cp << 6) | (b[i + k] & 0x3f);
    out += String.fromCodePoint(cp);
    i += n + 1;
  }
  return out;
}

class Reader {
  constructor(
    private readonly b: Uint8Array,
    public pos: number,
    private readonly end: number,
  ) {}
  get done() {
    return this.pos >= this.end;
  }
  u8(): number {
    if (this.pos >= this.end) throw unreadable();
    return this.b[this.pos++];
  }
  u16 = () => (this.u8() << 8) | this.u8();
  u32 = () => ((this.u16() << 16) >>> 0) + this.u16();
  bytes(n: number): Uint8Array {
    if (n < 0 || this.pos + n > this.end) throw unreadable();
    const out = this.b.subarray(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }
  tag = () => String.fromCharCode(...this.bytes(4));
  vlq(): number {
    let n = 0;
    for (let i = 0; i < 4; i++) {
      const c = this.u8();
      n = (n << 7) | (c & 0x7f);
      if (!(c & 0x80)) return n;
    }
    throw unreadable();
  }
}

const DATA_BYTES: Record<number, number> = { 0x80: 2, 0x90: 2, 0xa0: 2, 0xb0: 2, 0xc0: 1, 0xd0: 1, 0xe0: 2 };

function readTrack(r: Reader): MidiTrack {
  const track: MidiTrack = { events: [] };
  let tick = 0;
  let status = 0;
  while (!r.done) {
    tick += r.vlq();
    let s = r.u8();
    if (s === 0xff) {
      const type = r.u8();
      const data = r.bytes(r.vlq());
      if (type === 0x2f) {
        track.events.push({ tick, type: "end" });
        break;
      }
      if (type === 0x03) {
        const text = decodeText(data);
        track.events.push({ tick, type: "name", text });
        track.name ??= text;
      } else if (type === 0x51 && data.length === 3) {
        track.events.push({ tick, type: "tempo", usPerQuarter: (data[0] << 16) | (data[1] << 8) | data[2] });
      } else if (type === 0x58 && data.length >= 2) {
        track.events.push({ tick, type: "time", beats: data[0], beatType: 2 ** data[1] });
      } else if (type === 0x59 && data.length >= 1) {
        // armadura: número de sostenidos (+) o bemoles (−), con signo
        const key = data[0] > 127 ? data[0] - 256 : data[0];
        if (key >= -7 && key <= 7) track.events.push({ tick, type: "key", key });
      }
      continue;
    }
    if (s === 0xf0 || s === 0xf7) {
      r.bytes(r.vlq());
      continue;
    }
    if (s & 0x80) {
      if (s >= 0xf0) throw unreadable();
      status = s;
    } else {
      // running status: este byte ya es el primer dato
      if (!status) throw unreadable();
      r.pos--;
      s = status;
    }
    const kind = s & 0xf0;
    const channel = s & 0x0f;
    const a = r.u8();
    const b = DATA_BYTES[kind] === 2 ? r.u8() : 0;
    if (kind === 0x90 && b > 0) track.events.push({ tick, type: "on", channel, note: a, velocity: b });
    else if (kind === 0x80 || kind === 0x90) track.events.push({ tick, type: "off", channel, note: a });
    else if (kind === 0xc0) track.events.push({ tick, type: "program", channel, program: a });
  }
  return track;
}

/** Lee un Standard MIDI File (formato 0 o 1). Cualquier fallo de estructura → ImportError("unreadable"). */
export function parseMidi(bytes: Uint8Array): MidiFile {
  const r = new Reader(bytes, 0, bytes.length);
  if (bytes.length < 14 || r.tag() !== "MThd") throw unreadable();
  const headLen = r.u32();
  if (headLen < 6) throw unreadable();
  const head = new Reader(bytes, r.pos, r.pos + headLen);
  r.bytes(headLen);
  const format = head.u16();
  const count = head.u16();
  const division = head.u16();
  if (format > 1 || count === 0 || division === 0 || division & 0x8000) throw unreadable();

  const tracks: MidiTrack[] = [];
  while (tracks.length < count) {
    const tag = r.tag();
    const len = r.u32();
    const start = r.pos;
    r.bytes(len); // comprueba que la pista cabe en el archivo
    if (tag === "MTrk") tracks.push(readTrack(new Reader(bytes, start, start + len)));
  }
  return { format, division, tracks };
}

const stripExt = (name: string) => name.replace(/\.[^.]*$/, "");
const mean = (notes: RawNote[]) => notes.reduce((a, n) => a + n.pitch, 0) / notes.length;

/** Pasa de eventos MIDI a partes con notas en pulsos de negra. */
export function midiToRaw(midi: MidiFile, fileName: string): RawPiece {
  const q = midi.division;
  const all = midi.tracks.flatMap((t) => t.events);
  const programs = new Map<number, number[]>();
  for (const e of all) if (e.type === "program") programs.set(e.channel, [...(programs.get(e.channel) ?? []), e.program]);

  // notas por pista y canal
  const groups = new Map<string, { track: number; channel: number; notes: RawNote[] }>();
  midi.tracks.forEach((track, ti) => {
    const open = new Map<number, number[]>();
    const endTick = track.events.reduce((a, e) => Math.max(a, e.tick), 0);
    const push = (channel: number, note: number, from: number, to: number) => {
      const key = midi.format === 0 ? `c${channel}` : `t${ti}`;
      const g = groups.get(key) ?? { track: ti, channel, notes: [] };
      g.notes.push({ pitch: note, start: from / q, dur: (to - from) / q });
      groups.set(key, g);
    };
    for (const e of track.events) {
      if (e.type === "on") {
        const k = e.channel * 128 + e.note;
        open.set(k, [...(open.get(k) ?? []), e.tick]);
      } else if (e.type === "off") {
        const k = e.channel * 128 + e.note;
        const starts = open.get(k);
        const from = starts?.shift();
        if (from !== undefined) push(e.channel, e.note, from, e.tick);
      }
    }
    // notas sin note-off: hasta el final de la pista
    for (const [k, starts] of open) for (const from of starts) push(k >> 7, k & 127, from, endTick);
  });

  const channelsWithNotes = new Set<number>();
  for (const e of all) if (e.type === "on") channelsWithNotes.add(e.channel);
  const notPiano = [...channelsWithNotes].some((ch) => ch === 9 || (programs.get(ch) ?? []).some((p) => p > 7));

  let parts: RawPart[] = [...groups.values()].map((g) => ({
    name: midi.format === 0 ? undefined : midi.tracks[g.track].name,
    notes: g.notes.sort((a, b) => a.start - b.start || a.pitch - b.pitch),
  }));
  if (parts.length === 2) {
    const [a, b] = parts;
    const [right, left] = mean(a.notes) >= mean(b.notes) ? [a, b] : [b, a];
    parts = [
      { ...right, staff: 1 },
      { ...left, staff: 2 },
    ];
  }

  const tempoEvent = all.filter((e) => e.type === "tempo").sort((a, b) => a.tick - b.tick)[0];
  const times = all
    .flatMap((e) => (e.type === "time" ? [{ at: e.tick / q, beats: e.beats, beatType: e.beatType }] : []))
    .sort((a, b) => a.at - b.at);
  const keys = all
    .flatMap((e) => (e.type === "key" ? [{ at: e.tick / q, key: e.key }] : []))
    .sort((a, b) => a.at - b.at);
  const title = midi.tracks[0]?.name?.trim();

  return {
    format: "midi",
    title: title || stripExt(fileName),
    tempo: tempoEvent && tempoEvent.type === "tempo" ? 60_000_000 / tempoEvent.usPerQuarter : 120,
    times,
    ...(keys.length ? { keys } : {}),
    parts,
    notPiano,
    ignored: { grace: 0, cue: 0 },
  };
}

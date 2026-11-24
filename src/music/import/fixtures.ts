// Generadores de archivos MIDI y MusicXML a partir de un SongDef, para tests y para
// scripts/export-fixtures.mjs. Solo `import type`: node 24 lo carga sin compilar.
import type { RawTrack, SongDef } from "../types";

/** Evento de pista para writeMidi: espera en ticks y bytes tal cual (estado incluido u omitido). */
export interface MidiEventSpec {
  dt: number;
  data: number[];
}

const vlq = (n: number): number[] => {
  const out = [n & 0x7f];
  for (n >>>= 7; n > 0; n >>>= 7) out.unshift((n & 0x7f) | 0x80);
  return out;
};

const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u16 = (n: number) => [(n >>> 8) & 255, n & 255];
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
const utf8 = (s: string): number[] => [...new TextEncoder().encode(s)];

/** Escribe un Standard MIDI File. Cada pista termina con su evento de fin (se añade si falta). */
export function writeMidi(tracks: MidiEventSpec[][], opts: { format?: number; ppq?: number } = {}): Uint8Array {
  const { format = tracks.length > 1 ? 1 : 0, ppq = 480 } = opts;
  const bytes: number[] = [...ascii("MThd"), ...u32(6), ...u16(format), ...u16(tracks.length), ...u16(ppq)];
  for (const track of tracks) {
    const body: number[] = [];
    for (const e of track) body.push(...vlq(e.dt), ...e.data);
    const last = track[track.length - 1]?.data;
    if (!(last && last[0] === 0xff && last[1] === 0x2f)) body.push(0, 0xff, 0x2f, 0);
    bytes.push(...ascii("MTrk"), ...u32(body.length), ...body);
  }
  return new Uint8Array(bytes);
}

export const meta = (type: number, data: number[]): number[] => [0xff, type, ...vlq(data.length), ...data];
export const tempoMeta = (bpm: number) => meta(0x51, [0, 0, 0, ...u32(Math.round(60_000_000 / bpm))].slice(-3));
export const timeMeta = (beats: number, beatType = 4) => meta(0x58, [beats, Math.log2(beatType), 24, 8]);
export const nameMeta = (name: string) => meta(0x03, utf8(name));

const hands = (song: SongDef): RawTrack[] => (song.l ? [song.r ?? [], song.l] : [song.n ?? []]);

/** Eventos absolutos de una mano: [tick, bytes], con los note-off antes que los note-on al mismo tick. */
function handEvents(track: RawTrack, channel: number, ppq: number): [number, number[]][] {
  const out: [number, number[]][] = [];
  let at = 0;
  for (const [m, d] of track) {
    const len = Math.round(d * ppq);
    if (m !== 0) {
      out.push([at, [0x90 | channel, m, 80]]);
      out.push([at + len, [0x80 | channel, m, 0]]);
    }
    at += len;
  }
  return out;
}

function toTrack(events: [number, number[]][], head: number[][] = []): MidiEventSpec[] {
  const sorted = [...events].sort((a, b) => a[0] - b[0] || (a[1][0] & 0xf0) - (b[1][0] & 0xf0));
  const out: MidiEventSpec[] = head.map((data) => ({ dt: 0, data }));
  let t = 0;
  for (const [tick, data] of sorted) {
    out.push({ dt: tick - t, data });
    t = tick;
  }
  return out;
}

/** MIDI formato 1: pista 0 con nombre, tempo y compás; una pista por mano (o una sola con `singleTrack`). */
export function songToMidi(song: SongDef, opts: { singleTrack?: boolean; ppq?: number } = {}): Uint8Array {
  const ppq = opts.ppq ?? 480;
  const conductor: MidiEventSpec[] = [nameMeta(song.title), tempoMeta(song.tempo), timeMeta(song.bar ?? 4)].map((data) => ({ dt: 0, data }));
  const perHand = hands(song).map((t, ch) => handEvents(t, ch, ppq));
  const tracks = opts.singleTrack
    ? [toTrack(perHand.flat(), perHand.map((_, ch) => [0xc0 | ch, 0]))]
    : perHand.map((events, ch) => toTrack(events, [[0xc0 | ch, 0]]));
  return writeMidi([conductor, ...tracks], { format: 1, ppq });
}

const STEPS: [string, number][] = [["C", 0], ["C", 1], ["D", 0], ["D", 1], ["E", 0], ["F", 0], ["F", 1], ["G", 0], ["G", 1], ["A", 0], ["A", 1], ["B", 0]];
const TYPES: [number, string, boolean][] = [[4, "whole", false], [3, "half", true], [2, "half", false], [1.5, "quarter", true], [1, "quarter", false], [0.75, "eighth", true], [0.5, "eighth", false], [0.25, "16th", false]];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function noteXml(m: number, beats: number, staff: number, tie?: "start" | "stop" | "both"): string {
  const [type, dot] = (TYPES.find(([d]) => d <= beats + 1e-9) ?? TYPES[TYPES.length - 1]).slice(1) as [string, boolean];
  const dur = Math.round(beats * 2);
  const ties = tie === "both" ? ["stop", "start"] : tie ? [tie] : [];
  const pitch =
    m === 0
      ? "<rest/>"
      : `<pitch><step>${STEPS[m % 12][0]}</step>${STEPS[m % 12][1] ? "<alter>1</alter>" : ""}<octave>${Math.floor(m / 12) - 1}</octave></pitch>`;
  return (
    `<note>${pitch}<duration>${dur}</duration>${ties.map((t) => `<tie type="${t}"/>`).join("")}<voice>${staff}</voice>` +
    `<type>${type}</type>${dot ? "<dot/>" : ""}<staff>${staff}</staff>` +
    (ties.length ? `<notations>${ties.map((t) => `<tied type="${t}"/>`).join("")}</notations>` : "") +
    `</note>`
  );
}

/** Reparte una mano en compases; las notas que cruzan la barra se ligan. */
function measures(track: RawTrack, bar: number, count: number, staff: number): string[] {
  const out: string[][] = Array.from({ length: count }, () => []);
  let at = 0;
  for (const [m, d] of track) {
    let left = d;
    let first = true;
    while (left > 1e-9) {
      const i = Math.floor(at / bar + 1e-9);
      const part = Math.min(left, (i + 1) * bar - at);
      const last = left - part <= 1e-9;
      const tie = m === 0 || (first && last) ? undefined : first ? "start" : last ? "stop" : "both";
      out[i].push(noteXml(m, part, staff, tie));
      at += part;
      left -= part;
      first = false;
    }
  }
  return out.map((notes) => notes.join(""));
}

/** MusicXML 4.0 `score-partwise` con una parte de piano (uno o dos pentagramas), `divisions` 2. */
export function songToMusicXml(song: SongDef): string {
  const bar = song.bar ?? 4;
  const tracks = hands(song);
  const length = Math.max(...tracks.map((t) => t.reduce((a, [, d]) => a + d, 0)));
  const count = Math.ceil(length / bar);
  const staves = tracks.map((t, i) => measures(t, bar, count, i + 1));
  const clefs = tracks.length === 2 ? `<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>` : `<clef><sign>G</sign><line>2</line></clef>`;
  const body = Array.from({ length: count }, (_, i) => {
    const head =
      i === 0
        ? `<attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>${bar}</beats><beat-type>4</beat-type></time>` +
          `<staves>${tracks.length}</staves>${clefs}</attributes>` +
          `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${song.tempo}</per-minute></metronome></direction-type><sound tempo="${song.tempo}"/></direction>`
        : "";
    const content = staves.map((s) => s[i]).join(`<backup><duration>${bar * 2}</duration></backup>`);
    return `<measure number="${i + 1}">${head}${content}</measure>`;
  }).join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n` +
    `<score-partwise version="4.0"><work><work-title>${esc(song.title)}</work-title></work>` +
    `<part-list><score-part id="P1"><part-name>Piano</part-name><score-instrument id="P1-I1"><instrument-name>Piano</instrument-name></score-instrument>` +
    `<midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>1</midi-program></midi-instrument></score-part></part-list>\n` +
    `<part id="P1">\n${body}\n</part></score-partwise>\n`
  );
}

/** Pieza de prueba en 2/4 a dos manos, con un compás de silencio en la izquierda (clarificación 2026-11-24). */
export const DOS_CUARTOS: SongDef = {
  id: "dos-cuartos",
  title: "Marcha en dos por cuatro",
  level: "Nivel 4 · Prueba",
  tempo: 100,
  bar: 2,
  r: [[67, 0.5], [67, 0.5], [69, 0.5], [67, 0.5], [72, 1], [71, 1], [67, 0.5], [67, 0.5], [69, 0.5], [67, 0.5], [74, 1], [72, 1]],
  l: [[48, 2], [55, 2], [0, 2], [55, 1], [48, 1]],
};

// Generadores de archivos MIDI y MusicXML a partir de un SongDef, para tests y para
// scripts/export-fixtures.mjs. Solo `import type`: node 24 lo carga sin compilar.
import type { SongDef, Track } from "../types";

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

const hands = (song: SongDef): Track[] => (song.l ? [song.r ?? [], song.l] : [song.n ?? []]);

/** Compás en negras y cifra: 6/8 son 3 negras. */
const meterOf = (song: SongDef) => (song.time === "6/8" ? { bar: 3, beats: 6, beatType: 8, pulse: 1.5 } : { bar: song.bar ?? 4, beats: song.bar ?? 4, beatType: 4, pulse: 1 });

/** Alturas de un evento (vacío si es silencio), de grave a aguda. */
const pitches = (nota: number | number[]): number[] => (Array.isArray(nota) ? [...nota].sort((a, b) => a - b) : nota === 0 ? [] : [nota]);

/** Une las notas ligadas (`tie`) en un solo evento con la duración sumada. */
function merged(track: Track): { m: number[]; d: number }[] {
  const out: { m: number[]; d: number; tie: boolean }[] = [];
  for (const [nota, d, opts] of track) {
    const m = pitches(nota);
    const prev = out[out.length - 1];
    if (prev?.tie && prev.m.join() === m.join()) {
      prev.d += d;
      prev.tie = !!opts?.tie;
    } else out.push({ m, d, tie: !!opts?.tie });
  }
  return out;
}

/** Eventos absolutos de una mano: [tick, bytes], con los note-off antes que los note-on al mismo tick. */
function handEvents(track: Track, channel: number, ppq: number): [number, number[]][] {
  const out: [number, number[]][] = [];
  let at = 0;
  for (const { m: ms, d } of merged(track)) {
    const len = Math.round(d * ppq);
    for (const m of ms) {
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

/** Meta de armadura (FF 59): sostenidos (+) o bemoles (−), modo mayor. */
export const keyMeta = (key: number) => meta(0x59, [key & 0xff, 0]);

/** MIDI formato 1: pista 0 con nombre, tempo, compás y armadura; una pista por mano (o una sola con `singleTrack`). */
export function songToMidi(song: SongDef, opts: { singleTrack?: boolean; ppq?: number } = {}): Uint8Array {
  const ppq = opts.ppq ?? 480;
  const { beats, beatType, pulse } = meterOf(song);
  const head = [nameMeta(song.title), tempoMeta(song.tempo * pulse), timeMeta(beats, beatType)];
  if (song.key) head.push(keyMeta(song.key));
  const conductor: MidiEventSpec[] = head.map((data) => ({ dt: 0, data }));
  const perHand = hands(song).map((t, ch) => handEvents(t, ch, ppq));
  const tracks = opts.singleTrack
    ? [toTrack(perHand.flat(), perHand.map((_, ch) => [0xc0 | ch, 0]))]
    : perHand.map((events, ch) => toTrack(events, [[0xc0 | ch, 0]]));
  return writeMidi([conductor, ...tracks], { format: 1, ppq });
}

/** Divisiones por negra del MusicXML: admiten corcheas, semicorcheas y tresillos. */
const DIV = 12;
const SHARPS: [string, number][] = [["C", 0], ["C", 1], ["D", 0], ["D", 1], ["E", 0], ["F", 0], ["F", 1], ["G", 0], ["G", 1], ["A", 0], ["A", 1], ["B", 0]];
const FLATS: [string, number][] = [["C", 0], ["D", -1], ["D", 0], ["E", -1], ["E", 0], ["F", 0], ["G", -1], ["G", 0], ["A", -1], ["A", 0], ["B", -1], ["B", 0]];
const TYPES: [number, string, boolean][] = [[4, "whole", false], [3, "half", true], [2, "half", false], [1.5, "quarter", true], [1, "quarter", false], [0.75, "eighth", true], [0.5, "eighth", false], [0.25, "16th", false]];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Una figura (nota, acorde o silencio) en MusicXML; las alturas de un acorde llevan <chord/>. */
function noteXml(ms: number[], beats: number, staff: number, key: number, tie?: "start" | "stop" | "both"): string {
  const triplet = Math.abs(beats * 3 - Math.round(beats * 3)) < 1e-9 && Math.abs(beats * 4 - Math.round(beats * 4)) > 1e-9;
  const nominal = triplet ? (beats * 3) / 2 : beats;
  const [type, dot] = (TYPES.find(([d]) => d <= nominal + 1e-9) ?? TYPES[TYPES.length - 1]).slice(1) as [string, boolean];
  const dur = Math.round(beats * DIV);
  const ties = tie === "both" ? ["stop", "start"] : tie ? [tie] : [];
  const names = key < 0 ? FLATS : SHARPS;
  const one = (m: number | null, chord: boolean) => {
    const pitch =
      m === null
        ? "<rest/>"
        : `<pitch><step>${names[m % 12][0]}</step>${names[m % 12][1] ? `<alter>${names[m % 12][1]}</alter>` : ""}<octave>${Math.floor((m - names[m % 12][1]) / 12) - 1}</octave></pitch>`;
    return (
      `<note>${chord ? "<chord/>" : ""}${pitch}<duration>${dur}</duration>${ties.map((t) => `<tie type="${t}"/>`).join("")}<voice>${staff}</voice>` +
      `<type>${type}</type>${dot ? "<dot/>" : ""}` +
      (triplet ? "<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>" : "") +
      `<staff>${staff}</staff>` +
      (ties.length ? `<notations>${ties.map((t) => `<tied type="${t}"/>`).join("")}</notations>` : "") +
      `</note>`
    );
  };
  return ms.length ? ms.map((m, i) => one(m, i > 0)).join("") : one(null, false);
}

/** Reparte una mano en compases; las notas que cruzan la barra (o van ligadas) se ligan. */
function measures(track: Track, bar: number, count: number, staff: number, keyAt: (i: number) => number): string[] {
  const out: string[][] = Array.from({ length: count }, () => []);
  let at = 0;
  for (const { m, d } of merged(track)) {
    let left = d;
    let first = true;
    while (left > 1e-9) {
      const i = Math.floor(at / bar + 1e-9);
      const part = Math.min(left, (i + 1) * bar - at);
      const last = left - part <= 1e-9;
      const tie = !m.length || (first && last) ? undefined : first ? "start" : last ? "stop" : "both";
      out[i].push(noteXml(m, part, staff, keyAt(i), tie));
      at += part;
      left -= part;
      first = false;
    }
  }
  return out.map((notes) => notes.join(""));
}

/** MusicXML 4.0 `score-partwise` con una parte de piano (uno o dos pentagramas), 12 divisiones por negra. */
export function songToMusicXml(song: SongDef): string {
  const { bar, beats, beatType, pulse } = meterOf(song);
  const tracks = hands(song);
  const length = Math.max(...tracks.map((t) => t.reduce((a, [, d]) => a + d, 0)));
  const count = Math.ceil(length / bar - 1e-9);
  const changes = new Map((song.keyChanges ?? []).map((c) => [c.at, c.key]));
  const keyAt = (i: number) => {
    let k = song.key ?? 0;
    for (const [at, key] of changes) if (at <= i) k = key;
    return k;
  };
  const staves = tracks.map((t, i) => measures(t, bar, count, i + 1, keyAt));
  const clefs = tracks.length === 2 ? `<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>` : `<clef><sign>G</sign><line>2</line></clef>`;
  const unit = pulse === 1.5 ? "<beat-unit>quarter</beat-unit><beat-unit-dot/>" : "<beat-unit>quarter</beat-unit>";
  const body = Array.from({ length: count }, (_, i) => {
    const head =
      i === 0
        ? `<attributes><divisions>${DIV}</divisions><key><fifths>${keyAt(0)}</fifths></key><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>` +
          `<staves>${tracks.length}</staves>${clefs}</attributes>` +
          `<direction placement="above"><direction-type><metronome>${unit}<per-minute>${song.tempo}</per-minute></metronome></direction-type><sound tempo="${song.tempo * pulse}"/></direction>`
        : changes.has(i)
          ? `<attributes><key><fifths>${changes.get(i)}</fifths></key></attributes>`
          : "";
    const content = staves.map((s) => s[i]).join(`<backup><duration>${bar * DIV}</duration></backup>`);
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

/**
 * Pieza de prueba con lo que exige la versión completa (007): Sol mayor, acordes en la
 * izquierda, un tresillo y una nota ligada a través de la barra.
 */
export const PRUEBA_COMPLETA: SongDef = {
  id: "prueba-completa",
  title: "Prueba completa",
  level: "Nivel 4 · Prueba",
  tempo: 80,
  key: 1,
  r: [[67, 1], [71, 1], [74, 1 / 3], [72, 1 / 3], [71, 1 / 3], [69, 1, { tie: true }],
    [69, 1], [66, 1], [67, 2]],
  l: [[[43, 47, 50], 2], [[43, 47, 50], 2], [[38, 42, 45], 2], [[43, 47, 50], 2]],
};

/** MusicXML de una mano con dos voces en el mismo pentagrama: no admite versión completa. */
export function twoVoicesXml(): string {
  const n = (step: string, octave: number, dur: number, voice: number) =>
    `<note><pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>${dur}</duration><voice>${voice}</voice><type>${dur === 2 ? "half" : "quarter"}</type><staff>1</staff></note>`;
  const measure =
    `<measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>` +
    n("E", 5, 2, 1) + n("D", 5, 2, 1) + `<backup><duration>4</duration></backup>` +
    n("C", 4, 1, 2) + n("E", 4, 1, 2) + n("G", 4, 1, 2) + n("E", 4, 1, 2) + `</measure>`;
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n<score-partwise version="4.0"><work><work-title>Dos voces</work-title></work>` +
    `<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${measure}</part></score-partwise>\n`
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

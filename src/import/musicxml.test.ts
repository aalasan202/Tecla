// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { SONGS } from "../music/songs";
import { convertPiece } from "../music/import/convert";
import { ImportError } from "../music/import/errors";
import { DOS_CUARTOS, songToMusicXml } from "../music/import/fixtures";
import { parseMusicXml } from "./musicxml";

const reason = (f: () => unknown) => {
  try {
    f();
  } catch (e) {
    return e instanceof ImportError ? e.reason : `otro: ${String(e)}`;
  }
  return "none";
};

const score = (measures: string, opts: { title?: string; parts?: string; program?: number; root?: string } = {}) => {
  const root = opts.root ?? "score-partwise";
  const program = opts.program ? `<midi-instrument id="P1-I1"><midi-program>${opts.program}</midi-program></midi-instrument>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<${root} version="4.0">${opts.title ? `<work><work-title>${opts.title}</work-title></work>` : ""}
<part-list><score-part id="P1"><part-name>Piano</part-name>${program}</score-part></part-list>
<part id="P1">${measures}</part>${opts.parts ?? ""}</${root}>`;
};
const n = (step: string, octave: number, dur: number, extra = "") =>
  `<note>${extra.includes("<chord/>") ? "<chord/>" : ""}<pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>${dur}</duration>${extra.replace("<chord/>", "")}</note>`;
const attrs = (beats = 4, divisions = 1) => `<attributes><divisions>${divisions}</divisions><time><beats>${beats}</beats><beat-type>4</beat-type></time></attributes>`;

describe("ida y vuelta MusicXML del repertorio (SC-002)", () => {
  it.each(SONGS.map((s) => [s.id, s] as const))("%s", (_id, s) => {
    const raw = parseMusicXml(songToMusicXml(s), `${s.id}.musicxml`);
    expect(raw.title).toBe(s.title);
    const c = convertPiece(raw);
    if (!c.ok) throw new Error(c.reason);
    expect(c.proposal.song.n).toEqual(s.n);
    expect(c.proposal.song.r).toEqual(s.r);
    expect(c.proposal.song.l).toEqual(s.l);
    expect(c.proposal.song.bar ?? 4).toBe(s.bar ?? 4);
    expect(c.proposal.song.tempo).toBe(Math.round(s.tempo / 5) * 5);
    expect(c.proposal.warnings).toEqual([]);
  });
});

describe("compás de 2/4 (clarificación 2026-11-24)", () => {
  it("ida y vuelta de la pieza de prueba en 2/4", () => {
    const raw = parseMusicXml(songToMusicXml(DOS_CUARTOS), "dos-cuartos.musicxml");
    expect(raw.times[0]).toMatchObject({ beats: 2, beatType: 4 });
    const c = convertPiece(raw);
    if (!c.ok) throw new Error(c.reason);
    expect(c.proposal.song).toMatchObject({ bar: 2, tempo: 100, r: DOS_CUARTOS.r, l: DOS_CUARTOS.l });
    expect(c.proposal.warnings).toEqual([]);
  });

  it("2/2 se sigue rechazando", () => {
    const xml = score(`<measure number="1"><attributes><divisions>1</divisions><time><beats>2</beats><beat-type>2</beat-type></time></attributes>${n("C", 4, 4)}</measure>`);
    const c = convertPiece(parseMusicXml(xml, "x.musicxml"));
    expect(c.ok ? "ok" : c.reason).toBe("timeSignature");
  });
});

describe("parseMusicXml", () => {
  it("lee acordes, backup, forward y el segundo pentagrama", () => {
    const xml = score(
      `<measure number="1">${attrs()}` +
        n("C", 4, 2, "<staff>1</staff>") + n("E", 4, 2, "<chord/><staff>1</staff>") + n("G", 4, 2, "<staff>1</staff>") +
        `<backup><duration>4</duration></backup><forward><duration>1</duration></forward>` +
        n("C", 3, 3, "<staff>2</staff>") +
        `</measure>`,
    );
    const raw = parseMusicXml(xml, "a.musicxml");
    expect(raw.parts).toHaveLength(2);
    expect(raw.parts[0]).toMatchObject({ staff: 1, notes: [{ pitch: 60, start: 0, dur: 2 }, { pitch: 64, start: 0, dur: 2 }, { pitch: 67, start: 2, dur: 2 }] });
    expect(raw.parts[1]).toMatchObject({ staff: 2, notes: [{ pitch: 48, start: 1, dur: 3 }] });
  });

  it("une dos negras ligadas en una blanca, también a través de la barra", () => {
    const xml = score(
      `<measure number="1">${attrs()}<note><rest/><duration>3</duration></note>` + n("D", 4, 1, `<tie type="start"/>`) + `</measure>` +
        `<measure number="2">` + n("D", 4, 1, `<tie type="stop"/>`) + n("E", 4, 3) + `</measure>`,
    );
    const raw = parseMusicXml(xml, "a.musicxml");
    expect(raw.parts[0].notes).toEqual([{ pitch: 62, start: 3, dur: 2 }, { pitch: 64, start: 5, dur: 3 }]);
  });

  it("ignora y cuenta las notas de adorno", () => {
    const xml = score(`<measure number="1">${attrs()}<note><grace/><pitch><step>B</step><octave>4</octave></pitch></note>${n("C", 5, 4)}</measure>`);
    const raw = parseMusicXml(xml, "a.musicxml");
    expect(raw.ignored.grace).toBe(1);
    expect(raw.parts[0].notes).toEqual([{ pitch: 72, start: 0, dur: 4 }]);
  });

  it("lee las alteraciones", () => {
    const xml = score(`<measure number="1">${attrs()}<note><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch><duration>4</duration></note></measure>`);
    expect(parseMusicXml(xml, "a.musicxml").parts[0].notes[0].pitch).toBe(66);
  });

  it("sin tempo lo deja indefinido (la conversión pondrá 90)", () => {
    const raw = parseMusicXml(score(`<measure number="1">${attrs()}${n("C", 4, 4)}</measure>`), "a.musicxml");
    expect(raw.tempo).toBeUndefined();
    const c = convertPiece(raw);
    expect(c.ok && c.proposal.song.tempo).toBe(90);
  });

  it("toma el tempo del metrónomo si no hay sound", () => {
    const dir = `<direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>72</per-minute></metronome></direction-type></direction>`;
    expect(parseMusicXml(score(`<measure number="1">${attrs()}${dir}${n("C", 4, 4)}</measure>`), "a.musicxml").tempo).toBe(72);
  });

  it("título de work-title, movement-title o el nombre del archivo", () => {
    const m = `<measure number="1">${attrs()}${n("C", 4, 4)}</measure>`;
    expect(parseMusicXml(score(m, { title: "Obra" }), "a.musicxml").title).toBe("Obra");
    expect(parseMusicXml(score(m).replace("<part-list>", "<movement-title>Mov</movement-title><part-list>"), "a.musicxml").title).toBe("Mov");
    expect(parseMusicXml(score(m), "Mi pieza.musicxml").title).toBe("Mi pieza");
  });

  it("completa la anacrusa con silencio al principio", () => {
    const xml = score(`<measure number="0" implicit="yes">${attrs(3)}${n("D", 5, 1)}</measure><measure number="1">${n("G", 4, 3)}</measure>`);
    const c = convertPiece(parseMusicXml(xml, "a.musicxml"));
    expect(c.ok && c.proposal.song.n).toEqual([[0, 2], [74, 1], [67, 3]]);
  });
});

describe("MusicXML no válidos", () => {
  it("XML mal formado → ilegible", () => {
    expect(reason(() => parseMusicXml("<score-partwise><part>", "a.xml"))).toBe("unreadable");
  });

  it("un XML que no es partitura → ilegible", () => {
    expect(reason(() => parseMusicXml("<html><body/></html>", "a.xml"))).toBe("unreadable");
  });

  it("score-timewise u opus → hay que exportar como partitura de una sola obra", () => {
    expect(reason(() => parseMusicXml(score("", { root: "score-timewise" }), "a.xml"))).toBe("notScore");
    expect(reason(() => parseMusicXml(`<?xml version="1.0"?><opus><title>Varias</title></opus>`, "a.xml"))).toBe("notScore");
  });

  it("dos partes con notas → solo piano a una o dos manos", () => {
    const m = `<measure number="1">${attrs()}${n("C", 4, 4)}</measure>`;
    const xml = score(m, { parts: `<part id="P2">${m}</part>` });
    expect(reason(() => parseMusicXml(xml, "a.xml"))).toBe("tooManyParts");
  });

  it("midi-program 41 (violín) → no es piano", () => {
    const raw = parseMusicXml(score(`<measure number="1">${attrs()}${n("C", 4, 4)}</measure>`, { program: 41 }), "a.xml");
    expect(raw.notPiano).toBe(true);
  });

  it("compás de 6/8 → la conversión lo rechaza", () => {
    const xml = score(`<measure number="1"><attributes><divisions>2</divisions><time><beats>6</beats><beat-type>8</beat-type></time></attributes>${n("C", 4, 6)}</measure>`);
    const c = convertPiece(parseMusicXml(xml, "a.xml"));
    expect(c.ok ? "ok" : c.reason).toBe("timeSignature");
  });
});

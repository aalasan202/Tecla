import { describe, expect, it } from "vitest";
import { SONGS } from "../songs";
import { buildScore } from "../score";
import type { SongDef } from "../types";
import { validateSong } from "../validate";
import { convertFull } from "./full";
import { PRUEBA_COMPLETA, songToMidi } from "./fixtures";
import { midiToRaw, parseMidi } from "./midi";
import type { FullCheck, RawNote, RawPiece } from "./types";

const viaMidi = (s: SongDef) => convertFull(midiToRaw(parseMidi(songToMidi(s)), `${s.id}.mid`));
const ok = (c: FullCheck) => {
  if (!c.ok) throw new Error(c.reason);
  return c;
};
const asSong = (c: Extract<FullCheck, { ok: true }>): SongDef => ({ ...c.song, id: "x", level: "" });
/** Lo que se toca: alturas, inicios, duraciones y manos. */
const played = (s: SongDef) => buildScore(s).notes.map(({ m, s: at, d, h }) => [m, at, d, h]);
const raw = (notes: RawNote[], extra: Partial<RawPiece> = {}): RawPiece => ({
  format: "musicxml",
  times: [],
  parts: [{ notes }],
  notPiano: false,
  ignored: { grace: 0, cue: 0 },
  ...extra,
});
const note = (pitch: number, start: number, dur: number, extra: Partial<RawNote> = {}): RawNote => ({ pitch, start, dur, ...extra });

describe("convertFull (007, historia 5)", () => {
  it("conserva acordes, armadura, tresillo y la nota ligada de la pieza de prueba", () => {
    const c = ok(viaMidi(PRUEBA_COMPLETA));
    expect(c.song.key).toBe(1);
    expect(c.song.l?.[0][0]).toEqual([43, 47, 50]);
    expect(played(asSong(c))).toEqual(played(PRUEBA_COMPLETA));
    expect(validateSong(asSong(c))).toEqual([]);
    expect(c.level).toBe(4);
  });

  it.each(["minueto", "oda-acordes", "cuna", "greensleeves"])("ida y vuelta MIDI de %s: mismas notas", (id) => {
    const s = SONGS.find((x) => x.id === id)!;
    const c = ok(viaMidi(s));
    expect(played(asSong(c))).toEqual(played(s));
    expect(c.song.tempo).toBe(Math.round(s.tempo / 5) * 5);
    expect(c.song.time).toBe(s.time);
    expect(c.song.key ?? 0).toBe(s.key ?? 0);
  });

  it("6/8: el tempo pasa a negras con puntillo por minuto", () => {
    const c = ok(convertFull(raw([note(60, 0, 1.5), note(62, 1.5, 1.5)], { times: [{ at: 0, beats: 6, beatType: 8 }], tempo: 90 })));
    expect(c.song.time).toBe("6/8");
    expect(c.song.tempo).toBe(60);
    expect(c.song.n).toEqual([[60, 1.5], [62, 1.5]]);
  });

  it("cuantiza a semicorchea o a tercio de pulso, lo más cercano", () => {
    const c = ok(convertFull(raw([note(60, 0, 0.34), note(62, 0.33, 0.33), note(64, 0.67, 0.33), note(65, 1, 0.26), note(67, 1.24, 2.76)])));
    expect(c.song.n?.map(([, d]) => d)).toEqual([1 / 3, 1 / 3, 1 / 3, 0.25, 2.75]);
  });

  it("toma la ortografía del original cuando no es la de por defecto", () => {
    const c = ok(convertFull(raw([note(61, 0, 2, { spell: "b" }), note(66, 2, 2, { spell: "#" })])));
    // Re♭ se fuerza; Fa♯ ya es la ortografía por defecto en Do
    expect(c.song.n).toEqual([[61, 2, { spell: "b" }], [66, 2]]);
  });

  it("varias voces en una mano → completa no disponible", () => {
    const c = convertFull(raw([note(76, 0, 2), note(67, 0, 1), note(64, 1, 1), note(74, 2, 2), note(67, 2, 2)]));
    expect(c).toEqual({ ok: false, reason: "voices" });
  });

  it("un legato pequeño no es otra voz", () => {
    const c = ok(convertFull(raw([note(60, 0, 1.1), note(62, 1, 1), note(64, 2, 2)])));
    expect(c.song.n).toEqual([[60, 1], [62, 1], [64, 2]]);
  });

  it("compás no admitido o que cambia → completa no disponible", () => {
    const melody = [note(60, 0, 5)];
    expect(convertFull(raw(melody, { times: [{ at: 0, beats: 5, beatType: 4 }] }))).toEqual({ ok: false, reason: "timeSignature" });
    expect(convertFull(raw(melody, { times: [{ at: 0, beats: 4, beatType: 4 }, { at: 4, beats: 3, beatType: 4 }] }))).toEqual({ ok: false, reason: "timeChange" });
  });

  it("armadura y sus cambios, por compás", () => {
    const c = ok(convertFull(raw([note(60, 0, 4), note(62, 4, 4), note(64, 8, 4)], { keys: [{ at: 0, key: 2 }, { at: 4, key: 2 }, { at: 8, key: -1 }] })));
    expect(c.song.key).toBe(2);
    expect(c.song.keyChanges).toEqual([{ at: 2, key: -1 }]);
  });
});

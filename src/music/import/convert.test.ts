import { describe, expect, it } from "vitest";
import { SONGS } from "../songs";
import type { SongDef } from "../types";
import { DURATIONS, convertPiece } from "./convert";
import { needsFullNotation } from "../validate";
import { DOS_CUARTOS, pedalMidi, songToMidi } from "./fixtures";
import { midiToRaw, parseMidi } from "./midi";
import type { ImportCheck, Proposal, RawNote, RawPart, RawPiece } from "./types";

const byId = (id: string) => SONGS.find((s) => s.id === id)!;
/** Piezas que la versión simplificada representa tal cual (sin acordes, ligaduras ni 6/8). */
const SIMPLE = SONGS.filter((s) => !needsFullNotation(s));
const note = (pitch: number, start: number, dur: number): RawNote => ({ pitch, start, dur });
const piece = (parts: RawPart[], extra: Partial<RawPiece> = {}): RawPiece => ({
  format: "midi",
  title: "Prueba",
  tempo: 90,
  times: [{ at: 0, beats: 4, beatType: 4 }],
  parts,
  notPiano: false,
  ignored: { grace: 0, cue: 0 },
  ...extra,
});
const ok = (c: ImportCheck): Proposal => {
  if (!c.ok) throw new Error(`rechazada: ${c.reason}`);
  return c.proposal;
};
const warning = (p: Proposal, kind: string) => p.warnings.find((w) => w.kind === kind);
const viaMidi = (s: SongDef, opts?: { singleTrack?: boolean }) => convertPiece(midiToRaw(parseMidi(songToMidi(s, opts)), `${s.id}.mid`));

/** Las mismas reglas que exige score.test.ts al repertorio. */
function expectValid(song: Proposal["song"]) {
  const bar = song.bar ?? 4;
  const tracks = song.l ? [song.r!, song.l] : [song.n!];
  const lengths = tracks.map((t) => t.reduce((a, [, d]) => a + d, 0));
  lengths.forEach((len) => expect(len % bar).toBe(0));
  expect(new Set(lengths).size).toBe(1);
  for (const t of tracks)
    for (const [m, d] of t) {
      expect(d).toBeGreaterThan(0);
      if (m !== 0) {
        expect(m).toBeGreaterThanOrEqual(21);
        expect(m).toBeLessThanOrEqual(108);
        expect(DURATIONS).toContain(d);
      }
    }
}

describe("ida y vuelta MIDI del repertorio (SC-002)", () => {
  it.each(SIMPLE.map((s) => [s.id, s] as const))("%s", (_id, s) => {
    const p = ok(viaMidi(s));
    expect(p.song.n).toEqual(s.n);
    expect(p.song.r).toEqual(s.r);
    expect(p.song.l).toEqual(s.l);
    expect(p.song.bar ?? 4).toBe(s.bar ?? 4);
    // SC-002 no incluye el tempo: se ajusta a pasos de 5 como el control de la lección (66 → 65)
    expect(p.song.tempo).toBe(Math.round(s.tempo / 5) * 5);
    expect(p.song.title).toBe(s.title);
    expect(p.warnings).toEqual([]);
    expectValid(p.song);
  });
});

describe("simplificaciones (FR-010)", () => {
  it("un acorde en la derecha deja la nota más aguda y avisa con su compás", () => {
    const p = ok(convertPiece(piece([{ notes: [note(60, 0, 4), note(72, 4, 1), note(76, 4, 1), note(79, 4, 1), note(72, 5, 3)] }, { notes: [note(48, 0, 4), note(43, 4, 4)] }])));
    expect(p.song.r).toEqual([[60, 4], [79, 1], [72, 3]]);
    expect(warning(p, "chords")?.bars).toEqual([2]);
    expectValid(p.song);
  });

  it("un acorde en la izquierda deja la más grave", () => {
    const p = ok(convertPiece(piece([{ notes: [note(72, 0, 4)] }, { notes: [note(48, 0, 4), note(52, 0, 4), note(55, 0, 4)] }])));
    expect(p.song.l).toEqual([[48, 4]]);
    expect(warning(p, "chords")?.bars).toEqual([1]);
  });

  it("las semicorcheas se cuantizan a corcheas y se avisa", () => {
    const notes = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map((s, i) => note(60 + i, s, 0.25));
    const p = ok(convertPiece(piece([{ notes: [...notes, note(72, 2, 2)] }])));
    const starts: number[] = [];
    let at = 0;
    for (const [m, d] of p.song.n!) {
      if (m) starts.push(at);
      at += d;
    }
    starts.forEach((s) => expect(s % 0.5).toBe(0));
    expect(warning(p, "durations")?.bars).toEqual([1]);
    expectValid(p.song);
  });

  it("un tresillo de corcheas se ajusta y el compás queda completo", () => {
    const t = 1 / 3;
    const p = ok(convertPiece(piece([{ notes: [note(60, 0, t), note(62, t, t), note(64, 2 * t, t), note(65, 1, 3)] }])));
    expect(warning(p, "durations")?.bars).toEqual([1]);
    expectValid(p.song);
  });

  it("una nota de 2 pulsos que empieza en el pulso 3 (desde 0) de un 4/4 se corta en la barra", () => {
    const p = ok(convertPiece(piece([{ notes: [note(60, 0, 3), note(62, 3, 2), note(64, 5, 3)] }])));
    expect(p.song.n).toEqual([[60, 3], [62, 1], [0, 1], [64, 3]]);
    expect(warning(p, "cutAtBar")?.bars).toEqual([1]);
    expectValid(p.song);
  });

  it("una nota de 2,5 pulsos queda en 2 y un silencio de 0,5", () => {
    const p = ok(convertPiece(piece([{ notes: [note(60, 0, 2.5), note(62, 3, 1)] }])));
    expect(p.song.n).toEqual([[60, 2], [0, 1], [62, 1]]);
    expect(warning(p, "durations")?.bars).toEqual([1]);
  });
});

describe("reparto de manos (FR-008)", () => {
  it("una sola parte con notas simultáneas se reparte por el Do central", () => {
    const p = ok(convertPiece(piece([{ notes: [note(64, 0, 2), note(48, 0, 4), note(60, 2, 2), note(59, 4, 4), note(67, 4, 4)] }])));
    expect(p.song.r).toEqual([[64, 2], [60, 2], [67, 4]]);
    expect(p.song.l).toEqual([[48, 4], [59, 4]]);
    expect(warning(p, "handsSplit")).toBeTruthy();
    expectValid(p.song);
  });

  it("una melodía en una sola pista queda a una mano aunque baje del Do central (Martinillo)", () => {
    const p = ok(viaMidi(byId("martinillo"), { singleTrack: true }));
    expect(p.song.n).toEqual(byId("martinillo").n);
    expect(p.song.n!.some(([m]) => m === 55)).toBe(true);
    expect(warning(p, "handsSplit")).toBeUndefined();
  });

  it("las dos manos mezcladas en una pista se reparten (Himno a dos manos)", () => {
    const p = ok(viaMidi(byId("oda2"), { singleTrack: true }));
    expect(p.song.r).toEqual(byId("oda2").r);
    expect(p.song.l).toEqual(byId("oda2").l);
    expect(warning(p, "handsSplit")).toBeTruthy();
  });

  it("todas graves y simultáneas → dos manos con la derecha en silencio", () => {
    const p = ok(convertPiece(piece([{ notes: [note(48, 0, 4), note(52, 0, 4), note(43, 4, 4), note(47, 4, 4)] }])));
    expect(p.song.r).toEqual([[0, 8]]);
    expect(p.song.l).toEqual([[48, 4], [43, 4]]);
    expectValid(p.song);
  });

  it("todas agudas y simultáneas → una mano", () => {
    const p = ok(convertPiece(piece([{ notes: [note(64, 0, 4), note(67, 0, 4)] }])));
    expect(p.song.n).toEqual([[67, 4]]);
    expect(p.song.l).toBeUndefined();
  });

  it("un solo pentagrama inferior → dos manos con la derecha en silencio", () => {
    const p = ok(convertPiece(piece([{ staff: 2, notes: [note(48, 0, 4)] }])));
    expect(p.song.r).toEqual([[0, 4]]);
    expect(p.song.l).toEqual([[48, 4]]);
  });
});

describe("avisos y ajustes", () => {
  it("si las simplificaciones tocan más de la mitad de los compases, avisa de que puede diferir", () => {
    const notes = [0, 4, 8].flatMap((s) => [note(60, s, 4), note(64, s, 4)]);
    const p = ok(convertPiece(piece([{ notes: [...notes, note(60, 12, 4)] }, { notes: [0, 4, 8, 12].map((s) => note(48, s, 4)) }])));
    expect(warning(p, "chords")?.bars).toEqual([1, 2, 3]);
    expect(warning(p, "farFromOriginal")).toBeTruthy();
  });

  it("ajusta el tempo al rango de la lección en pasos de 5", () => {
    const tempo = (t?: number) => ok(convertPiece(piece([{ notes: [note(60, 0, 4)] }], { tempo: t }))).song.tempo;
    expect(tempo(37)).toBe(40);
    expect(tempo(151)).toBe(140);
    expect(tempo(87)).toBe(85);
    expect(tempo(undefined)).toBe(90);
  });

  it("px 60 si más del 25 % son corcheas, si no 50", () => {
    const eighths = [0, 0.5, 1, 1.5].map((s) => note(60, s, 0.5));
    expect(ok(convertPiece(piece([{ notes: [...eighths, note(60, 2, 2)] }]))).song.px).toBe(60);
    expect(ok(convertPiece(piece([{ notes: [note(60, 0, 4)] }]))).song.px).toBe(50);
  });

  it("las notas de adorno ignoradas se avisan", () => {
    const p = ok(convertPiece(piece([{ notes: [note(60, 0, 4)] }], { ignored: { grace: 2, cue: 0 } })));
    expect(warning(p, "grace")).toBeTruthy();
  });

  it("compás de 3/4 y relleno final hasta el compás completo", () => {
    const p = ok(convertPiece(piece([{ notes: [note(67, 0, 1), note(69, 1, 1)] }], { times: [{ at: 0, beats: 3, beatType: 4 }] })));
    expect(p.song.bar).toBe(3);
    expect(p.song.n).toEqual([[67, 1], [69, 1], [0, 1]]);
  });
});

describe("rechazos (FR-003)", () => {
  const reason = (c: ImportCheck) => (c.ok ? "ok" : c.reason);
  const melody = [note(60, 0, 1), note(62, 1, 1)];

  it("sin notas → vacía", () => {
    expect(reason(convertPiece(piece([])))).toBe("empty");
    expect(reason(convertPiece(piece([{ notes: [] }])))).toBe("empty");
  });
  it("instrumento que no es piano", () => {
    expect(reason(convertPiece(piece([{ notes: melody }], { notPiano: true })))).toBe("notPiano");
  });
  it("tres partes con notas → demasiadas partes", () => {
    expect(reason(convertPiece(piece([{ notes: melody }, { notes: melody }, { notes: melody }])))).toBe("tooManyParts");
  });
  it("notas fuera del piano → badNotes con cuántas y en qué compases", () => {
    const c = convertPiece(piece([{ notes: [note(60, 0, 1), note(120, 1, 1), note(10, 4, 1)] }]));
    expect(c).toEqual({ ok: false, reason: "badNotes", detail: { count: 2, bars: [1, 2] } });
  });
  it("duración NaN o no positiva → badNotes", () => {
    expect(reason(convertPiece(piece([{ notes: [note(60, 0, NaN)] }])))).toBe("badNotes");
    expect(reason(convertPiece(piece([{ notes: [note(60, 0, 0)] }])))).toBe("badNotes");
    expect(reason(convertPiece(piece([{ notes: [note(60, 0, -1)] }])))).toBe("badNotes");
  });
  it("compases que no son 4/4, 3/4, 2/4 ni 6/8, o que cambian → timeSignature", () => {
    const with_ = (times: RawPiece["times"]) => reason(convertPiece(piece([{ notes: melody }], { times })));
    expect(with_([{ at: 0, beats: 9, beatType: 8 }])).toBe("timeSignature");
    expect(with_([{ at: 0, beats: 5, beatType: 4 }])).toBe("timeSignature");
    expect(with_([{ at: 0, beats: 6, beatType: 8 }, { at: 3, beats: 3, beatType: 4 }])).toBe("timeSignature");
    expect(with_([{ at: 0, beats: 6, beatType: 8 }])).toBe("ok");
    expect(with_([{ at: 0, beats: 2, beatType: 2 }])).toBe("timeSignature");
    expect(with_([{ at: 0, beats: 4, beatType: 4 }, { at: 4, beats: 3, beatType: 4 }])).toBe("timeSignature");
    expect(with_([{ at: 0, beats: 4, beatType: 4 }, { at: 4, beats: 2, beatType: 4 }])).toBe("timeSignature");
    expect(with_([{ at: 0, beats: 2, beatType: 4 }])).toBe("ok");
    expect(with_([])).toBe("ok");
  });
});

describe("piezas largas (FR-011)", () => {
  /** `bars` compases de 4/4 con una redonda cada uno. */
  const long = (bars: number) => piece([{ notes: Array.from({ length: bars }, (_, i) => note(60 + (i % 5), i * 4, 4)) }]);

  it("más de 300 compases → pesada", () => {
    expect(ok(convertPiece(long(301))).heavy).toBe(true);
  });
  it("más de 1 500 notas en menos de 300 compases → pesada", () => {
    const p = ok(convertPiece(piece([{ notes: Array.from({ length: 1501 }, (_, i) => note(60 + (i % 5), i * 0.5, 0.5)) }])));
    expect(p.metrics.bars).toBeLessThan(300);
    expect(p.heavy).toBe(true);
  });
  it("exactamente 300 compases y 1 500 notas → no pesada", () => {
    // 5 notas por compás: tres negras y dos corcheas
    const shape: [number, number][] = [[0, 1], [1, 1], [2, 1], [3, 0.5], [3.5, 0.5]];
    const notes = Array.from({ length: 300 }, (_, b) => shape.map(([s, d], i) => note(60 + i, b * 4 + s, d))).flat();
    const p = ok(convertPiece(piece([{ notes }])));
    expect(p.metrics.bars).toBe(300);
    expect(p.metrics.notes).toBe(1500);
    expect(p.heavy).toBe(false);
  });
});

describe("compás de 2/4 (clarificación 2026-11-24)", () => {
  const twoFour = (notes: RawNote[]) => piece([{ notes }], { times: [{ at: 0, beats: 2, beatType: 4 }] });

  it("una melodía en 2/4 da bar 2 y compases completos de 2 pulsos", () => {
    const p = ok(convertPiece(twoFour([note(60, 0, 1), note(62, 1, 1), note(64, 2, 0.5), note(65, 2.5, 0.5), note(67, 3, 1), note(69, 4, 1)])));
    expect(p.song.bar).toBe(2);
    expect(p.metrics.bar).toBe(2);
    expect(p.metrics.bars).toBe(3);
    expect(p.song.n!.reduce((a, [, d]) => a + d, 0) % 2).toBe(0);
    expectValid(p.song);
    expect(p.warnings).toEqual([]);
  });

  it("una redonda en el pulso 0 de un 2/4 queda en blanca y se avisa del corte en el compás 1", () => {
    const p = ok(convertPiece(twoFour([note(60, 0, 4), note(62, 4, 2)])));
    expect(p.song.n).toEqual([[60, 2], [0, 2], [62, 2]]);
    expect(warning(p, "cutAtBar")?.bars).toEqual([1]);
    expectValid(p.song);
  });

  it("ida y vuelta MIDI de la pieza de prueba en 2/4", () => {
    const p = ok(viaMidi(DOS_CUARTOS));
    expect(p.song).toMatchObject({ bar: 2, tempo: 100, r: DOS_CUARTOS.r, l: DOS_CUARTOS.l });
    expect(p.warnings).toEqual([]);
    expectValid(p.song);
  });
});

describe("pedal (009)", () => {
  const raw = () => midiToRaw(parseMidi(pedalMidi()), "p.mid");

  it("la versión simplificada lleva el pedal ajustado a sus notas", () => {
    const c = convertPiece(raw());
    expect(c.ok && c.proposal.song.pedal).toEqual([[0, 4], [4, 8]]);
  });

  it("pedal incoherente: se ajusta o se descarta, y la importación sigue siendo válida (SC-007)", () => {
    const c = convertPiece({ ...raw(), pedal: [[0.1, 3.9], [3, 50], [Number.NaN, 2], [6, 5]] });
    expect(c.ok).toBe(true);
    expect(c.ok && c.proposal.song.pedal).toEqual([[0, 8]]);
  });

  it("si no queda ningún tramo, no hay campo pedal", () => {
    const c = convertPiece({ ...raw(), pedal: [[0.1, 0.2]] });
    expect(c.ok && "pedal" in c.proposal.song).toBe(false);
  });
});

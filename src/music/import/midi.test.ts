import { describe, expect, it } from "vitest";
import { SONGS } from "../songs";
import { ImportError } from "./errors";
import { DOS_CUARTOS, nameMeta, pedalMidi, songToMidi, tempoMeta, writeMidi } from "./fixtures";
import { midiToRaw, parseMidi } from "./midi";

const byId = (id: string) => SONGS.find((s) => s.id === id)!;
const reason = (f: () => unknown) => {
  try {
    f();
  } catch (e) {
    return e instanceof ImportError ? e.reason : "other";
  }
  return "none";
};

describe("parseMidi", () => {
  it("lee cabecera, pistas, tempo, compás y nombre", () => {
    const midi = parseMidi(songToMidi(byId("oda2")));
    expect(midi.format).toBe(1);
    expect(midi.division).toBe(480);
    expect(midi.tracks).toHaveLength(3);
    expect(midi.tracks[0].name).toBe("Himno a la alegría a dos manos");
    const tempo = midi.tracks[0].events.find((e) => e.type === "tempo");
    expect(tempo && tempo.type === "tempo" && 60_000_000 / tempo.usPerQuarter).toBe(80);
    expect(midi.tracks[0].events.find((e) => e.type === "time")).toMatchObject({ beats: 4, beatType: 4 });
  });

  it("entiende running status y note-on con velocidad 0 como note-off", () => {
    const bytes = writeMidi([
      [
        { dt: 0, data: [0x90, 60, 90] },
        { dt: 480, data: [60, 0] }, // running status, velocidad 0
        { dt: 0, data: [62, 90] },
        { dt: 240, data: [62, 0] },
      ],
    ]);
    const raw = midiToRaw(parseMidi(bytes), "x.mid");
    expect(raw.parts).toHaveLength(1);
    expect(raw.parts[0].notes).toEqual([
      { pitch: 60, start: 0, dur: 1 },
      { pitch: 62, start: 1, dur: 0.5 },
    ]);
  });
});

describe("midiToRaw", () => {
  it("lee el compás de 2/4", () => {
    const raw = midiToRaw(parseMidi(songToMidi(DOS_CUARTOS)), "dos-cuartos.mid");
    expect(raw.times).toEqual([{ at: 0, beats: 2, beatType: 4 }]);
    expect(raw.parts).toHaveLength(2);
  });

  it("da dos partes en pulsos, con la derecha primero", () => {
    const raw = midiToRaw(parseMidi(songToMidi(byId("oda2"))), "oda2.mid");
    expect(raw.format).toBe("midi");
    expect(raw.title).toBe("Himno a la alegría a dos manos");
    expect(raw.tempo).toBe(80);
    expect(raw.times).toEqual([{ at: 0, beats: 4, beatType: 4 }]);
    expect(raw.parts).toHaveLength(2);
    expect(raw.parts[0].notes[0]).toEqual({ pitch: 64, start: 0, dur: 1 });
    expect(raw.parts[1].notes[0]).toEqual({ pitch: 48, start: 0, dur: 4 });
    expect(raw.notPiano).toBe(false);
  });

  it("la derecha es la parte más aguda aunque venga en la segunda pista", () => {
    const low = [{ dt: 0, data: [0x90, 48, 80] }, { dt: 1920, data: [0x80, 48, 0] }];
    const high = [{ dt: 0, data: [0x91, 72, 80] }, { dt: 1920, data: [0x81, 72, 0] }];
    const raw = midiToRaw(parseMidi(writeMidi([[{ dt: 0, data: nameMeta("Pieza") }], low, high])), "x.mid");
    expect(raw.parts.map((p) => p.notes[0].pitch)).toEqual([72, 48]);
    expect(raw.parts.map((p) => p.staff)).toEqual([1, 2]);
  });

  it("sin tempo usa 120 y sin compás deja la lista vacía; sin nombre, el del archivo", () => {
    const raw = midiToRaw(parseMidi(writeMidi([[{ dt: 0, data: [0x90, 60, 80] }, { dt: 480, data: [0x80, 60, 0] }]])), "mi pieza.mid");
    expect(raw.tempo).toBe(120);
    expect(raw.times).toEqual([]);
    expect(raw.title).toBe("mi pieza");
  });

  it("lee el tempo aunque no sea entero", () => {
    const raw = midiToRaw(parseMidi(writeMidi([[{ dt: 0, data: tempoMeta(87) }, { dt: 0, data: [0x90, 60, 80] }, { dt: 480, data: [0x80, 60, 0] }]])), "x.mid");
    expect(raw.tempo).toBeCloseTo(87, 2);
  });
});

describe("archivos MIDI no válidos", () => {
  it("bytes al azar → ilegible", () => {
    const bytes = Uint8Array.from({ length: 200 }, (_, i) => (i * 73 + 11) % 256);
    expect(reason(() => parseMidi(bytes))).toBe("unreadable");
  });

  it("un MIDI cortado a la mitad → ilegible", () => {
    const full = songToMidi(byId("oda"));
    expect(reason(() => parseMidi(full.slice(0, Math.floor(full.length / 2))))).toBe("unreadable");
  });

  it("una pista más larga que el archivo → ilegible", () => {
    const bytes = songToMidi(byId("cinco"));
    const view = new DataView(bytes.buffer);
    view.setUint32(18, 0x00ffffff); // longitud de la primera pista
    expect(reason(() => parseMidi(bytes))).toBe("unreadable");
  });

  it("división SMPTE → ilegible", () => {
    const bytes = songToMidi(byId("cinco"));
    bytes[12] = 0xe7;
    expect(reason(() => parseMidi(bytes))).toBe("unreadable");
  });

  it("notas en el canal 10 → no es piano", () => {
    const raw = midiToRaw(parseMidi(writeMidi([[{ dt: 0, data: [0x99, 36, 100] }, { dt: 240, data: [0x89, 36, 0] }]])), "bateria.mid");
    expect(raw.notPiano).toBe(true);
  });

  it("un violín (programa 40) en un canal con notas → no es piano", () => {
    const raw = midiToRaw(
      parseMidi(writeMidi([[{ dt: 0, data: [0xc0, 0x28] }, { dt: 0, data: [0x90, 67, 80] }, { dt: 480, data: [0x80, 67, 0] }]])),
      "violin.mid",
    );
    expect(raw.notPiano).toBe(true);
  });

  it("un programa distinto en un canal sin notas no importa", () => {
    const raw = midiToRaw(
      parseMidi(writeMidi([[{ dt: 0, data: [0xc5, 0x28] }, { dt: 0, data: [0x90, 67, 80] }, { dt: 480, data: [0x80, 67, 0] }]])),
      "x.mid",
    );
    expect(raw.notPiano).toBe(false);
  });
});

describe("armadura en MIDI (007)", () => {
  it("lee el meta FF 59 como armadura con su pulso", () => {
    const minueto = SONGS.find((s) => s.id === "minueto")!;
    const raw = midiToRaw(parseMidi(songToMidi(minueto)), "m.mid");
    expect(raw.keys).toEqual([{ at: 0, key: 1 }]);
    const flats = midiToRaw(parseMidi(songToMidi({ ...minueto, key: -3 })), "m.mid");
    expect(flats.keys).toEqual([{ at: 0, key: -3 }]);
  });

  it("sin meta de armadura no hay keys", () => {
    expect(midiToRaw(parseMidi(songToMidi(SONGS[0])), "c.mid").keys).toBeUndefined();
  });
});

describe("pedal (009)", () => {
  it("parseMidi emite el pedal de CC 64 con el umbral 64", () => {
    const events = parseMidi(pedalMidi()).tracks[0].events.filter((e) => e.type === "pedal");
    expect(events.map((e) => e.type === "pedal" && [e.tick, e.down])).toEqual([[0, true], [240, true], [1920, false], [1920, true], [3840, false]]);
  });

  it("midiToRaw da los tramos en pulsos e ignora el pisado repetido", () => {
    expect(midiToRaw(parseMidi(pedalMidi()), "p.mid").pedal).toEqual([[0, 4], [4, 8]]);
  });

  it("un pisado sin levantar dura hasta el final de la pista", () => {
    const raw = midiToRaw(parseMidi(pedalMidi({ open: true })), "p.mid");
    expect(raw.pedal?.[1][0]).toBe(4);
    expect(raw.pedal?.[1][1]).toBeCloseTo(8, 2);
  });

  it("sin pedal, no hay campo pedal", () => {
    expect(midiToRaw(parseMidi(songToMidi(byId("oda2"))), "o.mid").pedal).toBeUndefined();
  });
});

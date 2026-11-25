import { describe, expect, it } from "vitest";
import { parseMidiMessage } from "./message";

describe("parseMidiMessage (009)", () => {
  it("note-on con velocidad es una nota; con velocidad 0, nada", () => {
    expect(parseMidiMessage([0x90, 60, 100])).toEqual({ type: "note", note: 60, velocity: 100 });
    expect(parseMidiMessage([0x90, 60, 0])).toBeNull();
    expect(parseMidiMessage([0x80, 60, 40])).toBeNull();
  });

  it("CC 64 es el pedal: ≥ 64 pisado, < 64 levantado, en cualquier canal", () => {
    expect(parseMidiMessage([0xb0, 64, 127])).toEqual({ type: "pedal", down: true });
    expect(parseMidiMessage([0xb0, 64, 63])).toEqual({ type: "pedal", down: false });
    expect(parseMidiMessage([0xb3, 64, 64])).toEqual({ type: "pedal", down: true });
  });

  it("otros controles y mensajes vacíos se ignoran", () => {
    expect(parseMidiMessage([0xb0, 7, 100])).toBeNull();
    expect(parseMidiMessage([])).toBeNull();
  });
});

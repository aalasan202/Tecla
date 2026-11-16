import { describe, expect, it } from "vitest";
import { PIANO_SAMPLES, playbackRate, sampleFor, sampleUrl } from "./samples";

describe("muestras de piano", () => {
  it("hay 30 muestras de La0 (21) a Do8 (108), cada 3 semitonos", () => {
    expect(PIANO_SAMPLES).toHaveLength(30);
    PIANO_SAMPLES.forEach((s, i) => expect(s.midi).toBe(21 + 3 * i));
  });

  it("los archivos se llaman como en el banco Salamander", () => {
    const files = PIANO_SAMPLES.map((s) => s.file);
    expect(files.slice(0, 5)).toEqual(["A0.mp3", "C1.mp3", "Ds1.mp3", "Fs1.mp3", "A1.mp3"]);
    expect(files).toContain("C4.mp3");
    expect(files).toContain("A4.mp3");
    expect(files[files.length - 1]).toBe("C8.mp3");
  });

  it("cada nota de las 88 teclas usa una muestra a un semitono como mucho", () => {
    for (let m = 21; m <= 108; m++) expect(Math.abs(sampleFor(m).midi - m)).toBeLessThanOrEqual(1);
  });

  it("la nota exacta usa su propia muestra", () => {
    expect(sampleFor(60).file).toBe("C4.mp3");
    expect(sampleFor(69).file).toBe("A4.mp3");
  });

  it("fuera del teclado se usa la muestra del extremo", () => {
    expect(sampleFor(10).midi).toBe(21);
    expect(sampleFor(120).midi).toBe(108);
  });

  it("la afinación ajusta la velocidad un semitono por 2^(1/12)", () => {
    expect(playbackRate(60, 60)).toBe(1);
    expect(playbackRate(61, 60)).toBeCloseTo(2 ** (1 / 12), 10);
    expect(playbackRate(59, 60)).toBeCloseTo(2 ** (-1 / 12), 10);
    expect(playbackRate(72, 60)).toBeCloseTo(2, 10);
  });

  it("la URL usa la base de la app", () => {
    expect(sampleUrl("./", "A0.mp3")).toBe("./samples/piano/A0.mp3");
    expect(sampleUrl("/Tecla/", "C4.mp3")).toBe("/Tecla/samples/piano/C4.mp3");
  });
});

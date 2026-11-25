import { describe, expect, it } from "vitest";
import { renderText } from "./text";

describe("renderText", () => {
  it("marcas por número MIDI en Do‑Re‑Mi y en C‑D‑E", () => {
    expect(renderText("Pulsa {60} y luego {67}", "latin")).toBe("Pulsa Do y luego Sol");
    expect(renderText("Pulsa {60} y luego {67}", "english")).toBe("Pulsa C y luego G");
  });
  it("marcas por nombre", () => {
    expect(renderText("{C}, {G} y {B}", "latin")).toBe("Do, Sol y Si");
    expect(renderText("{C}, {G} y {B}", "english")).toBe("C, G y B");
  });
  it("sostenidos por número", () => {
    expect(renderText("{61}", "english")).toBe("C♯");
  });
  it("un texto sin marcas queda igual", () => {
    expect(renderText("Sin notas, {sin marca}", "latin")).toBe("Sin notas, {sin marca}");
  });
});

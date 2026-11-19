import { describe, expect, it } from "vitest";
import { fitScale, keyScroll } from "./layout";

describe("fitScale", () => {
  it("reduce el contenido al alto disponible", () => {
    expect(fitScale(200, 120)).toBeCloseTo(0.6);
  });
  it("nunca amplía", () => {
    expect(fitScale(100, 300)).toBe(1);
  });
  it("no baja del mínimo", () => {
    expect(fitScale(400, 100)).toBe(0.55);
    expect(fitScale(400, 100, 0.3)).toBeCloseTo(0.3);
  });
  it("tolera medidas vacías", () => {
    expect(fitScale(0, 120)).toBe(1);
    expect(fitScale(200, 0)).toBe(1);
    expect(fitScale(-5, 120)).toBe(1);
  });
});

describe("keyScroll", () => {
  // 27 teclas blancas de 28 (756) en 600 visibles: como «canon» en un móvil
  const base = { whites: 27, keyW: 28, view: 600 };

  it("sin teclas guiadas no se mueve", () => {
    expect(keyScroll({ ...base, targets: [], left: 123 })).toBe(123);
  });
  it("no se mueve si las guiadas ya se ven con margen", () => {
    expect(keyScroll({ ...base, targets: [3], left: 0 })).toBe(0);
    expect(keyScroll({ ...base, targets: [10], left: 100 })).toBe(100);
  });
  it("trae una tecla de la derecha con una de margen", () => {
    expect(keyScroll({ ...base, targets: [25], left: 0 })).toBe(26 * 28 + 28 - 600);
  });
  it("trae una tecla de la izquierda con una de margen", () => {
    expect(keyScroll({ ...base, targets: [1], left: 156 })).toBe(0);
    // 40 teclas (1120): se puede desplazar hasta 520
    expect(keyScroll({ ...base, whites: 40, targets: [10], left: 400 })).toBe(9 * 28);
  });
  it("respeta los límites del teclado", () => {
    expect(keyScroll({ ...base, targets: [26], left: 0 })).toBe(756 - 600);
    expect(keyScroll({ ...base, targets: [0], left: 50 })).toBe(0);
    expect(keyScroll({ whites: 10, keyW: 28, view: 600, targets: [9], left: 0 })).toBe(0);
  });
  it("si las guiadas no caben juntas, prioriza la más grave", () => {
    const left = keyScroll({ ...base, targets: [24, 2], left: 150 });
    expect(left).toBe(1 * 28);
    expect(left).toBeLessThanOrEqual(2 * 28);
  });
  it("con margen 0 basta con que la tecla se vea entera", () => {
    expect(keyScroll({ ...base, targets: [25], left: 0, margin: 0 })).toBe(26 * 28 - 600);
  });
});

import { describe, expect, it } from "vitest";
import { fnv1a64 } from "./hash";

describe("fnv1a64", () => {
  it("coincide con los valores de referencia", () => {
    expect(fnv1a64(new Uint8Array())).toBe("cbf29ce484222325");
    expect(fnv1a64(new Uint8Array([0x61]))).toBe("af63dc4c8601ec8c");
  });

  it("siempre da 16 cifras hex y cambia con un byte", () => {
    const a = new Uint8Array([1, 2, 3, 4]);
    const b = new Uint8Array([1, 2, 3, 5]);
    expect(fnv1a64(a)).toMatch(/^[0-9a-f]{16}$/);
    expect(fnv1a64(a)).not.toBe(fnv1a64(b));
  });
});

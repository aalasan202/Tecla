/**
 * Huella FNV-1a de 64 bits, en 16 cifras hexadecimales (sin crypto.subtle, que exige https).
 * Se calcula en cuatro trozos de 16 bits: con BigInt un archivo de 5 MB tardaría segundos.
 * Primo FNV de 64 bits = 2^40 + 0x1b3.
 */
export function fnv1a64(bytes: Uint8Array): string {
  let h0 = 0x2325;
  let h1 = 0x8422;
  let h2 = 0x9ce4;
  let h3 = 0xcbf2;
  for (let i = 0; i < bytes.length; i++) {
    h0 ^= bytes[i];
    const t0 = h0 * 0x1b3;
    const t1 = h1 * 0x1b3 + (t0 >>> 16);
    const t2 = h2 * 0x1b3 + h0 * 0x100 + (t1 >>> 16);
    const t3 = h3 * 0x1b3 + h1 * 0x100 + (t2 >>> 16);
    h0 = t0 & 0xffff;
    h1 = t1 & 0xffff;
    h2 = t2 & 0xffff;
    h3 = t3 & 0xffff;
  }
  return [h3, h2, h1, h0].map((x) => x.toString(16).padStart(4, "0")).join("");
}

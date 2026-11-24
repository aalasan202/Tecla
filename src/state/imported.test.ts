import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addImported, editImported, findByHash, imported, removeImported, type ImportMeta } from "./imported";
import { progress, recordStars } from "./progress";
import type { Proposal } from "../music/import/types";

const proposal: Proposal = {
  song: { title: "Original", tempo: 90, px: 50, n: [[60, 4]] },
  metrics: { bar: 4, bars: 1, notes: 1, twoHands: false, accidentals: 0, rightSpan: 1, eighthShare: 0, simultaneousShare: 0 },
  level: 1,
  warnings: [{ kind: "chords", bars: [1] }],
  heavy: false,
};
const meta: ImportMeta = { format: "midi", fileName: "pieza.mid", size: 10, hash: "0123abcd89ef4567" };
const bytes = new Uint8Array([1, 2, 3]);

function fakeDeps(fail = false) {
  const saved = new Map<string, Uint8Array>();
  return {
    saved,
    putOriginal: vi.fn(async (id: string, b: Uint8Array) => {
      if (fail) throw new DOMException("lleno", "QuotaExceededError");
      saved.set(id, b);
    }),
    deleteOriginal: vi.fn(async (id: string) => void saved.delete(id)),
  };
}

beforeEach(() => {
  const map = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  });
  imported.set({ songs: [] });
  progress.set({ best: {}, last: null, days: {} });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("addImported", () => {
  it("guarda el original y luego la pieza con su id, título y nivel", async () => {
    const deps = fakeDeps();
    const res = await addImported(proposal, meta, bytes, { title: "Mi pieza", level: 2 }, deps);
    expect(res).toEqual({ ok: true, id: "imp-0123abcd" });
    expect(deps.saved.get("imp-0123abcd")).toBe(bytes);
    const [song] = imported.get().songs;
    expect(song.def).toMatchObject({ id: "imp-0123abcd", title: "Mi pieza", level: "Nivel 2 · Importada de MIDI", tempo: 90 });
    expect(song.source).toEqual({ format: "midi", fileName: "pieza.mid", size: 10 });
    expect(song.hash).toBe(meta.hash);
    expect(song.warnings).toEqual(proposal.warnings);
  });

  it("dice «de MusicXML» para MusicXML", async () => {
    await addImported(proposal, { ...meta, format: "musicxml" }, bytes, { title: "X", level: 3 }, fakeDeps());
    expect(imported.get().songs[0].def.level).toBe("Nivel 3 · Importada de MusicXML");
  });

  it("si no cabe el original → noSpace y nada guardado", async () => {
    const res = await addImported(proposal, meta, bytes, { title: "X", level: 1 }, fakeDeps(true));
    expect(res).toEqual({ ok: false, reason: "noSpace" });
    expect(imported.get().songs).toEqual([]);
  });

  it("si no cabe la pieza en localStorage → borra el original y devuelve noSpace (FR-016)", async () => {
    const deps = fakeDeps();
    vi.spyOn(imported, "set").mockReturnValueOnce(false);
    const res = await addImported(proposal, meta, bytes, { title: "X", level: 1 }, deps);
    expect(res).toEqual({ ok: false, reason: "noSpace" });
    expect(deps.deleteOriginal).toHaveBeenCalledWith("imp-0123abcd");
    expect(deps.saved.size).toBe(0);
    expect(imported.get().songs).toEqual([]);
  });

  it("otra copia del mismo archivo → id con -2, -3 y título con (2), (3)", async () => {
    const deps = fakeDeps();
    await addImported(proposal, meta, bytes, { title: "Pieza", level: 1 }, deps);
    const b = await addImported(proposal, meta, bytes, { title: "Pieza", level: 1 }, deps);
    const c = await addImported(proposal, meta, bytes, { title: "Pieza", level: 1 }, deps);
    expect(b).toEqual({ ok: true, id: "imp-0123abcd-2" });
    expect(c).toEqual({ ok: true, id: "imp-0123abcd-3" });
    expect(imported.get().songs.map((s) => s.def.title)).toEqual(["Pieza", "Pieza (2)", "Pieza (3)"]);
  });
});

describe("findByHash", () => {
  it("encuentra la importada con ese archivo", async () => {
    expect(findByHash(meta.hash)).toBeUndefined();
    await addImported(proposal, meta, bytes, { title: "X", level: 1 }, fakeDeps());
    expect(findByHash(meta.hash)?.def.id).toBe("imp-0123abcd");
  });
});

describe("editImported", () => {
  beforeEach(async () => {
    await addImported(proposal, meta, bytes, { title: "Antes", level: 1 }, fakeDeps());
    recordStars("imp-0123abcd", 2);
  });

  it("cambia título y número de nivel, conserva id y estrellas", () => {
    expect(editImported("imp-0123abcd", { title: " Nuevo ", level: 2 })).toBe(true);
    const [song] = imported.get().songs;
    expect(song.def).toMatchObject({ id: "imp-0123abcd", title: "Nuevo", level: "Nivel 2 · Importada de MIDI" });
    expect(progress.get().best["imp-0123abcd"]).toBe(2);
  });

  it("un título vacío o solo espacios no cambia nada", () => {
    expect(editImported("imp-0123abcd", { title: "   " })).toBe(false);
    expect(imported.get().songs[0].def.title).toBe("Antes");
  });

  it("una pieza del repertorio no se edita", () => {
    expect(editImported("oda", { title: "Otra" })).toBe(false);
  });
});

describe("removeImported", () => {
  it("quita la pieza, su original y sus estrellas", async () => {
    const deps = fakeDeps();
    await addImported(proposal, meta, bytes, { title: "X", level: 1 }, deps);
    recordStars("imp-0123abcd", 3);
    recordStars("oda", 1);
    await removeImported("imp-0123abcd", deps);
    expect(imported.get().songs).toEqual([]);
    expect(deps.deleteOriginal).toHaveBeenCalledWith("imp-0123abcd");
    expect(progress.get().best).toEqual({ oda: 1 });
  });
});

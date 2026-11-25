import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addImported, editImported, ensureFull, findByHash, imported, removeImported, setVersion, type ImportMeta } from "./imported";
import { allSongs, findSong, repertoireStars, resolveSongId } from "./library";
import { progress, recordStars } from "./progress";
import type { FullCheck, Proposal, RawPiece } from "../music/import/types";
import { buildScore } from "../music/score";

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

describe("versión completa (007, historia 5)", () => {
  const full: FullCheck = { ok: true, song: { title: "Original", tempo: 90, n: [[[60, 64, 67], 4]] }, level: 4, warnings: [] };
  const rawPiece: RawPiece = { format: "midi", times: [], parts: [{ notes: [{ pitch: 60, start: 0, dur: 4 }, { pitch: 64, start: 0, dur: 4 }] }], notPiano: false, ignored: { grace: 0, cue: 0 } };
  const fullDeps = (bytes?: Uint8Array) => ({ getOriginal: vi.fn(async () => bytes), readRaw: vi.fn(async () => rawPiece) });

  it("al importar guarda las dos versiones y la elegida, cada una con su nivel", async () => {
    await addImported(proposal, meta, bytes, { title: "Mía", level: 3, full, version: "full" }, fakeDeps());
    const [song] = imported.get().songs;
    expect(song.version).toBe("full");
    expect(song.def.level).toBe("Nivel 1 · Importada de MIDI");
    expect(song.full).toMatchObject({ def: { id: "imp-0123abcd.full", title: "Mía", level: "Nivel 3 · Importada de MIDI" }, level: 4 });
    expect(allSongs().at(-1)!.id).toBe("imp-0123abcd.full");
  });

  it("si la completa no está disponible se guarda el motivo y queda la simplificada", async () => {
    await addImported(proposal, meta, bytes, { title: "Mía", level: 2, full: { ok: false, reason: "voices" }, version: "full" }, fakeDeps());
    const [song] = imported.get().songs;
    expect(song.version).toBeUndefined();
    expect(song.full).toEqual({ unavailable: "voices" });
    expect(setVersion("imp-0123abcd", "full")).toBe(false);
  });

  it("una importada de 006 sigue en la simplificada; ensureFull la calcula desde el original", async () => {
    await addImported(proposal, meta, bytes, { title: "Vieja", level: 1 }, fakeDeps());
    expect(imported.get().songs[0].full).toBeUndefined();
    expect(resolveSongId("imp-0123abcd")).toBe("imp-0123abcd");
    const deps = fullDeps(bytes);
    expect(await ensureFull("imp-0123abcd", deps)).toBe("ok");
    expect(deps.readRaw).toHaveBeenCalledWith(bytes, "pieza.mid");
    expect(imported.get().songs[0].full).toMatchObject({ def: { id: "imp-0123abcd.full", n: [[[60, 64], 4]] } });
    // ya calculada: no vuelve a leer el original
    expect(await ensureFull("imp-0123abcd", deps)).toBe("ok");
    expect(deps.getOriginal).toHaveBeenCalledTimes(1);
  });

  it("sin original no guarda nada y se puede reintentar", async () => {
    await addImported(proposal, meta, bytes, { title: "Vieja", level: 1 }, fakeDeps());
    expect(await ensureFull("imp-0123abcd", fullDeps(undefined))).toBe("unreadable");
    expect(imported.get().songs[0].full).toBeUndefined();
  });

  it("cambiar de versión conserva las estrellas de cada una (SC-008)", async () => {
    await addImported(proposal, meta, bytes, { title: "Mía", level: 1, full }, fakeDeps());
    recordStars("imp-0123abcd", 2);
    expect(setVersion("imp-0123abcd", "full")).toBe(true);
    expect(resolveSongId("imp-0123abcd")).toBe("imp-0123abcd.full");
    expect(progress.get().best["imp-0123abcd.full"] ?? 0).toBe(0);
    recordStars("imp-0123abcd.full", 3);
    expect(setVersion("imp-0123abcd.full", "simple")).toBe(true);
    expect(resolveSongId("imp-0123abcd.full")).toBe("imp-0123abcd");
    expect(progress.get().best).toMatchObject({ "imp-0123abcd": 2, "imp-0123abcd.full": 3 });
    expect(findSong("imp-0123abcd.full")?.n).toEqual([[[60, 64, 67], 4]]);
    expect(repertoireStars(progress.get().best)).toBe(0);
  });

  it("editar cambia el título de las dos y el nivel solo de la versión editada", async () => {
    await addImported(proposal, meta, bytes, { title: "Mía", level: 1, full }, fakeDeps());
    expect(editImported("imp-0123abcd.full", { title: "Nueva", level: 2 })).toBe(true);
    const [song] = imported.get().songs;
    expect(song.def).toMatchObject({ title: "Nueva", level: "Nivel 1 · Importada de MIDI" });
    expect(song.full).toMatchObject({ def: { title: "Nueva", level: "Nivel 2 · Importada de MIDI" } });
  });

  it("borrar quita las estrellas de las dos versiones y «Continuar» si apuntaba a la completa", async () => {
    const deps = fakeDeps();
    await addImported(proposal, meta, bytes, { title: "Mía", level: 1, full }, deps);
    recordStars("imp-0123abcd", 1);
    recordStars("imp-0123abcd.full", 3);
    progress.set((p) => ({ ...p, last: { songId: "imp-0123abcd.full", mode: "play", hands: "both", progress: 0.5, at: 1 } }));
    await removeImported("imp-0123abcd.full", deps);
    expect(imported.get().songs).toEqual([]);
    expect(progress.get().best).toEqual({});
    expect(progress.get().last).toBeNull();
    expect(deps.deleteOriginal).toHaveBeenCalledWith("imp-0123abcd");
  });
});

describe("pedal en piezas importadas (009)", () => {
  const withPedal: Proposal = { ...proposal, song: { title: "Con pedal", tempo: 90, px: 50, n: [[60, 2], [62, 2]], pedal: [[0, 2], [2, 4]] } };

  it("se guarda con la pieza y se conserva al editar su nivel; solo se usa desde el nivel 3", async () => {
    const res = await addImported(withPedal, meta, bytes, { title: "P", level: 3 }, fakeDeps());
    if (!res.ok) throw new Error("no se guardó");
    const def = () => imported.get().songs[0].def;
    expect(def().pedal).toEqual([[0, 2], [2, 4]]);
    expect(buildScore(def()).pedals).toEqual([[0, 2], [2, 4]]);

    expect(editImported(res.id, { level: 2 })).toBe(true);
    expect(def().pedal).toEqual([[0, 2], [2, 4]]);
    expect(buildScore(def()).pedals).toEqual([]);

    editImported(res.id, { level: 3 });
    expect(buildScore(def()).pedals).toEqual([[0, 2], [2, 4]]);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import type { Attempt } from "../stats/types";

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    map,
  };
}

async function load() {
  vi.resetModules();
  return import("./history");
}

const attempt = (over: Partial<Attempt> = {}): Omit<Attempt, "at"> => ({
  key: "song:oda",
  src: "song",
  title: "Himno",
  mode: "play",
  hands: "both",
  twoHands: false,
  tempo: 80,
  score: 0.8,
  stars: 2,
  counts: true,
  ...over,
});

describe("almacén del historial (011)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("recordAttempt guarda en tecla-history y actualiza el resumen", async () => {
    const storage = fakeStorage();
    vi.stubGlobal("localStorage", storage);
    const { history, recordAttempt } = await load();
    recordAttempt(attempt(), 1000);
    expect(history.get().attempts).toEqual([{ ...attempt(), at: 1000 }]);
    expect(history.get().pieces["song:oda"].count).toBe(1);
    expect(JSON.parse(storage.map.get("tecla-history")!).attempts).toHaveLength(1);
  });

  it("forgetHistory quita los intentos y el resumen de esa pieza", async () => {
    vi.stubGlobal("localStorage", fakeStorage());
    const { history, recordAttempt, forgetHistory } = await load();
    recordAttempt(attempt(), 1);
    recordAttempt(attempt({ key: "song:otra" }), 2);
    forgetHistory("song:oda");
    expect(history.get().attempts.map((a) => a.key)).toEqual(["song:otra"]);
    expect(Object.keys(history.get().pieces)).toEqual(["song:otra"]);
  });

  it("reset lo vacía todo", async () => {
    vi.stubGlobal("localStorage", fakeStorage());
    const { history, recordAttempt } = await load();
    recordAttempt(attempt(), 1);
    history.set({ cheered: { record: "2026-11-27" } });
    history.reset();
    expect(history.get()).toEqual({ attempts: [], pieces: {}, cheered: {} });
  });

  it("al cargar descarta entradas mal formadas", async () => {
    const good = { ...attempt(), at: 5 };
    const raw = { attempts: [good, { ...good, key: "" }, { ...good, at: "x" }, { ...good, score: 3 }], pieces: { x: 1 }, cheered: null };
    vi.stubGlobal("localStorage", fakeStorage({ "tecla-history": JSON.stringify(raw) }));
    const { history } = await load();
    expect(history.get()).toEqual({ attempts: [good], pieces: {}, cheered: {} });
  });

  it("un JSON corrupto da un almacén vacío sin errores", async () => {
    vi.stubGlobal("localStorage", fakeStorage({ "tecla-history": "{no es json" }));
    const { history } = await load();
    expect(history.get().attempts).toEqual([]);
  });

  it("forgetSong borra también el historial de la pieza", async () => {
    vi.stubGlobal("localStorage", fakeStorage());
    vi.resetModules();
    const { recordAttempt, history } = await import("./history");
    const { forgetSong } = await import("./progress");
    recordAttempt(attempt({ key: "song:imp-1" }), 1);
    recordAttempt(attempt({ key: "song:oda" }), 2);
    forgetSong("imp-1");
    expect(history.get().attempts.map((a) => a.key)).toEqual(["song:oda"]);
  });
});

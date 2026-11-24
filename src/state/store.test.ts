import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore } from "./store";

function fakeStorage(fail = false) {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (fail) throw new DOMException("lleno", "QuotaExceededError");
      map.set(k, v);
    },
    removeItem: (k: string) => void map.delete(k),
  };
}

describe("createStore.set", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("devuelve true y guarda cuando hay espacio", () => {
    const storage = fakeStorage();
    vi.stubGlobal("localStorage", storage);
    const store = createStore("k", { a: 1 });
    expect(store.set({ a: 2 })).toBe(true);
    expect(JSON.parse(storage.map.get("k")!)).toEqual({ a: 2 });
  });

  it("devuelve false si localStorage falla, pero actualiza la memoria y avisa a los suscriptores", () => {
    vi.stubGlobal("localStorage", fakeStorage(true));
    const store = createStore("k", { a: 1 });
    const seen: number[] = [];
    store.subscribe(() => seen.push(store.get().a));
    expect(store.set({ a: 2 })).toBe(false);
    expect(store.get().a).toBe(2);
    expect(seen).toEqual([2]);
  });
});

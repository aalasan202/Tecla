import { afterEach, describe, expect, it, vi } from "vitest";

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

async function loadSettings() {
  vi.resetModules();
  return (await import("./settings")).settings;
}

describe("ajuste Aprender a tempo", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("los ajustes guardados antes de existir la opción la cargan desactivada", async () => {
    vi.stubGlobal("localStorage", fakeStorage({ "tecla-settings": JSON.stringify({ notation: "latin", showNames: true }) }));
    const settings = await loadSettings();
    expect(settings.get().learnAtTempo).toBe(false);
  });

  it("se recuerda entre sesiones", async () => {
    vi.stubGlobal("localStorage", fakeStorage());
    (await loadSettings()).set({ learnAtTempo: true });
    expect((await loadSettings()).get().learnAtTempo).toBe(true);
  });
});

describe("explicación del pedal (009)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sale una vez: por defecto no vista, también con ajustes antiguos", async () => {
    vi.stubGlobal("localStorage", fakeStorage({ "tecla-settings": JSON.stringify({ notation: "latin", learnAtTempo: true }) }));
    expect((await loadSettings()).get().pedalHelpSeen).toBe(false);
  });

  it("al cerrarla se recuerda", async () => {
    vi.stubGlobal("localStorage", fakeStorage());
    (await loadSettings()).set({ pedalHelpSeen: true });
    expect((await loadSettings()).get().pedalHelpSeen).toBe(true);
  });
});

describe("objetivo diario (011)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("por defecto está desactivado, también con ajustes antiguos", async () => {
    vi.stubGlobal("localStorage", fakeStorage({ "tecla-settings": JSON.stringify({ notation: "latin" }) }));
    expect((await loadSettings()).get().dailyGoal).toBe(0);
  });

  it("se recuerda entre sesiones", async () => {
    vi.stubGlobal("localStorage", fakeStorage());
    (await loadSettings()).set({ dailyGoal: 15 });
    expect((await loadSettings()).get().dailyGoal).toBe(15);
  });

  it("un valor no válido se trata como desactivado", async () => {
    vi.stubGlobal("localStorage", fakeStorage({ "tecla-settings": JSON.stringify({ dailyGoal: 7 }) }));
    expect((await loadSettings()).get().dailyGoal).toBe(0);
  });
});

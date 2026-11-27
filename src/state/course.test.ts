import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

async function load() {
  vi.resetModules();
  return import("./course");
}

describe("progreso del Curso", () => {
  beforeEach(() => vi.stubGlobal("localStorage", fakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it("guarda la mejor marca de estrellas", async () => {
    const { course, recordCourseStars } = await load();
    recordCourseStars("l-pulso", 2);
    recordCourseStars("l-pulso", 1);
    expect(course.get().best["l-pulso"]).toBe(2);
    recordCourseStars("l-pulso", 3);
    expect(course.get().best["l-pulso"]).toBe(3);
  });

  it("marca consejos vistos y niveles abiertos por prueba", async () => {
    const { course, markSeen, markLevelTest } = await load();
    markSeen("consejo-postura");
    markLevelTest(3);
    expect(course.get().seen).toEqual({ "consejo-postura": true });
    expect(course.get().tests).toEqual({ "3": true });
  });

  it("las escalas guardan estrellas por escalón de tempo", async () => {
    const { course, recordScaleStars } = await load();
    recordScaleStars("escala-c-R", 1, 3);
    expect(course.get().best["escala-c-R@1"]).toBe(3);
  });

  it("recuerda el último elemento y los 6 más recientes, sin repetir el último", async () => {
    const { course, touchCourse } = await load();
    for (const id of ["a", "b", "b", "c", "d", "e", "f", "g"]) touchCourse(id);
    expect(course.get().last?.itemId).toBe("g");
    expect(course.get().last?.at).toBeGreaterThan(0);
    expect(course.get().recent).toEqual(["b", "c", "d", "e", "f", "g"]);
  });

  it("se guarda en localStorage, se recupera y se reinicia", async () => {
    const first = await load();
    first.recordCourseStars("l-pulso", 3);
    expect(JSON.parse(localStorage.getItem("tecla-course")!).best["l-pulso"]).toBe(3);
    const again = await load();
    expect(again.course.get().best["l-pulso"]).toBe(3);
    again.course.reset();
    expect(again.course.get()).toEqual({ best: {}, seen: {}, skipped: {}, last: null, tests: {}, recent: [] });
  });

  it("un almacén de 010 (sin pruebas ni recientes) carga con los valores por defecto", async () => {
    vi.stubGlobal("localStorage", fakeStorage({ "tecla-course": JSON.stringify({ best: { "l-pulso": 2 }, seen: {}, skipped: { u1: true }, last: null }) }));
    const { course } = await load();
    expect(course.get()).toMatchObject({ best: { "l-pulso": 2 }, skipped: { u1: true }, tests: {}, recent: [] });
  });
});

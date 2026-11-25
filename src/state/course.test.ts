import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function fakeStorage() {
  const map = new Map<string, string>();
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

  it("marca consejos vistos y unidades saltadas", async () => {
    const { course, markSeen, markSkipped } = await load();
    markSeen("consejo-postura");
    markSkipped(["u1", "u2"]);
    expect(course.get().seen).toEqual({ "consejo-postura": true });
    expect(course.get().skipped).toEqual({ u1: true, u2: true });
  });

  it("recuerda el último elemento con su hora", async () => {
    const { course, touchCourse } = await load();
    touchCourse("l-pulso");
    const last = course.get().last;
    expect(last?.itemId).toBe("l-pulso");
    expect(last?.at).toBeGreaterThan(0);
  });

  it("se guarda en localStorage, se recupera y se reinicia", async () => {
    const first = await load();
    first.recordCourseStars("l-pulso", 3);
    expect(JSON.parse(localStorage.getItem("tecla-course")!).best["l-pulso"]).toBe(3);
    const again = await load();
    expect(again.course.get().best["l-pulso"]).toBe(3);
    again.course.reset();
    expect(again.course.get()).toEqual({ best: {}, seen: {}, skipped: {}, last: null });
  });
});

import { describe, expect, it, vi } from "vitest";
import { dayKey, formatDuration, lastWeek, streak } from "./progress";
import { parseRoute, hrefFor, type Route } from "../router";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);

describe("racha", () => {
  const today = day(2026, 11, 15);
  it("cuenta días seguidos hasta hoy", () => {
    const days = { [dayKey(day(2026, 11, 13))]: 60, [dayKey(day(2026, 11, 14))]: 60, [dayKey(today)]: 60 };
    expect(streak(days, today)).toBe(3);
  });
  it("si hoy aún no has practicado, cuenta desde ayer", () => {
    const days = { [dayKey(day(2026, 11, 14))]: 60 };
    expect(streak(days, today)).toBe(1);
  });
  it("un hueco corta la racha", () => {
    const days = { [dayKey(day(2026, 11, 12))]: 60, [dayKey(today)]: 60 };
    expect(streak(days, today)).toBe(1);
  });
  it("cruza el cambio de mes", () => {
    const days = { [dayKey(day(2026, 10, 31))]: 60, [dayKey(day(2026, 11, 1))]: 60 };
    expect(streak(days, day(2026, 11, 1))).toBe(2);
  });
});

describe("semana y duraciones", () => {
  it("devuelve 7 días terminando hoy", () => {
    const w = lastWeek({}, day(2026, 11, 15));
    expect(w).toHaveLength(7);
    expect(w[6].key).toBe("2026-11-15");
    expect(w[0].key).toBe("2026-11-09");
  });
  it("formatea minutos y horas", () => {
    expect(formatDuration(90)).toBe("2 min");
    expect(formatDuration(3900)).toBe("1 h 5 min");
  });
});

describe("rutas", () => {
  const routes: Route[] = [
    { name: "home" },
    { name: "songs" },
    { name: "lesson", songId: "oda2" },
    { name: "piano" },
    { name: "progress" },
    { name: "settings" },
    { name: "course" },
    { name: "courseItem", itemId: "l-pulso" },
    { name: "courseTest", unitId: "u2" },
  ];
  it.each(routes.map((r) => [r.name, r] as const))("%s va y vuelve", (_n, r) => {
    expect(parseRoute(hrefFor(r))).toEqual(r);
  });
  it("una dirección desconocida lleva al inicio", () => {
    expect(parseRoute("#loquesea")).toEqual({ name: "home" });
  });
});

describe("forgetSong", () => {
  it("quita las estrellas de la pieza y «Continuar» si era ella, sin tocar lo demás", async () => {
    const { progress, forgetSong } = await import("./progress");
    const last = { songId: "x", mode: "play" as const, hands: "both" as const, progress: 0.5, at: 1 };
    progress.set({ best: { x: 2, oda: 3 }, last, days: { "2026-11-20": 60 } });
    forgetSong("x");
    expect(progress.get()).toEqual({ best: { oda: 3 }, last: null, days: { "2026-11-20": 60 } });
  });

  it("conserva «Continuar» si apunta a otra pieza", async () => {
    const { progress, forgetSong } = await import("./progress");
    const last = { songId: "oda", mode: "learn" as const, hands: "R" as const, progress: 0.1, at: 2 };
    progress.set({ best: { x: 1, oda: 3 }, last, days: {} });
    forgetSong("x");
    expect(progress.get().last).toEqual(last);
    expect(progress.get().best).toEqual({ oda: 3 });
  });
});

describe("avisos al sumar práctica (011)", () => {
  async function fresh() {
    vi.resetModules();
    const p = await import("./progress");
    const h = await import("./history");
    const s = await import("./settings");
    return { ...p, ...h, settings: s.settings };
  }
  const now = day(2026, 11, 27);

  it("al batir el récord de racha avisa una vez al día", async () => {
    const { progress, addPractice, notice, history } = await fresh();
    progress.set({ days: { [dayKey(day(2026, 11, 25))]: 60, [dayKey(day(2026, 11, 26))]: 60 } });
    addPractice(30, now);
    expect(notice.get()?.kind).toBe("record");
    expect(notice.get()?.text).toContain("3 días");
    expect(history.get().cheered.record).toBe("2026-11-27");
    notice.clear();
    addPractice(30, now);
    expect(notice.get()).toBeNull();
  });

  it("al cruzar el objetivo diario avisa una vez", async () => {
    const { addPractice, notice, settings, history } = await fresh();
    settings.set({ dailyGoal: 5 });
    addPractice(200, now);
    expect(notice.get()).toBeNull();
    addPractice(200, now);
    expect(notice.get()).toMatchObject({ kind: "goal", text: "¡Objetivo de hoy cumplido!" });
    expect(history.get().cheered.goal).toBe("2026-11-27");
    notice.clear();
    addPractice(200, now);
    expect(notice.get()).toBeNull();
  });

  it("sin objetivo no hay aviso de objetivo", async () => {
    const { addPractice, notice } = await fresh();
    addPractice(3600, now);
    expect(notice.get()).toBeNull();
  });
});

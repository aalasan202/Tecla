import { describe, expect, it } from "vitest";
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
  ];
  it.each(routes.map((r) => [r.name, r] as const))("%s va y vuelve", (_n, r) => {
    expect(parseRoute(hrefFor(r))).toEqual(r);
  });
  it("una dirección desconocida lleva al inicio", () => {
    expect(parseRoute("#loquesea")).toEqual({ name: "home" });
  });
});

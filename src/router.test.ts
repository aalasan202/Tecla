import { describe, expect, it } from "vitest";
import { hrefFor, parseRoute, type Route } from "./router";

describe("rutas de Progreso (011)", () => {
  const routes: Route[] = [
    { name: "progress" },
    { name: "progress", tab: "history" },
    { name: "progress", tab: "pieces" },
    { name: "piece", key: "song:oda2" },
    { name: "piece", key: "course:test:u2" },
    { name: "piece", key: "song:imp-abc/1.full" },
  ];
  it.each(routes.map((r) => [hrefFor(r), r] as const))("%s va y vuelve", (_h, r) => {
    expect(parseRoute(hrefFor(r))).toEqual(r);
  });
  it("las pestañas tienen direcciones en español", () => {
    expect(hrefFor({ name: "progress", tab: "history" })).toBe("#progreso/historial");
    expect(hrefFor({ name: "progress", tab: "pieces" })).toBe("#progreso/piezas");
  });
  it("una pestaña desconocida abre Resumen", () => {
    expect(parseRoute("#progreso/loquesea")).toEqual({ name: "progress" });
  });
  it("una ficha sin clave abre Resumen", () => {
    expect(parseRoute("#progreso/pieza")).toEqual({ name: "progress" });
  });
});

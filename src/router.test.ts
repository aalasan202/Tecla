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

describe("rutas del Curso por niveles (012)", () => {
  const routes: Route[] = [
    { name: "course" },
    { name: "course", level: 3, path: "technique" },
    { name: "course", level: 1, path: "songs" },
    { name: "courseItem", itemId: "l-pulso" },
    { name: "courseTest", level: 3 },
  ];
  it.each(routes.map((r) => [hrefFor(r), r] as const))("%s va y vuelve", (_h, r) => {
    expect(parseRoute(hrefFor(r))).toEqual(r);
  });
  it("los caminos van en español", () => {
    expect(hrefFor({ name: "course", level: 3, path: "technique" })).toBe("#curso/nivel/3/tecnica");
  });
  it("la prueba antigua de la unidad 2 lleva a la del nivel 2", () => {
    expect(parseRoute("#curso/prueba/u2")).toEqual({ name: "courseTest", level: 2 });
  });
  it("un nivel o camino desconocido abre el Curso", () => {
    expect(parseRoute("#curso/nivel/7/tecnica")).toEqual({ name: "course" });
    expect(parseRoute("#curso/nivel/2/otra")).toEqual({ name: "course" });
    expect(parseRoute("#curso/prueba/1")).toEqual({ name: "course" });
  });
});

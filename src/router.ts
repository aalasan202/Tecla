import { useSyncExternalStore } from "react";

/** Rutas por hash (#canciones, #leccion/oda2…): funcionan en GitHub Pages y con el botón Atrás. */
export type Route =
  | { name: "home" }
  | { name: "songs" }
  | { name: "lesson"; songId: string }
  | { name: "piano" }
  /** Sin `tab`: la pestaña Resumen (011, FR-025). */
  | { name: "progress"; tab?: ProgressTab }
  | { name: "piece"; key: string }
  | { name: "settings" }
  | { name: "course" }
  | { name: "courseItem"; itemId: string }
  | { name: "courseTest"; unitId: string };

export type ProgressTab = "history" | "pieces";
const TAB_PATH: Record<ProgressTab, string> = { history: "historial", pieces: "piezas" };

export function parseRoute(hash: string): Route {
  const [path, arg, arg2] = hash.replace(/^#\/?/, "").split("/");
  switch (path) {
    case "curso":
      if (arg === "prueba" && arg2) return { name: "courseTest", unitId: decodeURIComponent(arg2) };
      return arg ? { name: "courseItem", itemId: decodeURIComponent(arg) } : { name: "course" };
    case "canciones":
      return { name: "songs" };
    case "leccion":
      return arg ? { name: "lesson", songId: decodeURIComponent(arg) } : { name: "songs" };
    case "piano":
      return { name: "piano" };
    case "progreso": {
      if (arg === "pieza" && arg2) return { name: "piece", key: decodeURIComponent(arg2) };
      const tab = (Object.keys(TAB_PATH) as ProgressTab[]).find((t) => TAB_PATH[t] === arg);
      return tab ? { name: "progress", tab } : { name: "progress" };
    }
    case "ajustes":
      return { name: "settings" };
    default:
      return { name: "home" };
  }
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case "home":
      return "#";
    case "songs":
      return "#canciones";
    case "lesson":
      return `#leccion/${encodeURIComponent(route.songId)}`;
    case "piano":
      return "#piano";
    case "progress":
      return route.tab ? `#progreso/${TAB_PATH[route.tab]}` : "#progreso";
    case "piece":
      return `#progreso/pieza/${encodeURIComponent(route.key)}`;
    case "settings":
      return "#ajustes";
    case "course":
      return "#curso";
    case "courseItem":
      return `#curso/${encodeURIComponent(route.itemId)}`;
    case "courseTest":
      return `#curso/prueba/${encodeURIComponent(route.unitId)}`;
  }
}

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash, () => "");
  return parseRoute(hash);
}

// si ya se ha navegado dentro de la app, Atrás vuelve a la pantalla anterior; si se entró por un enlace, va al destino por defecto
let navigatedInApp = false;
if (typeof window !== "undefined") window.addEventListener("hashchange", () => (navigatedInApp = true));

export function goBack(fallback: Route = { name: "home" }): void {
  if (navigatedInApp && history.length > 1) history.back();
  else location.hash = hrefFor(fallback);
}

import { useSyncExternalStore } from "react";

/** Rutas por hash (#canciones, #leccion/oda2…): funcionan en GitHub Pages y con el botón Atrás. */
export type Route =
  | { name: "home" }
  | { name: "songs" }
  | { name: "lesson"; songId: string }
  | { name: "piano" }
  | { name: "progress" }
  | { name: "settings" };

export function parseRoute(hash: string): Route {
  const [path, arg] = hash.replace(/^#\/?/, "").split("/");
  switch (path) {
    case "canciones":
      return { name: "songs" };
    case "leccion":
      return arg ? { name: "lesson", songId: decodeURIComponent(arg) } : { name: "songs" };
    case "piano":
      return { name: "piano" };
    case "progreso":
      return { name: "progress" };
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
      return "#progreso";
    case "settings":
      return "#ajustes";
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

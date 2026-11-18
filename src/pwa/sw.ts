import { useSyncExternalStore } from "react";

/**
 * Service worker (lo genera vite-plugin-pwa en el build): registro, «lista sin conexión» y
 * estado de la red. Nunca lanza errores: si algo falla, la app sigue funcionando con conexión.
 */
export interface PwaStatus {
  /** Hay un service worker activo con toda la app guardada. */
  offlineReady: boolean;
  /** Hay una versión nueva instalada esperando a que el alumno la acepte. */
  updateWaiting: boolean;
  online: boolean;
}

let status: PwaStatus = {
  offlineReady: false,
  updateWaiting: false,
  online: typeof navigator === "undefined" ? true : navigator.onLine,
};
const listeners = new Set<() => void>();

function set(patch: Partial<PwaStatus>): void {
  status = { ...status, ...patch };
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const usePwaStatus = (): PwaStatus => useSyncExternalStore(subscribe, () => status, () => status);

/** El uso sin conexión solo existe en el build de producción y en navegadores con service worker. */
export const offlineSupported = (): boolean =>
  import.meta.env.PROD && typeof navigator !== "undefined" && "serviceWorker" in navigator;

if (typeof window !== "undefined") {
  window.addEventListener("online", () => set({ online: true }));
  window.addEventListener("offline", () => set({ online: false }));
}

let started = false;

function warn(error: unknown): void {
  console.warn("Tecla: no se pudo preparar el uso sin conexión; la app sigue funcionando con conexión.", error);
}

/** Marca la app como lista sin conexión cuando este service worker se active. */
function readyWhenActivated(worker: ServiceWorker): void {
  worker.addEventListener("statechange", () => {
    if (worker.state === "activated") set({ offlineReady: true });
  });
}

/** Una versión nueva queda instalada y esperando: se ofrece al alumno, nunca se aplica sola. */
function waitingWhenInstalled(worker: ServiceWorker): void {
  worker.addEventListener("statechange", () => {
    if (worker.state === "installed" && navigator.serviceWorker.controller) set({ updateWaiting: true });
  });
}

const UPDATE_EVERY_MS = 60 * 60 * 1000;
let registration: ServiceWorkerRegistration | null = null;
let lastCheck = Date.now();

function watch(reg: ServiceWorkerRegistration): void {
  registration = reg;
  if (reg.active) set({ offlineReady: true });
  if (reg.waiting && navigator.serviceWorker.controller) set({ updateWaiting: true });
  // primera preparación: aún no hay ninguno activo
  if (reg.installing && !reg.active) readyWhenActivated(reg.installing);
  else if (reg.installing) waitingWhenInstalled(reg.installing);
  reg.addEventListener("updatefound", () => {
    const worker = reg.installing;
    if (!worker) return;
    // sin controller es la primera preparación, no una actualización
    if (!reg.active) readyWhenActivated(worker);
    else waitingWhenInstalled(worker);
  });

  // apps instaladas que se quedan abiertas días: buscar versión nueva al volver, como mucho cada hora
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || Date.now() - lastCheck < UPDATE_EVERY_MS) return;
    lastCheck = Date.now();
    reg.update().catch(() => undefined); // sin conexión: ya se comprobará
  });
}

/** Activa la versión en espera y recarga cuando toma el control. Solo por acción del alumno. */
export function applyUpdate(): void {
  const waiting = registration?.waiting;
  if (!waiting) return;
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });
  waiting.postMessage({ type: "SKIP_WAITING" });
}

/** Registra ./sw.js en producción si hay soporte; en otro caso no hace nada. */
export function registerServiceWorker(): void {
  if (started || !offlineSupported()) return;
  started = true;
  const start = () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).then(watch, warn);
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}

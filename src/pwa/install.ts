import { useSyncExternalStore } from "react";

/**
 * Instalar Tecla como app: qué ofrecer en Ajustes según el navegador. Las decisiones son funciones
 * puras (install.test.ts); el resto escucha los eventos del navegador.
 */
export type InstallOption = "installed" | "button" | "ios-instructions" | "unsupported";

export interface InstallEnv {
  /** Abierta desde el icono (display-mode: standalone o navigator.standalone en iOS). */
  standalone: boolean;
  /** El navegador ofreció instalar (se guardó beforeinstallprompt). */
  hasPrompt: boolean;
  isIOS: boolean;
}

/** Prioridad: installed > button > ios-instructions > unsupported. */
export function installOption(env: InstallEnv): InstallOption {
  if (env.standalone) return "installed";
  if (env.hasPrompt) return "button";
  if (env.isIOS) return "ios-instructions";
  return "unsupported";
}

/** iPhone/iPad, incluido iPadOS, que se identifica como un Mac con pantalla táctil. */
export function isIOSDevice(ua: string, platform: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  return platform === "MacIntel" && maxTouchPoints > 1;
}

/** No está en lib.dom: Chrome y Edge lo disparan cuando la app se puede instalar. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let option: InstallOption = "unsupported";
let started = false;
const listeners = new Set<() => void>();

function isStandalone(): boolean {
  return (
    installed ||
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function update(): void {
  option = installOption({
    standalone: isStandalone(),
    hasPrompt: deferred !== null,
    isIOS: isIOSDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints ?? 0),
  });
  listeners.forEach((l) => l());
}

/** Empieza a escuchar los eventos de instalación. Se llama una vez en main.tsx, antes de montar React. */
export function initInstall(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // se ofrece desde Ajustes, no con el aviso del navegador
    deferred = e as BeforeInstallPromptEvent;
    update();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    update();
  });
  window.matchMedia?.("(display-mode: standalone)").addEventListener?.("change", update);
  update();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useInstallOption = (): InstallOption => useSyncExternalStore(subscribe, () => option, () => option);

/** Muestra el diálogo nativo de instalación; resuelve true si se aceptó. No lanza errores. */
export async function promptInstall(): Promise<boolean> {
  const event = deferred;
  if (!event) return false;
  // el evento solo se puede usar una vez, se acepte o no
  deferred = null;
  update();
  try {
    await event.prompt();
    return (await event.userChoice).outcome === "accepted";
  } catch {
    return false;
  }
}

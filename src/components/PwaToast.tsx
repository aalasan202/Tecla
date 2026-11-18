import { useEffect, useState } from "react";
import type { Route } from "../router";
import { applyUpdate, usePwaStatus } from "../pwa/sw";

const READY_KEY = "tecla-offline-ready";
const READY_MS = 5000;

function readyShown(): boolean {
  try {
    return localStorage.getItem(READY_KEY) === "true";
  } catch {
    return false;
  }
}

function markReadyShown(): void {
  try {
    localStorage.setItem(READY_KEY, "true");
  } catch {
    /* sin almacenamiento: se volverá a avisar */
  }
}

/**
 * Avisos discretos del modo sin conexión: «ya funciona sin conexión» y «hay una versión nueva».
 * El de actualización no aparece durante una lección y nunca recarga sin que el alumno lo pida.
 */
export function PwaToast({ route }: { route: Route }) {
  const { offlineReady, updateWaiting } = usePwaStatus();
  const [showReady, setShowReady] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  // la primera vez que la app queda guardada en el dispositivo
  useEffect(() => {
    if (!offlineReady || readyShown()) return;
    markReadyShown();
    setShowReady(true);
  }, [offlineReady]);

  useEffect(() => {
    if (!showReady) return;
    const t = setTimeout(() => setShowReady(false), READY_MS);
    return () => clearTimeout(t);
  }, [showReady]);

  if (updateWaiting && !updateDismissed && route.name !== "lesson") {
    return (
      <div className="toast" role="status">
        <span>Hay una versión nueva</span>
        <button type="button" className="btn primary" onClick={applyUpdate}>
          Actualizar
        </button>
        <button type="button" className="btn ghost" onClick={() => setUpdateDismissed(true)}>
          Ahora no
        </button>
      </div>
    );
  }

  if (!showReady) return null;
  return (
    <div className="toast" role="status">
      <span>Tecla ya funciona sin conexión</span>
      <button type="button" className="toast-close" aria-label="Cerrar" onClick={() => setShowReady(false)}>
        ×
      </button>
    </div>
  );
}

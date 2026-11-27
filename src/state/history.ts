import { useSyncExternalStore } from "react";
import { createStore } from "./store";
import { addAttempt, validAttempts, validPieces } from "../stats/attempts";
import type { Attempt, HistoryData, PieceKey } from "../stats/types";

/** Historial de intentos y resumen por pieza (011). Separado de `tecla-progress` (research R4). */
export const history = createStore<HistoryData>("tecla-history", { attempts: [], pieces: {}, cheered: {} }, undefined, (v) => ({
  attempts: validAttempts(v.attempts),
  pieces: validPieces(v.pieces),
  cheered: v.cheered && typeof v.cheered === "object" ? v.cheered : {},
}));

export function recordAttempt(a: Omit<Attempt, "at">, at: number = Date.now()): void {
  history.set((h) => addAttempt(h, { ...a, at }));
}

/** Al borrar una pieza importada: fuera sus intentos y su resumen. */
export function forgetHistory(key: PieceKey): void {
  history.set((h) => {
    if (!h.pieces[key] && !h.attempts.some((a) => a.key === key)) return {};
    const pieces = { ...h.pieces };
    delete pieces[key];
    return { attempts: h.attempts.filter((a) => a.key !== key), pieces };
  });
}

export const useHistory = (): HistoryData => history.use();

/** Aviso breve (récord, objetivo): solo en memoria, lo muestra `Toast`. */
export interface Notice {
  kind: "record" | "goal";
  text: string;
  id: number;
}

let current: Notice | null = null;
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const notice = {
  get: (): Notice | null => current,
  push(n: Omit<Notice, "id">): void {
    current = { ...n, id: ++seq };
    emit();
  },
  clear(): void {
    current = null;
    emit();
  },
  use: (): Notice | null => useSyncExternalStore(subscribe, () => current, () => current),
};

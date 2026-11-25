import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { useMidi, type MidiState } from "./useMidi";

type Handler = (note: number, velocity: number) => void;

interface MidiContextValue extends MidiState {
  setHandler(h: Handler | null): void;
}

const MidiContext = createContext<MidiContextValue | null>(null);

/**
 * Una sola conexión MIDI para toda la app; cada pantalla recibe las notas mientras está abierta.
 * El pedal de resonancia va a `onPedal` (el audio), nunca a la lección: no puntúa (009).
 */
export function MidiProvider({ children, onPedal }: { children: ReactNode; onPedal?: (down: boolean) => void }) {
  const handler = useRef<Handler | null>(null);
  const pedal = useRef(onPedal);
  pedal.current = onPedal;
  const midi = useMidi(
    (n, v) => handler.current?.(n, v),
    (down) => pedal.current?.(down),
  );
  const setHandler = useCallback((h: Handler | null) => {
    handler.current = h;
  }, []);
  return <MidiContext.Provider value={{ ...midi, setHandler }}>{children}</MidiContext.Provider>;
}

export function useMidiContext(): MidiContextValue {
  const ctx = useContext(MidiContext);
  if (!ctx) throw new Error("useMidiContext fuera de MidiProvider");
  return ctx;
}

/** Dirige las notas del teclado MIDI a esta pantalla mientras esté montada. */
export function useMidiInput(onNote: Handler): void {
  const { setHandler } = useMidiContext();
  const latest = useRef(onNote);
  latest.current = onNote;
  useEffect(() => {
    setHandler((n, v) => latest.current(n, v));
    return () => setHandler(null);
  }, [setHandler]);
}

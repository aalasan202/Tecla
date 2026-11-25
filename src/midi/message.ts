/** Mensajes MIDI que entiende la app. Función pura, sin APIs del navegador. */
export type MidiMessage = { type: "note"; note: number; velocity: number } | { type: "pedal"; down: boolean } | null;

/** Control Change del pedal de resonancia (sustain). */
const SUSTAIN_CC = 64;

/**
 * Nota pulsada (note-on con velocidad > 0) o pedal de resonancia (CC 64, cualquier canal):
 * pisado con valor ≥ 64, levantado con < 64 (umbral estándar; sin medio pedal).
 */
export function parseMidiMessage(data: ArrayLike<number>): MidiMessage {
  const [st, a, b] = [data[0], data[1], data[2]];
  if (st === undefined) return null;
  const kind = st & 0xf0;
  if (kind === 0x90 && b > 0) return { type: "note", note: a, velocity: b };
  if (kind === 0xb0 && a === SUSTAIN_CC && b !== undefined) return { type: "pedal", down: b >= 64 };
  return null;
}

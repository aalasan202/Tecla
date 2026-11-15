export const NOTE_NAMES = ["Do", "Do♯", "Re", "Re♯", "Mi", "Fa", "Fa♯", "Sol", "Sol♯", "La", "La♯", "Si"];

const WHITE_INDEX: Record<number, number> = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };

export const isWhite = (m: number): boolean => m % 12 in WHITE_INDEX;

/** Posición diatónica (línea/espacio) de una nota; los sostenidos comparten la de su nota natural. */
export function staffStep(m: number): number {
  const w = isWhite(m) ? m : m - 1;
  return Math.floor(w / 12) * 7 + WHITE_INDEX[w % 12];
}

export const NOTE_NAMES_EN = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

export type Notation = "latin" | "english";

export const noteName = (m: number, notation: Notation = "latin"): string =>
  (notation === "english" ? NOTE_NAMES_EN : NOTE_NAMES)[m % 12];

export const octaveOf = (m: number): number => Math.floor(m / 12) - 1;

export const frequency = (m: number): number => 440 * 2 ** ((m - 69) / 12);

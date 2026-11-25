import { noteName, type Notation } from "../music/theory";

const LETTER_TO_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * Resuelve las marcas de nota de los textos del Curso según la notación elegida:
 * `{60}` (número MIDI) o `{C}` (nombre en inglés) → «Do» o «C». Lo demás queda igual.
 */
export function renderText(text: string, notation: Notation): string {
  return text.replace(/\{(\d{1,3}|[A-G])\}/g, (_all, token: string) => {
    const m = /^\d+$/.test(token) ? Number(token) : 60 + LETTER_TO_PC[token];
    return noteName(m, notation);
  });
}

import type { HandChoice } from "../engine/lesson";

/** Estadísticas, historial y rachas (011): tipos compartidos. Ver specs/011…/data-model.md. */

/** `song:<songId>`, `course:<itemId>` o `course:test:<unitId>`. */
export type PieceKey = `song:${string}` | `course:${string}`;
export type Origin = "song" | "course";

/** Qué se está practicando; lo pasa cada pantalla a `Practice`. */
export interface AttemptSource {
  key: PieceKey;
  src: Origin;
  title: string;
  /** Solo Curso: «Unidad N · título». */
  unit?: string;
}

/** Compases (1‑based) practicados en bucle y cuántas repeticiones. */
export interface Fragment {
  from: number;
  to: number;
  reps: number;
}

/** Un recorrido terminado en Aprender o Tocar, o una prueba completa del Curso. */
export interface Attempt extends AttemptSource {
  at: number;
  mode: "learn" | "play";
  hands: HandChoice;
  twoHands: boolean;
  tempo: number;
  /** 0–1. */
  score: number;
  stars: number;
  frag?: Fragment;
  /** Tocar, pieza completa y, si es a dos manos, con las dos (FR-007). */
  counts: boolean;
}

export interface ScorePoint {
  at: number;
  score: number;
}

/** Resumen por pieza: sobrevive al recorte de intentos. */
export interface PieceSummary {
  count: number;
  title: string;
  src: Origin;
  unit?: string;
  /** Primer y mejor intento que cuenta para la evolución. */
  first?: ScorePoint;
  best?: ScorePoint;
  last: ScorePoint & { mode: "learn" | "play" };
}

export interface HistoryData {
  /** Del más antiguo al más nuevo; como mucho `HISTORY_LIMIT`. */
  attempts: Attempt[];
  pieces: Record<string, PieceSummary>;
  /** Día (AAAA-MM-DD) en que ya se felicitó por récord o por objetivo. */
  cheered: { record?: string; goal?: string };
}

export type Period = "7d" | "30d" | "all";
/** 0 sin práctica, 1 poca, 2 mucha. */
export type DayLevel = 0 | 1 | 2;

export const HISTORY_LIMIT = 1000;

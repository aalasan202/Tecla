import type { SongDef } from "../music/types";

/** Los cuatro bloques de contenido de las lecciones. */
export type Block = "reading" | "rhythm" | "position" | "chords";

export const BLOCK_LABEL: Record<Block, string> = {
  reading: "Lectura",
  rhythm: "Ritmo",
  position: "Posiciones",
  chords: "Acordes",
};

export type IllustrationId = "posture" | "hand-shape" | "finger-numbers" | "find-c" | "arm-weight" | "arm-jump" | "eyes-on-score";
export type IconId = "clock" | "turtle" | "voice" | "arrow" | "loop" | "metronome";

export type LevelN = 1 | 2 | 3 | 4;

/** Pantalla de explicación de una lección: texto con marcas de nota ({60} o {C}) y un apoyo visual. */
export interface ExplainPage {
  text: string;
  /** Mini partitura que se puede escuchar. */
  staff?: SongDef;
  /** Teclas resaltadas, con dedo opcional. */
  keys?: { m: number; finger?: number }[];
}

export interface Lesson {
  id: string;
  block: Block;
  title: string;
  pages: ExplainPage[];
  exercise: SongDef;
}

export interface Tip {
  id: string;
  level: LevelN;
  title: string;
  text: string;
  art: { kind: "illustration"; id: IllustrationId } | { kind: "icon"; id: IconId } | null;
}

/** Escala de una octava (012, research R4). */
export type ScaleTonic = "C" | "G" | "F" | "D" | "A" | "E" | "Bb";
export interface ScaleSpec {
  tonic: ScaleTonic;
  /** Menor = armónica. */
  mode: "major" | "minor";
  hand: "R" | "L";
  /** Inicial < intermedio < objetivo, en negras por minuto. */
  tempos: [number, number, number];
}

/** Los tres caminos de cada nivel (012). */
export type Path = "lessons" | "technique" | "songs";

export const PATH_LABEL: Record<Path, string> = { lessons: "Lecciones", technique: "Técnica", songs: "Canciones" };

export type CourseItem =
  | { type: "lesson"; id: string; lesson: Lesson }
  | { type: "tip"; id: string; tip: Tip }
  | { type: "scale"; id: string; scale: ScaleSpec }
  | { type: "independence"; id: string; song: SongDef; needsMidi: true }
  | { type: "song"; id: string; songId: string; recommended: boolean };

export interface Level {
  n: LevelN;
  title: string;
  /** Lecciones y consejos, en el orden sugerido. */
  lessons: Extract<CourseItem, { type: "lesson" | "tip" }>[];
  technique: Extract<CourseItem, { type: "scale" | "independence" }>[];
  /** Hitos de 010 primero (recomendados) y después el resto de piezas del nivel. */
  songs: Extract<CourseItem, { type: "song" }>[];
  /** Prueba para abrir este nivel sin pasar por el anterior; null en el nivel 1. */
  test: SongDef[] | null;
}

/** Progreso del Curso guardado en el dispositivo ("tecla-course"). */
export interface CourseProgress {
  /** Mejores estrellas (0–3) en Tocar por id de lección, ejercicio de prueba e independencia; escalas por tempo: "<id>@<0|1|2>". */
  best: Record<string, number>;
  /** Consejos marcados como vistos. */
  seen: Record<string, true>;
  /** Unidades saltadas con las pruebas de 010 (solo lectura: u1 o u2 abren el nivel 2). */
  skipped: Record<string, true>;
  /** Último elemento del Curso practicado o abierto, para «Continuar». */
  last: { itemId: string; at: number } | null;
  /** Niveles abiertos por prueba (012). */
  tests?: Partial<Record<"2" | "3" | "4", true>>;
  /** Últimos elementos practicados, el más nuevo al final (012, para la recomendación). */
  recent?: string[];
}

export type ItemStatus = "locked" | "available" | "done" | "needsMidi";

export interface ItemState {
  status: ItemStatus;
  stars?: number;
  /** Escalas: escalón de tempo propuesto (0 inicial, 1 intermedio, 2 objetivo). */
  tempoStep?: 0 | 1 | 2;
}

export interface Recommendation {
  /** Id del elemento o `test:<n>` para una prueba de nivel. */
  itemId: string;
  level: LevelN;
  path: Path | "test";
  reason: string;
}

export interface LevelState {
  open: boolean;
  byTest: boolean;
  progress: Record<Path, { done: number; total: number }>;
}

export interface CourseState {
  levels: Record<LevelN, LevelState>;
  items: Record<string, ItemState>;
  /** Nivel abierto más alto. */
  current: LevelN;
  recommended: Recommendation | null;
}

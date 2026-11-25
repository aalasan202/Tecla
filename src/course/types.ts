import type { SongDef } from "../music/types";

/** Los cuatro bloques de contenido del Curso. */
export type Block = "reading" | "rhythm" | "position" | "chords";

export const BLOCK_LABEL: Record<Block, string> = {
  reading: "Lectura",
  rhythm: "Ritmo",
  position: "Posiciones",
  chords: "Acordes",
};

export type IllustrationId = "posture" | "hand-shape" | "finger-numbers" | "find-c" | "arm-weight" | "arm-jump" | "eyes-on-score";
export type IconId = "clock" | "turtle" | "voice" | "arrow" | "loop" | "metronome";

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
  level: 1 | 2;
  title: string;
  text: string;
  art: { kind: "illustration"; id: IllustrationId } | { kind: "icon"; id: IconId } | null;
}

export type PathItem =
  | { type: "lesson"; id: string; lesson: Lesson }
  | { type: "milestone"; id: string; songId: string }
  | { type: "tip"; id: string; tip: Tip };

export interface Unit {
  id: string;
  title: string;
  /** Nivel del repertorio al que prepara. */
  level: 1 | 2;
  items: PathItem[];
  /** Ejercicios de la prueba de nivel (uno por bloque trabajado antes); null en la primera unidad. */
  test: SongDef[] | null;
}

/** Progreso del Curso guardado en el dispositivo ("tecla-course"). */
export interface CourseProgress {
  /** Mejores estrellas (0–3) en Tocar por id de lección y por id de ejercicio de prueba. */
  best: Record<string, number>;
  /** Consejos marcados como vistos. */
  seen: Record<string, true>;
  /** Unidades superadas por prueba de nivel. */
  skipped: Record<string, true>;
  /** Último elemento del Curso practicado o abierto, para «Continuar». */
  last: { itemId: string; at: number } | null;
}

export type ItemStatus = "locked" | "available" | "passed" | "optional" | "seen";
export type UnitStatus = "locked" | "current" | "passed" | "skipped";

export interface PathState {
  items: Record<string, { status: ItemStatus; stars?: number }>;
  units: Record<string, UnitStatus>;
  /** Siguiente elemento pendiente (mapa y «Continuar»); null con la ruta terminada. */
  next: string | null;
  /** Avance para Inicio: unidad actual, elementos superados o vistos y total de la unidad. */
  summary: { unitId: string; done: number; total: number } | null;
}

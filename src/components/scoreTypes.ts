import type { NoteMark } from "../engine/lesson";
import type { Notation } from "../music/theory";
import type { Score } from "../music/types";

/** Lo que la lección controla de la partitura sin volver a dibujarla. */
export interface StaffHandle {
  setPlayhead(x: number | null): void;
  scrollTo(x: number, smooth: boolean): void;
}

export interface StaffProps {
  score: Score;
  marks: Record<number, NoteMark>;
  autoIds: Set<number>;
  showNames: boolean;
  showFingers: boolean;
  notation?: Notation;
  /** Fragmento en bucle que se resalta (compases base 0; `to` null si falta el segundo extremo). */
  loop?: { from: number; to: number | null } | null;
  /** Si existe, tocar la partitura elige un compás. */
  onMeasure?: (i: number) => void;
  /** Ajustar al alto del contenedor: recorta el margen vertical y escala (móvil apaisado). */
  fit?: boolean;
  /** La partitura ya está dibujada (la lección no debe empezar antes). */
  onReady?: () => void;
}

export type Hand = "R" | "L";

/** Alteración escrita forzada: sostenido, bemol, becuadro, doble sostenido o doble bemol. */
export type Spell = "#" | "b" | "n" | "##" | "bb";

export interface EventOpts {
  /** Ligada a la siguiente (prolongación): misma(s) altura(s), se toca una sola vez. */
  tie?: true;
  /** Ligadura de expresión: solo visual. */
  slur?: "start" | "end";
  /** Ortografía forzada; en un acorde, una por altura (en el orden escrito). */
  spell?: Spell | Spell[];
  /**
   * Dedo fijo, 1 (pulgar) a 5 (meñique); en un acorde, uno por altura (de grave a agudo).
   * Sustituye a la digitación sugerida (p. ej. escalas del Curso, 012).
   */
  f?: number | number[];
}

/**
 * Un evento de una mano: [nota, pulsos, opciones?]. `nota` es un número MIDI, un array de
 * números (acorde) o 0 (silencio). Pulsos en negras; admite tercios (tresillos) y cuartos.
 */
export type TrackEvent = [number | number[], number] | [number | number[], number, EventOpts];
export type Track = TrackEvent[];
/** Alias de compatibilidad: las pistas de antes ([nota, pulsos][]) siguen siendo válidas. */
export type RawTrack = Track;

/** Tramo con el pedal de resonancia pisado: [pulso de inicio, pulso de fin), en negras. */
export type PedalSpan = [from: number, to: number];

export interface KeyChange {
  /** Compás (base 0) desde el que rige. */
  at: number;
  /** −7 (7 bemoles) … +7 (7 sostenidos). */
  key: number;
}

export interface SongDef {
  id: string;
  title: string;
  level: string;
  /**
   * Origen que justifica el dominio público: compositor con fechas o procedencia popular, y
   * «arreglo» o «fragmento» si aplica. Obligatorio en el repertorio incluido.
   */
  origin?: string;
  /** Pulsos por minuto: negras en x/4, negras con puntillo en 6/8. */
  tempo: number;
  /** Negras por compás (4 por defecto; en 6/8 se deduce: 3). */
  bar?: number;
  /** Compás de 6/8. Sin él, el compás es bar/4. */
  time?: "6/8";
  /** Armadura inicial, −7 … +7; 0 por defecto. */
  key?: number;
  keyChanges?: KeyChange[];
  /** Píxeles por negra en la partitura (50 por defecto; mínimo automático con notas muy seguidas). */
  px?: number;
  /** Digitación por compás con extensión hasta la octava (arpegios). */
  arpFingering?: boolean;
  /** Pieza a una mano (derecha). */
  n?: Track;
  /** Mano derecha e izquierda de una pieza a dos manos. */
  r?: Track;
  l?: Track;
  /** Tramos de pedal de resonancia, ordenados y sin solaparse. Solo se usan desde el nivel 3. */
  pedal?: PedalSpan[];
  /**
   * Ejercicio del Curso: ritmo (cualquier tecla) o acordes (ventana de simultaneidad).
   * Las piezas del repertorio no lo usan.
   */
  kind?: "rhythm" | "chords";
}

/** Cómo se escribe y se nombra una altura: nota (C…B) y alteración (−2…2). */
export interface Spelled {
  step: string;
  alter: number;
}

export interface ScoreNote {
  id: number;
  m: number;
  /** Duración en pulsos (negras); si va ligada, la suma de las figuras. */
  d: number;
  /** Pulso en el que empieza. */
  s: number;
  h: Hand;
  /** Posición horizontal en la partitura (de `layout`). */
  x: number;
  /** Dedo sugerido, 1 (pulgar) a 5 (meñique). */
  f: number;
  /** Evento al que pertenece: las alturas de un acorde comparten `unit`. */
  unit: number;
  /** Margen de acierto en pulsos, ya recortado con notas muy seguidas. */
  win: { hit: number; perfect: number };
  spell: Spelled;
  /** Ligadura de expresión (solo visual). */
  slur?: "start" | "end";
}

/** Hueco (silencio) de una mano, sin partir: el grabado lo convierte en figuras. */
export interface Rest {
  h: Hand;
  s: number;
  d: number;
}

export interface MeasureBox {
  /** Inicio del compás en px. */
  x: number;
  width: number;
  /** Pulso de inicio. */
  start: number;
  /** Distancia de la barra al primer inicio de nota. */
  pad: number;
}

export interface Layout {
  measures: MeasureBox[];
  width: number;
  /** Margen inicial (claves, armadura y compás). */
  left: number;
  px: number;
  /** Posición del pulso `beat`: estrictamente creciente; xAt(n.s) === n.x. */
  xAt(beat: number): number;
  /** Compás (base 0) bajo una x, recortado a la pieza. */
  measureAt(x: number): number;
}

export interface Score {
  song: SongDef;
  notes: ScoreNote[];
  rests: Rest[];
  /** Duración total en pulsos, redondeada al compás. */
  total: number;
  /** Negras por compás (3 en 6/8). */
  bar: number;
  /** Píxeles por negra efectivos. */
  px: number;
  /** Negras por pulso del metrónomo: 1, o 1,5 en 6/8. */
  pulse: number;
  time: { beats: number; unit: 4 | 8 };
  /** Armaduras por compás (al menos la del compás 0), ordenadas. */
  keys: KeyChange[];
  twoHands: boolean;
  layout: Layout;
  /** Tramos de pedal en uso: los de la pieza si su nivel es ≥ 3; si no, vacío. */
  pedals: PedalSpan[];
}

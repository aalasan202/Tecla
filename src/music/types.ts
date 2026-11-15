export type Hand = "R" | "L";

/** [nota MIDI, duración en pulsos]. La nota 0 es un silencio. */
export type RawTrack = [number, number][];

export interface SongDef {
  id: string;
  title: string;
  level: string;
  tempo: number;
  /** Pulsos por compás (4 por defecto). */
  bar?: number;
  /** Píxeles por pulso en la partitura (50 por defecto). */
  px?: number;
  /** Digitación por compás con extensión hasta la octava (arpegios). */
  arpFingering?: boolean;
  /** Pieza a una mano (derecha). */
  n?: RawTrack;
  /** Mano derecha e izquierda de una pieza a dos manos. */
  r?: RawTrack;
  l?: RawTrack;
}

export interface ScoreNote {
  id: number;
  m: number;
  d: number;
  /** Pulso en el que empieza. */
  s: number;
  h: Hand;
  /** Posición horizontal en la partitura. */
  x: number;
  /** Dedo sugerido, 1 (pulgar) a 5 (meñique). */
  f: number;
}

export interface Rest {
  h: Hand;
  d: number;
  x: number;
}

export interface Score {
  song: SongDef;
  notes: ScoreNote[];
  rests: Rest[];
  /** Duración total en pulsos, redondeada al compás. */
  total: number;
  bar: number;
  px: number;
  twoHands: boolean;
}

import type { SongDef } from "../types";

/** Nota leída de un archivo, en pulsos de negra sin cuantizar. Las ligadas ya vienen unidas. */
export interface RawNote {
  pitch: number;
  start: number;
  dur: number;
}

export interface RawPart {
  name?: string;
  /** Pentagrama de MusicXML: 1 = mano derecha, 2 = izquierda. */
  staff?: 1 | 2;
  notes: RawNote[];
}

export type SourceFormat = "midi" | "musicxml";

/** Lo que sale de leer un archivo, antes de convertirlo. */
export interface RawPiece {
  format: SourceFormat;
  title?: string;
  /** Negras por minuto, sin redondear. */
  tempo?: number;
  /** Compases con su pulso de inicio; vacío = 4/4. */
  times: { at: number; beats: number; beatType: number }[];
  parts: RawPart[];
  notPiano: boolean;
  ignored: { grace: number; cue: number };
}

export type RejectReason =
  | "tooLarge"
  | "unreadable"
  | "notScore"
  | "empty"
  | "notPiano"
  | "tooManyParts"
  | "badNotes"
  | "timeSignature";

export interface RejectDetail {
  count?: number;
  /** Compases afectados, en base 1. */
  bars?: number[];
}

export interface Metrics {
  bars: number;
  notes: number;
  twoHands: boolean;
  accidentals: number;
  rightSpan: number;
  eighthShare: number;
  simultaneousShare: number;
}

export type WarningKind = "handsSplit" | "chords" | "durations" | "cutAtBar" | "dropped" | "grace" | "farFromOriginal";

export interface Warning {
  kind: WarningKind;
  /** Compases afectados, en base 1 (vacío si no aplica). */
  bars: number[];
}

export type Level = 1 | 2 | 3 | 4;

export interface Proposal {
  song: Omit<SongDef, "id" | "level">;
  metrics: Metrics;
  level: Level;
  warnings: Warning[];
  heavy: boolean;
}

export type ImportCheck = { ok: false; reason: RejectReason; detail?: RejectDetail } | { ok: true; proposal: Proposal };

export interface ImportedSong {
  def: SongDef;
  source: { format: SourceFormat; fileName: string; size: number };
  /** FNV-1a de 64 bits del archivo, 16 hex. */
  hash: string;
  importedAt: number;
  warnings: Warning[];
}

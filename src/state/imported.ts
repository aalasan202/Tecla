import { createStore } from "./store";
import { forgetSong } from "./progress";
import * as originals from "../import/originals";
import { rawFromBytes } from "../import/check";
import { convertFull } from "../music/import/full";
import type { FullCheck, FullReason, FullVersion, ImportedSong, Level, Proposal, RawPiece, SongVersion, SourceFormat, Warning } from "../music/import/types";

export interface ImportedData {
  songs: ImportedSong[];
}

/** Piezas importadas ya convertidas. Los archivos originales van aparte, en IndexedDB. */
export const imported = createStore<ImportedData>("tecla-imported", { songs: [] });

/** Dónde se guardan los originales; se inyecta para probar sin IndexedDB. */
export interface OriginalsDeps {
  putOriginal: (id: string, bytes: Uint8Array, type: string) => Promise<void>;
  deleteOriginal: (id: string) => Promise<void>;
}

const defaultDeps: OriginalsDeps = { putOriginal: originals.putOriginal, deleteOriginal: originals.deleteOriginal };

/** La versión completa de una importada usa el id de la simplificada con este sufijo (FR-019b). */
export const FULL_SUFFIX = ".full";
/** Id de la pieza importada a partir del id de cualquiera de sus dos versiones. */
export const baseId = (id: string): string => (id.endsWith(FULL_SUFFIX) ? id.slice(0, -FULL_SUFFIX.length) : id);
/** La versión completa, si existe y se pudo obtener. */
export const fullDef = (s: ImportedSong) => (s.full && "def" in s.full ? s.full.def : undefined);
/** La definición de la versión que eligió el alumno (la simplificada por defecto, FR-019a). */
export const chosenDef = (s: ImportedSong) => (s.version === "full" ? fullDef(s) ?? s.def : s.def);

const find = (id: string) => imported.get().songs.find((s) => s.def.id === baseId(id));

export interface ImportMeta {
  format: SourceFormat;
  fileName: string;
  size: number;
  hash: string;
}

const FORMAT_NAME: Record<SourceFormat, string> = { midi: "MIDI", musicxml: "MusicXML" };
const levelLabel = (level: Level, format: SourceFormat) => `Nivel ${level} · Importada de ${FORMAT_NAME[format]}`;

/** `imp-` + 8 hex del hash; si ya existe (otra copia), `-2`, `-3`… */
function freeId(hash: string, songs: ImportedSong[]): string {
  const base = `imp-${hash.slice(0, 8)}`;
  const used = new Set(songs.map((s) => s.def.id));
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** El título tal cual o, si ya lo tiene otra importada, con « (2)», « (3)»… */
function freeTitle(title: string, songs: ImportedSong[]): string {
  const used = new Set(songs.map((s) => s.def.title));
  if (!used.has(title)) return title;
  let n = 2;
  while (used.has(`${title} (${n})`)) n++;
  return `${title} (${n})`;
}

export function findByHash(hash: string): ImportedSong | undefined {
  return imported.get().songs.find((s) => s.hash === hash);
}

/**
 * Guarda el original y luego la pieza. Si falta espacio en cualquiera de los dos, no deja
 * nada a medias y devuelve `noSpace` (FR-016).
 */
export async function addImported(
  proposal: Proposal,
  meta: ImportMeta,
  bytes: Uint8Array,
  opts: { title: string; level: Level; warnings?: Warning[]; full?: FullCheck; version?: SongVersion },
  deps: OriginalsDeps = defaultDeps,
): Promise<{ ok: true; id: string } | { ok: false; reason: "noSpace" }> {
  const before = imported.get().songs;
  const id = freeId(meta.hash, before);
  try {
    await deps.putOriginal(id, bytes, meta.format);
  } catch {
    return { ok: false, reason: "noSpace" };
  }
  // el nivel elegido es el de la versión elegida; la otra se queda con su nivel sugerido
  const version: SongVersion = opts.version === "full" && opts.full?.ok ? "full" : "simple";
  const title = freeTitle(opts.title.trim() || proposal.song.title, before);
  const song: ImportedSong = {
    def: {
      ...proposal.song,
      id,
      title,
      level: levelLabel(version === "simple" ? opts.level : proposal.level, meta.format),
    },
    source: { format: meta.format, fileName: meta.fileName, size: meta.size },
    hash: meta.hash,
    importedAt: Date.now(),
    warnings: version === "simple" ? opts.warnings ?? proposal.warnings : proposal.warnings,
  };
  if (opts.full) song.full = toFullVersion(opts.full, id, title, meta.format, version === "full" ? opts.level : undefined);
  if (version === "full") song.version = "full";
  if (!imported.set({ songs: [...before, song] })) {
    imported.set({ songs: before });
    await deps.deleteOriginal(id).catch(() => {});
    return { ok: false, reason: "noSpace" };
  }
  return { ok: true, id };
}

/** Versión completa para guardar a partir de su conversión. */
function toFullVersion(full: FullCheck, id: string, title: string, format: SourceFormat, level?: Level): FullVersion {
  if (!full.ok) return { unavailable: full.reason };
  return {
    def: { ...full.song, id: id + FULL_SUFFIX, title, level: levelLabel(level ?? full.level, format) },
    level: full.level,
    warnings: full.warnings,
  };
}

/**
 * Cambia el título (de las dos versiones) y el nivel (de la versión de `id`) de una importada; el
 * id y el progreso se conservan (FR-014).
 */
export function editImported(id: string, patch: { title?: string; level?: Level }): boolean {
  const songs = imported.get().songs;
  const i = songs.findIndex((s) => s.def.id === baseId(id));
  if (i < 0) return false;
  const s = songs[i];
  const title = patch.title === undefined ? s.def.title : patch.title.trim();
  if (!title) return false;
  const relevel = (level: string, mine: boolean) => (patch.level === undefined || !mine ? level : level.replace(/^Nivel \d/, `Nivel ${patch.level}`));
  const isFull = id.endsWith(FULL_SUFFIX);
  const full = fullDef(s);
  const next = songs.slice();
  next[i] = {
    ...s,
    def: { ...s.def, title, level: relevel(s.def.level, !isFull) },
    ...(full && s.full && "def" in s.full ? { full: { ...s.full, def: { ...full, title, level: relevel(full.level, isFull) } } } : {}),
  };
  return imported.set({ songs: next });
}

/** Borra la pieza, su original y las estrellas de sus dos versiones; «Continuar» deja de apuntarla. */
export async function removeImported(id: string, deps: Pick<OriginalsDeps, "deleteOriginal"> = defaultDeps): Promise<void> {
  const base = baseId(id);
  imported.set((d) => ({ songs: d.songs.filter((s) => s.def.id !== base) }));
  forgetSong(base);
  forgetSong(base + FULL_SUFFIX);
  await deps.deleteOriginal(base).catch(() => {});
}

/** Lectura del original para calcular la versión completa; se inyecta para probar sin IndexedDB. */
export interface FullDeps {
  getOriginal: (id: string) => Promise<Uint8Array | undefined>;
  readRaw: (bytes: Uint8Array, name: string) => Promise<RawPiece>;
}

const defaultFullDeps: FullDeps = { getOriginal: originals.getOriginal, readRaw: rawFromBytes };

/**
 * Calcula y guarda la versión completa de una importada que aún no la tiene (piezas de 006),
 * convirtiendo de nuevo el original guardado. Devuelve "ok" o por qué no la hay (FR-019c).
 */
export async function ensureFull(id: string, deps: FullDeps = defaultFullDeps): Promise<"ok" | FullReason> {
  const song = find(id);
  if (!song) return "unreadable";
  if (song.full) return "def" in song.full ? "ok" : song.full.unavailable;
  let check: FullCheck;
  try {
    const bytes = await deps.getOriginal(song.def.id);
    // sin el original (datos del navegador borrados) no se guarda nada: se puede reintentar
    if (!bytes) return "unreadable";
    check = convertFull(await deps.readRaw(bytes, song.source.fileName));
  } catch {
    return "unreadable";
  }
  const full = toFullVersion(check, song.def.id, song.def.title, song.source.format);
  imported.set((d) => ({ songs: d.songs.map((s) => (s.def.id === song.def.id ? { ...s, full } : s)) }));
  return check.ok ? "ok" : check.reason;
}

/** Elige la versión de una importada; la completa solo si existe. Devuelve si se guardó. */
export function setVersion(id: string, version: SongVersion): boolean {
  const song = find(id);
  if (!song || (version === "full" && !fullDef(song))) return false;
  return imported.set((d) => ({ songs: d.songs.map((s) => (s.def.id === song.def.id ? { ...s, version } : s)) }));
}

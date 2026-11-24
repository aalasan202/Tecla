import { createStore } from "./store";
import { forgetSong } from "./progress";
import * as originals from "../import/originals";
import type { ImportedSong, Level, Proposal, SourceFormat, Warning } from "../music/import/types";

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
  opts: { title: string; level: Level; warnings?: Warning[] },
  deps: OriginalsDeps = defaultDeps,
): Promise<{ ok: true; id: string } | { ok: false; reason: "noSpace" }> {
  const before = imported.get().songs;
  const id = freeId(meta.hash, before);
  try {
    await deps.putOriginal(id, bytes, meta.format);
  } catch {
    return { ok: false, reason: "noSpace" };
  }
  const song: ImportedSong = {
    def: {
      ...proposal.song,
      id,
      title: freeTitle(opts.title.trim() || proposal.song.title, before),
      level: levelLabel(opts.level, meta.format),
    },
    source: { format: meta.format, fileName: meta.fileName, size: meta.size },
    hash: meta.hash,
    importedAt: Date.now(),
    warnings: opts.warnings ?? proposal.warnings,
  };
  if (!imported.set({ songs: [...before, song] })) {
    imported.set({ songs: before });
    await deps.deleteOriginal(id).catch(() => {});
    return { ok: false, reason: "noSpace" };
  }
  return { ok: true, id };
}

/** Cambia título y número de nivel de una importada; el id y el progreso se conservan (FR-014). */
export function editImported(id: string, patch: { title?: string; level?: Level }): boolean {
  const songs = imported.get().songs;
  const i = songs.findIndex((s) => s.def.id === id);
  if (i < 0) return false;
  const title = patch.title === undefined ? songs[i].def.title : patch.title.trim();
  if (!title) return false;
  const level = patch.level === undefined ? songs[i].def.level : songs[i].def.level.replace(/^Nivel \d/, `Nivel ${patch.level}`);
  const next = songs.slice();
  next[i] = { ...songs[i], def: { ...songs[i].def, title, level } };
  return imported.set({ songs: next });
}

/** Borra la pieza, su original y sus estrellas. */
export async function removeImported(id: string, deps: Pick<OriginalsDeps, "deleteOriginal"> = defaultDeps): Promise<void> {
  imported.set((d) => ({ songs: d.songs.filter((s) => s.def.id !== id) }));
  forgetSong(id);
  await deps.deleteOriginal(id).catch(() => {});
}

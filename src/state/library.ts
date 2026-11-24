import { useMemo } from "react";
import { SONGS } from "../music/songs";
import type { SongDef } from "../music/types";
import { baseId, chosenDef, fullDef, imported } from "./imported";
import type { ImportedSong } from "../music/import/types";

/** Las piezas importadas tienen ids con este prefijo, que nunca usa el repertorio. */
export const isImported = (id: string): boolean => id.startsWith("imp-");

const merge = (songs: ImportedSong[]): SongDef[] => [...SONGS, ...songs.map(chosenDef)];

/** Repertorio incluido seguido de las piezas importadas (en la versión elegida de cada una). */
export function allSongs(): SongDef[] {
  return merge(imported.get().songs);
}

/** Busca por id; en una importada acepta el id de cualquiera de sus dos versiones. */
export function findSong(id: string): SongDef | undefined {
  const own = SONGS.find((s) => s.id === id);
  if (own) return own;
  for (const s of imported.get().songs) {
    if (s.def.id === id) return s.def;
    const full = fullDef(s);
    if (full?.id === id) return full;
  }
  return undefined;
}

/** Id de la versión elegida de una importada (para «Continuar»); el mismo id en el repertorio. */
export function resolveSongId(id: string): string {
  if (!isImported(id)) return id;
  const s = imported.get().songs.find((x) => x.def.id === baseId(id));
  return s ? chosenDef(s).id : id;
}

/** Como allSongs, pero se actualiza al añadir, editar o borrar importadas. */
export function useLibrary(): SongDef[] {
  const { songs } = imported.use();
  return useMemo(() => merge(songs), [songs]);
}

const REPERTOIRE = new Set(SONGS.map((s) => s.id));

/** Estrellas del repertorio incluido: las importadas no cuentan en los totales (FR-019). */
export function repertoireStars(best: Record<string, number>): number {
  return Object.entries(best).reduce((a, [id, n]) => (REPERTOIRE.has(id) ? a + n : a), 0);
}

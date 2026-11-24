import { useMemo } from "react";
import { SONGS } from "../music/songs";
import type { SongDef } from "../music/types";
import { imported } from "./imported";

/** Las piezas importadas tienen ids con este prefijo, que nunca usa el repertorio. */
export const isImported = (id: string): boolean => id.startsWith("imp-");

const merge = (songs: { def: SongDef }[]): SongDef[] => [...SONGS, ...songs.map((s) => s.def)];

/** Repertorio incluido seguido de las piezas importadas. */
export function allSongs(): SongDef[] {
  return merge(imported.get().songs);
}

export function findSong(id: string): SongDef | undefined {
  return SONGS.find((s) => s.id === id) ?? imported.get().songs.find((s) => s.def.id === id)?.def;
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

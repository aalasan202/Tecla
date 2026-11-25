import type { SongDef } from "./types";

/** Nivel 1–4 a partir de `level` («Nivel N · …»); 1 si no se reconoce. */
export const levelOf = (s: Pick<SongDef, "level">): number => Number(/Nivel (\d+)/.exec(s.level)?.[1] ?? 1);

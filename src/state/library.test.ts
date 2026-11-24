import { afterEach, describe, expect, it } from "vitest";
import { SONGS } from "../music/songs";
import type { ImportedSong } from "../music/import/types";
import { imported } from "./imported";
import { allSongs, findSong, isImported, repertoireStars } from "./library";

const song: ImportedSong = {
  def: { id: "imp-0123abcd", title: "Mía", level: "Nivel 1 · Importada de MIDI", tempo: 90, n: [[60, 4]] },
  source: { format: "midi", fileName: "mia.mid", size: 10 },
  hash: "0123abcd00000000",
  importedAt: 1,
  warnings: [],
};

describe("catálogo de canciones", () => {
  afterEach(() => imported.set({ songs: [] }));

  it("sin importadas es el repertorio, en el mismo orden", () => {
    expect(allSongs()).toEqual(SONGS);
    expect(findSong("oda")).toBe(SONGS.find((s) => s.id === "oda"));
    expect(findSong("nada")).toBeUndefined();
  });

  it("distingue las importadas por el id", () => {
    expect(isImported("imp-0123abcd")).toBe(true);
    expect(isImported("oda")).toBe(false);
  });

  it("añade las importadas detrás del repertorio", () => {
    imported.set({ songs: [song] });
    expect(allSongs()).toEqual([...SONGS, song.def]);
    expect(findSong("imp-0123abcd")).toBe(song.def);
  });

  it("los totales de estrellas solo cuentan el repertorio", () => {
    expect(repertoireStars({ oda: 3, "imp-x": 2 })).toBe(3);
  });
});

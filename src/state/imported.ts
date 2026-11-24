import { createStore } from "./store";
import type { ImportedSong } from "../music/import/types";

export interface ImportedData {
  songs: ImportedSong[];
}

/** Piezas importadas ya convertidas. Los archivos originales van aparte, en IndexedDB. */
export const imported = createStore<ImportedData>("tecla-imported", { songs: [] });

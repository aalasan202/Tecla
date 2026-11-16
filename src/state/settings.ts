import { createStore } from "./store";
import type { Notation } from "../music/theory";

export type { Notation };
export type Theme = "auto" | "light" | "dark";

export interface Settings {
  notation: Notation;
  showNames: boolean;
  showFingers: boolean;
  theme: Theme;
  /** Aprender a tempo: la partitura avanza sola y espera la nota pendiente. */
  learnAtTempo: boolean;
}

export const settings = createStore<Settings>("tecla-settings", {
  notation: "latin",
  showNames: true,
  showFingers: false,
  theme: "auto",
  learnAtTempo: false,
});

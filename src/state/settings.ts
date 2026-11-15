import { createStore } from "./store";
import type { Notation } from "../music/theory";

export type { Notation };
export type Theme = "auto" | "light" | "dark";

export interface Settings {
  notation: Notation;
  showNames: boolean;
  showFingers: boolean;
  theme: Theme;
}

export const settings = createStore<Settings>("tecla-settings", {
  notation: "latin",
  showNames: true,
  showFingers: false,
  theme: "auto",
});

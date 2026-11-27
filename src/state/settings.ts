import { createStore } from "./store";
import type { Notation } from "../music/theory";

export type { Notation };
export type Theme = "auto" | "light" | "dark";

/** Minutos al día; 0 = sin objetivo (011, FR-019). */
export const DAILY_GOALS = [0, 5, 10, 15, 20, 30] as const;
export type DailyGoal = (typeof DAILY_GOALS)[number];

export interface Settings {
  notation: Notation;
  showNames: boolean;
  showFingers: boolean;
  theme: Theme;
  /** Aprender a tempo: la partitura avanza sola y espera la nota pendiente. */
  learnAtTempo: boolean;
  /** La explicación del pedal de resonancia ya se cerró (009). */
  pedalHelpSeen: boolean;
  /** Objetivo diario: solo informativo, no cambia la racha (011). */
  dailyGoal: DailyGoal;
  /** Solo en desarrollo (`npm run dev`): abre todos los niveles del Curso. */
  devUnlock: boolean;
}

export const settings = createStore<Settings>(
  "tecla-settings",
  {
    notation: "latin",
    showNames: true,
    showFingers: false,
    theme: "auto",
    learnAtTempo: false,
    pedalHelpSeen: false,
    dailyGoal: 0,
    devUnlock: false,
  },
  undefined,
  (s) => ((DAILY_GOALS as readonly number[]).includes(s.dailyGoal) ? s : { ...s, dailyGoal: 0 }),
);

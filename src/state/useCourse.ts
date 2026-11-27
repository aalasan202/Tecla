import { useMemo } from "react";
import { LEVELS } from "../course/content";
import { courseState } from "../course/state";
import { useMidiContext } from "../midi/MidiProvider";
import { course } from "./course";
import { progress } from "./progress";
import { settings } from "./settings";

/** Estado del Curso para las pantallas: se recalcula al cambiar el progreso, las estrellas de Canciones o el MIDI. */
export function useCourse() {
  const cp = course.use();
  const { best } = progress.use();
  const midiOk = useMidiContext().status === "ok";
  // el desbloqueo de desarrollo no existe en la versión publicada
  const unlockAll = import.meta.env.DEV && settings.use().devUnlock;
  const state = useMemo(() => courseState(LEVELS, cp, best, midiOk, unlockAll), [cp, best, midiOk, unlockAll]);
  return { levels: LEVELS, cp, best, state, midiOk };
}

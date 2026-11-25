import { useMemo } from "react";
import { COURSE } from "../course/content";
import { pathState } from "../course/path";
import { course } from "./course";
import { progress } from "./progress";

/** Estado del Curso para las pantallas: se recalcula al cambiar el progreso del Curso o de Canciones. */
export function useCourse() {
  const cp = course.use();
  const { best } = progress.use();
  const state = useMemo(() => pathState(COURSE, cp, best), [cp, best]);
  return { units: COURSE, cp, best, state };
}

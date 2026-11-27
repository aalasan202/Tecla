import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ExplainPage, Lesson, Level, ScaleSpec } from "../course/types";
import { Practice } from "../components/Practice";
import { ExplainPageView } from "../components/ExplainPage";
import { TopBar } from "../components/TopBar";
import { recordCourseStars, recordScaleStars, touchCourse } from "../state/course";
import { useCourse } from "../state/useCourse";
import { PASS_STARS } from "../course/state";
import { scale, scaleNotes, stepForTempo, thumbPasses } from "../course/scales";
import { hrefFor, type Route } from "../router";
import { itemTitle, levelLabel, recommendationRoute } from "./courseItems";
import { findItem } from "../course/state";

/** 1–2 pantallas de explicación antes del ejercicio (010, FR-007); al volver, se empieza por la primera. */
function Explained({ title, pages, back, children }: { title: string; pages: ExplainPage[]; back: Route; children: ReactNode }) {
  const [page, setPage] = useState(0);
  if (page >= pages.length) return <>{children}</>;
  const last = page === pages.length - 1;
  return (
    <div className="screen course-lesson">
      <TopBar title={title} back={back} />
      <ExplainPageView key={page} page={pages[page]} />
      <div className="explain-actions">
        {page > 0 && (
          <button type="button" className="btn" onClick={() => setPage(page - 1)}>
            Anterior
          </button>
        )}
        <span className="muted">
          {page + 1} de {pages.length + 1}
        </span>
        <button type="button" className="btn primary" onClick={() => setPage(page + 1)}>
          {last ? "Al ejercicio" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}

/** Botón al «Siguiente recomendado» (si no es este mismo elemento) o vuelta al camino. */
function NextLink({ currentId, back }: { currentId: string; back: Route }) {
  const { levels, state } = useCourse();
  const rec = state.recommended;
  if (!rec || rec.itemId === currentId) {
    return (
      <a className="btn primary" href={hrefFor(back)}>
        Volver al Curso
      </a>
    );
  }
  const found = rec.path === "test" ? null : findItem(levels, rec.itemId);
  return (
    <a className="btn primary" href={hrefFor(recommendationRoute(rec))}>
      Siguiente: {found ? itemTitle(found.item) : `Prueba del nivel ${rec.level}`}
    </a>
  );
}

/** Lección del Curso: explicación y ejercicio puntuado (010, FR-007/FR-008). */
export function CourseLesson({ lesson, level, back }: { lesson: Lesson; level: Level; back: Route }) {
  const ex = lesson.exercise;
  const rhythm = ex.kind === "rhythm";
  useEffect(() => touchCourse(lesson.id), [lesson.id]);

  return (
    <Explained title={lesson.title} pages={lesson.pages} back={back}>
      <Practice
        song={ex}
        back={back}
        modes={rhythm ? ["listen", "play"] : ["listen", "learn", "play"]}
        allowLoop={false}
        handsChoice={false}
        beat
        engine={rhythm ? { rhythm: true } : undefined}
        hint={
          rhythm
            ? { listen: "Escucha el ritmo y cuenta los pulsos.", play: "Toca el ritmo con cualquier tecla. Primero suena un compás de cuenta atrás." }
            : ex.kind === "chords"
              ? { play: "Pulsa las tres notas a la vez. Con el ratón, una tras otra y rápido." }
              : undefined
        }
        record={{ key: `course:${lesson.id}`, src: "course", title: lesson.title, unit: levelLabel(level) }}
        onStep={() => touchCourse(lesson.id)}
        onPlayResult={(r) => {
          recordCourseStars(lesson.id, r.stars);
          touchCourse(lesson.id);
        }}
        resultActions={(r) => {
          if (r.mode !== "play") return null;
          if (r.stars < PASS_STARS) return <span className="muted">Con 2 estrellas la lección queda superada. ¡Otra vez!</span>;
          return <NextLink currentId={lesson.id} back={back} />;
        }}
      />
    </Explained>
  );
}

/** Explicación generada de una escala: el paso del pulgar y los dedos (012, FR-014). */
function scalePage(spec: ScaleSpec): ExplainPage {
  const passes = thumbPasses(spec).map((m) => `{${m}}`);
  const how =
    spec.hand === "R"
      ? "al subir, el pulgar pasa por debajo de la mano; al bajar, el dedo 3 o 4 cruza por encima del pulgar"
      : "al subir, el dedo 3 o 4 cruza por encima del pulgar; al bajar, el pulgar pasa por debajo de la mano";
  return {
    text: `Una mano tiene cinco dedos y la escala, ocho notas: la mano tiene que cambiar de posición. Ocurre en ${passes.join(" y ")}: ${how}. Hazlo sin girar la muñeca y con el dedo ya preparado. Sigue los números de dedo: se enseñan, aunque no cuentan para la puntuación.`,
    staff: scale(spec, spec.tempos[0]),
    keys: scaleNotes(spec)
      .slice(0, 8)
      .map((n) => ({ m: n.m, finger: n.f })),
  };
}

/** Escala del camino Técnica: explicación, ejercicio con los dedos a la vista y tres tempos (FR-013–016). */
export function CourseScale({ id, spec, level, back }: { id: string; spec: ScaleSpec; level: Level; back: Route }) {
  const { state } = useCourse();
  const st = state.items[id];
  const step = st?.tempoStep ?? 0;
  // escalón con el que se practica; al pulsar «Subir» se vuelve a montar la práctica con el nuevo
  const [usedStep, setUsedStep] = useState(step);
  const [run, setRun] = useState(0);
  const song = useMemo(() => scale(spec, spec.tempos[usedStep]), [spec, usedStep]);
  const title = useMemo(() => itemTitle({ type: "scale", id, scale: spec }), [id, spec]);
  useEffect(() => touchCourse(id), [id]);

  return (
    <Explained title={title} pages={[scalePage(spec)]} back={back}>
      <Practice
        key={`${id}-${run}`}
        song={song}
        back={back}
        allowLoop={false}
        handsChoice={false}
        beat
        forceFingers
        initialTempo={spec.tempos[usedStep]}
        hint={{ play: `Toca la escala a tempo. Objetivo: ${spec.tempos[2]} ppm. Con 3 estrellas se propone el siguiente tempo.` }}
        record={{ key: `course:${id}`, src: "course", title, unit: levelLabel(level) }}
        onStep={() => touchCourse(id)}
        onPlayResult={(r, _hands, tempo) => {
          const s = stepForTempo(spec.tempos, tempo);
          if (s !== -1) recordScaleStars(id, s, r.stars);
          touchCourse(id);
        }}
        resultActions={(r) => {
          if (r.mode !== "play") return null;
          if (st?.status === "done") return <NextLink currentId={id} back={back} />;
          if (step > usedStep) {
            return (
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setUsedStep(step);
                  setRun(run + 1);
                }}
              >
                Subir a {spec.tempos[step]} ppm
              </button>
            );
          }
          return <span className="muted">Con 3 estrellas a este tempo se propone el siguiente; con 2 a {spec.tempos[2]} ppm, la escala queda dominada.</span>;
        }}
      />
    </Explained>
  );
}

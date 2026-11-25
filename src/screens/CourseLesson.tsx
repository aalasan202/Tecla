import { useEffect, useState } from "react";
import type { Lesson } from "../course/types";
import { Practice } from "../components/Practice";
import { ExplainPageView } from "../components/ExplainPage";
import { TopBar } from "../components/TopBar";
import { recordCourseStars, touchCourse } from "../state/course";
import { useCourse } from "../state/useCourse";
import { findItem, PASS_STARS } from "../course/path";
import { hrefFor } from "../router";
import { itemTitle } from "./CourseMap";

/** Lección del Curso: 1–2 pantallas de explicación y después el ejercicio (FR-007, FR-008). */
export function CourseLesson({ lesson }: { lesson: Lesson }) {
  // al volver, la lección empieza en la primera página
  const [page, setPage] = useState(0);
  const { units, state } = useCourse();
  const ex = lesson.exercise;
  const rhythm = ex.kind === "rhythm";

  useEffect(() => touchCourse(lesson.id), [lesson.id]);

  if (page < lesson.pages.length) {
    const last = page === lesson.pages.length - 1;
    return (
      <div className="screen course-lesson">
        <TopBar title={lesson.title} back={{ name: "course" }} />
        <ExplainPageView key={page} page={lesson.pages[page]} />
        <div className="explain-actions">
          {page > 0 && (
            <button type="button" className="btn" onClick={() => setPage(page - 1)}>
              Anterior
            </button>
          )}
          <span className="muted">
            {page + 1} de {lesson.pages.length + 1}
          </span>
          <button type="button" className="btn primary" onClick={() => setPage(page + 1)}>
            {last ? "Al ejercicio" : "Siguiente"}
          </button>
        </div>
      </div>
    );
  }

  const nextAfter = () => {
    const id = state.next;
    if (!id || id === lesson.id) return null;
    const f = findItem(units, id);
    return f ? { id, title: itemTitle(f.item) } : null;
  };

  return (
    <Practice
      song={ex}
      back={{ name: "course" }}
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
      onStep={() => touchCourse(lesson.id)}
      onPlayResult={(r) => {
        recordCourseStars(lesson.id, r.stars);
        touchCourse(lesson.id);
      }}
      resultActions={(r) => {
        if (r.mode !== "play") return null;
        if (r.stars < PASS_STARS) return <span className="muted">Necesitas 2 estrellas para seguir. ¡Otra vez!</span>;
        const next = nextAfter();
        return next ? (
          <a className="btn primary" href={hrefFor({ name: "courseItem", itemId: next.id })}>
            Siguiente: {next.title}
          </a>
        ) : (
          <a className="btn primary" href={hrefFor({ name: "course" })}>
            Volver al Curso
          </a>
        );
      }}
    />
  );
}

import { useState } from "react";
import type { Unit } from "../course/types";
import { BLOCK_LABEL } from "../course/types";
import { testOutcome } from "../course/path";
import { Practice } from "../components/Practice";
import { TopBar } from "../components/TopBar";
import { markSkipped, recordCourseStars } from "../state/course";
import { hrefFor } from "../router";

/**
 * Prueba de nivel (010, FR-020): un ejercicio por bloque trabajado antes, seguidos. Con 2★ o más
 * en todos se saltan las unidades anteriores. Sin límite de intentos.
 */
export function CourseTest({ unit, index, units }: { unit: Unit; index: number; units: Unit[] }) {
  const exercises = unit.test ?? [];
  // −1: introducción; 0…n−1: ejercicios; n: resultado
  const [step, setStep] = useState(-1);
  // estrellas de este intento (no las mejores guardadas)
  const [got, setGot] = useState<Record<string, number>>({});

  if (step < 0) {
    return (
      <div className="screen course-test">
        <TopBar title={`Prueba de nivel · Unidad ${index + 1}`} back={{ name: "course" }} />
        <section className="panel">
          <h2>{unit.title}</h2>
          <p>
            Si ya sabes lo que enseñan las unidades anteriores, puedes saltarlas. Son {exercises.length} ejercicios cortos, uno de cada bloque. Necesitas
            2 estrellas en Tocar en todos.
          </p>
          <button type="button" className="btn primary" onClick={() => setStep(0)}>
            Empezar la prueba
          </button>
        </section>
      </div>
    );
  }

  if (step >= exercises.length) {
    const outcome = testOutcome(
      exercises.map((e) => e.id),
      got,
    );
    return (
      <div className="screen course-test">
        <TopBar title={`Prueba de nivel · Unidad ${index + 1}`} back={{ name: "course" }} />
        <section className="panel">
          {outcome.passed ? (
            <>
              <h2>¡Prueba superada!</h2>
              <p>La Unidad {index + 1} está abierta. Lo anterior queda disponible por si quieres repasarlo.</p>
              <a className="btn primary" href={hrefFor({ name: "course" })}>
                Ir al Curso
              </a>
            </>
          ) : (
            <>
              <h2>Todavía no</h2>
              <p>Te conviene repasar {outcome.weakest ? BLOCK_LABEL[outcome.weakest].toLowerCase() : "las unidades anteriores"} antes de saltar. Puedes repetir la prueba cuando quieras.</p>
              <div className="explain-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setGot({});
                    setStep(0);
                  }}
                >
                  Repetir prueba
                </button>
                <a className="btn primary" href={hrefFor({ name: "course" })}>
                  Volver al Curso
                </a>
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  const ex = exercises[step];
  const rhythm = ex.kind === "rhythm";
  const done = got[ex.id] !== undefined;
  const advance = () => {
    if (step + 1 >= exercises.length) {
      // aprobada: se saltan las unidades anteriores (sus elementos quedan como opcionales)
      if (testOutcome(exercises.map((e) => e.id), got).passed) markSkipped(units.slice(0, index).map((u) => u.id));
    }
    setStep(step + 1);
  };
  return (
    <Practice
      key={ex.id}
      song={ex}
      back={{ name: "course" }}
      modes={["listen", "play"]}
      initialMode="play"
      allowLoop={false}
      handsChoice={false}
      beat
      engine={rhythm ? { rhythm: true } : undefined}
      hint={{
        listen: `Ejercicio ${step + 1} de ${exercises.length}. Escucha cómo suena.`,
        play: `Ejercicio ${step + 1} de ${exercises.length}.${rhythm ? " Toca el ritmo con cualquier tecla." : ""} Necesitas 2 estrellas.`,
      }}
      onPlayResult={(r) => {
        recordCourseStars(ex.id, r.stars);
        setGot((g) => ({ ...g, [ex.id]: Math.max(g[ex.id] ?? 0, r.stars) }));
      }}
      resultActions={(r) =>
        r.mode === "play" || done ? (
          <button type="button" className="btn primary" onClick={advance}>
            {step + 1 < exercises.length ? "Siguiente ejercicio" : "Ver resultado"}
          </button>
        ) : null
      }
    />
  );
}

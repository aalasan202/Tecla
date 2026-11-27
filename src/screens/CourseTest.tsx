import { useState } from "react";
import type { Level } from "../course/types";
import { BLOCK_LABEL } from "../course/types";
import { testOutcome } from "../course/state";
import { Practice } from "../components/Practice";
import { TopBar } from "../components/TopBar";
import { markLevelTest, recordCourseStars } from "../state/course";
import { levelLabel } from "./courseItems";
import { hrefFor } from "../router";
import { recordAttempt } from "../state/history";
import { makeAttempt } from "../stats/attempts";

/**
 * Prueba de nivel (010, FR-020; 012, FR-022): un ejercicio por tema del nivel anterior, seguidos.
 * Con 2★ o más en todos se abre el nivel (y los anteriores). Sin límite de intentos.
 */
export function CourseTest({ level }: { level: Level }) {
  const exercises = level.test ?? [];
  const n = level.n as 2 | 3 | 4;
  const back = { name: "course" as const, level: n, path: "lessons" as const };
  // −1: introducción; 0…n−1: ejercicios; n: resultado
  const [step, setStep] = useState(-1);
  // estrellas de este intento (no las mejores guardadas)
  const [got, setGot] = useState<Record<string, number>>({});
  // mejor nota (0–1) de cada ejercicio en esta pasada: para el historial (011, research R2)
  const [scores, setScores] = useState<Record<string, number>>({});

  if (step < 0) {
    return (
      <div className="screen course-test">
        <TopBar title={`Prueba del nivel ${n}`} back={back} />
        <section className="panel">
          <h2>{levelLabel(level)}</h2>
          <p>
            Si ya sabes lo que enseña el nivel {n - 1}, puedes saltarlo. Son {exercises.length} ejercicios cortos, uno de cada tema. Necesitas 2
            estrellas en Tocar en todos.
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
        <TopBar title={`Prueba del nivel ${n}`} back={back} />
        <section className="panel">
          {outcome.passed ? (
            <>
              <h2>¡Prueba superada!</h2>
              <p>El nivel {n} está abierto. Lo anterior queda disponible por si quieres repasarlo.</p>
              <a className="btn primary" href={hrefFor(back)}>
                Ir al nivel {n}
              </a>
            </>
          ) : (
            <>
              <h2>Todavía no</h2>
              <p>Te conviene repasar {outcome.weakest ? BLOCK_LABEL[outcome.weakest].toLowerCase() : `el nivel ${n - 1}`} antes de saltar. Puedes repetir la prueba cuando quieras.</p>
              <div className="explain-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setGot({});
                    setScores({});
                    setStep(0);
                  }}
                >
                  Repetir prueba
                </button>
                <a className="btn primary" href={hrefFor({ name: "course", level: (n - 1) as 1 | 2 | 3, path: "lessons" })}>
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
      // la prueba completa es un intento: media de las notas y el mínimo de las estrellas
      const ids = exercises.map((e) => e.id);
      recordAttempt(
        makeAttempt({
          source: { key: `course:test:${n}`, src: "course", title: `Prueba del nivel ${n}`, unit: levelLabel(level) },
          mode: "play",
          hands: "both",
          twoHands: false,
          tempo: exercises[0]?.tempo ?? 0,
          score: ids.reduce((a, id) => a + (scores[id] ?? 0), 0) / (ids.length || 1),
          stars: Math.min(...ids.map((id) => got[id] ?? 0)),
        }),
      );
      // aprobada: se saltan las unidades anteriores (sus elementos quedan como opcionales)
      if (testOutcome(exercises.map((e) => e.id), got).passed) markLevelTest(n);
    }
    setStep(step + 1);
  };
  return (
    <Practice
      key={ex.id}
      song={ex}
      back={back}
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
        setScores((g) => ({ ...g, [ex.id]: Math.max(g[ex.id] ?? 0, r.score ?? 0) }));
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

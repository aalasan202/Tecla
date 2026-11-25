import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import { IconCheck, IconFlag, IconLock, IconTip } from "../components/Icons";
import { BLOCK_LABEL, type PathItem, type PathState, type Unit } from "../course/types";
import { findSong } from "../state/library";
import { hrefFor } from "../router";
import { useCourse } from "../state/useCourse";

const UNIT_LABEL = { locked: "Bloqueada", current: "En curso", passed: "Superada", skipped: "Superada por prueba" } as const;

export const itemTitle = (item: PathItem): string =>
  item.type === "lesson" ? item.lesson.title : item.type === "tip" ? item.tip.title : (findSong(item.songId)?.title ?? item.songId);

/** Qué hay que superar antes de un elemento bloqueado (FR-018). */
export function lockedReason(units: Unit[], state: PathState, itemId: string): string {
  const flat = units.flatMap((u) => u.items);
  const i = flat.findIndex((x) => x.id === itemId);
  const before = flat
    .slice(0, i)
    .reverse()
    .find((x) => x.type !== "tip" && state.items[x.id].status !== "passed" && state.items[x.id].status !== "optional");
  return before ? `Supera antes «${itemTitle(before)}» con 2 estrellas.` : "Supera antes los pasos anteriores.";
}

const Stars = ({ n }: { n: number }) => (
  <span className="stars" aria-label={`${n} de 3 estrellas`}>
    {"★".repeat(n)}
    {"☆".repeat(3 - n)}
  </span>
);

/** Mapa del Curso: unidades y elementos con su estado (FR-029). */
export function CourseMap() {
  const { units, state } = useCourse();
  const [notice, setNotice] = useState<string | null>(null);
  const nextRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    nextRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  return (
    <div className="screen course">
      <TopBar title="Curso" back={{ name: "home" }} />
      {state.next === null && (
        <section className="panel course-done">
          <h2>¡Ruta completada!</h2>
          <p>
            Ya dominas lo básico de los niveles 1 y 2. Sigue con las piezas de nivel 3 en <a href="#canciones">Canciones</a>.
          </p>
        </section>
      )}
      {notice && (
        <p className="course-notice" role="status">
          {notice}
        </p>
      )}
      {units.map((unit, ui) => {
        const us = state.units[unit.id];
        return (
          <section key={unit.id} className={`panel unit unit-${us}`} aria-labelledby={`unit-${unit.id}`}>
            <header className="unit-head">
              <div>
                <span className="eyebrow-dark">
                  Unidad {ui + 1} · Nivel {unit.level}
                </span>
                <h2 id={`unit-${unit.id}`}>{unit.title}</h2>
              </div>
              <span className={`unit-status s-${us}`}>{UNIT_LABEL[us]}</span>
            </header>
            {us === "locked" && unit.test && (
              <p className="unit-test">
                ¿Ya sabes lo de antes? <a href={hrefFor({ name: "courseTest", unitId: unit.id })}>Haz la prueba de nivel</a> para saltar hasta aquí.
              </p>
            )}
            <ol className="path">
              {unit.items.map((item) => {
                const it = state.items[item.id];
                const isNext = state.next === item.id;
                const kind = item.type === "lesson" ? BLOCK_LABEL[item.lesson.block] : item.type === "tip" ? "Consejo" : "Pieza";
                const body = (
                  <>
                    <span className={`path-icon t-${item.type}`}>
                      {it.status === "locked" ? <IconLock /> : item.type === "tip" ? <IconTip size={18} /> : item.type === "milestone" ? <IconFlag size={18} /> : <span className="path-dot" />}
                    </span>
                    <span className="path-text">
                      <span className="path-kind">{kind}</span>
                      <span className="path-title">{itemTitle(item)}</span>
                    </span>
                    <span className="path-meta">
                      {it.status === "optional" && <span className="tag">Opcional</span>}
                      {it.status === "seen" && <IconCheck />}
                      {item.type !== "tip" && it.stars !== undefined && it.status !== "locked" && <Stars n={it.stars} />}
                    </span>
                  </>
                );
                return (
                  <li key={item.id} className={`path-item p-${it.status}${isNext ? " next" : ""}`}>
                    {it.status === "locked" ? (
                      <button type="button" className="path-link" onClick={() => setNotice(lockedReason(units, state, item.id))}>
                        {body}
                      </button>
                    ) : (
                      <a ref={isNext ? nextRef : undefined} className="path-link" href={hrefFor({ name: "courseItem", itemId: item.id })}>
                        {body}
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

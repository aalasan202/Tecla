import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { IconCheck, IconFlag, IconLock, IconTip } from "../components/Icons";
import { PATH_LABEL, type CourseItem, type ItemState, type LevelN, type Path } from "../course/types";
import { PATHS, findItem, itemsOf } from "../course/state";
import { hrefFor, type CourseLevel, type CoursePath } from "../router";
import { useCourse } from "../state/useCourse";
import { itemKind, itemTitle, levelLabel, lockedLevelReason, recommendationRoute } from "./courseItems";

const Stars = ({ n }: { n: number }) => (
  <span className="stars" aria-label={`${n} de 3 estrellas`}>
    {"★".repeat(n)}
    {"☆".repeat(3 - n)}
  </span>
);

const EMPTY: Record<Path, string> = {
  lessons: "Este nivel todavía no tiene lecciones.",
  technique: "Este nivel todavía no tiene ejercicios de técnica.",
  songs: "No hay canciones del repertorio en este nivel.",
};

/** Mapa del Curso (012): niveles, tres caminos con su avance y «Siguiente recomendado». */
export function CourseMap({ level, path = "lessons" }: { level?: CourseLevel; path?: CoursePath }) {
  const { levels, state } = useCourse();
  const n: LevelN = level ?? state.current;
  const lv = levels[n - 1];
  const ls = state.levels[n];
  const rec = state.recommended;
  const recItem = rec && rec.path !== "test" ? (findItem(levels, rec.itemId)?.item ?? null) : null;
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="screen course">
      <TopBar title="Curso" back={{ name: "home" }} />

      {rec && (
        <section className="panel course-rec" aria-label="Siguiente recomendado">
          <div>
            <span className="eyebrow-dark">
              Siguiente recomendado · Nivel {rec.level} · {rec.path === "test" ? "Prueba" : PATH_LABEL[rec.path]}
            </span>
            <h2>{rec.path === "test" ? `Prueba del nivel ${rec.level}` : recItem ? itemTitle(recItem) : rec.itemId}</h2>
            <p className="muted">{rec.reason}</p>
          </div>
          <a className="btn primary" href={hrefFor(recommendationRoute(rec))}>
            Empezar
          </a>
        </section>
      )}

      <nav className="levels" aria-label="Niveles">
        {levels.map((l) => {
          const open = state.levels[l.n].open;
          return (
            <a
              key={l.n}
              className={`level-chip${l.n === n ? " on" : ""}${open ? "" : " locked"}`}
              href={hrefFor({ name: "course", level: l.n, path })}
              aria-current={l.n === n ? "page" : undefined}
            >
              {!open && <IconLock />}
              <span className="level-n">Nivel {l.n}</span>
              <span className="level-title">{l.title}</span>
            </a>
          );
        })}
      </nav>

      {!ls.open && (
        <section className="panel level-locked">
          <p>{lockedLevelReason(n)}</p>
          {lv.test && (
            <a className="btn" href={hrefFor({ name: "courseTest", level: n as 2 | 3 | 4 })}>
              Hacer la prueba del nivel {n}
            </a>
          )}
        </section>
      )}

      <section className="panel" aria-label={levelLabel(lv)}>
        <nav className="tabs" role="tablist" aria-label="Caminos del nivel">
          {PATHS.map((p) => {
            const pr = ls.progress[p];
            return (
              <a key={p} role="tab" aria-selected={p === path} className={p === path ? "tab on" : "tab"} href={hrefFor({ name: "course", level: n, path: p })}>
                {PATH_LABEL[p]}
                {pr.total > 0 && (
                  <span className="tab-count">
                    {pr.done}/{pr.total}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
        {notice && (
          <p className="course-notice" role="status">
            {notice}
          </p>
        )}
        {itemsOf(lv, path).length === 0 ? (
          <p className="muted">{EMPTY[path]}</p>
        ) : (
          <ol className="path">
            {itemsOf(lv, path).map((item) => (
              <ItemRow key={item.id} item={item} st={state.items[item.id]} recommended={rec?.itemId === item.id} onLocked={() => setNotice(lockedLevelReason(n))} />
            ))}
          </ol>
        )}
        {path === "technique" && <p className="muted">Los números de dedo se enseñan, pero no puntúan: la app no puede saber qué dedo pulsa.</p>}
      </section>
    </div>
  );
}

function ItemRow({ item, st, recommended, onLocked }: { item: CourseItem; st: ItemState; recommended: boolean; onLocked(): void }) {
  const locked = st.status === "locked";
  const tempo = item.type === "scale" && st.tempoStep !== undefined ? item.scale.tempos[st.tempoStep] : null;
  const body = (
    <>
      <span className={`path-icon t-${item.type}`}>
        {locked ? <IconLock /> : item.type === "tip" ? <IconTip size={18} /> : item.type === "song" && item.recommended ? <IconFlag size={18} /> : <span className="path-dot" />}
      </span>
      <span className="path-text">
        <span className="path-kind">{itemKind(item)}</span>
        <span className="path-title">{itemTitle(item)}</span>
      </span>
      <span className="path-meta">
        {st.status === "needsMidi" && <span className="tag">Requiere teclado MIDI</span>}
        {item.type === "scale" && !locked && (st.status === "done" ? <span className="tag ok">Dominada</span> : tempo && <span className="tag">{tempo} ppm</span>)}
        {item.type === "tip" && st.status === "done" && <IconCheck />}
        {item.type !== "tip" && st.stars !== undefined && !locked && <Stars n={st.stars} />}
      </span>
    </>
  );
  return (
    <li className={`path-item p-${st.status}${recommended ? " next" : ""}`}>
      {locked ? (
        <button type="button" className="path-link" onClick={onLocked}>
          {body}
        </button>
      ) : (
        <a className="path-link" href={hrefFor({ name: "courseItem", itemId: item.id })}>
          {body}
        </a>
      )}
    </li>
  );
}

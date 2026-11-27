import { useMemo } from "react";
import { TopBar } from "../components/TopBar";
import { ScoreTrend } from "../components/ScoreTrend";
import { AttemptRow, pct, Stars } from "../components/AttemptRow";
import { useHistory } from "../state/history";
import { findSong } from "../state/library";
import { useCourse } from "../state/useCourse";
import { findItem } from "../course/path";
import { itemTitle } from "./CourseMap";
import { hrefFor, type Route } from "../router";
import { starsFor } from "../engine/lesson";

/** A dónde lleva «Practicar» y cómo se llama la pieza si aún existe. */
function usePieceTarget(key: string): { title: string; route: Route } | null {
  const { units } = useCourse();
  if (key.startsWith("song:")) {
    const song = findSong(key.slice(5));
    return song ? { title: song.title, route: { name: "lesson", songId: song.id } } : null;
  }
  if (key.startsWith("course:test:")) {
    const unitId = key.slice(12);
    const i = units.findIndex((u) => u.id === unitId);
    return i > 0 && units[i].test ? { title: `Prueba de nivel · Unidad ${i + 1}`, route: { name: "courseTest", unitId } } : null;
  }
  if (key.startsWith("course:")) {
    const found = findItem(units, key.slice(7));
    return found ? { title: itemTitle(found.item), route: { name: "courseItem", itemId: found.item.id } } : null;
  }
  return null;
}

/** Ficha de historial de una pieza, lección o prueba (011, FR-006). */
export function PieceHistory({ pieceKey }: { pieceKey: string }) {
  const h = useHistory();
  const target = usePieceTarget(pieceKey);
  const summary = h.pieces[pieceKey];
  const attempts = useMemo(() => h.attempts.filter((a) => a.key === pieceKey).reverse(), [h.attempts, pieceKey]);
  const title = summary?.title ?? attempts[0]?.title ?? target?.title ?? "Pieza";
  const unit = summary?.unit ?? attempts[0]?.unit;

  return (
    <div className="screen">
      <TopBar title={title} back={{ name: "progress", tab: "pieces" }} />
      {unit && <p className="muted piece-unit">{unit}</p>}

      {!summary ? (
        <section className="panel">
          <p>Aún no hay intentos con {target ? "esta pieza" : "esta pieza (ya no está en la app)"}.</p>
          {target && (
            <a className="btn primary" href={hrefFor(target.route)}>
              Practicar ahora
            </a>
          )}
        </section>
      ) : (
        <>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{summary.count}</span>
              <span className="stat-label">{summary.count === 1 ? "Intento" : "Intentos"}</span>
            </div>
            <div className="stat">
              <span className="stat-value">{summary.best ? pct(summary.best.score) : "—"}</span>
              <span className="stat-label">
                Mejor nota en Tocar {summary.best && <Stars n={starsFor(summary.best.score)} />}
              </span>
            </div>
            <div className="stat">
              <span className="stat-value">{pct(summary.last.score)}</span>
              <span className="stat-label">Última nota ({summary.last.mode === "play" ? "Tocar" : "Aprender"})</span>
            </div>
          </div>

          <section className="panel">
            <div className="panel-head">
              <h2>Evolución</h2>
              {target && (
                <a className="btn" href={hrefFor(target.route)}>
                  Practicar
                </a>
              )}
            </div>
            <ScoreTrend attempts={attempts} />
            <p className="muted">Cuentan los intentos en Tocar con la pieza completa{pieceKey.startsWith("song:") ? " y, si es a dos manos, con las dos" : ""}.</p>
          </section>

          <section className="panel">
            <h2>Intentos</h2>
            {attempts.length ? (
              <ul className="attempt-list">
                {attempts.map((a, i) => (
                  <AttemptRow key={a.at + ":" + i} a={a} showTitle={false} />
                ))}
              </ul>
            ) : (
              <p className="muted">Los intentos más antiguos ya no se guardan; el resumen de arriba sí los cuenta.</p>
            )}
            {attempts.length > 0 && attempts.length < summary.count && (
              <p className="muted">Se muestran los {attempts.length} más recientes de {summary.count}.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

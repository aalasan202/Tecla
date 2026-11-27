import { SONGS } from "../music/songs";
import { buildScore, measureCount } from "../music/score";
import { dayKey, progress, lastWeek, streak } from "../state/progress";
import { settings } from "../state/settings";
import { goalMet } from "../stats/streaks";
import { findSong, repertoireStars, resolveSongId } from "../state/library";
import { TopBar } from "../components/TopBar";
import { MiniStaff } from "../components/MiniStaff";
import { IconCourse, IconPiano, IconPlay, IconProgress, IconSettings, IconSongs } from "../components/Icons";
import { hrefFor } from "../router";
import { useCourse } from "../state/useCourse";
import { continueTarget, courseStars, findItem } from "../course/path";
import { itemTitle } from "./CourseMap";

const MODE_LABEL = { listen: "Paso 1 de 3: Escuchar", learn: "Paso 2 de 3: Aprender", play: "Paso 3 de 3: Tocar" } as const;
const HANDS_LABEL = { both: "", R: " · mano derecha", L: " · mano izquierda" } as const;

export function Home() {
  const p = progress.use();
  // una importada abre la versión elegida, aunque se cambiara después de practicarla
  const lastSong = p.last ? findSong(resolveSongId(p.last.songId)) : undefined;
  const last = lastSong ? p.last : null;
  const song = lastSong ?? SONGS[0];
  const measures = measureCount(buildScore(song));
  const fraction = last?.progress ?? 0;
  const measure = Math.min(measures, Math.floor(fraction * measures) + 1);
  const totalStars = repertoireStars(p.best);
  const maxStars = SONGS.length * 3;
  const week = lastWeek(p.days);
  const days = streak(p.days);
  // 011: recordatorio de racha (FR-013) y objetivo de hoy (FR-020)
  const todaySeconds = p.days[dayKey()] ?? 0;
  const practicedToday = todaySeconds > 0;
  const { dailyGoal } = settings.use();
  // Curso (010): avance, estrellas aparte (FR-037) y «Continuar» si fue lo último (FR-030)
  const { units, cp, state } = useCourse();
  const cStars = courseStars(units, cp);
  const summary = state.summary;
  const summaryUnit = summary ? units.findIndex((u) => u.id === summary.unitId) + 1 : 0;
  const target = continueTarget(cp.last, p.last, state.next);
  const courseNext = target.kind === "course" ? findItem(units, target.itemId) : null;

  const courseTile = (
    <a className="tile tile-course" href="#curso">
      <span className="tile-icon i-blue">
        <IconCourse />
      </span>
      <span className="tile-title">Curso</span>
      <span className="tile-text">
        {summary ? `Unidad ${summaryUnit} · ${summary.done} de ${summary.total}` : "Ruta completada"}. Aprende desde cero: lectura, ritmo, posiciones y acordes.
      </span>
      <span className="tile-meta blue">
        Curso: ★ {cStars.stars} de {cStars.max} estrellas
      </span>
    </a>
  );

  return (
    <div className="screen home">
      <TopBar />
      <div className="home-grid">
        {courseNext ? (
          <section className="continue" aria-label="Continuar">
            <div className="continue-body">
              <span className="eyebrow">Continuar el Curso</span>
              <div className="continue-title">
                <h2>{itemTitle(courseNext.item)}</h2>
                <p>
                  Unidad {units.indexOf(courseNext.unit) + 1} · {courseNext.unit.title}
                </p>
              </div>
              <div className="continue-art">
                <MiniStaff song={courseNext.item.type === "lesson" ? courseNext.item.lesson.exercise : (findSong(courseNext.item.type === "milestone" ? courseNext.item.songId : "") ?? song)} progress={0} />
              </div>
              <div className="continue-actions">
                <a className="btn-light" href={hrefFor({ name: "courseItem", itemId: courseNext.item.id })}>
                  <IconPlay />
                  Continuar
                </a>
                <a className="btn-outline-light" href="#curso">
                  Ver el Curso
                </a>
              </div>
            </div>
          </section>
        ) : (
        <section className="continue" aria-label={last ? "Continuar" : "Empezar"}>
          <div className="continue-body">
            <span className="eyebrow">{last ? "Continuar donde lo dejaste" : "Empieza por aquí"}</span>
            <div className="continue-title">
              <h2>{song.title}</h2>
              <p>
                {song.level.split(" · ")[0]} · {last ? MODE_LABEL[last.mode] + HANDS_LABEL[last.hands] : "Tu primera pieza, con cinco dedos"}
              </p>
            </div>
            <div className="continue-art">
              <MiniStaff song={song} progress={fraction} />
            </div>
            {last && (
              <div className="bar-wrap">
                <div className="bar-legend">
                  <span>
                    Compás {measure} de {measures}
                  </span>
                  <span>{Math.round(fraction * 100)} %</span>
                </div>
                <div className="bar" role="progressbar" aria-valuenow={Math.round(fraction * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div style={{ width: `${fraction * 100}%` }} />
                </div>
              </div>
            )}
            <div className="continue-actions">
              <a className="btn-light" href={hrefFor({ name: "lesson", songId: song.id })}>
                <IconPlay />
                {last ? "Continuar" : "Empezar"}
              </a>
              <a className="btn-outline-light" href="#canciones">
                Elegir otra canción
              </a>
            </div>
          </div>
        </section>
        )}

        <nav className="tiles" aria-label="Menú">
          {courseTile}
          <a className="tile" href="#canciones">
            <span className="tile-icon i-blue">
              <IconSongs />
            </span>
            <span className="tile-title">Canciones</span>
            <span className="tile-text">
              {SONGS.length} piezas en 4 niveles, de Cinco dedos a Bach.
            </span>
            <span className="tile-meta blue">
              ★ {totalStars} de {maxStars} estrellas
            </span>
          </a>
          <a className="tile" href="#piano">
            <span className="tile-icon i-green">
              <IconPiano />
            </span>
            <span className="tile-title">Piano libre</span>
            <span className="tile-text">Toca sin partitura con el teclado en pantalla o tu piano MIDI.</span>
            <span className="tile-meta green">Ideal para probar el sonido</span>
          </a>
          <a className="tile" href="#progreso">
            <span className="tile-icon i-orange">
              <IconProgress />
            </span>
            <span className="tile-title">Progreso</span>
            <span className="tile-text">
              {!days
                ? "Practica hoy para empezar una racha."
                : practicedToday
                  ? `Racha de ${days} ${days === 1 ? "día" : "días"}.`
                  : `Racha de ${days} ${days === 1 ? "día" : "días"}. Practica hoy para mantenerla.`}
            </span>
            {dailyGoal > 0 && (
              <span className={goalMet(todaySeconds, dailyGoal) ? "tile-goal done" : "tile-goal"}>
                <span>{goalMet(todaySeconds, dailyGoal) ? "Objetivo de hoy cumplido" : `Hoy: ${Math.floor(todaySeconds / 60)} de ${dailyGoal} min`}</span>
                <span className="goal-bar" role="progressbar" aria-label="Objetivo de hoy" aria-valuemin={0} aria-valuemax={dailyGoal} aria-valuenow={Math.min(dailyGoal, Math.floor(todaySeconds / 60))}>
                  <span style={{ width: `${Math.min(100, (todaySeconds / (dailyGoal * 60)) * 100)}%` }} />
                </span>
              </span>
            )}
            <span className="week" aria-label={`Has practicado ${week.filter((d) => d.seconds).length} de los últimos 7 días`}>
              {week.map((d) => (
                <span key={d.key} className={d.seconds ? "on" : ""} />
              ))}
            </span>
          </a>
          <a className="tile" href="#ajustes">
            <span className="tile-icon i-grey">
              <IconSettings />
            </span>
            <span className="tile-title">Ajustes</span>
            <span className="tile-text">Teclado MIDI, nombres de notas, dedos y tema.</span>
          </a>
        </nav>
      </div>
    </div>
  );
}

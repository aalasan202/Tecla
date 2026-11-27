import { useMemo, useState } from "react";
import { SONGS } from "../music/songs";
import { dayKey, formatDuration, progress, streak } from "../state/progress";
import { repertoireStars, useLibrary } from "../state/library";
import { settings } from "../state/settings";
import { useHistory } from "../state/history";
import { TopBar } from "../components/TopBar";
import { TimeBars } from "../components/TimeBars";
import { StreakCalendar } from "../components/StreakCalendar";
import { AttemptRow, pct, Stars } from "../components/AttemptRow";
import { hrefFor, type ProgressTab } from "../router";
import { useCourse } from "../state/useCourse";
import { courseStars } from "../course/state";
import { bestStreak, goalMet } from "../stats/streaks";
import { periodStats } from "../stats/period";
import type { HistoryData, Period } from "../stats/types";

const TABS: [ProgressTab | undefined, string][] = [
  [undefined, "Resumen"],
  ["history", "Historial"],
  ["pieces", "Piezas"],
];

/** Progreso en tres pestañas: Resumen, Historial y Piezas (011, FR-025). */
export function ProgressScreen({ tab }: { tab?: ProgressTab }) {
  return (
    <div className="screen">
      <TopBar title="Progreso" back={{ name: "home" }} />
      <nav className="tabs" role="tablist" aria-label="Secciones de Progreso">
        {TABS.map(([t, label]) => (
          <a key={label} role="tab" aria-selected={tab === t} className={tab === t ? "tab on" : "tab"} href={hrefFor({ name: "progress", tab: t })}>
            {label}
          </a>
        ))}
      </nav>
      {tab === "history" ? <HistoryTab /> : tab === "pieces" ? <PiecesTab /> : <SummaryTab />}
    </div>
  );
}

/* ---------- Resumen ---------- */

const PERIODS: [Period, string][] = [
  ["7d", "7 días"],
  ["30d", "30 días"],
  ["all", "Todo"],
];
const PERIOD_KEY = "tecla-progress-period";

function loadPeriod(): Period {
  try {
    const v = sessionStorage.getItem(PERIOD_KEY);
    return v === "30d" || v === "all" ? v : "7d";
  } catch {
    return "7d";
  }
}

function SummaryTab() {
  const p = progress.use();
  const h = useHistory();
  const { dailyGoal } = settings.use();
  const { levels, cp } = useCourse();
  const [period, setPeriod] = useState<Period>(loadPeriod);
  const choose = (v: Period) => {
    setPeriod(v);
    try {
      sessionStorage.setItem(PERIOD_KEY, v);
    } catch {
      /* sin almacenamiento: solo dura la visita */
    }
  };

  const days = streak(p.days);
  const best = useMemo(() => bestStreak(p.days), [p.days]);
  const today = p.days[dayKey()] ?? 0;
  const cStars = courseStars(levels, cp);
  const stats: [string, string][] = [
    ["Racha", `${days} ${days === 1 ? "día" : "días"}`],
    ["Mejor racha", `${best} ${best === 1 ? "día" : "días"}`],
    ["Estrellas", `${repertoireStars(p.best)} de ${SONGS.length * 3}`],
    ["Piezas dominadas", `${SONGS.filter((s) => (p.best[s.id] ?? 0) === 3).length} de ${SONGS.length}`],
    ["Curso", `${cStars.stars} de ${cStars.max} ★`],
  ];

  return (
    <>
      {dailyGoal > 0 && <GoalCard seconds={today} goal={dailyGoal} />}
      <div className="stats">
        {stats.map(([label, value]) => (
          <div key={label} className="stat">
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>

      <section className="panel">
        <h2>Constancia</h2>
        <StreakCalendar days={p.days} goal={dailyGoal} />
        <p className="muted">Cualquier día con práctica cuenta para la racha.</p>
      </section>

      <PeriodPanel period={period} onPeriod={choose} days={p.days} h={h} />
    </>
  );
}

export function GoalCard({ seconds, goal }: { seconds: number; goal: number }) {
  const done = goalMet(seconds, goal);
  const min = Math.floor(seconds / 60);
  return (
    <div className={done ? "goal done" : "goal"}>
      <span className="goal-text">{done ? "Objetivo de hoy cumplido" : `Hoy: ${min} de ${goal} min`}</span>
      <span className="goal-bar" role="progressbar" aria-label="Objetivo de hoy" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(goal, min)}>
        <span style={{ width: `${Math.min(100, (seconds / (goal * 60)) * 100)}%` }} />
      </span>
    </div>
  );
}

function PeriodPanel({ period, onPeriod, days, h }: { period: Period; onPeriod(p: Period): void; days: Record<string, number>; h: HistoryData }) {
  const s = useMemo(() => periodStats(period, days, h), [period, days, h]);
  const both = (song: string, course: string) => `${song} · ${course}`;
  const avg = (v: number | null) => (v === null ? "—" : pct(v));
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Estadísticas</h2>
        <div className="seg" role="group" aria-label="Periodo">
          {PERIODS.map(([v, label]) => (
            <button key={v} type="button" aria-pressed={period === v} onClick={() => onPeriod(v)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {s.empty ? (
        <p className="empty">Aún no has practicado en este periodo. Diez minutos hoy ya cuentan: elige una canción o sigue con el Curso.</p>
      ) : (
        <>
          <div className="stats compact">
            <div className="stat">
              <span className="stat-value">{formatDuration(s.seconds)}</span>
              <span className="stat-label">Tiempo de práctica</span>
            </div>
            <div className="stat">
              <span className="stat-value">{s.daysPracticed}</span>
              <span className="stat-label">{s.daysPracticed === 1 ? "Día con práctica" : "Días con práctica"}</span>
            </div>
            <div className="stat">
              <span className="stat-value">{both(String(s.attempts.song), String(s.attempts.course))}</span>
              <span className="stat-label">Intentos · Canciones · Curso</span>
            </div>
            <div className="stat">
              <span className="stat-value">{both(avg(s.avgPlay.song), avg(s.avgPlay.course))}</span>
              <span className="stat-label">Nota media en Tocar · Canciones · Curso</span>
            </div>
          </div>
          <TimeBars series={s.series} />
          <p className="muted">
            {s.unit === "day" ? "Tiempo por día." : s.unit === "week" ? "Tiempo por semana." : "Tiempo por mes."} Cuenta el tiempo con una lección o ejercicio en marcha
            y el que tocas en Piano libre.
          </p>
          <div className="rank-grid">
            <div>
              <h3>Más practicadas</h3>
              {s.top.length ? (
                <ol className="rank">
                  {s.top.map((t) => (
                    <li key={t.key}>
                      <a href={hrefFor({ name: "piece", key: t.key })}>{t.title}</a>
                      <span className={`origin ${t.src}`}>{t.src === "song" ? "Canciones" : "Curso"}</span>
                      <span className="muted">
                        {t.attempts} {t.attempts === 1 ? "intento" : "intentos"}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="muted">Termina un intento para verlas aquí.</p>
              )}
            </div>
            <div>
              <h3>Más mejoradas</h3>
              {s.improved.length ? (
                <ol className="rank">
                  {s.improved.map((t) => (
                    <li key={t.key}>
                      <a href={hrefFor({ name: "piece", key: t.key })}>{t.title}</a>
                      <span className={`origin ${t.src}`}>{t.src === "song" ? "Canciones" : "Curso"}</span>
                      <span className="muted">
                        de {pct(t.from)} a {pct(t.to)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="muted">Toca una pieza al menos dos veces en Tocar para ver cuánto mejoras.</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/* ---------- Historial ---------- */

const PAGE = 30;

function HistoryTab() {
  const h = useHistory();
  const [shown, setShown] = useState(PAGE);
  const list = useMemo(() => [...h.attempts].reverse(), [h.attempts]);
  if (!list.length) {
    return (
      <section className="panel">
        <p className="empty">Aún no hay intentos. Cada vez que termines una pieza o una lección en Aprender o Tocar, aparecerá aquí con su nota.</p>
        <a className="btn primary" href="#canciones">
          Elegir una canción
        </a>
      </section>
    );
  }
  return (
    <section className="panel">
      <ul className="attempt-list">
        {list.slice(0, shown).map((a, i) => (
          <AttemptRow key={a.at + ":" + i} a={a} />
        ))}
      </ul>
      {shown < list.length && (
        <button type="button" className="btn" onClick={() => setShown(shown + PAGE)}>
          Ver más
        </button>
      )}
    </section>
  );
}

/* ---------- Piezas ---------- */

function PiecesTab() {
  const p = progress.use();
  const h = useHistory();
  const songs = useLibrary();
  const { levels, state } = useCourse();
  const courseKeys = Object.entries(h.pieces).filter(([k]) => k.startsWith("course:"));

  return (
    <>
      <section className="panel">
        <h2>Curso</h2>
        <ul className="song-list">
          {levels.map((lv) => {
            const ls = state.levels[lv.n];
            const pr = ls.progress;
            const label = !ls.open
              ? "Bloqueado"
              : `Lecciones ${pr.lessons.done}/${pr.lessons.total} · Técnica ${pr.technique.done}/${pr.technique.total} · Canciones ${pr.songs.done}/${pr.songs.total}`;
            return (
              <li key={lv.n}>
                <a href={hrefFor({ name: "course", level: lv.n, path: "lessons" })}>
                  Nivel {lv.n} · {lv.title}
                </a>
                <span className="muted">{ls.byTest ? "Abierto por prueba" : ""}</span>
                <span className="muted">{label}</span>
              </li>
            );
          })}
        </ul>
        {courseKeys.length > 0 && (
          <>
            <h3>Lecciones y pruebas practicadas</h3>
            <ul className="song-list">
              {courseKeys.map(([key, s]) => (
                <li key={key}>
                  <a href={hrefFor({ name: "piece", key })}>{s.title}</a>
                  <span className="muted">
                    {s.count} {s.count === 1 ? "intento" : "intentos"}
                  </span>
                  <span className="muted">{s.best ? `mejor ${pct(s.best.score)}` : ""}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="muted">Las estrellas del Curso se ganan en el paso Tocar de cada lección y no suman a las de Canciones.</p>
      </section>

      <section className="panel">
        <h2>Canciones</h2>
        <ul className="song-list">
          {songs.map((s) => {
            const st = p.best[s.id] ?? 0;
            const sum = h.pieces[`song:${s.id}`];
            return (
              <li key={s.id}>
                <a href={hrefFor({ name: "piece", key: `song:${s.id}` })}>{s.title}</a>
                <span className="muted">{sum ? `${sum.count} ${sum.count === 1 ? "intento" : "intentos"}` : s.level.split(" · ")[0]}</span>
                <Stars n={st} />
              </li>
            );
          })}
        </ul>
        <p className="muted">Las estrellas se ganan en el paso Tocar con las dos manos. Pulsa una pieza para ver su historial.</p>
      </section>
    </>
  );
}

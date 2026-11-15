import { SONGS } from "../music/songs";
import { formatDuration, lastWeek, progress, streak } from "../state/progress";
import { TopBar } from "../components/TopBar";
import { hrefFor } from "../router";

const WEEKDAY = ["D", "L", "M", "X", "J", "V", "S"];

export function ProgressScreen() {
  const p = progress.use();
  const week = lastWeek(p.days);
  const weekSeconds = week.reduce((a, d) => a + d.seconds, 0);
  const totalSeconds = Object.values(p.days).reduce((a, b) => a + b, 0);
  const maxDay = Math.max(60, ...week.map((d) => d.seconds));
  const stars = Object.values(p.best).reduce((a, b) => a + b, 0);
  const mastered = SONGS.filter((s) => (p.best[s.id] ?? 0) === 3).length;
  const days = streak(p.days);

  const stats: [string, string][] = [
    ["Racha", `${days} ${days === 1 ? "día" : "días"}`],
    ["Esta semana", formatDuration(weekSeconds)],
    ["Estrellas", `${stars} de ${SONGS.length * 3}`],
    ["Piezas dominadas", `${mastered} de ${SONGS.length}`],
  ];

  return (
    <div className="screen">
      <TopBar title="Progreso" back={{ name: "home" }} />
      <div className="stats">
        {stats.map(([label, value]) => (
          <div key={label} className="stat">
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>

      <section className="panel">
        <h2>Últimos 7 días</h2>
        <div className="week-chart">
          {week.map((d) => (
            <div key={d.key} className="wc-col">
              <span className="wc-val">{d.seconds ? formatDuration(d.seconds) : ""}</span>
              <div className="wc-track">
                <div className={d.seconds ? "wc-bar on" : "wc-bar"} style={{ height: `${Math.max(4, (d.seconds / maxDay) * 100)}%` }} />
              </div>
              <span className="wc-day">{WEEKDAY[d.date.getDay()]}</span>
            </div>
          ))}
        </div>
        <p className="muted">En total has practicado {formatDuration(totalSeconds)}. Cuenta el tiempo con una lección en marcha y el que tocas en Piano libre.</p>
      </section>

      <section className="panel">
        <h2>Canciones</h2>
        <ul className="song-list">
          {SONGS.map((s) => {
            const st = p.best[s.id] ?? 0;
            return (
              <li key={s.id}>
                <a href={hrefFor({ name: "lesson", songId: s.id })}>{s.title}</a>
                <span className="muted">{s.level.split(" · ")[0]}</span>
                <span className="stars" aria-label={`${st} de 3 estrellas`}>
                  {"★".repeat(st)}
                  {"☆".repeat(3 - st)}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="muted">Las estrellas se ganan en el paso Tocar con las dos manos.</p>
      </section>
    </div>
  );
}

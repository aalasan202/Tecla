import { SONGS } from "../music/songs";
import { buildScore, measureCount } from "../music/score";
import { progress, lastWeek, streak } from "../state/progress";
import { findSong, repertoireStars, resolveSongId } from "../state/library";
import { TopBar } from "../components/TopBar";
import { MiniStaff } from "../components/MiniStaff";
import { IconPiano, IconPlay, IconProgress, IconSettings, IconSongs } from "../components/Icons";
import { hrefFor } from "../router";

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

  return (
    <div className="screen home">
      <TopBar />
      <div className="home-grid">
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

        <nav className="tiles" aria-label="Menú">
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
            <span className="tile-text">{days ? `Racha de ${days} ${days === 1 ? "día" : "días"}.` : "Practica hoy para empezar una racha."}</span>
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

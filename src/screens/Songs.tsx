import { useState } from "react";
import { SONGS } from "../music/songs";
import type { SongDef } from "../music/types";
import { progress } from "../state/progress";
import { TopBar } from "../components/TopBar";
import { hrefFor } from "../router";

type Filter = "all" | "one" | "two";

export const levelOf = (s: SongDef): number => Number(/Nivel (\d+)/.exec(s.level)?.[1] ?? 1);
const detailOf = (s: SongDef): string => s.level.split(" · ").slice(1).join(" · ");

const LEVEL_TEXT: Record<number, string> = {
  1: "Una mano, cinco dedos, sin moverse del sitio.",
  2: "Saltos y corcheas con la mano derecha.",
  3: "Compás de 3/4, sostenidos y las dos manos.",
  4: "Dos manos con más independencia y arpegios.",
};

export function Songs() {
  const { best } = progress.use();
  const [filter, setFilter] = useState<Filter>("all");
  const shown = SONGS.filter((s) => filter === "all" || (filter === "two") === !!s.l);
  const levels = [...new Set(shown.map(levelOf))].sort();

  return (
    <div className="screen">
      <TopBar title="Canciones" back={{ name: "home" }} />
      <div className="seg" role="group" aria-label="Filtrar canciones">
        {(
          [
            ["all", "Todas"],
            ["one", "Una mano"],
            ["two", "Dos manos"],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {label}
          </button>
        ))}
      </div>
      {levels.map((lv) => (
        <section key={lv} className="level">
          <div className="level-head">
            <h2>Nivel {lv}</h2>
            <p>{LEVEL_TEXT[lv]}</p>
          </div>
          <div className="song-grid">
            {shown
              .filter((s) => levelOf(s) === lv)
              .map((s) => {
                const stars = best[s.id] ?? 0;
                return (
                  <a key={s.id} className="song-card" href={hrefFor({ name: "lesson", songId: s.id })}>
                    <b>{s.title}</b>
                    <span className="song-detail">{detailOf(s)}</span>
                    <span className="song-foot">
                      {s.l && <span className="tag">Dos manos</span>}
                      <span className="stars" aria-label={`${stars} de 3 estrellas`}>
                        {"★".repeat(stars)}
                        {"☆".repeat(3 - stars)}
                      </span>
                    </span>
                  </a>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

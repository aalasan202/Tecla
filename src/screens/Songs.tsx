import { useEffect, useRef, useState } from "react";
import { isImported, useLibrary } from "../state/library";
import type { SongDef } from "../music/types";
import { progress } from "../state/progress";
import { TopBar } from "../components/TopBar";
import { hrefFor } from "../router";
import { ImportDialog } from "../components/ImportDialog";
import { ImportedSongDialog } from "../components/ImportedSongDialog";

const ACCEPT = ".mid,.midi,.musicxml,.xml,.mxl";

type Filter = "all" | "one" | "two";

export const levelOf = (s: SongDef): number => Number(/Nivel (\d+)/.exec(s.level)?.[1] ?? 1);
const detailOf = (s: SongDef): string => s.level.split(" · ").slice(1).join(" · ");

const LEVEL_TEXT: Record<number, string> = {
  1: "Una mano, cinco dedos, sin moverse del sitio.",
  2: "Saltos, cambios de posición y corcheas con la mano derecha.",
  3: "Compás de 3/4, alteraciones, acordes y las dos manos.",
  4: "Dos manos independientes: arpegios, cánones y 6/8.",
};

export function Songs() {
  const { best } = progress.use();
  const songs = useLibrary();
  const [filter, setFilter] = useState<Filter>("all");
  const shown = songs.filter((s) => filter === "all" || (filter === "two") === !!s.l);
  const levels = [...new Set(shown.map(levelOf))].sort();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<SongDef | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  // tras añadir, llevar la vista a la tarjeta nueva
  useEffect(() => {
    if (!added) return;
    const card = document.getElementById(`song-${added}`);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
    card?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    setAdded(null);
  }, [added]);

  return (
    <div className="screen">
      <TopBar title="Canciones" back={{ name: "home" }} />
      <div className="song-actions">
        <button type="button" className="btn primary" onClick={() => input.current?.click()}>
          Importar archivo
        </button>
        <button type="button" className="btn soon" disabled aria-disabled="true">
          Importar de servidor <span className="soon-tag">Próximamente</span>
        </button>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = ""; // para poder elegir el mismo archivo otra vez
            if (f) setFile(f);
          }}
        />
      </div>
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
                const mine = isImported(s.id);
                return (
                  <div key={s.id} id={`song-${s.id}`} className={`song-cell${mine ? " imported" : ""}`}>
                    <a className="song-card" href={hrefFor({ name: "lesson", songId: s.id })}>
                      <b>{s.title}</b>
                      <span className="song-detail">{detailOf(s)}</span>
                      <span className="song-foot">
                        <span className="tags">
                          {s.l && <span className="tag">Dos manos</span>}
                          {mine && <span className="tag imported">Importada</span>}
                        </span>
                        <span className="stars" aria-label={`${stars} de 3 estrellas`}>
                          {"★".repeat(stars)}
                          {"☆".repeat(3 - stars)}
                        </span>
                      </span>
                    </a>
                    {mine && (
                      <button type="button" className="song-more" aria-label={`Opciones de ${s.title}`} onClick={() => setOptions(s)}>
                        ⋯
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      ))}
      {file && (
        <ImportDialog
          file={file}
          onClose={() => setFile(null)}
          onAdded={(id) => {
            setFile(null);
            setFilter("all");
            setAdded(id);
          }}
        />
      )}
      {options && <ImportedSongDialog song={options} onClose={() => setOptions(null)} />}
    </div>
  );
}

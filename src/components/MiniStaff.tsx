import { useMemo } from "react";
import { buildScore } from "../music/score";
import { staffStep } from "../music/theory";
import type { SongDef } from "../music/types";

/** Primeras notas de la mano derecha de una canción, en un pentagrama decorativo. */
export function MiniStaff({ song, progress }: { song: SongDef; progress: number }) {
  // de un acorde se pinta la nota más aguda
  const notes = useMemo(() => {
    const right = buildScore(song).notes.filter((n) => n.h === "R");
    return right.filter((n) => !right.some((o) => o.unit === n.unit && o.m > n.m)).slice(0, 10);
  }, [song]);
  const W = 360;
  const H = 120;
  const bottom = 86;
  const gap = 10;
  const step0 = 37; // Mi4 en la línea inferior
  const dx = (W - 40) / Math.max(notes.length, 1);
  const y = (m: number) => bottom - (staffStep(m) - step0) * (gap / 2);
  const cursor = 20 + Math.min(notes.length, Math.round(progress * notes.length)) * dx - dx / 2;

  return (
    <svg className="mini-staff" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Inicio de ${song.title}`}>
      <g className="ms-lines">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="0" x2={W} y1={bottom - i * gap} y2={bottom - i * gap} />
        ))}
      </g>
      {notes.map((n, i) => {
        const cx = 30 + i * dx;
        const cy = y(n.m);
        const s = staffStep(n.m);
        const up = s < 41;
        const ledgers = [];
        for (let l = 35; l >= s; l -= 2) ledgers.push(bottom - (l - step0) * (gap / 2));
        for (let l = 47; l <= s; l += 2) ledgers.push(bottom - (l - step0) * (gap / 2));
        return (
          <g key={n.id} className={i < progress * notes.length ? "ms-note done" : "ms-note"}>
            {ledgers.map((ly) => (
              <line key={ly} x1={cx - 10} x2={cx + 10} y1={ly} y2={ly} className="ms-ledger" />
            ))}
            <ellipse cx={cx} cy={cy} rx="6.5" ry="4.6" transform={`rotate(-20 ${cx} ${cy})`} />
            {n.d < 4 && <line x1={up ? cx + 6 : cx - 6} x2={up ? cx + 6 : cx - 6} y1={cy} y2={up ? cy - 30 : cy + 30} className="ms-stem" />}
          </g>
        );
      })}
      {progress > 0 && <rect x={cursor} y="10" width="3" height="100" rx="1.5" className="ms-cursor" />}
    </svg>
  );
}

import type { Attempt } from "../stats/types";
import { hrefFor } from "../router";

const HANDS = { both: "Ambas manos", R: "Mano derecha", L: "Mano izquierda" } as const;

export const pct = (score: number) => `${Math.round(score * 100)} %`;

export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} de 3 estrellas`}>
      {"★".repeat(n)}
      {"☆".repeat(Math.max(0, 3 - n))}
    </span>
  );
}

export function formatWhen(at: number): string {
  const d = new Date(at);
  return `${d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Una fila del historial (FR-002). `showTitle` en la lista general; en la ficha ya se sabe la pieza. */
export function AttemptRow({ a, showTitle = true }: { a: Attempt; showTitle?: boolean }) {
  const details = [
    a.mode === "play" ? "Tocar" : "Aprender",
    a.twoHands ? HANDS[a.hands] : null,
    a.tempo ? `${a.tempo} ppm` : null,
    a.frag ? `Compases ${a.frag.from}–${a.frag.to} · ${a.frag.reps} ${a.frag.reps === 1 ? "repetición" : "repeticiones"}` : null,
  ].filter(Boolean);
  return (
    <li className="attempt">
      <div className="attempt-main">
        {showTitle && (
          <a href={hrefFor({ name: "piece", key: a.key })} className="attempt-title">
            {a.title}
          </a>
        )}
        <span className="muted">
          {showTitle && <span className={`origin ${a.src}`}>{a.src === "song" ? "Canciones" : "Curso"}</span>}
          {showTitle && a.unit ? ` ${a.unit} · ` : " "}
          {details.join(" · ")}
        </span>
      </div>
      <span className="attempt-when muted">{formatWhen(a.at)}</span>
      <span className="attempt-score">{pct(a.score)}</span>
      <Stars n={a.stars} />
    </li>
  );
}

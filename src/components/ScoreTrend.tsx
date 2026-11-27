import type { Attempt } from "../stats/types";

const W = 600;
const H = 180;
const PAD = { l: 40, r: 12, t: 12, b: 12 };
/** Umbrales de 1, 2 y 3 estrellas (starsFor). */
const GUIDES = [0.4, 0.7, 0.9];

/** Evolución de la nota en Tocar: solo intentos que cuentan, en orden de fecha (FR-006, FR-007). */
export function ScoreTrend({ attempts }: { attempts: Attempt[] }) {
  const pts = attempts.filter((a) => a.counts).sort((a, b) => a.at - b.at);
  if (pts.length < 2) {
    return <p className="muted">La gráfica aparece cuando tengas al menos dos intentos en Tocar con la pieza completa.</p>;
  }
  const best = pts.reduce((a, b) => (b.score > a.score ? b : a));
  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / (pts.length - 1);
  const y = (s: number) => PAD.t + (1 - s) * (H - PAD.t - PAD.b);
  const label = `${pts.length} intentos en Tocar, mejor ${Math.round(best.score * 100)} %, último ${Math.round(pts[pts.length - 1].score * 100)} %`;
  return (
    <svg className="trend" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {[0, ...GUIDES, 1].map((g) => (
        <g key={g}>
          <line className={g === 0 || g === 1 ? "trend-axis" : "trend-guide"} x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} />
          <text className="trend-label" x={PAD.l - 6} y={y(g) + 4} textAnchor="end">
            {Math.round(g * 100)}
          </text>
        </g>
      ))}
      <polyline className="trend-line" points={pts.map((p, i) => `${x(i)},${y(p.score)}`).join(" ")} />
      {pts.map((p, i) => (
        <circle key={p.at + ":" + i} className={p === best ? "trend-dot best" : "trend-dot"} cx={x(i)} cy={y(p.score)} r={p === best ? 6 : 4}>
          <title>
            {new Date(p.at).toLocaleDateString("es-ES")}: {Math.round(p.score * 100)} %
          </title>
        </circle>
      ))}
    </svg>
  );
}

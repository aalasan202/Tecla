import { formatDuration } from "../state/progress";

/** Barras de tiempo de práctica (antes «Últimos 7 días» de Progreso). Con muchas barras, etiquetas espaciadas. */
export function TimeBars({ series }: { series: { label: string; title: string; seconds: number }[] }) {
  const max = Math.max(60, ...series.map((d) => d.seconds));
  const dense = series.length > 12;
  const every = dense ? Math.ceil(series.length / 7) : 1;
  return (
    <div className={dense ? "week-chart dense" : "week-chart"} style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}>
      {series.map((d, i) => {
        const showLabel = (series.length - 1 - i) % every === 0;
        return (
          <div key={i} className="wc-col" title={`${d.title}: ${d.seconds ? formatDuration(d.seconds) : "sin práctica"}`}>
            {!dense && <span className="wc-val">{d.seconds ? formatDuration(d.seconds) : ""}</span>}
            <div className="wc-track">
              <div className={d.seconds ? "wc-bar on" : "wc-bar"} style={{ height: `${Math.max(4, (d.seconds / max) * 100)}%` }} />
            </div>
            <span className="wc-day">{showLabel ? d.label : " "}</span>
          </div>
        );
      })}
    </div>
  );
}

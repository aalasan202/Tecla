import { useMemo, useState } from "react";
import { calendar, DEFAULT_MUCH_MIN, type CalendarDay } from "../stats/streaks";
import { formatDuration } from "../state/progress";

const ROW_LABEL = ["L", "", "X", "", "V", "", ""];

const longDate = (d: Date) => d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
const describe = (d: CalendarDay) => `${longDate(d.date)}: ${d.seconds ? formatDuration(d.seconds) : "sin práctica"}${d.goal ? " · objetivo cumplido" : ""}`;

/** Calendario de las últimas 13 semanas (FR-011): sin práctica, poca o mucha. */
export function StreakCalendar({ days, goal }: { days: Record<string, number>; goal: number }) {
  const cols = useMemo(() => calendar(days, goal), [days, goal]);
  const [picked, setPicked] = useState<CalendarDay | null>(null);
  const much = goal ? `objetivo de ${goal} min` : `${DEFAULT_MUCH_MIN} min o más`;
  return (
    <div className="cal">
      <div className="cal-grid">
        <div className="cal-rows" aria-hidden="true">
          {ROW_LABEL.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
        {cols.map((col) => (
          <div key={col[0].key} className="cal-col">
            {col.map((d) =>
              d.future ? (
                <span key={d.key} className="cal-day future" />
              ) : (
                <button
                  key={d.key}
                  type="button"
                  className={`cal-day l${d.level}${picked?.key === d.key ? " picked" : ""}`}
                  aria-label={describe(d)}
                  title={describe(d)}
                  onClick={() => setPicked(d)}
                />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="cal-foot">
        <span className="muted" aria-live="polite">
          {picked ? describe(picked).replace(/^./, (c) => c.toUpperCase()) : "Pulsa un día para ver cuánto practicaste."}
        </span>
        <span className="cal-legend muted">
          <span className="cal-day l0" /> Nada <span className="cal-day l1" /> Poca <span className="cal-day l2" /> Mucha ({much})
        </span>
      </div>
    </div>
  );
}

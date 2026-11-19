import { forwardRef, memo, useImperativeHandle, useMemo, useRef } from "react";
import type { Score, ScoreNote } from "../music/types";
import type { NoteMark } from "../engine/lesson";
import { isWhite, noteName, staffStep, type Notation } from "../music/theory";
import { STAFF_LEFT, measureAt } from "../music/score";

/** Medio espacio entre líneas, en px. */
const H = 6;
/** Línea inferior del pentagrama de sol (Mi4) y de fa (Sol2). */
const TREBLE_BOTTOM = 100;
const BASS_BOTTOM = 196;
const STEP_E4 = 37;
const STEP_G2 = 25;
const FINGER_ROW = { R: 24, L: 134 } as const;

const yOf = (step: number, hand: "R" | "L") =>
  hand === "L" ? BASS_BOTTOM - (step - STEP_G2) * H : TREBLE_BOTTOM - (step - STEP_E4) * H;

export interface StaffHandle {
  setPlayhead(x: number | null): void;
  scrollTo(x: number, smooth: boolean): void;
}

interface Props {
  score: Score;
  marks: Record<number, NoteMark>;
  autoIds: Set<number>;
  showNames: boolean;
  showFingers: boolean;
  notation?: Notation;
  /** Fragmento en bucle que se resalta (compases base 0; `to` null si falta el segundo extremo). */
  loop?: { from: number; to: number | null } | null;
  /** Si existe, tocar la partitura elige un compás. */
  onMeasure?: (i: number) => void;
}

export const Staff = forwardRef<StaffHandle, Props>(function Staff({ score, marks, autoIds, showNames, showFingers, notation = "latin", loop = null, onMeasure }, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const head = useRef<SVGLineElement>(null);

  useImperativeHandle(ref, () => ({
    setPlayhead(x) {
      const l = head.current;
      if (!l) return;
      if (x === null) l.setAttribute("opacity", "0");
      else {
        l.setAttribute("opacity", "1");
        l.setAttribute("x1", String(x));
        l.setAttribute("x2", String(x));
      }
    },
    scrollTo(x, smooth) {
      const w = wrap.current;
      if (!w) return;
      const left = Math.max(0, x - w.clientWidth * 0.3);
      if (smooth) w.scrollTo({ left, behavior: "smooth" });
      else w.scrollLeft = left;
    },
  }));

  const { twoHands, total, px, bar } = score;
  const width = STAFF_LEFT + total * px + 40;
  const height = twoHands ? 262 : 178;
  const top = TREBLE_BOTTOM - 8 * H;
  const bottom = twoHands ? BASS_BOTTOM : TREBLE_BOTTOM;
  const labelRow = { R: twoHands ? 228 : 166, L: 248 };

  // las alteraciones se muestran una vez por compás; un becuadro anula el sostenido
  const accidentals = useMemo(() => {
    const seen: Record<string, string> = {};
    const out = new Map<number, string>();
    for (const n of score.notes) {
      const key = `${n.h}${Math.floor(n.s / bar)}:${staffStep(n.m)}`;
      if (!isWhite(n.m)) {
        if (seen[key] !== "#") out.set(n.id, "♯");
        seen[key] = "#";
      } else if (seen[key] === "#") {
        out.set(n.id, "♮");
        seen[key] = "";
      }
    }
    return out;
  }, [score, bar]);

  return (
    <div className="staff-wrap" ref={wrap}>
      <svg
        className={onMeasure ? "staff pickable" : "staff"}
        onClick={
          onMeasure &&
          ((e) => {
            // el rectángulo del <svg> ya se mueve con el scroll del contenedor
            const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
            onMeasure(measureAt(score, x));
          })
        }
        width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Partitura de ${score.song.title}`}>
        {loop && (
          <rect
            className="loop-range"
            x={STAFF_LEFT + loop.from * bar * px + 2}
            width={((loop.to ?? loop.from) - loop.from + 1) * bar * px}
            y={top - 18}
            height={bottom + 30 - (top - 18)}
            rx={6}
          />
        )}
        <Lines y={TREBLE_BOTTOM} width={width} />
        <text x={12} y={TREBLE_BOTTOM - 2 * H} fontSize={8 * H} className="glyph">{"\u{1D11E}"}</text>
        <TimeSig y={TREBLE_BOTTOM} top={bar} />
        {twoHands && (
          <>
            <Lines y={BASS_BOTTOM} width={width} />
            <text x={12} y={BASS_BOTTOM - 6 * H} fontSize={8 * H} className="glyph">{"\u{1D122}"}</text>
            <TimeSig y={BASS_BOTTOM} top={bar} />
            <line x1={8} x2={8} y1={top} y2={BASS_BOTTOM} className="staff-line" strokeWidth={1.5} />
            {showNames && (
              <>
                <text x={10} y={labelRow.R} className="rowh rowh-r">MD</text>
                <text x={10} y={labelRow.L} className="rowh rowh-l">MI</text>
              </>
            )}
          </>
        )}
        {Array.from({ length: total / bar }, (_, i) => {
          const b = (i + 1) * bar;
          const x = STAFF_LEFT + b * px + 2;
          return <line key={b} x1={x} x2={x} y1={top} y2={bottom} className="staff-line" strokeWidth={b === total ? 3 : 1} />;
        })}
        {score.rests.map((r, i) => (
          <text key={i} x={r.x - 6} y={(r.h === "L" ? BASS_BOTTOM : TREBLE_BOTTOM) - 4 * H} fontSize={8 * H} className="glyph rest">
            {r.d >= 4 || r.d >= bar ? "\u{1D13B}" : r.d >= 2 ? "\u{1D13C}" : "\u{1D13D}"}
          </text>
        ))}
        {score.notes.map((n) => (
          <Note
            key={n.id}
            note={n}
            mark={marks[n.id] ?? null}
            auto={autoIds.has(n.id)}
            accidental={accidentals.get(n.id)}
            labelY={labelRow[n.h]}
            showName={showNames}
            showFinger={showFingers}
            notation={notation}
          />
        ))}
        <line ref={head} x1={0} x2={0} y1={top - 18} y2={bottom + 30} className="playhead" opacity={0} />
      </svg>
    </div>
  );
});

function Lines({ y, width }: { y: number; width: number }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={8} x2={width - 8} y1={y - i * 2 * H} y2={y - i * 2 * H} className="staff-line" />
      ))}
    </>
  );
}

function TimeSig({ y, top }: { y: number; top: number }) {
  return (
    <>
      <text x={50} y={y - 4 * H - 1} className="tsig">{top}</text>
      <text x={50} y={y + 1} className="tsig">4</text>
    </>
  );
}

interface NoteProps {
  note: ScoreNote;
  mark: NoteMark;
  auto: boolean;
  accidental?: string;
  labelY: number;
  showName: boolean;
  showFinger: boolean;
  notation: Notation;
}

const Note = memo(function Note({ note: n, mark, auto, accidental, labelY, showName, showFinger, notation }: NoteProps) {
  const left = n.h === "L";
  const s = staffStep(n.m);
  const x = n.x;
  const y = yOf(s, n.h);
  const ledgers: number[] = [];
  for (let l = left ? 23 : 35; l >= s; l -= 2) ledgers.push(l);
  for (let l = left ? 35 : 47; l <= s; l += 2) ledgers.push(l);
  const hollow = n.d >= 2;
  const stemUp = s < (left ? 29 : 41);
  const sx = stemUp ? x + 6.6 : x - 6.6;
  const ey = stemUp ? y - 34 : y + 34;
  const cls = ["n", n.h, auto ? "auto" : "", mark ?? ""].join(" ").trim();

  return (
    <g className={cls}>
      {ledgers.map((l) => (
        <line key={l} x1={x - 11} x2={x + 11} y1={yOf(l, n.h)} y2={yOf(l, n.h)} className="staff-line" strokeWidth={1.2} />
      ))}
      <ellipse cx={x} cy={y} rx={7.4} ry={5.2} transform={`rotate(-20 ${x} ${y})`} className={hollow ? "head hollow" : "head"} />
      {accidental && <text x={x - 20} y={y + 6} fontSize={18} className="acc">{accidental}</text>}
      {n.d < 4 && <line x1={sx} x2={sx} y1={y} y2={ey} className="stem" />}
      {n.d === 0.5 && (
        <path d={stemUp ? `M${sx} ${ey} q 3 9 10 14` : `M${sx} ${ey} q 3 -9 10 -14`} className="flag" />
      )}
      {(n.d === 1.5 || n.d === 3) && <circle cx={x + 13} cy={s % 2 ? y - H : y} r={2.2} className="dot-fill" />}
      {showName && <text x={x} y={labelY} textAnchor="middle" className="lbl">{noteName(n.m, notation)}</text>}
      {showFinger && <text x={x} y={FINGER_ROW[n.h]} textAnchor="middle" className="fg">{n.f}</text>}
    </g>
  );
});

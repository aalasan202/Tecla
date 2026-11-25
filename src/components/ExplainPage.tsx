import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExplainPage } from "../course/types";
import { renderText } from "../course/text";
import { buildScore } from "../music/score";
import { noteName } from "../music/theory";
import type { ScoreNote } from "../music/types";
import { Lesson, type NoteMark } from "../engine/lesson";
import { ensureAudio, playClick, playTone, releaseAll } from "../audio/synth";
import { useMidiInput } from "../midi/MidiProvider";
import { settings } from "../state/settings";
import { ScoreView, type StaffHandle } from "./ScoreView";
import { Keyboard, type KeyboardHandle } from "./Keyboard";

/**
 * Una pantalla de explicación (010, FR-007/FR-007a): texto según la notación, mini partitura que
 * se puede escuchar y teclado que responde a cualquier tecla, con las resaltadas destacadas. No
 * se evalúa nada.
 */
export function ExplainPageView({ page }: { page: ExplainPage }) {
  const prefs = settings.use();
  const keys = useRef<KeyboardHandle>(null);
  const highlighted = useMemo(() => new Set((page.keys ?? []).map((k) => k.m)), [page]);
  // la guía del teclado espera notas de partitura: solo usa la altura y la mano
  const guide = useMemo(() => (page.keys ?? []).map((k) => ({ m: k.m, h: k.m < 60 ? "L" : "R" }) as ScoreNote), [page]);
  const range = useMemo(() => {
    const ms = [...(page.keys ?? []).map((k) => k.m), ...(page.staff ? buildScore(page.staff).notes.map((n) => n.m) : [])];
    return ms.length ? ([Math.min(...ms), Math.max(...ms)] as const) : ([60, 72] as const);
  }, [page]);

  const press = useCallback(
    (m: number) => {
      ensureAudio();
      playTone(m, 0.6);
      keys.current?.flash(m, highlighted.has(m) ? "ok" : "down", 260);
    },
    [highlighted],
  );
  useMidiInput(press);

  return (
    <div className="explain">
      <p className="explain-text">{renderText(page.text, prefs.notation)}</p>
      {page.staff && <ListenStaff page={page} />}
      {page.keys?.some((k) => k.finger) && (
        <p className="explain-fingers" aria-label="Dedos">
          {page.keys.map((k) => (
            <span key={k.m} className="finger-chip">
              {noteName(k.m, prefs.notation)} <b>{k.finger}</b>
            </span>
          ))}
        </p>
      )}
      {(page.keys?.length ?? 0) > 0 && (
        <Keyboard ref={keys} low={range[0]} high={range[1]} guide={guide} onPress={press} notation={prefs.notation} height={150} letters={false} />
      )}
    </div>
  );
}

/** Mini partitura de solo lectura con botón «Escuchar». */
function ListenStaff({ page }: { page: ExplainPage }) {
  const prefs = settings.use();
  const score = useMemo(() => buildScore(page.staff!), [page]);
  const staff = useRef<StaffHandle>(null);
  const [marks, setMarks] = useState<Record<number, NoteMark>>({});
  const [playing, setPlaying] = useState(false);
  const lesson = useRef<Lesson | null>(null);
  const none = useMemo(() => new Set<number>(), []);

  useEffect(() => {
    const l = new Lesson(score, "listen", "both", score.song.tempo, {
      mark: (id, mark) => setMarks((prev) => (prev[id] === mark ? prev : { ...prev, [id]: mark })),
      guide: () => {},
      status: () => {},
      playhead: (x) => staff.current?.setPlayhead(x),
      scrollTo: (x, smooth) => staff.current?.scrollTo(x, smooth),
      flash: () => {},
      tone: playTone,
      release: releaseAll,
      click: playClick,
      now: () => performance.now(),
      frame: (f) => requestAnimationFrame(f),
      cancelFrame: (id) => cancelAnimationFrame(id),
      finish: () => setPlaying(false),
    });
    lesson.current = l;
    return () => {
      l.stop();
      releaseAll();
    };
  }, [score]);

  const toggle = () => {
    const l = lesson.current;
    if (!l) return;
    ensureAudio();
    if (l.running) {
      l.stop();
      l.reset();
      setPlaying(false);
    } else {
      l.start();
      setPlaying(true);
    }
  };

  return (
    <div className="explain-staff">
      <div className="board">
        <ScoreView ref={staff} score={score} marks={marks} autoIds={none} showNames={prefs.showNames} showFingers={prefs.showFingers} notation={prefs.notation} />
      </div>
      <button type="button" className="btn" onClick={toggle}>
        {playing ? "Parar" : "♪ Escuchar"}
      </button>
    </div>
  );
}

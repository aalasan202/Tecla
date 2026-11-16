import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SONGS } from "../music/songs";
import { buildScore, measureCount } from "../music/score";
import { noteName } from "../music/theory";
import type { ScoreNote } from "../music/types";
import { Lesson, type HandChoice, type LessonResult, type Mode, type NoteMark } from "../engine/lesson";
import { ensureAudio, playClick, playTone } from "../audio/synth";
import { useMidiInput } from "../midi/MidiProvider";
import { settings } from "../state/settings";
import { addPractice, progress, recordSession, recordStars } from "../state/progress";
import { Staff, type StaffHandle } from "../components/Staff";
import { Keyboard, type KeyboardHandle } from "../components/Keyboard";
import { TopBar } from "../components/TopBar";

const HINTS: Record<Mode, [string, string]> = {
  listen: [
    "Escucha la pieza entera y sigue las notas en la partitura.",
    "Escucha cómo suenan las dos manos juntas. Azul es la mano derecha y verde la izquierda.",
  ],
  learn: [
    "La partitura espera a que toques la nota marcada. Ve a tu ritmo.",
    "Cuando aparecen dos notas a la vez, pulsa las dos teclas marcadas. Empieza practicando cada mano por separado.",
  ],
  play: [
    "Toca a tempo. Suenan cuatro clics de cuenta atrás y empieza la canción.",
    "Toca a tempo. Si eliges una sola mano, la otra suena sola para acompañarte.",
  ],
};
const LEARN_AT_TEMPO_HINTS: [string, string] = [
  "La partitura avanza a tempo y se detiene en la nota hasta que la toques.",
  "La partitura avanza a tempo y se detiene en la nota hasta que la toques. Si eliges una sola mano, la otra suena y espera contigo.",
];
const MODES: [Mode, string][] = [["listen", "Escuchar"], ["learn", "Aprender"], ["play", "Tocar"]];

export function LessonScreen({ songId }: { songId: string }) {
  const song = SONGS.find((s) => s.id === songId);
  if (!song) {
    return (
      <div className="screen">
        <TopBar title="Canción no encontrada" back={{ name: "songs" }} />
        <p>
          Esta canción no existe. <a href="#canciones">Ver todas las canciones</a>
        </p>
      </div>
    );
  }
  return <LessonView key={song.id} songId={song.id} />;
}

function LessonView({ songId }: { songId: string }) {
  const song = SONGS.find((s) => s.id === songId)!;
  const score = useMemo(() => buildScore(song), [song]);
  const prefs = settings.use();
  const resume = progress.get().last?.songId === songId ? progress.get().last : null;

  const [mode, setMode] = useState<Mode>(resume?.mode ?? "listen");
  const [hands, setHands] = useState<HandChoice>(score.twoHands ? (resume?.hands ?? "both") : "both");
  const [tempo, setTempo] = useState(song.tempo);
  const [marks, setMarks] = useState<Record<number, NoteMark>>({});
  const [guide, setGuide] = useState<ScoreNote[]>([]);
  const [status, setStatus] = useState<[string, string]>(["Pulsa Empezar", ""]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<LessonResult | null>(null);

  const range = useMemo(() => {
    const ms = score.notes.map((n) => n.m);
    return [Math.min(...ms), Math.max(...ms)] as const;
  }, [score]);

  const staff = useRef<StaffHandle>(null);
  const keys = useRef<KeyboardHandle>(null);
  const lesson = useRef<Lesson | null>(null);
  const startedAt = useRef<number | null>(null);
  const notation = useRef(prefs.notation);
  notation.current = prefs.notation;

  // cuánto has practicado y hasta dónde llegaste, al parar, terminar o salir
  const saveAttempt = useCallback(
    (l: Lesson) => {
      if (startedAt.current !== null) {
        addPractice((performance.now() - startedAt.current) / 1000);
        startedAt.current = null;
      }
      recordSession({ songId, mode: l.mode, hands: l.hands, progress: l.progress() });
    },
    [songId],
  );

  useEffect(() => {
    recordSession({ songId, mode, hands, progress: resume && resume.mode === mode && resume.hands === hands ? resume.progress : 0 });
    setResult(null);
    setRunning(false);
    setStatus(["Pulsa Empezar", ""]);
    const l = new Lesson(score, mode, hands, tempo, {
      mark: (id, mark) => setMarks((prev) => (prev[id] === mark ? prev : { ...prev, [id]: mark })),
      guide: setGuide,
      status: (text, next) => setStatus([text, next]),
      playhead: (x) => staff.current?.setPlayhead(x),
      scrollTo: (x, smooth) => staff.current?.scrollTo(x, smooth),
      flash: (m, kind, ms) => keys.current?.flash(m, kind, ms),
      tone: playTone,
      click: playClick,
      now: () => performance.now(),
      frame: (cb) => requestAnimationFrame(cb),
      cancelFrame: (id) => cancelAnimationFrame(id),
      name: (m) => noteName(m, notation.current),
      finish: (r) => {
        setRunning(false);
        setResult(r);
        setStatus(["Lección terminada", ""]);
        saveAttempt(l);
        if (r.mode === "play" && (!score.twoHands || hands === "both")) recordStars(songId, r.stars);
      },
    }, { atTempo: prefs.learnAtTempo });
    lesson.current = l;
    staff.current?.scrollTo(0, false);
    return () => {
      if (l.running) {
        l.stop();
        saveAttempt(l);
      }
    };
    // el tempo no reinicia la lección; resume solo se lee al entrar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, mode, hands, prefs.learnAtTempo]);

  useEffect(() => {
    if (lesson.current) lesson.current.tempo = tempo;
  }, [tempo]);

  const press = useCallback((m: number) => lesson.current?.input(m), []);
  useMidiInput(press);

  const toggleRun = () => {
    const l = lesson.current;
    if (!l) return;
    ensureAudio();
    if (l.running) {
      l.stop();
      saveAttempt(l);
      l.reset();
      setRunning(false);
      setStatus(["Pulsa Empezar", ""]);
      return;
    }
    setResult(null);
    startedAt.current = performance.now();
    l.start();
    setRunning(true);
  };

  const autoIds = useMemo(
    () => new Set(score.notes.filter((n) => score.twoHands && hands !== "both" && n.h !== hands).map((n) => n.id)),
    [score, hands],
  );

  return (
    <div className="screen lesson">
      <TopBar title={song.title} back={{ name: "songs" }} />

      <div className="lesson-head">
        <p className="sub">
          {song.level} · {score.notes.length} notas · {measureCount(score)} compases
        </p>
        {score.twoHands && (
          <div className="seg" role="group" aria-label="Qué mano practicas">
            {(
              [
                ["both", "Ambas"],
                ["R", "Derecha"],
                ["L", "Izquierda"],
              ] as [HandChoice, string][]
            ).map(([h, label]) => (
              <button key={h} aria-pressed={hands === h} onClick={() => setHands(h)}>
                {h !== "both" && <span className={`dot ${h === "R" ? "r" : "l"}`} />}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="modes" role="tablist" aria-label="Pasos de la lección">
        {MODES.map(([m, label], i) => (
          <button key={m} className="mode" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}>
            <i>{i + 1}</i>
            {label}
          </button>
        ))}
      </div>
      <p className="hint">{(mode === "learn" && prefs.learnAtTempo ? LEARN_AT_TEMPO_HINTS : HINTS[mode])[score.twoHands ? 1 : 0]}</p>

      <div className="board">
        <Staff
          ref={staff}
          score={score}
          marks={marks}
          autoIds={autoIds}
          showNames={prefs.showNames}
          showFingers={prefs.showFingers}
          notation={prefs.notation}
        />
        <div className="statusbar" aria-live="polite">
          <span>{status[0]}</span>
          <strong>{status[1]}</strong>
        </div>
      </div>

      <div className="controls">
        <button className="btn primary" onClick={toggleRun}>
          {running ? "Parar" : "Empezar"}
        </button>
        {mode === "learn" && (
          <label className="field">
            <input type="checkbox" checked={prefs.learnAtTempo} onChange={(e) => settings.set({ learnAtTempo: e.target.checked })} /> A tempo
          </label>
        )}
        <label className="field" style={{ visibility: mode === "learn" && !prefs.learnAtTempo ? "hidden" : "visible" }}>
          Tempo
          <input type="range" min={40} max={140} step={5} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
          <output>{tempo}</output> ppm
        </label>
        <label className="field">
          <input type="checkbox" checked={prefs.showNames} onChange={(e) => settings.set({ showNames: e.target.checked })} /> Nombres de las notas
        </label>
        <label className="field">
          <input type="checkbox" checked={prefs.showFingers} onChange={(e) => settings.set({ showFingers: e.target.checked })} /> Números de dedo
        </label>
      </div>

      {result && (
        <div className="result">
          <div className="big">{result.score === null ? "♪" : `${Math.round(result.score * 100)}%`}</div>
          {result.score !== null && (
            <div className="rs" aria-label={`${result.stars} de 3 estrellas`}>
              {"★".repeat(result.stars)}
              {"☆".repeat(3 - result.stars)}
            </div>
          )}
          <p>{result.message}</p>
          <div className="acts">
            <button className="btn" onClick={toggleRun}>
              Repetir
            </button>
            {mode !== "play" && (
              <button className="btn primary" onClick={() => setMode(mode === "listen" ? "learn" : "play")}>
                Siguiente paso
              </button>
            )}
          </div>
        </div>
      )}

      <Keyboard ref={keys} low={range[0]} high={range[1]} guide={guide} onPress={press} notation={prefs.notation} />
    </div>
  );
}

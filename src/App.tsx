import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SONGS, DEFAULT_SONG_ID } from "./music/songs";
import { buildScore, measureCount } from "./music/score";
import type { ScoreNote } from "./music/types";
import { Lesson, type HandChoice, type LessonResult, type Mode, type NoteMark } from "./engine/lesson";
import { ensureAudio, playClick, playTone } from "./audio/synth";
import { useMidi, MIDI_HELP } from "./midi/useMidi";
import { loadBest, saveBest, type BestScores } from "./storage";
import { Staff, type StaffHandle } from "./components/Staff";
import { Keyboard, type KeyboardHandle } from "./components/Keyboard";

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
const MODES: [Mode, string][] = [["listen", "Escuchar"], ["learn", "Aprender"], ["play", "Tocar"]];

export default function App() {
  const [songId, setSongId] = useState(DEFAULT_SONG_ID);
  const [mode, setMode] = useState<Mode>("learn");
  const [hands, setHands] = useState<HandChoice>("both");
  const [tempo, setTempo] = useState(() => SONGS.find((s) => s.id === DEFAULT_SONG_ID)?.tempo ?? 80);
  const [showNames, setShowNames] = useState(true);
  const [showFingers, setShowFingers] = useState(false);
  const [marks, setMarks] = useState<Record<number, NoteMark>>({});
  const [guide, setGuide] = useState<ScoreNote[]>([]);
  const [status, setStatus] = useState<[string, string]>(["Pulsa Empezar", ""]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [best, setBest] = useState<BestScores>(loadBest);

  const song = SONGS.find((s) => s.id === songId) ?? SONGS[0];
  const score = useMemo(() => buildScore(song), [song]);
  const range = useMemo(() => {
    const ms = score.notes.map((n) => n.m);
    return [Math.min(...ms), Math.max(...ms)] as const;
  }, [score]);

  const staff = useRef<StaffHandle>(null);
  const keys = useRef<KeyboardHandle>(null);
  const lesson = useRef<Lesson | null>(null);

  // un motor nuevo por canción, modo o mano; el tempo se actualiza en caliente
  useEffect(() => {
    lesson.current?.stop();
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
      finish: (r) => {
        setRunning(false);
        setResult(r);
        setStatus(["Lección terminada", ""]);
        if (r.mode === "play" && (!score.twoHands || hands === "both")) setBest(saveBest(score.song.id, r.stars));
      },
    });
    lesson.current = l;
    staff.current?.scrollTo(0, false);
    return () => l.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- el tempo no reinicia la lección
  }, [score, mode, hands]);

  useEffect(() => {
    if (lesson.current) lesson.current.tempo = tempo;
  }, [tempo]);

  const press = useCallback((m: number) => lesson.current?.input(m), []);
  const midi = useMidi(press);

  const selectSong = (id: string) => {
    const s = SONGS.find((x) => x.id === id)!;
    setSongId(id);
    setHands("both");
    setTempo(s.tempo);
  };

  const toggleRun = () => {
    const l = lesson.current;
    if (!l) return;
    ensureAudio();
    if (l.running) {
      l.stop();
      l.reset();
      setRunning(false);
      setStatus(["Pulsa Empezar", ""]);
      return;
    }
    setResult(null);
    l.start();
    setRunning(true);
  };

  const autoIds = useMemo(
    () => new Set(score.notes.filter((n) => score.twoHands && hands !== "both" && n.h !== hands).map((n) => n.id)),
    [score, hands],
  );

  const midiLabel =
    midi.status === "ok"
      ? `MIDI: ${midi.devices.join(", ")}`
      : midi.status === "none"
        ? "Sin teclado MIDI · Reintentar"
        : midi.status === "blocked"
          ? "MIDI bloqueado · Ver ayuda"
          : midi.status === "unsupported"
            ? "MIDI no disponible aquí"
            : "Conectar teclado MIDI";

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          Tecla <small>aprende piano</small>
        </div>
        <button
          type="button"
          className={`chip ${midi.status === "ok" ? "on" : midi.status === "idle" ? "" : "warn"}`}
          onClick={() => {
            ensureAudio();
            midi.connect();
          }}
        >
          {midiLabel}
        </button>
      </header>
      {midi.status !== "idle" && midi.status !== "ok" && <p className="midihelp">{MIDI_HELP[midi.status]}</p>}

      <nav className="songs" aria-label="Lecciones">
        {SONGS.map((s) => {
          const stars = best[s.id] ?? 0;
          return (
            <button key={s.id} className="song" aria-pressed={s.id === songId} onClick={() => selectSong(s.id)}>
              <b>{s.title}</b>
              <span>{s.level}</span>
              {s.l && <span className="tag">Dos manos</span>}
              <span className="stars" aria-label={`${stars} de 3 estrellas`}>
                {"★".repeat(stars)}
                {"☆".repeat(3 - stars)}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="lesson-head">
        <div>
          <h1>{song.title}</h1>
          <p className="sub">
            {song.level} · {score.notes.length} notas · {measureCount(score)} compases
          </p>
        </div>
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
      <p className="hint">{HINTS[mode][score.twoHands ? 1 : 0]}</p>

      <div className="board">
        <Staff ref={staff} score={score} marks={marks} autoIds={autoIds} showNames={showNames} showFingers={showFingers} />
        <div className="statusbar" aria-live="polite">
          <span>{status[0]}</span>
          <strong>{status[1]}</strong>
        </div>
      </div>

      <div className="controls">
        <button className="btn primary" onClick={toggleRun}>
          {running ? "Parar" : "Empezar"}
        </button>
        <label className="field" style={{ visibility: mode === "learn" ? "hidden" : "visible" }}>
          Tempo
          <input type="range" min={40} max={140} step={5} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
          <output>{tempo}</output> ppm
        </label>
        <label className="field">
          <input type="checkbox" checked={showNames} onChange={(e) => setShowNames(e.target.checked)} /> Nombres de las notas
        </label>
        <label className="field">
          <input type="checkbox" checked={showFingers} onChange={(e) => setShowFingers(e.target.checked)} /> Números de dedo
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

      <Keyboard ref={keys} low={range[0]} high={range[1]} guide={guide} onPress={press} />
      <p className="foot">
        En ordenador, la fila A S D F… son las teclas blancas y la fila de arriba las negras. En las piezas a dos manos, azul es la mano
        derecha y verde la izquierda. Los números de dedo (1 pulgar … 5 meñique) son una digitación sugerida.
      </p>
    </div>
  );
}

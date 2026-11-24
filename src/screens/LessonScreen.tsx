import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findSong } from "../state/library";
import { buildScore, measureCount } from "../music/score";
import { noteName } from "../music/theory";
import type { ScoreNote } from "../music/types";
import { Lesson, type HandChoice, type LessonResult, type Mode, type NoteMark } from "../engine/lesson";
import { canNudge, emptySelection, nudge, rangeOf, tapMeasure, toggleLoop, type FragmentEdge, type FragmentSelection } from "../engine/fragment";
import { ensureAudio, playClick, playTone } from "../audio/synth";
import { useMidiInput } from "../midi/MidiProvider";
import { settings } from "../state/settings";
import { addPractice, progress, recordSession, recordStars } from "../state/progress";
import { Staff, type StaffHandle } from "../components/Staff";
import { Keyboard, type KeyboardHandle } from "../components/Keyboard";
import { ConnectionStatus, TopBar } from "../components/TopBar";
import { Popover } from "../components/Popover";
import { IconBack, IconSettings } from "../components/Icons";
import { goBack } from "../router";
import { useCompactLesson } from "../ui/useCompactLesson";

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
const LOOP_PLAY_HINT = " Entre repeticiones hay un compás de descanso para volver a colocar la mano.";
const MODES: [Mode, string][] = [["listen", "Escuchar"], ["learn", "Aprender"], ["play", "Tocar"]];

export function LessonScreen({ songId }: { songId: string }) {
  const song = findSong(songId);
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
  const song = findSong(songId)!;
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
  const [result, setResult] = useState<(LessonResult & { loop?: boolean }) | null>(null);
  // fragmento en bucle: vive mientras dura la lección (se pierde al salir o cambiar de pieza)
  const [sel, setSel] = useState<FragmentSelection>(emptySelection);
  const loopRange = useMemo(() => rangeOf(sel), [sel]);
  const loopFrom = loopRange?.from;
  const loopTo = loopRange?.to;
  const measures = measureCount(score);
  // móvil apaisado: disposición compacta con paneles; no recrea la lección al cambiar
  const compact = useCompactLesson();
  const [panel, setPanel] = useState<"options" | "loop" | null>(null);
  useEffect(() => {
    if (!compact || (panel === "loop" && !loopRange)) setPanel(null);
  }, [compact, panel, loopRange]);

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
      // el bucle es práctica parcial: suma tiempo, pero no cuenta como intento de la pieza
      if (!l.loop) recordSession({ songId, mode: l.mode, hands: l.hands, progress: l.progress() });
    },
    [songId],
  );

  // aparte de la lección, para que cambiar el fragmento o «A tempo» no reescriba la última sesión
  useEffect(() => {
    recordSession({ songId, mode, hands, progress: resume && resume.mode === mode && resume.hands === hands ? resume.progress : 0 });
    // resume solo se lee al entrar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId, mode, hands]);

  useEffect(() => {
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
    }, { atTempo: prefs.learnAtTempo, loop: loopFrom === undefined || loopTo === undefined ? undefined : { from: loopFrom, to: loopTo } });
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
  }, [score, mode, hands, prefs.learnAtTempo, loopFrom, loopTo]);

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
      const summary = l.loopSummary();
      l.reset();
      setRunning(false);
      setStatus([l.loop ? "Bucle detenido" : "Pulsa Empezar", ""]);
      if (summary) {
        const pct = (r: LessonResult) => `${Math.round((r.score ?? 0) * 100)} %`;
        const reps = `${summary.reps} ${summary.reps === 1 ? "repetición" : "repeticiones"}`;
        setResult({ ...summary.best, loop: true, message: `${reps} · mejor ${pct(summary.best)} · última ${pct(summary.last)}` });
      }
      return;
    }
    setResult(null);
    startedAt.current = performance.now();
    l.start();
    // un fragmento sin notas de la mano elegida no arranca (el motor ya lo explica en el estado)
    if (!l.running) startedAt.current = null;
    setRunning(l.running);
  };

  const pickHint =
    sel.a === null ? "Pulsa en la partitura el compás donde empieza el fragmento" : "Pulsa en la partitura el compás donde acaba el fragmento";
  const shownStatus: [string, string] = !running && sel.on && !loopRange ? [pickHint, ""] : status;
  const edge = (e: FragmentEdge, d: 1 | -1, label: string, text: string) => (
    <button aria-label={label} disabled={!canNudge(sel, e, d, measures)} onClick={() => setSel((s) => nudge(s, e, d, measures))}>
      {text}
    </button>
  );

  const autoIds = useMemo(
    () => new Set(score.notes.filter((n) => score.twoHands && hands !== "both" && n.h !== hands).map((n) => n.id)),
    [score, hands],
  );

  const closePanel = useCallback(() => setPanel(null), []);
  const hint = (
    <>
      {(mode === "learn" && prefs.learnAtTempo ? LEARN_AT_TEMPO_HINTS : HINTS[mode])[score.twoHands ? 1 : 0]}
      {mode === "play" && loopRange && LOOP_PLAY_HINT}
    </>
  );
  const loopEdges = (
    <>
      <span className="loop-edge">
        {edge("from", -1, "Inicio un compás antes", "−")}
        <span>inicio</span>
        {edge("from", 1, "Inicio un compás después", "+")}
      </span>
      <span className="loop-edge">
        {edge("to", -1, "Fin un compás antes", "−")}
        <span>fin</span>
        {edge("to", 1, "Fin un compás después", "+")}
      </span>
    </>
  );
  const atTempoField = mode === "learn" && (
    <label className="field">
      <input type="checkbox" checked={prefs.learnAtTempo} onChange={(e) => settings.set({ learnAtTempo: e.target.checked })} /> A tempo
    </label>
  );
  const tempoField = (
    <label className="field" style={{ visibility: mode === "learn" && !prefs.learnAtTempo ? "hidden" : "visible" }}>
      Tempo
      <input type="range" min={40} max={140} step={5} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
      <output>{tempo}</output> ppm
    </label>
  );
  const viewFields = (
    <>
      <label className="field">
        <input type="checkbox" checked={prefs.showNames} onChange={(e) => settings.set({ showNames: e.target.checked })} /> Nombres de las notas
      </label>
      <label className="field">
        <input type="checkbox" checked={prefs.showFingers} onChange={(e) => settings.set({ showFingers: e.target.checked })} /> Números de dedo
      </label>
    </>
  );
  const board = (
    <div className="board">
      <Staff
        ref={staff}
        score={score}
        marks={marks}
        autoIds={autoIds}
        showNames={prefs.showNames}
        showFingers={prefs.showFingers}
        notation={prefs.notation}
        loop={
          sel.on && sel.a !== null
            ? sel.b === null
              ? { from: sel.a, to: null }
              : { from: Math.min(sel.a, sel.b), to: Math.max(sel.a, sel.b) }
            : null
        }
        onMeasure={sel.on ? (i) => setSel((s) => tapMeasure(s, i)) : undefined}
        fit={compact}
      />
      <div className="statusbar" aria-live="polite">
        <span>{shownStatus[0]}</span>
        <strong>{shownStatus[1]}</strong>
      </div>
    </div>
  );
  const resultCard = result && (
    <div className="result">
      {compact && (
        <button type="button" className="result-close" aria-label="Cerrar" onClick={() => setResult(null)}>
          ×
        </button>
      )}
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
        {mode !== "play" && !result.loop && (
          <button className="btn primary" onClick={() => setMode(mode === "listen" ? "learn" : "play")}>
            Siguiente paso
          </button>
        )}
      </div>
    </div>
  );
  const keyboard = <Keyboard ref={keys} low={range[0]} high={range[1]} guide={guide} onPress={press} notation={prefs.notation} fit={compact} />;

  if (compact) {
    return (
      <div className="screen lesson compact">
        <div className="practice-row">
          <button type="button" className="icon-btn" aria-label="Atrás" onClick={() => goBack({ name: "songs" })}>
            <IconBack />
          </button>
          <div className="modes" role="tablist" aria-label="Pasos de la lección">
            {MODES.map(([m, label], i) => (
              <button key={m} className="mode" role="tab" aria-selected={mode === m} aria-label={`${i + 1}. ${label}`} onClick={() => setMode(m)}>
                <i>{i + 1}</i>
                <span className="mode-name">{label}</span>
              </button>
            ))}
          </div>
          {score.twoHands && (
            <div className="seg" role="group" aria-label="Qué mano practicas">
              {(
                [
                  ["both", "Ambas manos"],
                  ["R", "Mano derecha"],
                  ["L", "Mano izquierda"],
                ] as [HandChoice, string][]
              ).map(([h, label]) => (
                <button key={h} aria-pressed={hands === h} aria-label={label} title={label} onClick={() => setHands(h)}>
                  {h !== "L" && <span className="dot r" />}
                  {h !== "R" && <span className="dot l" />}
                </button>
              ))}
            </div>
          )}
          <button className="btn primary" onClick={toggleRun}>
            {running ? "Parar" : "Empezar"}
          </button>
          <button type="button" className="loop-toggle" aria-label="Bucle" aria-pressed={sel.on} onClick={() => setSel((s) => toggleLoop(s, !s.on))}>
            ⟲{!loopRange && " Bucle"}
          </button>
          {loopRange && (
            <button
              type="button"
              className="loop-chip"
              aria-label={`Compases ${loopRange.from + 1}–${loopRange.to + 1}: ajustar inicio y fin`}
              aria-expanded={panel === "loop"}
              onClick={() => setPanel(panel === "loop" ? null : "loop")}
            >
              {loopRange.from + 1}–{loopRange.to + 1} ▾
            </button>
          )}
          <span className="row-spacer" />
          <button
            type="button"
            className="icon-btn"
            aria-label="Opciones"
            aria-expanded={panel === "options"}
            onClick={() => setPanel(panel === "options" ? null : "options")}
          >
            <IconSettings size={20} />
          </button>
        </div>

        <Popover open={panel === "loop" && loopRange !== null} onClose={closePanel} anchor="end" label="Ajustar fragmento">
          {loopRange && (
            <p className="hint">
              Compases {loopRange.from + 1}–{loopRange.to + 1}
            </p>
          )}
          {loopEdges}
        </Popover>
        <Popover open={panel === "options"} onClose={closePanel} anchor="end" label="Opciones de la lección">
          <h2>{song.title}</h2>
          <p className="hint">{hint}</p>
          {atTempoField}
          {tempoField}
          {viewFields}
          <ConnectionStatus />
          <a href="#ajustes">Ajustes</a>
        </Popover>

        {board}
        {resultCard}
        {keyboard}
      </div>
    );
  }

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
      <p className="hint">{hint}</p>

      {board}

      <div className="controls">
        <button className="btn primary" onClick={toggleRun}>
          {running ? "Parar" : "Empezar"}
        </button>
        {atTempoField}
        <div className="loop-ctl">
          <label className="field">
            <input type="checkbox" checked={sel.on} onChange={(e) => setSel((s) => toggleLoop(s, e.target.checked))} /> Bucle
          </label>
          {loopRange && (
            <>
              <span className="loop-range-label">
                Compases {loopRange.from + 1}–{loopRange.to + 1}
              </span>
              {loopEdges}
            </>
          )}
        </div>
        {tempoField}
        {viewFields}
      </div>

      {resultCard}

      {keyboard}
    </div>
  );
}

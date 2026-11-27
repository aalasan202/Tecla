import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildScore, measureCount } from "../music/score";
import { noteName } from "../music/theory";
import { noteLabel } from "../music/spelling";
import type { ScoreNote, SongDef } from "../music/types";
import { Lesson, type HandChoice, type InputVia, type LessonOptions, type LessonResult, type Mode, type NoteMark } from "../engine/lesson";
import { BeatIndicator, type BeatHandle } from "./BeatIndicator";
import { canNudge, emptySelection, nudge, rangeOf, tapMeasure, toggleLoop, type FragmentEdge, type FragmentSelection } from "../engine/fragment";
import { ensureAudio, playClick, playTone, releaseAll } from "../audio/synth";
import { useMidiInput } from "../midi/MidiProvider";
import { settings } from "../state/settings";
import { addPractice } from "../state/progress";
import { recordAttempt } from "../state/history";
import { makeAttempt } from "../stats/attempts";
import type { AttemptSource } from "../stats/types";
import { ScoreView, type StaffHandle } from "./ScoreView";
import { Keyboard, type KeyboardHandle } from "./Keyboard";
import { ConnectionStatus, TopBar } from "./TopBar";
import { Popover } from "./Popover";
import { IconBack, IconSettings } from "./Icons";
import { goBack, type Route } from "../router";
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
const ALL_MODES: [Mode, string][] = [["listen", "Escuchar"], ["learn", "Aprender"], ["play", "Tocar"]];

/** Margen para completar un acorde (010, R5): amplio con ratón o letras, corto con MIDI o dedos. */
export const chordWindow = (via: InputVia): number => (via === "screen-mouse" || via === "computer-keys" ? 1.5 : 0.15);

export interface PracticeProps {
  song: SongDef;
  /** Pasos disponibles (los tres por defecto; en ritmo, Escuchar y Tocar). */
  modes?: Mode[];
  initialMode?: Mode;
  initialHands?: HandChoice;
  /** Opciones extra del motor (ritmo, acordes). */
  engine?: Pick<LessonOptions, "rhythm" | "chordSpread">;
  /** Bucle de compases (Canciones); false en el Curso. */
  allowLoop?: boolean;
  /** Elegir mano en piezas a dos manos; false en el Curso (siempre ambas). */
  handsChoice?: boolean;
  /** Indicador visual del pulso del metrónomo (Curso). */
  beat?: boolean;
  /** A dónde vuelve Atrás. */
  back: Route;
  /** Texto de ayuda propio para cada paso (sustituye al de las piezas). */
  hint?: Partial<Record<Mode, string>>;
  /** Cada vez que se entra en un paso o se cambia de mano. */
  onStep?(mode: Mode, hands: HandChoice): void;
  /** Al parar, terminar o salir de un intento (sin bucle): hasta dónde se llegó. */
  onAttempt?(mode: Mode, hands: HandChoice, progress: number): void;
  /** Resultado de un intento completo en Tocar. */
  onPlayResult?(result: LessonResult, hands: HandChoice): void;
  /** Acciones extra en la tarjeta de resultado (p. ej. «Siguiente lección»). */
  resultActions?(result: LessonResult): ReactNode;
  /** Qué se practica: si se da, cada intento terminado y cada bucle detenido van al historial (011). */
  record?: AttemptSource;
}

/** Práctica de una pieza: partitura, teclado, pasos, tempo y bucle. La usan Canciones y el Curso. */
export function Practice({
  song,
  modes = ["listen", "learn", "play"],
  initialMode,
  initialHands,
  engine,
  allowLoop = true,
  handsChoice = true,
  beat = false,
  back,
  hint: customHint,
  onStep,
  onAttempt,
  onPlayResult,
  resultActions,
  record,
}: PracticeProps) {
  const score = useMemo(() => buildScore(song), [song]);
  const prefs = settings.use();
  const MODES = ALL_MODES.filter(([m]) => modes.includes(m));
  const showHands = handsChoice && score.twoHands;

  const [mode, setMode] = useState<Mode>(initialMode && modes.includes(initialMode) ? initialMode : modes[0]);
  const [hands, setHands] = useState<HandChoice>(showHands ? (initialHands ?? "both") : "both");
  const [tempo, setTempo] = useState(song.tempo);
  const [marks, setMarks] = useState<Record<number, NoteMark>>({});
  const [guide, setGuide] = useState<ScoreNote[]>([]);
  const [status, setStatus] = useState<[string, string]>(["Pulsa Empezar", ""]);
  // la partitura ya está dibujada: hasta entonces la lección no empieza
  const [ready, setReady] = useState(false);
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
  // los callbacks pueden cambiar en cada render sin recrear la lección
  const cb = useRef({ onStep, onAttempt, onPlayResult, record });
  cb.current = { onStep, onAttempt, onPlayResult, record };
  const engineRef = useRef(engine);
  engineRef.current = engine;
  const beatRef = useRef<BeatHandle>(null);
  // piezas con acordes (ejercicios y repertorio): margen para completarlos según el origen (FR-014a)
  const hasChords = useMemo(() => {
    const units = new Map<number, number>();
    for (const n of score.notes) units.set(n.unit, (units.get(n.unit) ?? 0) + 1);
    return [...units.values()].some((c) => c > 1);
  }, [score]);

  // cuánto has practicado y hasta dónde llegaste, al parar, terminar o salir
  const saveAttempt = useCallback((l: Lesson) => {
    if (startedAt.current !== null) {
      addPractice((performance.now() - startedAt.current) / 1000);
      startedAt.current = null;
    }
    // el bucle es práctica parcial: suma tiempo, pero no cuenta como intento de la pieza
    if (!l.loop) cb.current.onAttempt?.(l.mode, l.hands, l.progress());
  }, []);

  // aparte de la lección, para que cambiar el fragmento o «A tempo» no reescriba la última sesión
  useEffect(() => {
    cb.current.onStep?.(mode, hands);
  }, [mode, hands]);

  useEffect(() => {
    setResult(null);
    setRunning(false);
    setStatus(["Pulsa Empezar", ""]);
    const l = new Lesson(
      score,
      mode,
      hands,
      tempo,
      {
        mark: (id, mark) => setMarks((prev) => (prev[id] === mark ? prev : { ...prev, [id]: mark })),
        guide: setGuide,
        status: (text, next) => setStatus([text, next]),
        playhead: (x) => staff.current?.setPlayhead(x),
        scrollTo: (x, smooth) => staff.current?.scrollTo(x, smooth),
        flash: (m, kind, ms) => keys.current?.flash(m, kind, ms),
        tone: playTone,
        release: releaseAll,
        click: (strong) => {
          playClick(strong);
          beatRef.current?.pulse(strong);
        },
        now: () => performance.now(),
        frame: (f) => requestAnimationFrame(f),
        cancelFrame: (id) => cancelAnimationFrame(id),
        name: (m, sp) => (sp ? noteLabel(sp, notation.current) : noteName(m, notation.current)),
        finish: (r) => {
          setRunning(false);
          setResult(r);
          setStatus(["Lección terminada", ""]);
          saveAttempt(l);
          const source = cb.current.record;
          // el bucle no termina solo: se registra al detenerlo (toggleRun)
          if (source && r.mode !== "listen" && !l.loop) {
            recordAttempt(makeAttempt({ source, mode: r.mode, hands, twoHands: score.twoHands, tempo: l.tempo, score: r.score ?? 0, stars: r.stars }));
          }
          if (r.mode === "play") cb.current.onPlayResult?.(r, hands);
        },
      },
      {
        ...(hasChords ? { chordSpread: chordWindow } : {}),
        ...engineRef.current,
        atTempo: prefs.learnAtTempo,
        loop: loopFrom === undefined || loopTo === undefined ? undefined : { from: loopFrom, to: loopTo },
      },
    );
    lesson.current = l;
    staff.current?.scrollTo(0, false);
    return () => {
      if (l.running) {
        l.stop();
        saveAttempt(l);
      }
      // al salir o cambiar de paso no se queda nada sonando (009, FR-010)
      releaseAll();
    };
    // el tempo no reinicia la lección
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, mode, hands, prefs.learnAtTempo, loopFrom, loopTo]);

  useEffect(() => {
    if (lesson.current) lesson.current.tempo = tempo;
  }, [tempo]);

  const press = useCallback((m: number, via: InputVia) => lesson.current?.input(m, via), []);
  useMidiInput(useCallback((m: number) => press(m, "midi"), [press]));

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
        // bucle detenido: un intento de fragmento con la mejor repetición (research R1)
        const source = cb.current.record;
        if (source && l.loop && summary.best.mode !== "listen") {
          recordAttempt(
            makeAttempt({
              source,
              mode: summary.best.mode,
              hands: l.hands,
              twoHands: score.twoHands,
              tempo: l.tempo,
              score: summary.best.score ?? 0,
              stars: summary.best.stars,
              frag: { from: l.loop.from + 1, to: l.loop.to + 1, reps: summary.reps },
            }),
          );
        }
        const pct = (r: LessonResult) => `${Math.round((r.score ?? 0) * 100)} %`;
        const reps = `${summary.reps} ${summary.reps === 1 ? "repetición" : "repeticiones"}`;
        setResult({ ...summary.best, loop: true, message: `${reps} · mejor ${pct(summary.best)} · última ${pct(summary.last)}` });
      }
      return;
    }
    if (!ready) return;
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

  const nextMode = MODES[MODES.findIndex(([m]) => m === mode) + 1]?.[0];
  const closePanel = useCallback(() => setPanel(null), []);
  const hint =
    customHint?.[mode] !== undefined ? (
      <>{customHint[mode]}</>
    ) : (
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
      {/* en 6/8 el pulso es la negra con puntillo (FR-012a) */}
      <output>{tempo}</output> {score.pulse === 1.5 ? "♩. por minuto" : "ppm"}
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
  // primera pieza con pedal: explicación breve que no vuelve a salir (009, FR-011)
  // en móvil apaisado, panel superpuesto; en escritorio, aviso sobre la partitura
  const pedalHelpOpen = score.pedals.length > 0 && !prefs.pedalHelpSeen;
  const closePedalHelp = () => void settings.set({ pedalHelpSeen: true });
  const pedalHelpBody = (
    <>
      <h2>Pedal de resonancia</h2>
      <p className="hint">
        La línea bajo la partitura indica el pedal derecho (de resonancia): písalo con el pie donde empieza la línea,
        levántalo y vuelve a pisarlo en cada pico, y suéltalo donde termina. Es una indicación de lectura: no cuenta para
        la puntuación.
      </p>
      <button type="button" className="btn primary" onClick={closePedalHelp}>
        Entendido
      </button>
    </>
  );
  const pedalHelp = compact ? (
    <Popover open={pedalHelpOpen} onClose={closePedalHelp} anchor="start" label="Pedal de resonancia">
      {pedalHelpBody}
    </Popover>
  ) : (
    pedalHelpOpen && (
      <div className="pedal-help" role="note" aria-label="Pedal de resonancia">
        {pedalHelpBody}
      </div>
    )
  );
  const board = (
    <div className="board">
      <ScoreView
        ref={staff}
        onReady={() => setReady(true)}
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
        {beat && <BeatIndicator ref={beatRef} />}
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
        {nextMode && !result.loop && (
          <button className="btn primary" onClick={() => setMode(nextMode)}>
            Siguiente paso
          </button>
        )}
        {!result.loop && resultActions?.(result)}
      </div>
    </div>
  );
  const keyboard = <Keyboard ref={keys} low={range[0]} high={range[1]} guide={guide} onPress={press} notation={prefs.notation} fit={compact} />;
  const handsSeg = (compactLabels: boolean) =>
    showHands && (
      <div className="seg" role="group" aria-label="Qué mano practicas">
        {(
          (compactLabels
            ? [
                ["both", "Ambas manos"],
                ["R", "Mano derecha"],
                ["L", "Mano izquierda"],
              ]
            : [
                ["both", "Ambas"],
                ["R", "Derecha"],
                ["L", "Izquierda"],
              ]) as [HandChoice, string][]
        ).map(([h, label]) =>
          compactLabels ? (
            <button key={h} aria-pressed={hands === h} aria-label={label} title={label} onClick={() => setHands(h)}>
              {h !== "L" && <span className="dot r" />}
              {h !== "R" && <span className="dot l" />}
            </button>
          ) : (
            <button key={h} aria-pressed={hands === h} onClick={() => setHands(h)}>
              {h !== "both" && <span className={`dot ${h === "R" ? "r" : "l"}`} />}
              {label}
            </button>
          ),
        )}
      </div>
    );

  if (compact) {
    return (
      <div className="screen lesson compact">
        <div className="practice-row">
          <button type="button" className="icon-btn" aria-label="Atrás" onClick={() => goBack(back)}>
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
          {handsSeg(true)}
          <button className="btn primary" onClick={toggleRun} disabled={!running && !ready}>
            {running ? "Parar" : "Empezar"}
          </button>
          {allowLoop && (
            <button type="button" className="loop-toggle" aria-label="Bucle" aria-pressed={sel.on} onClick={() => setSel((s) => toggleLoop(s, !s.on))}>
              ⟲{!loopRange && " Bucle"}
            </button>
          )}
          {allowLoop && loopRange && (
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
        {pedalHelp}

        {board}
        {resultCard}
        {keyboard}
      </div>
    );
  }

  return (
    <div className="screen lesson">
      <TopBar title={song.title} back={back} />

      <div className="lesson-head">
        <p className="sub">
          {song.level} · {score.notes.length} notas · {measureCount(score)} compases
        </p>
        {handsSeg(false)}
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

      {pedalHelp}
      {board}

      <div className="controls">
        <button className="btn primary" onClick={toggleRun} disabled={!running && !ready}>
          {running ? "Parar" : "Empezar"}
        </button>
        {atTempoField}
        {allowLoop && (
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
        )}
        {tempoField}
        {viewFields}
      </div>

      {resultCard}

      {keyboard}
    </div>
  );
}

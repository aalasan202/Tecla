import { useCallback, useEffect, useRef, useState } from "react";
import { ensureAudio, playTone } from "../audio/synth";
import { noteName, octaveOf } from "../music/theory";
import { useMidiInput } from "../midi/MidiProvider";
import { settings } from "../state/settings";
import { addPractice } from "../state/progress";
import { Keyboard, type KeyboardHandle } from "../components/Keyboard";
import { TopBar } from "../components/TopBar";

const RANGES = {
  small: { label: "2 octavas", low: 48, high: 71 },
  medium: { label: "3 octavas", low: 48, high: 83 },
  large: { label: "4 octavas", low: 36, high: 83 },
} as const;
type RangeKey = keyof typeof RANGES;

/** Si entre dos notas pasan menos de esto, se cuenta como práctica. */
const ACTIVE_GAP = 15;

export function FreePiano() {
  const { notation } = settings.use();
  const [range, setRange] = useState<RangeKey>("medium");
  const [last, setLast] = useState<number[]>([]);
  const keys = useRef<KeyboardHandle>(null);
  const lastPress = useRef<number | null>(null);
  const pending = useRef(0);

  const press = useCallback((m: number) => {
    ensureAudio();
    playTone(m, 0.8);
    keys.current?.flash(m, "down", 220);
    setLast((prev) => [m, ...prev].slice(0, 8));
    const now = performance.now();
    if (lastPress.current !== null) {
      const gap = (now - lastPress.current) / 1000;
      if (gap < ACTIVE_GAP) pending.current += gap;
    }
    lastPress.current = now;
  }, []);
  useMidiInput(press);

  // guarda el tiempo tocado al salir
  useEffect(() => () => addPractice(pending.current), []);

  const r = RANGES[range];
  const current = last[0];

  return (
    <div className="screen piano">
      <TopBar title="Piano libre" back={{ name: "home" }} />
      <div className="piano-head">
        <div className="now-playing" aria-live="polite">
          {current === undefined ? (
            <span className="np-empty">Toca una tecla</span>
          ) : (
            <>
              <span className="np-note">{noteName(current, notation)}</span>
              <span className="np-octave">octava {octaveOf(current)}</span>
            </>
          )}
        </div>
        <div className="np-trail" aria-label="Últimas notas">
          {last.slice(1).map((m, i) => (
            <span key={i}>{noteName(m, notation)}</span>
          ))}
        </div>
        <div className="seg" role="group" aria-label="Tamaño del teclado">
          {(Object.keys(RANGES) as RangeKey[]).map((k) => (
            <button key={k} aria-pressed={range === k} onClick={() => setRange(k)}>
              {RANGES[k].label}
            </button>
          ))}
        </div>
      </div>
      <Keyboard ref={keys} low={r.low + 2} high={r.high - 2} guide={[]} onPress={press} notation={notation} height={240} />
      <p className="foot">En ordenador puedes tocar con las teclas A S D F… (blancas) y W E R T… (negras).</p>
    </div>
  );
}

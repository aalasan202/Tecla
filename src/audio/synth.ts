import { frequency } from "../music/theory";
import { decodePiano, pianoState, playPiano, type Sounding } from "./piano";

/**
 * Salida de audio de la app. Las notas suenan con el piano de muestras (piano.ts) cuando está
 * cargado; mientras carga o si falla, con un sintetizador sencillo de reserva.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function ensureAudio(): AudioContext | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  decodePiano(ctx);
  return ctx;
}

/**
 * Notas que suenan (009): se pueden apagar antes de tiempo al parar la lección o al soltar el
 * pedal del teclado MIDI. `nominal` es cuándo acabaría sin pedal.
 */
interface Voice extends Sounding {
  nominal: number;
}
const sounding = new Set<Voice>();
/** Pedal de resonancia del teclado MIDI del alumno pisado. */
let sustain = false;
/** Lo más que se deja sonar una nota con el pedal pisado (la resonancia natural de una muestra). */
const SUSTAIN_MAX = 8;
/** Constante de tiempo del apagado rápido (≈ 0,1 s hasta el silencio). */
const FAST = 0.03;

function track(v: Sounding | null, nominal: number): void {
  if (!v) return;
  const voice: Voice = { ...v, nominal };
  sounding.add(voice);
  v.onEnd(() => sounding.delete(voice));
}

/** Apaga una nota a partir de `at`, sin saltos de volumen. */
function fadeAt(v: Voice, at: number, tau: number): void {
  const p = v.gain as AudioParam & { cancelAndHoldAtTime?: (t: number) => AudioParam };
  if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(at);
  else {
    p.cancelScheduledValues(at);
    p.setValueAtTime(p.value, at);
  }
  p.setTargetAtTime(0, at, tau);
  v.stop(at + tau * 8);
}

/** Toca una nota: con el piano si está listo, si no con el sintetizador. */
export function playTone(m: number, duration = 0.5, volume = 0.32): void {
  const a = ensureAudio();
  if (!a || !master) return;
  const hold = sustain ? Math.max(duration, SUSTAIN_MAX) : undefined;
  const v = pianoState() === "ready" ? playPiano(a, master, m, duration, volume, hold) : synthTone(a, master, m, hold ?? duration, volume);
  track(v, a.currentTime + duration);
}

/** Apaga en ≈ 0,1 s todo lo que suena (al parar, salir o repetir el bucle). */
export function releaseAll(): void {
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const v of sounding) fadeAt(v, now, FAST);
  sounding.clear();
}

/**
 * Pedal de resonancia del teclado MIDI (009): mientras está pisado, las notas siguen sonando;
 * al soltarlo, cada una se apaga en su fin nominal (o ya, si ese momento pasó). No puntúa.
 */
export function setSustain(down: boolean): void {
  if (sustain === down) return;
  sustain = down;
  if (down || !ctx) return;
  const now = ctx.currentTime;
  for (const v of sounding) {
    if (v.nominal <= now) {
      fadeAt(v, now, FAST);
      sounding.delete(v);
    } else fadeAt(v, v.nominal, 0.12);
  }
}

/** Sintetizador de reserva: triangular + armónicos, filtro que se cierra. */
function synthTone(a: AudioContext, master: GainNode, m: number, duration: number, volume: number): Sounding {
  const f = frequency(m);
  const t = a.currentTime;
  const end = t + Math.max(0.35, duration) + 0.7;
  const oscs: OscillatorNode[] = [];

  const env = a.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(volume, t + 0.006);
  env.gain.exponentialRampToValueAtTime(volume * 0.4, t + 0.22);
  env.gain.exponentialRampToValueAtTime(0.0005, end);

  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(3200, t);
  lp.frequency.exponentialRampToValueAtTime(900, end);

  const partials: [OscillatorType, number, number][] = [["triangle", 1, 1], ["sine", 2, 0.35], ["sine", 3, 0.12]];
  for (const [type, harmonic, gain] of partials) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = f * harmonic;
    g.gain.value = gain;
    o.connect(g);
    g.connect(lp);
    o.start(t);
    o.stop(end);
    oscs.push(o);
  }
  lp.connect(env);
  env.connect(master);
  return {
    gain: env.gain,
    stop: (at) =>
      oscs.forEach((o) => {
        try {
          o.stop(Math.min(at, end));
        } catch {
          /* ya parado */
        }
      }),
    onEnd: (cb) => oscs[0].addEventListener("ended", cb),
  };
}

/** Clic de metrónomo; más agudo en la primera parte del compás. */
export function playClick(strong: boolean): void {
  const a = ensureAudio();
  if (!a || !master) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = "square";
  o.frequency.value = strong ? 1600 : 1100;
  g.gain.setValueAtTime(strong ? 0.12 : 0.07, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + 0.06);
}

import { frequency } from "../music/theory";
import { decodePiano, pianoState, playPiano } from "./piano";

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

/** Toca una nota: con el piano si está listo, si no con el sintetizador. */
export function playTone(m: number, duration = 0.5, volume = 0.32): void {
  const a = ensureAudio();
  if (!a || !master) return;
  if (pianoState() === "ready") playPiano(a, master, m, duration, volume);
  else synthTone(a, master, m, duration, volume);
}

/** Sintetizador de reserva: triangular + armónicos, filtro que se cierra. */
function synthTone(a: AudioContext, master: GainNode, m: number, duration: number, volume: number): void {
  const f = frequency(m);
  const t = a.currentTime;
  const end = t + Math.max(0.35, duration) + 0.7;

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
  }
  lp.connect(env);
  env.connect(master);
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

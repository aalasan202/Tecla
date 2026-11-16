import { PIANO_SAMPLES, playbackRate, sampleFor, sampleUrl } from "./samples";

/**
 * Piano con muestras (Salamander Grand Piano, CC BY 3.0). Se descarga al arrancar, se guarda en
 * Cache Storage y se decodifica cuando existe el AudioContext. Solo pasa a "ready" si las 30
 * muestras están listas; mientras tanto, o si algo falla, synth.ts usa el sintetizador.
 */
export type PianoState = "loading" | "ready" | "unavailable";

/** Al cambiar las muestras, subir la versión: las cachés antiguas se borran al arrancar. */
const CACHE_NAME = "tecla-piano-v1";
/** Ganancia de las muestras respecto al `volume` de playTone, para igualar al sintetizador. */
const PIANO_GAIN = 4;
/** Tiempo que tarda una nota en apagarse tras su duración (constante de setTargetAtTime). */
const RELEASE = 0.12;

let state: PianoState = "loading";
let started = false;
let decoding = false;
let ctxRef: AudioContext | null = null;
let raw: Map<number, ArrayBuffer> | null = null;
const buffers = new Map<number, AudioBuffer>();

interface Voice {
  src: AudioBufferSourceNode;
  gain: GainNode;
}
const voices = new Map<number, Voice>();

export const pianoState = (): PianoState => state;

function fail(error: unknown): void {
  if (state !== "loading") return;
  state = "unavailable";
  raw = null;
  console.warn("Tecla: no se pudo cargar el sonido de piano; se usa el sintetizador.", error);
  // no conservar una muestra dañada: en la próxima visita se vuelve a descargar todo
  if (typeof caches !== "undefined") void caches.delete(CACHE_NAME).catch(() => undefined);
}

async function openCache(): Promise<Cache | null> {
  try {
    if (typeof caches === "undefined") return null;
    const old = (await caches.keys()).filter((k) => k.startsWith("tecla-piano-") && k !== CACHE_NAME);
    await Promise.all(old.map((k) => caches.delete(k)));
    return await caches.open(CACHE_NAME);
  } catch {
    return null; // contexto no seguro o almacenamiento bloqueado: basta con la caché HTTP
  }
}

async function fetchSample(url: string, cache: Cache | null): Promise<ArrayBuffer> {
  if (cache) {
    try {
      const hit = await cache.match(url);
      if (hit) return await hit.arrayBuffer();
    } catch {
      /* se descarga de nuevo */
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  if (cache) {
    try {
      await cache.put(url, res.clone());
    } catch {
      /* sin espacio o bloqueado: se usa igualmente */
    }
  }
  return res.arrayBuffer();
}

/** Empieza a descargar las muestras. Se llama una vez al arrancar; las llamadas siguientes no hacen nada. */
export function preloadPiano(): void {
  if (started) return;
  started = true;
  const hasWebAudio =
    typeof window !== "undefined" &&
    !!(window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);
  if (!hasWebAudio) {
    state = "unavailable";
    return;
  }
  void (async () => {
    try {
      const cache = await openCache();
      const base = import.meta.env.BASE_URL;
      const entries = await Promise.all(
        PIANO_SAMPLES.map(async (s) => [s.midi, await fetchSample(sampleUrl(base, s.file), cache)] as const),
      );
      raw = new Map(entries);
      if (ctxRef) decodePiano(ctxRef);
    } catch (error) {
      fail(error);
    }
  })();
}

/** Decodifica las muestras en cuanto hay contexto y descarga; da igual el orden en que lleguen. */
export function decodePiano(ctx: AudioContext): void {
  ctxRef = ctx;
  if (state !== "loading" || decoding || !raw) return;
  decoding = true;
  const pending = raw;
  Promise.all([...pending].map(async ([midi, data]) => [midi, await ctx.decodeAudioData(data)] as const))
    .then((decoded) => {
      for (const [midi, buffer] of decoded) buffers.set(midi, buffer);
      raw = null;
      state = "ready";
    })
    .catch(fail);
}

/** Toca la nota `m` con el piano durante `seconds` y la apaga de forma gradual. */
export function playPiano(ctx: AudioContext, out: AudioNode, m: number, seconds: number, volume: number): void {
  const sample = sampleFor(m);
  const buffer = buffers.get(sample.midi);
  if (!buffer) return;
  const t = ctx.currentTime;

  // como el apagador de un piano: repetir una nota apaga la anterior
  const prev = voices.get(m);
  if (prev) {
    prev.gain.gain.cancelScheduledValues(t);
    prev.gain.gain.setTargetAtTime(0, t, 0.01);
    try {
      prev.src.stop(t + 0.05);
    } catch {
      /* ya parada */
    }
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = playbackRate(m, sample.midi);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * PIANO_GAIN, t);
  gain.gain.setTargetAtTime(0, t + seconds, RELEASE);
  src.connect(gain);
  gain.connect(out);
  src.start(t);
  src.stop(t + seconds + RELEASE * 5);

  const voice: Voice = { src, gain };
  voices.set(m, voice);
  src.onended = () => {
    if (voices.get(m) === voice) voices.delete(m);
    gain.disconnect();
  };
}

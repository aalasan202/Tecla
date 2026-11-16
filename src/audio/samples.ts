/** Muestras del piano y afinación. Funciones puras, sin APIs del navegador. */

export interface PianoSample {
  midi: number;
  file: string;
}

const FIRST = 21; // La0
const LAST = 108; // Do8
const STEP = 3; // una muestra cada 3 semitonos: ninguna nota se transpone más de ±1
const FILE_NAMES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"];

const fileFor = (m: number): string => `${FILE_NAMES[m % 12]}${Math.floor(m / 12) - 1}.mp3`;

export const PIANO_SAMPLES: readonly PianoSample[] = Array.from(
  { length: (LAST - FIRST) / STEP + 1 },
  (_, i) => ({ midi: FIRST + i * STEP, file: fileFor(FIRST + i * STEP) }),
);

/** La muestra más cercana a la nota `m` (en empate, la inferior); fuera de rango, la del extremo. */
export function sampleFor(m: number): PianoSample {
  const i = Math.round((Math.min(LAST, Math.max(FIRST, m)) - FIRST - 0.01) / STEP);
  return PIANO_SAMPLES[Math.min(PIANO_SAMPLES.length - 1, Math.max(0, i))];
}

/** Velocidad de reproducción para que la muestra `sampleMidi` suene como la nota `m`. */
export const playbackRate = (m: number, sampleMidi: number): number => 2 ** ((m - sampleMidi) / 12);

export const sampleUrl = (base: string, file: string): string => `${base}samples/piano/${file}`;

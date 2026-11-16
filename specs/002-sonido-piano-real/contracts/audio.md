# Contrato: módulo de audio

## API pública de `src/audio/synth.ts` (sin cambios)

Las pantallas y el motor (a través de `LessonHost.tone` / `LessonHost.click`) siguen usando
exactamente estas funciones. Ningún llamador cambia (FR-010).

```ts
ensureAudio(): AudioContext | null
playTone(m: number, duration?: number, volume?: number): void   // por defecto 0.5 s, 0.32
playClick(strong: boolean): void
```

### Comportamiento nuevo de `playTone`

| Estado del piano | Sonido |
|------------------|--------|
| `loading` | sintetizador actual (sin cambios) |
| `ready` | piano: muestra más cercana, afinada; se apaga de forma gradual a los `duration` segundos |
| `unavailable` | sintetizador actual |

- `ensureAudio()` además arranca la decodificación del piano si las muestras ya están
  descargadas.
- `playClick` no cambia (FR-006).
- Ninguna función lanza errores por fallos de carga; los fallos se registran con
  `console.warn` una sola vez.

## Nuevo: `src/audio/samples.ts` (puro, sin APIs del navegador)

```ts
export const PIANO_SAMPLES: readonly { midi: number; file: string }[]; // 30 entradas, 21..108 cada 3
export function sampleFor(m: number): { midi: number; file: string };  // la más cercana; empate → inferior
export function playbackRate(m: number, sampleMidi: number): number;   // 2 ** ((m - sampleMidi) / 12)
export function sampleUrl(base: string, file: string): string;        // `${base}samples/piano/${file}`
```

## Nuevo: `src/audio/piano.ts` (navegador)

```ts
export type PianoState = "loading" | "ready" | "unavailable";
export function preloadPiano(): void;                    // se llama una vez en main.tsx
export function pianoState(): PianoState;
export function decodePiano(ctx: AudioContext): void;    // la llama ensureAudio()
export function playPiano(ctx: AudioContext, out: AudioNode, m: number, seconds: number, volume: number): void;
```

## Archivos estáticos

```text
public/samples/piano/
├── A0.mp3 … C8.mp3     # 30 archivos (ver data-model.md)
└── LICENSE.txt         # atribución CC BY 3.0
```

Se sirven con la base relativa de Vite (`import.meta.env.BASE_URL`), así que funcionan en
GitHub Pages y en local.

## Pantalla de Ajustes

Línea de créditos visible: «Sonido de piano: Salamander Grand Piano, de Alexander Holm
(CC BY 3.0)», con enlace a la licencia.

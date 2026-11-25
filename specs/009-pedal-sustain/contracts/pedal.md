# Contract: pedal de resonancia

Interfaces internas que introduce 009. Todo lo de `src/music/` es puro (sin DOM ni APIs del
navegador, Principio I) y lleva tests.

## `src/music/pedal.ts`

```ts
import type { PedalSpan, ScoreNote, SongDef } from "./types";

/**
 * Pulso en el que deja de sonar una nota que empieza en `s` y dura `d`: si su fin cae dentro de
 * un tramo (from < s + d < to), el fin del tramo; si no, s + d.
 */
export function sustainedEnd(s: number, d: number, pedals: readonly PedalSpan[]): number;

export type PedalMark =
  | { kind: "down"; at: number }            // gancho al pisar
  | { kind: "change"; at: number }          // muesca en «V»
  | { kind: "up"; at: number }              // gancho al levantar
  | { kind: "line"; from: number; to: number }; // tramo horizontal

/** Qué dibujar, en pulsos (la vista los pasa a x con layout.xAt). */
export function pedalMarks(pedals: readonly PedalSpan[]): PedalMark[];

/** Tramos limitados a [from, to) en pulsos (fragmento del bucle); los de fuera se descartan. */
export function clipPedals(pedals: readonly PedalSpan[], from: number, to: number): PedalSpan[];

/** Errores de las reglas 1–4 del modelo de datos; vacío si es válido. */
export function validatePedal(song: SongDef): string[];

/**
 * Ajusta tramos leídos de un archivo a la pieza ya convertida: cada extremo al inicio de nota
 * más cercano (o al final), sin tramos vacíos y fusionando solapes. Nunca lanza.
 */
export function fitPedals(spans: readonly [number, number][], song: Omit<SongDef, "id" | "level">): PedalSpan[];
```

### Ejemplos de comportamiento

| Entrada | Resultado |
|---------|-----------|
| `sustainedEnd(0, 1, [[0, 4]])` | `4` (la nota se sostiene hasta levantar) |
| `sustainedEnd(0, 4, [[0, 4]])` | `4` (termina con el tramo) |
| `sustainedEnd(2, 4, [[0, 4]])` | `6` (termina fuera: no se toca) |
| `sustainedEnd(0, 1, [[0, 2], [2, 4]])` | `2` (el cambio la apaga) |
| `sustainedEnd(3, 1, [])` | `4` |
| `pedalMarks([[0, 2], [2, 4]])` | down@0, line 0→2, change@2, line 2→4, up@4 |
| `clipPedals([[0, 4], [4, 8]], 3, 6)` | `[[3, 4], [4, 6]]` |
| `clipPedals([[0, 2]], 4, 8)` | `[]` |
| `fitPedals([[0.1, 3.9]], …)` con notas en 0, 2, 4 y total 8 | `[[0, 4]]` |
| `fitPedals([[0, 4], [3, 6]], …)` | `[[0, 6]]` (solape fusionado) |

## `src/music/score.ts`

- `buildScore(song).pedals`: `song.pedal ?? []` si `levelOf(song) >= 3`; si no, `[]`.

## `src/music/level.ts`

```ts
/** Nivel 1–4 a partir de `level` («Nivel N · …»); 1 si no se reconoce. */
export const levelOf: (s: Pick<SongDef, "level">) => number;
```

## `src/engine/lesson.ts`

- `LessonHost.release?(): void`: se llama en `stop()` y al empezar cada repetición del bucle.
- `sound(n)`: la duración pasa a `min(sustainedEnd(n.s, n.d, score.pedals), end) - n.s` pulsos.
- **Invariante**: el resultado (`LessonResult`) no depende de `score.pedals`.

## `src/audio/synth.ts`

```ts
/** Pedal del teclado MIDI del alumno: sostiene todo lo que suena mientras está pisado. */
export function setSustain(down: boolean): void;
/** Apaga en ~0,1 s todo lo que suena (piano y sintetizador). */
export function releaseAll(): void;
```

## `src/midi/useMidi.ts` y `MidiProvider`

- `useMidi(onNoteOn, onPedal?)`: CC 64 con valor ≥ 64 → `onPedal(true)`, < 64 → `onPedal(false)`.
  Al cambiar los dispositivos conectados → `onPedal(false)`.
- `<MidiProvider onPedal={setSustain}>` en `App.tsx`.

## Importación

- `parseMidi`: evento `pedal` (CC 64, umbral 64) por pista.
- `midiToRaw` / `parseMusicXml`: `RawPiece.pedal` en pulsos sin cuantizar.
- `convertPiece` y `convertFull`: `song.pedal = fitPedals(raw.pedal, song)` cuando el resultado
  no está vacío.

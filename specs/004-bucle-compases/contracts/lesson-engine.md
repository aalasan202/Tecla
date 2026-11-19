# Contract: bucle en el motor de lección y en la pantalla

Los cambios son **aditivos**: sin `options.loop`, las llamadas y los tests existentes siguen
siendo válidos sin modificación (SC-004). Términos (`start`, `end`, `L`, `P`, `local`) en
[data-model.md](../data-model.md).

## 1. Motor (`src/engine/lesson.ts`)

### Constructor

```ts
export interface LoopRange {
  /** Compás de inicio y de fin, base 0, inclusivos (from ≤ to). */
  from: number;
  to: number;
}

export interface LessonOptions {
  atTempo?: boolean;
  /** Repite solo estos compases, indefinidamente, en cualquier paso. */
  loop?: LoopRange;
}

export interface LoopSummary {
  reps: number;          // repeticiones completas
  best: LessonResult;    // mayor score
  last: LessonResult;    // última completa
}
```

- `loop` fuera de rango se recorta a `[0, measures − 1]`; `from > to` se intercambia.
- `readonly loop: LoopRange | null` queda expuesto en la instancia.

### Métodos públicos con bucle

| Método | Comportamiento |
|--------|----------------|
| `start()` | Empieza en `start`. Aprender/Tocar sin notas activas en el fragmento: no arranca (`running = false`) y emite el estado de R7. Tocar: cuenta atrás de `COUNT_IN` solo la primera vez. |
| `input(m)` | Solo considera notas del fragmento. En Tocar, con `local > P − HIT_WINDOW` se compara con la repetición siguiente. |
| `stop()` | Igual que hoy. No llama a `finish`. |
| `loopSummary()` | `LoopSummary` o `null` (Escuchar, o ninguna repetición completa). |
| `progress()` | Sin cambios (la pantalla no lo guarda con bucle). |
| `tempo` (campo) | Sin cambios respecto a hoy: Aprender «A tempo» lo aplica en caliente; en Escuchar/Tocar el bucle no añade tratamiento especial. |

### `LessonHost` con bucle

Sin callbacks nuevos.

| Callback | Uso con bucle |
|----------|---------------|
| `finish` | **Nunca** se llama: el bucle solo termina con `stop()`. |
| `tone(m, s)` | Notas automáticas y de Escuchar con duración recortada a `min(n.d, end − n.s) · spb · 0.95`. |
| `mark(id, null)` | Para todas las notas del fragmento al cerrar cada repetición. |
| `playhead(x)` / `scrollTo(x)` | Posición `start + local`; durante el descanso de Tocar, en `start`. Al volver al inicio, `scrollTo` lleva la partitura al compás de inicio. |
| `click(strong)` | Tocar: cada pulso, también en el descanso; `strong` cuando `local` es inicio de compás. |
| `status(text, next)` | Prefijo `Repetición k` y, desde la 2.ª, `· anterior NN %` (Aprender/Tocar). Descanso de Tocar: `Otra vez… n`. Escuchar: `Repetición k · Compás X de Y`. |

## 2. Selección de fragmento (`src/engine/fragment.ts`, puro)

```ts
export interface FragmentSelection { on: boolean; a: number | null; b: number | null }

export const emptySelection: FragmentSelection;           // { on: false, a: null, b: null }
export function toggleLoop(sel, on: boolean): FragmentSelection;
export function tapMeasure(sel, i: number): FragmentSelection;
export function nudge(sel, edge: "from" | "to", delta: 1 | -1, measures: number): FragmentSelection;
export function rangeOf(sel): LoopRange | null;           // null si no está completo
export function canNudge(sel, edge, delta, measures): boolean;
```

- `tapMeasure` sin bucle activado devuelve `sel` sin cambios.
- `nudge` nunca produce `from < 0`, `to ≥ measures` ni `from > to`.

## 3. Partitura (`src/music/score.ts`, `src/components/Staff.tsx`)

```ts
/** Compás (base 0) bajo la coordenada x de la partitura, recortado a [0, measures − 1]. */
export function measureAt(score: Score, x: number): number;
```

`Staff` añade dos props opcionales:

| Prop | Tipo | Efecto |
|------|------|--------|
| `loop` | `{ from: number; to: number \| null } \| null` | Rectángulo de fondo bajo los compases `from…to` (solo `from` si `to` es `null`). |
| `onMeasure` | `(i: number) => void` | Si existe, un clic o toque en la partitura llama con `measureAt`; el cursor cambia a «pointer». |

Sin `loop` ni `onMeasure`, `Staff` se ve y se comporta igual que hoy.

## 4. Pantalla de lección (`src/screens/LessonScreen.tsx`)

- Casilla **«Bucle»** en la barra de controles, en los tres pasos. Desactivada al entrar.
- Con el bucle activado:
  - sin fragmento completo, el estado indica «Pulsa en la partitura el compás donde empieza el
    fragmento» / «…donde acaba» y Empezar recorre la pieza entera;
  - con fragmento, la barra muestra «Compases X–Y» y cuatro botones (inicio −/+, fin −/+),
    deshabilitados según `canNudge`.
- El rango (`rangeOf`) se pasa como `options.loop` y forma parte de las dependencias del efecto
  que crea la lección (cambiarlo para la práctica, FR-016).
- Al pulsar **Parar** con bucle: `stop()`, `addPractice(...)` y, si `loopSummary()` no es
  `null`, panel de resultado con «N repeticiones», porcentaje y estrellas de la mejor, y el
  porcentaje de la última. **No** se llama a `recordStars` ni a `recordSession`.
- Tras `start()`, la pantalla muestra «Parar» solo si `lesson.running` es `true` (R7).

# Contrato: Curso (motor, lógica de la ruta y rutas)

Interfaces que la funcionalidad añade o cambia. Tipos en [../data-model.md](../data-model.md).

## 1. Motor de lección (`src/engine/lesson.ts`)

```ts
interface LessonOptions {
  atTempo?: boolean;
  loop?: LoopRange;
  /** NUEVO. Tocar: cualquier tecla vale; solo se evalúa el momento (R3). */
  rhythm?: boolean;
  /** NUEVO. Tocar: segundos para completar un acorde ya empezado (R5). Sin él, como hoy. */
  chordSpread?: number | ((via: InputVia) => number);
}

type InputVia = "screen-touch" | "screen-mouse" | "midi" | "computer-keys";

class Lesson {
  /** CAMBIA: origen opcional; sin él se comporta como hoy. */
  input(m: number, via?: InputVia): void;
}
```

Garantías:

- **Sin opciones nuevas, el comportamiento es idéntico al actual.** Las pruebas existentes de
  `lesson.test.ts` deben pasar sin cambios.
- `rhythm`:
  - Una pulsación se asocia a la nota pendiente más cercana dentro de `win.hit`, sea cual sea su
    altura.
  - Las pulsaciones a menos de 80 ms de un golpe ya contado se ignoran (ni acierto ni sobrante).
  - Suena la tecla pulsada.
- `chordSpread`:
  - Tras acertar la primera nota de un acorde, sus otras notas se aceptan hasta
    `chordSpread(via)` segundos después.
  - Con el acorde abierto, una altura ajena lo marca como fallado (0 puntos en `result()`) y
    además suma un sobrante.
  - Mientras el acorde está abierto, sus notas acertadas siguen sonando.
- `result()`, `starsFor` y los mensajes no cambian.
- `Practice` pasa `chordSpread` a toda pieza cuya partitura tenga algún acorde (Curso y
  Canciones, FR-014a): 0,15 s con `midi` o `screen-touch` y 1,5 s con `screen-mouse` o
  `computer-keys`.

## 2. Lógica de la ruta (`src/course/path.ts`, `src/state/course.ts`)

```ts
// src/course/path.ts (puro)
export const COURSE: Unit[];
export function pathState(units: Unit[], cp: CourseProgress, songBest: Record<string, number>): PathState;
export function findItem(units: Unit[], itemId: string): { unit: Unit; item: PathItem; index: number } | null;
export function courseStars(units: Unit[], cp: CourseProgress): { stars: number; max: number };
export function testOutcome(exerciseIds: string[], stars: Record<string, number>): { passed: boolean; weakest: Block | null };

// src/course/text.ts (puro)
export function renderText(text: string, notation: Notation): string;

// src/state/course.ts (almacén)
export const course: Store<CourseProgress>;           // "tecla-course"
export function recordCourseStars(id: string, stars: number): void;
export function markSeen(tipId: string): void;
export function markSkipped(unitIds: string[]): void;
export function touchCourse(itemId: string): void;    // last = { itemId, at: Date.now() }
```

## 3. Rutas (`src/router.ts`)

| Hash | Route | Pantalla |
|------|-------|----------|
| `#curso` | `{ name: "course" }` | `CourseMap` |
| `#curso/<itemId>` | `{ name: "courseItem"; itemId }` | `CourseLesson` · `CourseTip` · `LessonScreen` (hito, `back` = curso) |
| `#curso/prueba/<unitId>` | `{ name: "courseTest"; unitId }` | `CourseTest` |

Comportamiento con elementos bloqueados o desconocidos:

- Un `itemId` desconocido muestra «No encontrado», con enlace al Curso.
- Un elemento `locked` abierto por URL no se abre: muestra qué hay que superar antes (FR-018).

## 4. Componentes

```ts
// src/components/Practice.tsx: extraído de LessonView, sin cambios visibles en Canciones
interface PracticeProps {
  song: SongDef;
  modes: Mode[];                      // Canciones: los 3; ritmo: ["listen", "play"]
  initialMode?: Mode;
  engine?: Pick<LessonOptions, "rhythm" | "chordSpread">;
  allowLoop?: boolean;                // false en el Curso
  handsChoice?: boolean;              // true por defecto; false en el Curso (siempre ambas manos)
  beat?: boolean;                     // indicador visual del pulso (Curso)
  onPlayResult?(r: LessonResult, hands: HandChoice): void;
  onSession?(mode: Mode, hands: HandChoice, progress: number): void; // Canciones: recordSession
}

// src/components/Keyboard.tsx: CAMBIA
onPress(m: number, via: "screen-touch" | "screen-mouse" | "computer-keys"): void;
```

- `Illustration({ id })`: SVG en línea que usa las variables de color del tema.
- `ExplainPageView({ page })`: texto, `ScoreView` de solo lectura con «Escuchar» y `Keyboard`
  libre con las teclas resaltadas.

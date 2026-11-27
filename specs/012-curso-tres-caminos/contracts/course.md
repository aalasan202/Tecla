# Contract: Curso por niveles, técnica y recomendación (012)

Interfaces internas entre módulos y rutas. Los tipos de datos están en
[data-model.md](../data-model.md).

## `src/course/` (lógica pura, sin navegador; Principio I)

```ts
// content.ts
export const LEVELS: Level[];                  // 4 niveles (research R1, R12)

// state.ts — sustituye a pathState
export function courseState(levels: Level[], cp: CourseProgress, songBest: Record<string, number>, midiOk: boolean): CourseState;
export function findItem(levels: Level[], itemId: string): { level: Level; path: Path; item: CourseItem; index: number } | null;
export function courseStars(levels: Level[], cp: CourseProgress): { stars: number; max: number }; // solo lecciones (sin cambios de criterio)
export function testOutcome(...)               // sin cambios
export function continueTarget(courseLast, songLast, recommendedId: string | null) // sin cambios de forma

// recommend.ts
export function recommend(levels: Level[], st: Omit<CourseState, "recommended">, recent: string[], midiOk: boolean): Recommendation | null;

// scales.ts
export const SCALE_TABLE: Record<ScaleKey, { key: number; spell?: …; fingers: { R: number[]; L: number[] } }>;
export function scale(spec: ScaleSpec, tempo: number): SongDef;      // con f explícito por nota
export function thumbPasses(spec: ScaleSpec): number[];               // midis donde pasa el pulgar
export function tempoStep(best: Record<string, number>, id: string): 0 | 1 | 2;
export function stepForTempo(tempos: [number, number, number], used: number): 0 | 1 | 2 | -1; // −1: más lento que el inicial

// independence.ts
export const INDEPENDENCE: Record<2 | 3 | 4, SongDef[]>;              // ≥ 2 por nivel; validados con validateSong

// checks.ts — ampliado
export function checkCourse(levels: Level[], repertoireIds: Set<string>): string[];
// mínimos: niveles 3 y 4 con 4–6 lecciones y 3–4 consejos; pruebas de los niveles 2–4;
// ≥ 2 escalas por mano y nivel… (SC-005); ids únicos y estables (los de 010 presentes)
```

## `src/music/` (cambio mínimo, con tests)

```ts
// types.ts
interface EventOpts { tie?; slur?; spell?; f?: number }   // NUEVO f: dedo 1–5 fijo
// score.ts: buildScore respeta f; assignFingering solo rellena las notas sin f
```

## `src/state/course.ts`

```ts
export function touchCourse(itemId: string): void;   // + añade a recent (máx. 6, sin repetir el último)
export function recordCourseStars(id: string, stars: number): void; // sin cambios
export function recordScaleStars(id: string, step: 0 | 1 | 2, stars: number): void; // best["id@step"]
export function markLevelTest(level: 2 | 3 | 4): void;              // tests[level] = true
// markSkipped se retira: las pruebas nuevas usan markLevelTest
```

`useCourse()` devuelve `{ levels, cp, best, state }`; `state` se calcula con `midiOk` del
`MidiProvider`.

## `Practice` (props nuevas)

| Prop | Tipo | Efecto |
|------|------|--------|
| `forceFingers` | `boolean` | muestra dedos aunque `settings.showFingers` sea false |
| `needsMidi` | `boolean` | sin MIDI: solo Escuchar y aviso con botón de conexión; desconexión a mitad: para sin resultado ni registro |
| `initialTempo` | `number` | tempo inicial (escalón propuesto de la escala) |
| `onPlayResult(r, hands, tempo)` | — | se añade el tempo usado |

## Rutas

| Hash | Route |
|------|-------|
| `#curso` | `{ name: "course" }` (nivel actual, Lecciones) |
| `#curso/nivel/<n>/<lecciones\|tecnica\|canciones>` | `{ name: "course", level: n, path }` |
| `#curso/<itemId>` | `{ name: "courseItem", itemId }` (sin cambios) |
| `#curso/prueba/<2\|3\|4>` | `{ name: "courseTest", level }`; `u2` → nivel 2 (compatibilidad) |

## Pantallas

- `CourseMap`: selector de niveles (abierto/bloqueado y motivo), pestañas de los tres caminos con
  su avance, tarjeta «Siguiente recomendado» y la lista del camino.
- `CourseItem`: abre lección o escala (`CourseLesson`), consejo, canción (`LessonScreen` con
  `back` al camino y `touchCourse`) o independencia (`Practice` con `needsMidi`).
- `Home`: la tarjeta del Curso muestra «Nivel N · Lecciones x de y» y «Continuar» usa la
  recomendación.

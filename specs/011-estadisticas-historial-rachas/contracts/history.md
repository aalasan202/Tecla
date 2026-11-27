# Contract: historial, estadísticas y rachas (011)

Interfaces internas entre módulos y las rutas nuevas. Los tipos viven en `src/stats/types.ts`.

## `src/stats/` (lógica pura, sin navegador; Principio I)

```ts
export type PieceKey = `song:${string}` | `course:${string}`;
export type Period = "7d" | "30d" | "all";
export type DayLevel = 0 | 1 | 2;

/** Decide `counts` y construye el intento (sin `at`, que pone quien registra). */
export function makeAttempt(input: {
  source: AttemptSource; mode: "learn" | "play"; hands: HandChoice; twoHands: boolean;
  tempo: number; score: number; stars: number; frag?: { from: number; to: number; reps: number };
}): Omit<Attempt, "at">;

/** Añade y recorta a `limit` (1000); actualiza el resumen. No muta la entrada. */
export function addAttempt(data: HistoryData, a: Attempt, limit?: number): Pick<HistoryData, "attempts" | "pieces">;

export function bestStreak(days: Record<string, number>): number;
export function dayLevel(seconds: number, goalMin: number): DayLevel;
export function goalMet(seconds: number, goalMin: number): boolean;

/** Rejilla del calendario: 13 columnas (semanas, lunes a domingo); la última es la actual. */
export function calendar(days: Record<string, number>, goalMin: number, today: Date, weeks?: number):
  { key: string; date: Date; seconds: number; level: DayLevel; goal: boolean; future: boolean }[][];

export function periodStats(period: Period, days: Record<string, number>, h: HistoryData, today: Date): {
  seconds: number; daysPracticed: number;
  attempts: { song: number; course: number };
  avgPlay: { song: number | null; course: number | null };   // 0–1, null sin datos
  series: { label: string; seconds: number }[];               // día, semana o mes (R9)
  top: { key: PieceKey; title: string; src: "song" | "course"; attempts: number }[];      // máx. 3
  improved: { key: PieceKey; title: string; src: "song" | "course"; from: number; to: number }[]; // máx. 3
  empty: boolean;
};

export function milestones(before: Record<string, number>, after: Record<string, number>,
  goalMin: number, today: Date, cheered: HistoryData["cheered"]): ("record" | "goal")[];
```

Todas las fechas se pasan como argumento (`today`) para poder probarlas sin reloj.

## `src/state/history.ts` (almacén)

```ts
export const history: Store<HistoryData>;                 // "tecla-history"
export function recordAttempt(a: Omit<Attempt, "at">): void;
export function forgetHistory(key: PieceKey): void;
export function useHistory(): HistoryData;
export const notice: { use(): Notice | null; push(n: Notice): void; clear(): void }; // en memoria
```

- `progress.addPractice` evalúa `milestones` tras sumar, hace `notice.push(...)` y marca
  `cheered` en el historial.
- `progress.forgetSong(id)` llama también a `forgetHistory(\`song:${id}\`)`.

## `Practice` (prop nueva)

```ts
interface AttemptSource { key: PieceKey; src: "song" | "course"; title: string; unit?: string }
/** Si se da, cada intento terminado (Aprender/Tocar) y cada bucle detenido con repeticiones se registra. */
record?: AttemptSource;
```

| Pantalla | `record` |
|----------|----------|
| `LessonScreen` (Canciones e hitos) | `{ key: "song:"+id, src: "song", title }` |
| `CourseLesson` | `{ key: "course:"+lessonId, src: "course", title, unit }` |
| `CourseTest` (cada ejercicio) | sin definir; la pantalla registra la prueba completa (research R2) |

## Rutas (`src/router.ts`)

| Hash | Route |
|------|-------|
| `#progreso` | `{ name: "progress", tab: "summary" }` |
| `#progreso/historial` | `{ name: "progress", tab: "history" }` |
| `#progreso/piezas` | `{ name: "progress", tab: "pieces" }` |
| `#progreso/pieza/<key>` | `{ name: "piece", key }` (clave codificada con `encodeURIComponent`) |

La ruta actual `{ name: "progress" }` pasa a llevar `tab`. Cualquier valor desconocido abre
`summary`.

## Ajustes

`settings.dailyGoal` se elige con un selector «Objetivo diario» de valores Desactivado, 5, 10,
15, 20 y 30 min.

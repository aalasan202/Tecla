# Data Model: Estadísticas, historial y rachas (011)

Todo se guarda en `localStorage`. Los almacenes existentes no cambian de forma, salvo un campo
nuevo en `settings`.

## Attempt (nuevo, en `tecla-history.attempts`)

Un recorrido terminado en Aprender o Tocar, o una prueba completa del Curso.

| Campo | Tipo | Regla |
|-------|------|-------|
| `at` | `number` | ms desde epoch, al terminar |
| `key` | `PieceKey` | `song:<songId>` \| `course:<itemId>` \| `course:test:<unitId>` |
| `src` | `"song" \| "course"` | origen, para separar estadísticas (FR-017) |
| `title` | `string` | título en ese momento (sirve si la pieza desaparece) |
| `unit` | `string?` | solo Curso: «Unidad N · título» |
| `mode` | `"learn" \| "play"` | Escuchar nunca se registra (FR-003) |
| `hands` | `HandChoice` | `"right" \| "left" \| "both"` |
| `twoHands` | `boolean` | la pieza tiene dos manos |
| `tempo` | `number` | ppm usadas |
| `score` | `number` | 0–1 |
| `stars` | `0–3` | `starsFor(score)`; en pruebas, el mínimo de los ejercicios (research R2) |
| `frag` | `{ from: number; to: number; reps: number }?` | compases (1‑based) si fue un bucle |
| `counts` | `boolean` | `mode==="play" && !frag && (!twoHands \|\| hands==="both")` (FR-007) |

**Validación al cargar**: se descartan entradas sin `key`, sin `at` numérico o con `score`
fuera de 0–1. Un almacén corrupto se trata como vacío; no se lanza ningún error.

## PieceSummary (nuevo, en `tecla-history.pieces[key]`)

Resumen por pieza que sobrevive al recorte de intentos.

| Campo | Tipo | Regla |
|-------|------|-------|
| `count` | `number` | intentos registrados en total |
| `title`, `src` | como en Attempt | último título conocido |
| `first` | `{ at; score }?` | primer intento que cuenta |
| `best` | `{ at; score }?` | mejor intento que cuenta (si empata, el primero) |
| `last` | `{ at; score; mode }` | último intento de cualquier tipo |

## HistoryData (almacén `tecla-history`)

```ts
{
  attempts: Attempt[];               // del más antiguo al más nuevo, como mucho 1000
  pieces: Record<PieceKey, PieceSummary>;
  cheered: { record?: DayKey; goal?: DayKey };
}
```

**Transiciones**:

- `recordAttempt(a)`:
  1. añade el intento al final y, si pasan de 1000, quita los más antiguos;
  2. actualiza `pieces[a.key]`.
- `forgetHistory(key)`: quita los intentos con esa clave y su resumen.
- `history.reset()`: lo vacía todo (desde «Borrar el progreso»).

## Datos existentes que se reutilizan

- `progress.days: Record<DayKey, seconds>` es la fuente de la racha, la mejor racha, el
  calendario y el tiempo por periodo. No se recorta nunca.
- `progress.best` y `course.best` siguen siendo la fuente de las estrellas. El historial no las
  sustituye (FR-008).

## Settings (campo nuevo)

| Campo | Tipo | Defecto |
|-------|------|---------|
| `dailyGoal` | `0 \| 5 \| 10 \| 15 \| 20 \| 30` | `0` (desactivado) |

## Derivados (funciones puras, sin almacenar)

- `bestStreak(days)`: la secuencia más larga de días consecutivos con segundos > 0.
- `dayLevel(seconds, goalMin)`: devuelve `0`, `1` o `2`. Es `2` si
  `seconds ≥ (goalMin || 10) * 60`.
- `goalMet(seconds, goalMin)`: `goalMin > 0 && seconds ≥ goalMin * 60`.
- `periodStats(period, days, attempts, pieces, today)`: totales, serie de tiempo, más
  practicadas y más mejoradas (research R9).
- `milestones(beforeDays, afterDays, goalMin, today, cheered)`: devuelve los avisos
  `("record" | "goal")[]` (research R6).

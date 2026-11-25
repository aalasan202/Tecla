# Data Model: Ruta de aprendizaje (Curso)

Tipos de `src/course/` (datos y lógica puros) y del almacén nuevo `tecla-course`. Decisiones en
[research.md](research.md).

## Contenido (estático, en el código)

### Block

```ts
type Block = "reading" | "rhythm" | "position" | "chords";
// etiquetas: Lectura · Ritmo · Posiciones · Acordes
```

### Unit

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `string` | `"u1"`, `"u2"`, `"u3"`. Estable: se guarda en el progreso. |
| `title` | `string` | p. ej. «Primeros pasos» |
| `level` | `1 \| 2` | Nivel del repertorio al que prepara (la Unidad 3 cuenta como 2). |
| `items` | `PathItem[]` | Orden de la ruta |
| `test` | `SongDef[] \| null` | Ejercicios de la prueba de nivel. `null` en la Unidad 1. |

### PathItem (unión discriminada)

```ts
type PathItem =
  | { type: "lesson"; id: string; lesson: Lesson }
  | { type: "milestone"; id: string; songId: string }   // id: "hito-<songId>"
  | { type: "tip"; id: string; tip: Tip };              // id: "consejo-<slug>"
```

Los ids son únicos en todo el curso y estables, porque se guardan en el progreso y aparecen en
las URL.

### Lesson

| Campo | Tipo | Regla |
|-------|------|-------|
| `id` | `string` | `"l-<slug>"` |
| `block` | `Block` | |
| `title` | `string` | |
| `pages` | `ExplainPage[]` | 1 o 2 (FR-007) |
| `exercise` | `SongDef` | id `"curso-<slug>"`. Pasa `validateSong`, dura como máximo 8 compases y 30 s a su tempo (FR-008). |

### ExplainPage

| Campo | Tipo | Regla |
|-------|------|-------|
| `text` | `string` | Como máximo 80 palabras, con marcas `{60}` o `{C}` para los nombres de nota (R10) |
| `staff` | `SongDef?` | Mini partitura que se puede escuchar |
| `keys` | `{ m: number; finger?: number }[]?` | Teclas resaltadas |

Debe tener al menos `staff` o `keys` (FR-007).

### Tip

| Campo | Tipo | Regla |
|-------|------|-------|
| `id` | `string` | `"consejo-<slug>"` |
| `level` | `1 \| 2` | |
| `title` | `string` | |
| `text` | `string` | Como máximo 60 palabras (FR-024). No menciona el teclado en pantalla (FR-025): la comprobación busca «pantalla», «ratón» y «táctil». |
| `art` | `IllustrationId \| IconId \| null` | Los 7 consejos con ilustración obligatoria (FR-026) tienen `IllustrationId` |

```ts
type IllustrationId = "posture" | "hand-shape" | "finger-numbers" | "find-c" | "arm-weight" | "arm-jump" | "eyes-on-score";
```

### SongDef (cambio)

```ts
interface SongDef {
  // …
  /** Ejercicio del Curso: ritmo (cualquier tecla) o acordes (ventana de simultaneidad). */
  kind?: "rhythm" | "chords";
}
```

Las piezas del repertorio no lo usan. La validación exige `time` 4/4 cuando `kind === "rhythm"`
(R4).

## Progreso (persistido: `localStorage["tecla-course"]`)

```ts
interface CourseProgress {
  /** Mejores estrellas (0–3) en Tocar por id de lección y por id de ejercicio de prueba. */
  best: Record<string, number>;
  /** Consejos marcados como vistos. */
  seen: Record<string, true>;
  /** Unidades superadas por prueba de nivel. */
  skipped: Record<string, true>;
  /** Último elemento del Curso practicado o abierto, para «Continuar». */
  last: { itemId: string; at: number } | null;
}
// por defecto: { best: {}, seen: {}, skipped: {}, last: null }
```

- Las estrellas de los **hitos** no se guardan aquí: se leen de `progress.best[songId]` (FR-021).
- `recordCourseStars(id, stars)` guarda solo si mejora (como `recordStars`).
- Borrar el progreso en Ajustes también reinicia este almacén.
- Al añadir una lección, no hace falta migrar nada. Los ids que ya no existan se ignoran.

## Estado derivado: `pathState(course, courseProgress, songBest)`

Función pura. Devuelve el estado de cada elemento y de cada unidad (R6, R7).

```ts
type ItemStatus = "locked" | "available" | "passed" | "optional" | "seen";
type UnitStatus = "locked" | "current" | "passed" | "skipped";

interface PathState {
  items: Record<string, { status: ItemStatus; stars?: number }>;
  units: Record<string, UnitStatus>;
  /** Siguiente elemento pendiente (para el mapa y «Continuar»); null si la ruta está terminada. */
  next: string | null;
  /** Avance para Inicio: unidad actual, superados y total de la unidad. */
  summary: { unitId: string; done: number; total: number } | null;
}
```

### Reglas

1. Un elemento puntuable (lección o hito) está **superado** con 2 o más estrellas.
2. **Frontera** = índice del último elemento puntuable (en orden global) que está superado o que
   pertenece a una unidad `skipped`. Sin ninguno, vale −1.
3. Para cada elemento puntuable con índice *i*:
   - superado → `passed`;
   - *i* < frontera y no superado → `optional`;
   - el primero no superado con *i* > frontera → `available`;
   - el resto → `locked`.
4. Un consejo es `seen` si está en `seen`. Si no, es `available` cuando el primer elemento
   puntuable que le sigue no está `locked` (o cuando no hay ninguno y el anterior está superado).
   Si no, es `locked`. Un consejo nunca influye en la frontera.
5. Unidades:
   - `skipped` si está en `skipped`;
   - `passed` si todos sus puntuables están `passed` u `optional` y la frontera está en la unidad
     o más allá;
   - `current` si contiene el `available` (o el primer consejo no visto del inicio);
   - `locked` en los demás casos.
6. `next` = primer consejo no visto anterior al `available`, dentro de su misma unidad, o, si no
   hay, el `available`. Si no queda nada, `null`.

### Transiciones

```text
locked ──(anterior puntuable ≥2★, o prueba aprobada, o hito ≥2★ más adelante)──▶ available / optional
available ──(≥2★ en Tocar)──▶ passed
optional ──(≥2★ en Tocar)──▶ passed
tip: locked ──▶ available ──(«Entendido»)──▶ seen
```

Nada vuelve a `locked` salvo borrar el progreso (FR-019).

## Comprobaciones automáticas (`src/course/checks.ts`, FR-034, FR-035)

- Ids únicos en todo el curso.
- Todo `milestone.songId` existe en `SONGS`.
- Entre 12 y 16 lecciones, con al menos 2 por bloque.
- Están los 13 consejos de FR-005, y «postura» y «forma de la mano» van antes de la primera
  lección.
- Ejercicios: `validateSong` sin errores, como máximo 8 compases y 30 s, `kind: "rhythm"` en 4/4
  y acordes de tres notas en los ejercicios `kind: "chords"`.
- Textos dentro de su límite de palabras. Los consejos no mencionan pantalla, ratón ni táctil.

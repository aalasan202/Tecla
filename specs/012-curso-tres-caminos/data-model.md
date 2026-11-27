# Data Model: Curso en tres caminos y técnica (012)

## Contenido (estático, en `src/course/`)

### Level (sustituye a `Unit`)

| Campo | Tipo | Regla |
|-------|------|-------|
| `n` | `1 \| 2 \| 3 \| 4` | único |
| `title` | `string` | p. ej. «Primeros pasos» |
| `lessons` | `(LessonItem \| TipItem)[]` | orden sugerido |
| `technique` | `TechItem[]` | orden sugerido |
| `songs` | `SongItem[]` | hitos primero (`recommended: true`) y luego el resto del nivel |
| `test` | `SongDef[] \| null` | prueba para **abrir** este nivel; `null` en el nivel 1 |

### Elementos (`CourseItem`)

| Tipo | Campos | Id |
|------|--------|-----|
| `lesson` | `lesson: Lesson` (existente) | `l-*` (sin cambios) |
| `tip` | `tip: Tip` (`level` amplía a `1–4`) | `consejo-*` (sin cambios) |
| `scale` | `scale: ScaleSpec` | `escala-<tonalidad>-<R\|L>` |
| `independence` | `song: SongDef`, `needsMidi: true` | `indep-<n>-<k>` |
| `song` | `songId: string`, `recommended: boolean` | `hito-<songId>` (antiguos) o `cancion-<songId>` |

### ScaleSpec

| Campo | Tipo | Regla |
|-------|------|-------|
| `tonic` | `"C" \| "G" \| "F" \| "D" \| "A" \| "E" \| "Bb"` | tabla de research R4 |
| `mode` | `"major" \| "minor"` | menor = armónica |
| `hand` | `"R" \| "L"` | |
| `tempos` | `[number, number, number]` | inicial < intermedio < objetivo |

**Validación** (tests): la escala sale con 15 notas más un silencio y la armadura correcta. Los
dedos coinciden con la tabla. La mano derecha empieza en la octava 4 y la izquierda en la 3.

## Progreso (`tecla-course`, ampliado sin migración)

```ts
interface CourseProgress {
  best: Record<string, number>;      // existente; además "<escala>@<0|1|2>" por tempo
  seen: Record<string, true>;        // existente
  skipped: Record<string, true>;     // existente (solo lectura: u1, u2 de pruebas antiguas)
  last: { itemId: string; at: number } | null; // existente
  tests?: Partial<Record<"2" | "3" | "4", true>>; // NUEVO: niveles abiertos por prueba
  recent?: string[];                 // NUEVO: últimos 6 itemIds, el más nuevo al final
}
```

## Estado derivado (puro, `courseState`)

```ts
type ItemStatus = "locked" | "available" | "done" | "needsMidi";
interface CourseState {
  levels: Record<1 | 2 | 3 | 4, { open: boolean; byTest: boolean;
    progress: Record<Path, { done: number; total: number }> }>;
  items: Record<string, { status: ItemStatus; stars?: number; tempoStep?: 0 | 1 | 2 }>;
  current: 1 | 2 | 3 | 4;            // nivel abierto más alto
  recommended: Recommendation | null;
}
type Path = "lessons" | "technique" | "songs";
interface Recommendation { itemId: string; level: number; path: Path; reason: string }
```

### Reglas

1. **Nivel 1**: siempre abierto.
2. **Nivel N > 1**: abierto si se cumple alguna de estas condiciones:
   - todas las `lesson` del N‑1 tienen 2★ o más;
   - `tests[N]`;
   - el nivel N+1 está abierto;
   - N = 2 y `skipped.u1 || skipped.u2`.
3. **Elemento de un nivel cerrado**: `locked`.
4. **Elemento de un nivel abierto**:
   - lección: `done` con 2★ o más;
   - consejo: `done` si está visto;
   - escala: `done` con 2★ o más en `@2`;
   - canción: `done` con 2★ o más en `progress.best[songId]`;
   - independencia: `done` con 2★ o más; si no, `needsMidi` cuando no hay MIDI;
   - en otro caso, `available`.
5. **Escalón de tempo de una escala**: el primer `i` sin 3★ en `@i`; con todos en 3★, el 2.
6. **Avance de un camino**: `done / total`. Sin MIDI se excluyen los `independence` de ambos
   valores (FR-006, FR-019).
7. **Recomendación**: research R8.

## Historial (011)

Los intentos de escalas y de independencia se registran con
`{ key: "course:<itemId>", src: "course" }` y su ficha propia. Las canciones del camino
Canciones se registran como `song:<songId>`, igual que hoy.

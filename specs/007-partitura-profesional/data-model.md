# Data Model: Partitura profesional

Tipos en `src/music/types.ts` salvo que se indique otro sitio. Pulsos = negras. Todo lo nuevo es
opcional: una pieza de hoy es válida sin cambios (FR-015).

## SongDef (ampliado)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id`, `title`, `level` | `string` | Igual que hoy |
| `tempo` | `number` | **Pulsos** por minuto: negras en x/4 (como hoy), negras con puntillo en 6/8 |
| `bar` | `number?` | Negras por compás (4 por defecto). En 6/8 se deduce: 3 |
| `time` | `"6/8"?` | Nuevo. Sin él, el compás es `bar`/4 |
| `key` | `number?` | Nuevo. Armadura inicial, −7 (7 bemoles) … +7 (7 sostenidos); 0 por defecto |
| `keyChanges` | `{ at: number; key: number }[]?` | Nuevo. `at` = compás (base 0) desde el que rige |
| `px` | `number?` | Píxeles por negra; mínimo automático con semicorcheas o tresillos (research R2) |
| `arpFingering` | `boolean?` | Igual que hoy |
| `n` / `r` + `l` | `Track` | Una mano o dos, como hoy |

### Track y Event

```text
Track = Event[]
Event = [nota: number | number[], pulsos: number, opciones?: EventOpts]
EventOpts = { tie?: true; slur?: "start" | "end"; spell?: Spell | Spell[] }
Spell = "#" | "b" | "n" | "##" | "bb"     // alteración escrita forzada, por altura del acorde
```

- `0` = silencio (como hoy). Un array = acorde (2–6 alturas distintas, ordenadas o no).
- `RawTrack` (hoy `[number, number][]`) sigue siendo un `Track` válido.
- `pulsos` admite tercios (`1/3`, `2/3`, `4/3`) para tresillos y cuartos (`0.25`, `0.75`) para
  semicorcheas.

**Validación** (tests del repertorio, FR-017):

- Toda duración es múltiplo de 1/48 de negra y > 0.
- Cada mano llena compases completos; las dos manos duran lo mismo (como hoy).
- Alturas 21–108; un acorde no repite altura.
- `tie` solo entre un evento y el siguiente de la misma mano con exactamente las mismas alturas.
- `slur` `start` y `end` emparejados en la misma mano, sin anidar.
- `key` y `keyChanges[].key` en −7…7; `keyChanges` ordenado y con `at` dentro de la pieza.
- `time: "6/8"` implica que cada mano suma múltiplos de 3 negras.

## Score (salida de `buildScore`, pura)

| Campo | Tipo | Notas |
|-------|------|-------|
| `song` | `SongDef` | |
| `notes` | `ScoreNote[]` | Una por altura; ligadas ya unidas; orden por `s`, derecha primero |
| `rests` | `Rest[]` | Huecos por mano (`s`, `d`, `h`); el grabado los convierte en figuras |
| `total` | `number` | Pulsos, redondeado al compás |
| `bar` | `number` | Negras por compás (3 en 6/8) |
| `pulse` | `number` | Negras por pulso del metrónomo: 1, o 1,5 en 6/8 (research R8) |
| `time` | `{ beats: number; unit: 4 \| 8 }` | Para dibujar el compás |
| `keys` | `{ at: number; key: number }[]` | Armaduras por compás (al menos la del compás 0) |
| `twoHands` | `boolean` | |
| `layout` | `Layout` | Posiciones (ver abajo) |

### ScoreNote (ampliada)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id`, `m`, `d`, `s`, `h`, `x`, `f` | | Como hoy; `x` viene de `layout`; `d` puede ser cualquier múltiplo de tick (p. ej. 2,5 o 5 si va ligada) |
| `unit` | `number` | Nuevo. Evento al que pertenece: las alturas de un acorde comparten `unit` (research R6) |
| `win` | `{ hit: number; perfect: number }` | Nuevo. Margen de acierto en pulsos, ya recortado (research R7) |
| `spell` | `{ step: string; alter: number }` | Nuevo. Cómo se escribe y se nombra (research R4) |
| `slur` | `"start" \| "end"?` | Nuevo, solo visual |

### Layout (`src/music/layout.ts`, puro)

| Campo | Tipo | Notas |
|-------|------|-------|
| `measures` | `{ x: number; width: number; start: number }[]` | Inicio en px, ancho y pulso de inicio de cada compás |
| `width`, `left` | `number` | Ancho total; margen inicial (claves, armadura, compás) |
| `xAt(beat)` | `(beat: number) => number` | Interpolación lineal entre los inicios de nota y de compás; la usan motor y vista |
| `measureAt(x)` | `(x: number) => number` | Compás bajo una `x` (selección del bucle) |

## Engraving (`src/music/engrave.ts`, puro)

```text
Engraving = { hands: HandStaff[] }                 // 1 o 2 pentagramas
HandStaff  = { h: Hand; clef: "treble" | "bass"; measures: EngravedMeasure[] }
EngravedMeasure = { index; key?: number /* si cambia aquí */; figures: Figure[];
                    beams: number[][]; tuplets: { figures: number[]; num: 3 }[] }
Figure = { kind: "note" | "rest"; s: number; dur: "w" | "h" | "q" | "8" | "16";
           dots: 0 | 1; keys: { noteId: number; step; alter; octave; acc?: "#" | "b" | "n" | "##" | "bb" }[];
           tieToNext?: boolean[] /* por altura */; slur?: "start" | "end" }
```

- La suma de figuras de cada compás es exactamente el compás (incluidos tresillos: 3 × 1/3).
- `acc` solo cuando hay que escribir la alteración (research R4).
- Cada `noteId` de una `ScoreNote` aparece en al menos una figura; si va ligada, en varias (la
  marca de color se aplica a todas sus figuras).

## ImportedSong (ampliado, `src/music/import/types.ts`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `def` | `SongDef` | Versión simplificada, como en 006; id `imp-xxxxxxxx[-n]` |
| `full` | `{ def: SongDef; level: Level; warnings: Warning[] } \| { unavailable: FullReason }`? | Nuevo. `def.id` = id de la simplificada + `.full`. Ausente = aún sin calcular (piezas de 006) |
| `version` | `"simple" \| "full"`? | Nuevo. Ausente = `"simple"` (FR-019a) |
| `source`, `hash`, `importedAt`, `warnings` | | Como en 006 |

`FullReason = "voices" | "timeSignature" | "timeChange" | "unreadable"` → mensajes en español en
el diálogo (FR-019c).

**Reglas**:

- Editar título cambia el título de las dos versiones; el nivel se edita por versión.
- Borrar quita la pieza, su original, `best[id]`, `best[id + ".full"]` y `last` si apunta a
  cualquiera de los dos.
- Las estrellas van con el id de cada versión; los totales de Inicio y Progreso siguen ignorando
  las importadas (006, FR-019).

## Ciclo de vida de la versión

```text
importada (006, sin full) ─ elegir «Versión completa» ─▶ convertir desde el original
                                                         ├─ ok ─▶ full = {...}, version = "full"
                                                         └─ no ─▶ full = { unavailable }, aviso, sigue "simple"
importada nueva ─ resumen con las dos (si difieren) ─ «Añadir» ─▶ version = elegida (por defecto "full")
version ⇄ cambiar desde ⋯ de la tarjeta (sin perder estrellas de ninguna)
```

## Cambios en lo existente

- `RawTrack` sigue exportándose como alias compatible de `Track`.
- `buildScore` mantiene su firma; añade campos a `Score` y `ScoreNote`.
- `Lesson`: `spb = 60 / (tempo · pulse)`; cursor por `score.layout.xAt`; clic cada `pulse`;
  puntuación por `unit`; márgenes por nota (`win`).
- `measureAt(score, x)` de `score.ts` pasa a delegar en `layout.measureAt`.
- `STAFF_LEFT` deja de usarse fuera de `layout.ts`.

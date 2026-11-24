# Contract: partitura, motor e importación

Interfaces entre módulos. Tipos en [data-model.md](../data-model.md).

## `src/music/` (puro: sin DOM ni APIs del navegador; con tests)

```ts
// score.ts (firma igual que hoy)
export function buildScore(song: SongDef): Score;          // lanza Error si la pieza no es válida
export const measureCount: (score: Score) => number;
export function measureAt(score: Score, x: number): number; // delega en score.layout

// layout.ts
export function layoutScore(input: LayoutInput): Layout;   // LayoutInput: notas, compases, armaduras, px
// Layout.xAt(beat), Layout.measureAt(x)

// spelling.ts
export function spell(m: number, key: number, override?: Spell): { step: string; alter: number; octave: number };
export function noteLabel(spelled: { step: string; alter: number }, notation: Notation): string; // «Fa♯», «Si♭», «F♯»
export function accidentals(notes: ScoreNote[], keys: Score["keys"], bar: number): Map<number, Acc>; // qué se dibuja

// engrave.ts
export function engrave(score: Score): Engraving;

// fingering.ts (cambia la unidad: eventos en vez de notas)
export function assignFingering(events: ScoreNote[][], opts: Options): void;
```

Garantías:

- `buildScore` de cualquiera de las 12 piezas actuales da las mismas `m`, `d`, `s`, `h` y `f` que
  antes del cambio (test de no regresión con los valores guardados antes de empezar).
- `engrave` es determinista y cada compás de figuras suma exactamente su compás.
- `layout.xAt` es estrictamente creciente; `xAt(n.s) === n.x` para toda nota.

## `src/engine/lesson.ts` (puro)

Sin cambios en `LessonHost` ni en la API pública de `Lesson`. Cambios internos:

- Segundos por negra: `60 / (tempo · score.pulse)`.
- Cursor: `score.layout.xAt(beat)` en lugar de `STAFF_LEFT + beat·px + 16`.
- Metrónomo y cuenta atrás: un clic cada `score.pulse` negras, fuerte al inicio del compás;
  `COUNT_IN` cuenta pulsos.
- Tocar: margen de cada nota `n.win` (research R7).
- `result()`: puntos por `unit` (acorde = un acierto o un fallo); con un solo elemento por `unit`
  el resultado es idéntico al actual (test sobre las 12 piezas con una secuencia de pulsaciones
  fija).

## `src/components/ScoreView.tsx` (navegador; sustituye a `Staff.tsx`)

```ts
export const ScoreView: ForwardRef<StaffHandle, StaffProps>; // mismas props y handle que Staff hoy
// StaffHandle: setPlayhead(x | null), scrollTo(x, smooth)
// StaffProps: score, marks, autoIds, showNames, showFingers, notation, loop, onMeasure, fit
```

- Carga `vexflow/bravura` con `import()` la primera vez; mientras, muestra «Cargando partitura…»
  y llama a `onReady?.()` cuando ya está dibujada (nueva prop opcional para que la lección no
  empiece antes).
- Dibuja con VexFlow las figuras de `engrave(score)`, colocando cada inicio en `layout`.
- Marcas por clases sobre el SVG dibujado (`now`, `hit`, `miss`, `auto`), sin volver a dibujar.
- Colores con las variables del tema; en `fit` mide y escala como `Staff` hoy.

## `src/music/import/` y `src/import/`

```ts
// full.ts (puro)
export function convertFull(raw: RawPiece): { ok: true; song: Omit<SongDef, "id" | "level">; level: Level; warnings: Warning[] }
                                         | { ok: false; reason: FullReason };
// convert.ts: convertPiece admite times 6/8 (FR-020); lo demás igual
// midi.ts: lee FF 59 (armadura) → RawPiece.keys
// musicxml.ts: lee <key><fifths>, <alter>/<step> → RawNote.spell, <time> 6/8
```

## `src/state/`

```ts
// imported.ts
export async function ensureFull(id: string, deps?): Promise<"ok" | FullReason>; // calcula desde el original si falta
export function setVersion(id: string, version: "simple" | "full"): boolean;
export function editImported(id: string, patch: { title?: string; level?: Level }): boolean; // nivel de la versión elegida
export async function removeImported(id: string, deps?): Promise<void>; // + best de las dos versiones

// library.ts
export function allSongs(): SongDef[];          // repertorio + versión elegida de cada importada
export function findSong(id: string): SongDef | undefined;  // acepta id de cualquiera de las dos versiones
export function resolveSongId(id: string): string;          // id de la versión elegida (para «Continuar»)
```

## Interfaz

- **Lección**: misma pantalla; tempo con «♩. por minuto» en 6/8.
- **Canciones · ⋯ de una importada**: además de Editar y Borrar, «Versión completa» /
  «Versión simplificada» (la activa marcada). Si la completa no está disponible, opción
  deshabilitada con el motivo.
- **ImportDialog · resumen**: si las dos versiones difieren, selector «Versión completa» (por
  defecto) / «Versión simplificada»; los datos, el nivel sugerido y los avisos son los de la
  versión seleccionada.

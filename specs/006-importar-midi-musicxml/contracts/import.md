# Contract: importación de canciones

Interfaces entre módulos. Tipos en [data-model.md](../data-model.md).

## `src/music/import/` (puro: sin DOM ni APIs del navegador; con tests)

```ts
// midi.ts
export function parseMidi(bytes: Uint8Array): MidiFile;      // lanza ImportError("unreadable")
export function midiToRaw(midi: MidiFile, fileName: string): RawPiece;

// convert.ts
export function convertPiece(raw: RawPiece): ImportCheck;     // FR-003 pasos 3–5, FR-007–FR-011
export const DURATIONS: readonly number[];                    // [0.5, 1, 1.5, 2, 3, 4]
export const HEAVY = { bars: 300, notes: 1500 };

// level.ts
export function measure(song: Omit<SongDef, "id" | "level">): Metrics;
export function suggestLevel(m: Metrics): 1 | 2 | 3 | 4;

// hash.ts
export function fnv1a64(bytes: Uint8Array): string;           // 16 hex

// errors.ts
export class ImportError extends Error { reason: RejectReason; detail?: ... }
```

Garantías:

- `convertPiece` nunca lanza: devuelve `{ ok: false, ... }` en los rechazos.
- Un `proposal.song` válido supera las mismas comprobaciones que `SONGS` en `score.test.ts`.
- Funciones deterministas: mismo archivo → misma propuesta.

## `src/import/` (navegador: lectura de archivos, XML, ZIP, IndexedDB)

```ts
// musicxml.ts
export function parseMusicXml(text: string, fileName: string): RawPiece; // DOMParser; lanza ImportError

// mxl.ts
export async function unzipMxl(bytes: Uint8Array): Promise<string>;      // texto del rootfile

// check.ts: orquesta FR-003
export const MAX_BYTES = 5 * 1024 * 1024;
export async function checkFile(file: File, signal: AbortSignal): Promise<ImportCheck & { bytes?: Uint8Array; hash?: string }>;
// tamaño → leer bytes → detectar formato (MThd | ZIP «PK» | XML) → RawPiece → convertPiece
// cede el hilo entre fases; si signal se aborta, rechaza con AbortError

// originals.ts
export async function putOriginal(id: string, bytes: Uint8Array, type: string): Promise<void>;
export async function deleteOriginal(id: string): Promise<void>;
export async function getOriginal(id: string): Promise<Uint8Array | undefined>; // para VexFlow
```

La extensión del archivo no decide el formato: se detecta por el contenido. Así un `.xml` que no es
MusicXML se rechaza como `unreadable`.

## `src/state/` (con tests)

```ts
// imported.ts
export const imported: Store<ImportedData>;                    // "tecla-imported"
export async function addImported(p: Proposal, meta: {...}, bytes: Uint8Array, opts: { title: string; level: 1|2|3|4 }): Promise<{ ok: true; id: string } | { ok: false; reason: "noSpace" }>;
export function findByHash(hash: string): ImportedSong | undefined;
export function editImported(id: string, patch: { title?: string; level?: 1|2|3|4 }): boolean;
export async function removeImported(id: string): Promise<void>; // + deleteOriginal + forgetSong

// library.ts
export function allSongs(): SongDef[];                         // SONGS, luego importadas
export function findSong(id: string): SongDef | undefined;
export function useLibrary(): SongDef[];                       // se actualiza al añadir, editar o borrar
export const isImported: (id: string) => boolean;              // id empieza por "imp-"

// progress.ts (nuevo)
export function forgetSong(id: string): void;
// store.ts (cambio): set(...) devuelve boolean
```

`addImported` recibe el original por inyección (`putOriginal`/`deleteOriginal`) para poder
probarse en `node` sin IndexedDB.

## Interfaz (`src/screens/Songs.tsx`, `src/components/ImportDialog.tsx`)

- **Canciones**, bajo la barra superior: `Importar archivo` (abre `<input type="file"
  accept=".mid,.midi,.musicxml,.xml,.mxl">`) y `Importar de servidor` (`disabled`,
  `aria-disabled`, etiqueta «Próximamente»).
- **Tarjeta de pieza importada**: etiqueta «Importada» y botón «⋯» (Popover existente) con
  «Editar» y «Borrar». Las incluidas no tienen ese botón.
- **ImportDialog** (modal; en móvil apaisado con su propio desplazamiento interno):
  - `checking`: «Comprobando el archivo…» + Cancelar.
  - `rejected`: mensaje de `RejectReason` + detalle + Aceptar.
  - `duplicate`: «Ya importaste este archivo como “X”» + Cancelar / Añadir otra copia.
  - `summary`: título (editable), nivel (1–4, sugerido marcado), una o dos manos, compás, tempo,
    compases, notas, avisos (los de simplificación con sus compases) y, si `heavy`, el aviso de
    rendimiento; Cancelar / Añadir (o «Añadir igualmente» si `heavy`).
  - `saving` → `noSpace`: «No queda espacio en este dispositivo. Borra alguna pieza importada.»
  - `edit`: título y nivel de una importada; Guardar / Cancelar.
- **Borrar**: confirmación «¿Borrar “X” y sus estrellas?».
- Al añadir: se cierra el diálogo y la lista se desplaza a la tarjeta nueva.

## Pantallas que cambian de fuente

| Pantalla | Antes | Después |
|----------|-------|---------|
| `Songs` | `SONGS` | `useLibrary()` |
| `LessonScreen` | `SONGS.find` | `findSong` |
| `Home` (Continuar) | `SONGS.find` | `findSong` |
| `Home`, `ProgressScreen` (totales) | `Object.values(best)` | solo ids de `SONGS` |

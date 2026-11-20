# Data Model: Importar canciones MIDI y MusicXML

Tipos nuevos y cambios. Las funciones que los producen están en
[contracts/import.md](contracts/import.md).

## RawPiece (neutra, en memoria)

Lo que sale de leer un archivo, antes de convertirlo. La producen el lector de MIDI
(`src/music/import/midi.ts`) y el de MusicXML (`src/import/musicxml.ts`).

| Campo | Tipo | Notas |
|-------|------|-------|
| `format` | `"midi" \| "musicxml"` | |
| `title` | `string \| undefined` | Nombre de pista (MIDI) o `work-title`/`movement-title` |
| `tempo` | `number \| undefined` | Negras por minuto, sin redondear |
| `times` | `{ at: number; beats: number; beatType: number }[]` | Compases con su pulso de inicio; vacío = 4/4 |
| `parts` | `RawPart[]` | 1 o más; las reglas de FR-008/FR-009 se aplican en la conversión |
| `notPiano` | `boolean` | Percusión o programa que no es piano |
| `ignored` | `{ grace: number; cue: number }` | Para los avisos |

**RawPart**: `{ name?: string; staff?: 1 | 2; notes: RawNote[] }`.

**RawNote**: `{ pitch: number; start: number; dur: number }`. `start` y `dur` en pulsos de negra
(números reales, sin cuantizar). Las notas ligadas ya vienen unidas.

## ImportCheck (resultado de la comprobación)

```text
ImportCheck =
  | { ok: false; reason: RejectReason; detail?: { count?: number; bars?: number[] } }
  | { ok: true; proposal: Proposal }

RejectReason = "tooLarge" | "unreadable" | "notScore" | "empty" | "notPiano"
             | "tooManyParts" | "badNotes" | "timeSignature"
```

| `reason` | Cuándo | Mensaje (resumen) |
|----------|--------|-------------------|
| `tooLarge` | > 5 MB | «El archivo pasa de 5 MB.» |
| `unreadable` | Cabecera, longitudes o XML incorrectos | «El archivo no se puede leer. Puede estar dañado o no ser MIDI ni MusicXML.» |
| `notScore` | MusicXML `opus` o `score-timewise` | «Exporta la partitura como MusicXML de una sola obra.» |
| `empty` | Sin notas | «El archivo no contiene notas.» |
| `notPiano` | Percusión o instrumento no piano | «Solo se pueden importar piezas de piano.» |
| `tooManyParts` | > 2 partes con notas | «Solo se pueden importar piezas de piano a una o dos manos.» |
| `badNotes` | Notas fuera de 21–108 o sin duración | «N notas no se pueden leer (compases …).» |
| `timeSignature` | Compás que no es 4/4 ni 3/4, o cambios | «Solo se admiten compases de 4/4 y 3/4.» |

## Proposal (lo que muestra el resumen)

| Campo | Tipo | Notas |
|-------|------|-------|
| `song` | `Omit<SongDef, "id" \| "level">` | `title`, `tempo` (40–140, paso 5), `bar`, `px`, `n` o `r`+`l` |
| `metrics` | `Metrics` | Ver abajo |
| `level` | `1 \| 2 \| 3 \| 4` | Nivel sugerido (research R5) |
| `warnings` | `Warning[]` | En el orden en que se muestran |
| `heavy` | `boolean` | > 300 compases o > 1 500 notas (FR-011) |

**Metrics**: `{ bars, notes, twoHands, accidentals, rightSpan, eighthShare, simultaneousShare }`.

**Warning**: `{ kind, bars: number[] }`, con `kind` en `"handsSplit" | "chords" |
"durations" | "cutAtBar" | "dropped" | "grace" | "farFromOriginal"`.

## ImportedSong (persistida, `localStorage` `tecla-imported`)

```text
ImportedData = { songs: ImportedSong[] }
ImportedSong = {
  def: SongDef,           // id "imp-xxxxxxxx[-n]", level "Nivel N · Importada de MIDI|MusicXML"
  source: { format: "midi" | "musicxml"; fileName: string; size: number },
  hash: string,           // FNV-1a 64 bits, 16 hex
  importedAt: number,     // ms
  warnings: Warning[],    // los que se mostraron al importar
}
```

Reglas:

- `def` cumple las reglas del repertorio: cada mano llena compases completos, las dos acaben a la
  vez, notas en 21–108 y duraciones en `{0.5, 1, 1.5, 2, 3, 4}`.
- `id` es único entre `SONGS` e importadas; empieza por `imp-` para no chocar nunca con el
  repertorio.
- `hash` repetido → duplicado (FR-015); se puede añadir otra copia con id `-2`, `-3`…
- **Editar** (FR-014) solo cambia `def.title` y el número de nivel de `def.level`; el id y las
  estrellas se conservan.

## Original (IndexedDB `tecla` → `originals`)

`{ id: string (= ImportedSong.def.id), bytes: ArrayBuffer, type: string }`. Se escribe antes que
la pieza y se borra con ella.

## Ciclo de vida

```text
archivo elegido → comprobando → rechazado
                              → duplicado? → (cancelar | otra copia) → resumen
                              → resumen → cancelar
                                        → añadir → guardar original → guardar pieza → en la lista
                                                    └ fallo ──────────┴ fallo → aviso «sin espacio», nada guardado
en la lista → editar (título, nivel)
            → borrar (confirmación) → quitar pieza, original, best[id] y last (si es esta)
```

## Cambios en lo existente

- `createStore(...).set` devuelve `boolean`: `true` si se guardó en `localStorage`. Las llamadas
  actuales lo ignoran sin cambios.
- `progress`: nueva `forgetSong(id)` que quita `best[id]` y `last` si `last.songId === id`.
- `SongDef` no cambia.

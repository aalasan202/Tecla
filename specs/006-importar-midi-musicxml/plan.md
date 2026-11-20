# Implementation Plan: Importar canciones MIDI y MusicXML

**Branch**: `006-importar-midi-musicxml` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-importar-midi-musicxml/spec.md`

## Summary

Desde Canciones, el alumno elige un archivo MIDI, MusicXML o `.mxl`. La app lo lee, comprueba y
convierte en un `SongDef` como los del repertorio, de modo que motor, partitura, digitación y
bucle no cambian. Si algo falla, explica el motivo y no añade nada. Si todo va bien, muestra un
resumen con el nivel sugerido y los avisos (simplificaciones, rendimiento) para que el alumno
añada la pieza.

- **MIDI**: parser propio y puro.
- **MusicXML**: `DOMParser` del navegador; los `.mxl` se descomprimen con
  `DecompressionStream` y un lector ZIP mínimo.
- **Conversión pura**: reparte las manos, cuantiza a corcheas, deja una nota por mano y ajusta
  las duraciones a las que se dibujan.
- **Almacenamiento**: las piezas convertidas en `localStorage`; los archivos originales en
  IndexedDB, para VexFlow más adelante.
- **Totales**: Inicio y Progreso siguen contando solo el repertorio.

Sin dependencias de producción nuevas. Detalles en [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (modo estricto)

**Primary Dependencies**: React 18, Vite 5. Sin dependencias de producción nuevas. Nueva
dependencia de desarrollo: `happy-dom`, solo para los tests de MusicXML (R3).

**Storage**: `localStorage` `tecla-imported` (piezas convertidas, vía `createStore`); IndexedDB
`tecla`/`originals` (archivos originales)

**Testing**: Vitest 2 (`npm test`, entorno `node`; `happy-dom` por archivo en `src/import/`);
verificación manual con el quickstart

**Target Platform**: últimas versiones de Chrome, Edge, Firefox y Safari (16.4+ por
`DecompressionStream`), en escritorio, tablet y móvil apaisado, también como app instalada

**Project Type**: aplicación web estática (SPA) publicada en GitHub Pages

**Performance Goals**: resumen en < 2 s para un archivo de 300 compases en un móvil de gama media
(SC-005); la respuesta a la nota en piezas importadas sigue por debajo de 50 ms (SC-006)

**Constraints**: archivos de hasta 5 MB; nada sale del dispositivo; el motor y `SongDef` no
cambian; las piezas importadas cumplen las reglas de validación del repertorio

**Scale/Scope**: unos 10 módulos nuevos pequeños (`src/music/import/`, `src/import/`,
`src/state/imported.ts` y `library.ts`), 1 componente nuevo (`ImportDialog`) y 4 pantallas
retocadas (`Songs`, `LessonScreen`, `Home`, `ProgressScreen`); decenas de piezas importadas
por dispositivo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Comprobación | Estado |
|-----------|--------------|--------|
| I. Motor separado de la interfaz | La lectura de MIDI, la conversión, el nivel y la huella son puros en `src/music/import/`. Lo que necesita el navegador (`DOMParser`, `DecompressionStream`, `File`, IndexedDB) va en un módulo propio, `src/import/`, como `audio/` y `midi/`. `src/engine/` no cambia. | ✅ |
| II. Lógica musical probada | Tests para el parser MIDI, la conversión (acordes, duraciones, barras, reparto de manos), el nivel contra las 12 piezas, la ida y vuelta del repertorio (SC-002) y los almacenes. Toda pieza importada cumple las mismas reglas que el repertorio (compases completos, notas y duraciones válidas), verificado en los tests de `convertPiece`. | ✅ |
| III. Funciona sin hardware | Una pieza importada se practica igual con el teclado en pantalla que con MIDI. Importar no usa MIDI. | ✅ |
| IV. Para quien empieza, cualquier pantalla | Mensajes en español sin jerga; resumen con nivel sugerido y avisos explicados; los tres pasos se mantienen; el diálogo funciona en móvil apaisado y en los dos temas; respeta la notación. | ✅ |
| V. Sencillez y datos en el dispositivo | Sin dependencias de producción (parser MIDI y ZIP propios y pequeños; XML y descompresión del navegador). Piezas y originales solo en el dispositivo. La regla de dominio público se refiere al repertorio incluido; lo que importa cada alumno no se publica (supuesto de la especificación). | ✅ |
| Restricciones técnicas | Mismo stack. Rutas por hash: `#leccion/imp-…` funciona porque el catálogo se lee de forma síncrona. | ✅ |
| Flujo de trabajo | `npm test` y `npm run build` antes de integrar; quickstart en escritorio y móvil. | ✅ |

**Post-design re-check**: [data-model.md](data-model.md) solo cambia de forma compatible
(`createStore.set` devuelve `boolean`, nueva `forgetSong`). Las pantallas pasan a leer las
canciones del catálogo. `happy-dom` es dependencia de desarrollo. Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/006-importar-midi-musicxml/
├── plan.md              # Este archivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── import.md        # Phase 1: módulos puros, navegador, estado e interfaz
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
src/
├── music/import/            # NUEVO · puro, con tests
│   ├── types.ts             # RawPiece, ImportCheck, Proposal, Metrics, Warning
│   ├── errors.ts            # ImportError, RejectReason
│   ├── midi.ts              # parseMidi, midiToRaw
│   ├── convert.ts           # convertPiece, DURATIONS, HEAVY
│   ├── level.ts             # measure, suggestLevel
│   ├── hash.ts              # fnv1a64
│   ├── fixtures.ts          # generadores MIDI/MusicXML desde SongDef (tests y script)
│   └── *.test.ts
├── import/                  # NUEVO · usa APIs del navegador
│   ├── musicxml.ts          # parseMusicXml (DOMParser)
│   ├── mxl.ts               # unzipMxl (ZIP + DecompressionStream)
│   ├── check.ts             # checkFile: orquesta FR-003, cede el hilo, AbortSignal
│   ├── originals.ts         # IndexedDB
│   └── *.test.ts            # @vitest-environment happy-dom
├── state/
│   ├── store.ts             # set() devuelve boolean
│   ├── progress.ts          # + forgetSong
│   ├── imported.ts          # NUEVO: almacén y alta/edición/baja
│   ├── library.ts           # NUEVO: allSongs, findSong, useLibrary, isImported
│   └── *.test.ts
├── components/
│   └── ImportDialog.tsx     # NUEVO
├── screens/
│   ├── Songs.tsx            # botones, tarjetas importadas, menú ⋯
│   ├── LessonScreen.tsx     # findSong
│   ├── Home.tsx             # findSong; totales solo del repertorio
│   └── ProgressScreen.tsx   # totales solo del repertorio
└── styles.css               # diálogo, botones de importar, etiqueta «Importada»
scripts/
└── export-fixtures.mjs      # NUEVO: archivos de prueba a dev-fixtures/ (en .gitignore)
```

**Structure Decision**: mismo proyecto único. Se añade `src/import/` como módulo de navegador
(igual que `audio/` y `midi/`) para que `src/music/` siga sin DOM, conforme al Principio I.

## Orden de trabajo sugerido

1. `store.set` → `boolean`; `forgetSong`; `library.ts` y cambio de fuente en las pantallas
   (sin importadas todavía: todo igual que hoy).
2. Tipos, `parseMidi`, `midiToRaw` y `fixtures` (MIDI) con tests.
3. `convertPiece` y `suggestLevel` con tests, incluida la ida y vuelta MIDI de las 12 piezas.
4. `parseMusicXml`, `unzipMxl` con `happy-dom`; ida y vuelta MusicXML.
5. `imported.ts`, `originals.ts`, `checkFile`.
6. `ImportDialog`, botones y tarjetas en `Songs`; editar y borrar.
7. `export-fixtures.mjs` y quickstart completo, medidas en móvil (R9).

## Complexity Tracking

Sin violaciones de la constitución. Se anotan dos decisiones que añaden algo de código:

| Decisión | Por qué | Alternativa más simple descartada porque |
|----------|---------|------------------------------------------|
| Dos almacenamientos (`localStorage` + IndexedDB) | Los originales no caben en `localStorage` (≈ 5 MB en total) y el catálogo debe leerse de forma síncrona para las rutas | Todo en IndexedDB obliga a estados de carga en 4 pantallas; todo en `localStorage` se llena con 1–2 archivos |
| Parser MIDI y lector ZIP propios | Evitan dependencias de producción (Principio V) y son pequeños y probables | `@tonejs/midi` y `fflate` resuelven lo mismo con más código del que se usa |

# Implementation Plan: Pedal de resonancia (sustain) desde el nivel 3

**Branch**: `009-pedal-sustain` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/009-pedal-sustain/spec.md`

## Summary

Las piezas ganan un campo opcional `pedal` con tramos de pedal de resonancia en pulsos. Solo se
usa si la pieza es de nivel 3 o superior: así lo decide `buildScore`, con una única regla que
vale para las incluidas y las importadas. La partitura lo dibuja como una línea con ganchos y
muescas en «V», en SVG propio alineado con `layout`. El motor solo lo usa para alargar el sonido
de las notas que toca él, así que la evaluación no cambia. El pedal del teclado MIDI del alumno
va directo al audio (`setSustain`) sin pasar por el motor. La importación lee CC 64 (MIDI) y
`<pedal>` (MusicXML). 11 de las 16 piezas de nivel 3–4 reciben pedal. Detalles en
[research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (modo estricto)

**Primary Dependencies**: React 18, Vite 5, VexFlow 5 (ya presentes); ninguna nueva

**Storage**: `localStorage` vía `createStore`: un ajuste nuevo (`pedalHelpSeen`). Las piezas
importadas guardan `pedal` dentro de su `SongDef`, sin migración (las anteriores no lo tienen).

**Testing**: Vitest 2 (`npm test`)

**Target Platform**: navegadores actuales en escritorio, tablet y móvil apaisado; PWA sin conexión; Web MIDI en Chrome/Edge

**Project Type**: aplicación web estática (SPA)

**Performance Goals**: respuesta a una nota < 50 ms sin cambios. El dibujo del pedal es una capa
SVG por pieza, de coste despreciable frente a VexFlow, y `releaseAll()` corta el sonido en ≤ 0,1 s.

**Constraints**: evaluación idéntica con y sin pedal (FR-007); piezas existentes intactas salvo
`pedal` y « · Pedal» en `level` (FR-013); sin desplazamiento vertical en móvil apaisado (SC-004)

**Scale/Scope**: 1 módulo puro nuevo (`src/music/pedal.ts` + tests) y `src/music/level.ts`;
cambios en `types.ts`, `score.ts`, `validate.ts`, `songs.ts`, `repertoire.ts`, `lesson.ts`,
`synth.ts`, `piano.ts`, `useMidi.ts`, `MidiProvider.tsx`, `App.tsx`, `ScoreView.tsx`,
`LessonScreen.tsx`, `settings.ts`, la importación (`midi.ts`, `musicxml.ts`, `convert.ts`,
`full.ts`, `types.ts`) y `Songs.tsx` (`levelOf`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Comprobación | Estado |
|-----------|--------------|--------|
| I. Motor separado de la interfaz | El pedal en datos y su lógica (`pedal.ts`, `level.ts`) son puros. El motor solo añade el callback opcional `release` a `LessonHost`. El pedal MIDI va de `src/midi` a `src/audio` por `App.tsx`, sin pasar por el motor. El dibujo vive en `ScoreView`. | ✅ |
| II. Lógica musical probada | Tests de `pedal.ts`, de la validación nueva, de la regla de nivel en `buildScore`, del motor (duración sostenida, `release`, resultado idéntico con y sin pedal, 3 estrellas) y de la importación MIDI/MusicXML. Todo el repertorio sigue pasando `validateSong` y la no regresión. | ✅ |
| III. Funciona sin hardware | El pedal no puntúa: toda la práctica se completa con el teclado en pantalla. El pedal MIDI es una mejora de sonido, y sin Web MIDI no pasa nada. | ✅ |
| IV. Para quien empieza | Explicación en español la primera vez, notación de iniciación (línea con muescas) y fila propia sin desplazamiento en móvil apaisado. Respeta el tema claro/oscuro. | ✅ |
| V. Sencillez y datos en el dispositivo | Sin dependencias nuevas (se descarta `PedalMarking` de VexFlow por sencillez, R7). Un ajuste local más. | ✅ |
| Flujo de trabajo | `npm test` y `npm run build` antes de integrar; rama `009-pedal-sustain`. | ✅ |

**Post-design re-check**: los cambios de tipos son campos opcionales (`pedal`, `release`,
`RawPiece.pedal`) y un campo derivado (`Score.pedals`). Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/009-pedal-sustain/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/pedal.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/music/
├── types.ts             # + PedalSpan, SongDef.pedal, Score.pedals
├── level.ts             # NUEVO: levelOf (movido desde Songs.tsx)
├── pedal.ts             # NUEVO: sustainedEnd, pedalMarks, clipPedals, validatePedal, fitPedals
├── pedal.test.ts        # NUEVO
├── score.ts             # Score.pedals según el nivel
├── validate.ts          # llama a validatePedal
├── songs.ts             # pedal y « · Pedal» en 7 piezas de nivel 3–4
├── repertoire.ts        # pedal y « · Pedal» en 4 piezas (largo, despedida, nochedepaz, elisa2)
├── repertoire.test.ts   # niveles 1–2 sin pedal; «Pedal» ⇔ pedal; 3 estrellas
└── import/
    ├── types.ts         # RawPiece.pedal, evento MIDI "pedal"
    ├── midi.ts          # CC 64
    ├── convert.ts       # fitPedals en la versión simplificada
    └── full.ts          # fitPedals en la versión completa
src/import/musicxml.ts   # <pedal> y <sound damper-pedal>
src/engine/lesson.ts     # sound() con sustainedEnd; release() en stop y en cada repetición
src/audio/
├── synth.ts             # setSustain, releaseAll, registro de voces del sintetizador
└── piano.ts             # liberar voces y aplazar el apagado con sustain
src/midi/
├── useMidi.ts           # CC 64 → onPedal
└── MidiProvider.tsx     # prop onPedal; false al desconectar
src/App.tsx              # <MidiProvider onPedal={setSustain}>
src/components/ScoreView.tsx   # fila de pedal en la geometría y capa SVG
src/screens/LessonScreen.tsx   # host.release; explicación de primera vez
src/screens/Songs.tsx          # importa levelOf de music/level
src/state/settings.ts          # pedalHelpSeen
```

**Structure Decision**: la lógica del pedal se concentra en `src/music/pedal.ts`, pura y
probada, y el resto de módulos solo la llaman. El audio y el MIDI se conectan en `App.tsx`,
como el resto de inyecciones, para no acoplar `src/midi` con `src/audio`.

## Complexity Tracking

Sin desviaciones de la constitución que justificar.

En el bucle se recortan al fragmento tanto el sonido como la línea de pedal (research R8,
`clipPedals`).

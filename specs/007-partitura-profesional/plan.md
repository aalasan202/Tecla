# Implementation Plan: Partitura profesional (acordes, ligaduras y armaduras)

**Branch**: `007-partitura-profesional` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-partitura-profesional/spec.md`

## Summary

La partitura de la lección pasa a dibujarse con VexFlow para todas las piezas (FR-021), con
acordes, armaduras, ligaduras de prolongación y de expresión, semicorcheas, tresillos y 6/8.

- **La música sigue siendo pura y probada**: la pieza se amplía de forma compatible (acordes como
  arrays, opciones por evento, `key`, `time`); `buildScore` une las notas ligadas y da a cada
  acorde un `unit`; tres módulos nuevos sin DOM deciden la ortografía (`spelling.ts`), las figuras
  (`engrave.ts`) y las posiciones (`layout.ts`).
- **VexFlow solo dibuja**: `ScoreView` sustituye a `Staff` con la misma interfaz; carga VexFlow
  aparte (no engorda Inicio ni Canciones) y aplica las marcas de color sin redibujar.
- **El motor cambia poco**: el cursor usa `layout.xAt`, el metrónomo cuenta pulsos (6/8), el
  margen de acierto se recorta bajo la corchea y la puntuación cuenta cada acorde como una unidad.
  Las 12 piezas actuales puntúan exactamente igual.
- **Importadas**: nueva conversión completa desde el original; el alumno elige versión por pieza
  y cada una guarda sus estrellas (id `<id>.full`).

Nueva dependencia de producción: `vexflow@5.0.0` (research R1). Detalles en
[research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (modo estricto)

**Primary Dependencies**: React 18, Vite 5; **nueva**: `vexflow` 5.0.0 (MIT), cargada con
`import()` dinámico en la lección

**Storage**: sin cambios de almacenamiento; `tecla-imported` gana los campos `full` y `version`
(compatibles); las estrellas de la versión completa usan la clave `<id>.full` en `tecla-progress`

**Testing**: Vitest 2 (`npm test`, entorno `node`) para `src/music/`, `src/engine/`, `src/state/`
y la importación; verificación visual manual con el quickstart (VexFlow necesita `<canvas>`)

**Target Platform**: últimas versiones de Chrome, Edge, Firefox y Safari, en escritorio, tablet y
móvil apaisado, también instalada y sin conexión

**Project Type**: aplicación web estática (SPA) publicada en GitHub Pages

**Performance Goals**: partitura visible en < 1 s (100 compases) y < 2 s (300 compases) en móvil
de gama media (SC-004); respuesta a la nota < 50 ms y cursor fluido (SC-005)

**Constraints**: el motor no depende de VexFlow ni del DOM (Principio I); las 12 piezas no se
reescriben y puntúan igual (FR-013, FR-015); funciona sin conexión (FR-007); el bundle principal
no crece por VexFlow

**Scale/Scope**: 3 módulos puros nuevos (`spelling`, `engrave`, `layout`), 1 de importación
(`full.ts`), 1 componente que sustituye a otro (`ScoreView` por `Staff`), cambios acotados en
`score.ts`, `fingering.ts`, `lesson.ts`, `theory.ts`, `imported.ts`, `library.ts`, `Songs`,
`ImportDialog`, `ImportedSongDialog` y `LessonScreen`; 3 piezas nuevas en el repertorio

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Comprobación | Estado |
|-----------|--------------|--------|
| I. Motor separado de la interfaz | Ortografía, grabado, posiciones, digitación y conversión completa son puros en `src/music/`. VexFlow solo se importa en `src/components/ScoreView.tsx`. `LessonHost` no cambia; el motor solo lee datos nuevos de `Score` (`pulse`, `layout.xAt`, `unit`, `win`). | ✅ |
| II. Lógica musical probada | Tests para `spelling`, `engrave`, `layout`, digitación de acordes, motor (acordes, márgenes, 6/8, ligadas en bucle), `convertFull` y validación ampliada del repertorio. Test de no regresión que fija notas, dedos y puntuación de las 12 piezas antes del cambio. | ✅ |
| III. Funciona sin hardware | Los acordes se pueden tocar nota a nota con el ratón (Aprender acumula; Tocar admite cada nota dentro de su margen). El teclado en pantalla y MIDI siguen dando los mismos eventos. | ✅ |
| IV. Para quien empieza, cualquier pantalla | Nombres de nota con la ortografía y la notación de Ajustes; dedos en acordes; tres pasos sin cambios; partitura en móvil apaisado sin desplazar la página y con el tema oscuro (verificación manual, quickstart §3.8). | ✅ |
| V. Sencillez y datos en el dispositivo | **Nueva dependencia de producción**, justificada en research R1 y en *Complexity Tracking*. Datos solo en el dispositivo. Piezas nuevas de dominio público. | ⚠️ justificada |
| Restricciones técnicas | Mismo stack; rutas `#leccion/imp-….full` funcionan con el catálogo síncrono; el chunk de VexFlow entra en el precache del service worker. | ✅ |
| Flujo de trabajo | `npm test` y `npm run build` antes de integrar; quickstart en escritorio y móvil. | ✅ |

**Post-design re-check**: el diseño de [data-model.md](data-model.md) amplía `SongDef`, `Score` e
`ImportedSong` solo con campos opcionales o derivados; `LessonHost`, `StaffHandle` y las props de
la partitura se mantienen (más `onReady` opcional). La dependencia queda confinada a un
componente y a un chunk aparte. Sin violaciones no justificadas.

## Project Structure

### Documentation (this feature)

```text
specs/007-partitura-profesional/
├── plan.md              # Este archivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── score.md         # Phase 1: música pura, motor, vista, importación y estado
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
src/
├── music/
│   ├── types.ts             # Track/Event, SongDef.key/keyChanges/time, Score.pulse/keys/layout, ScoreNote.unit/win/spell
│   ├── score.ts             # buildScore: ticks, acordes, ligadas unidas, unit, win, layout
│   ├── spelling.ts          # NUEVO: spell, noteLabel, accidentals
│   ├── engrave.ts           # NUEVO: figuras por compás (ligaduras, tresillos, barras, 6/8)
│   ├── layout.ts            # NUEVO: posiciones, xAt, measureAt
│   ├── fingering.ts         # por eventos; acordes
│   ├── theory.ts            # nombres desde la ortografía
│   ├── songs.ts             # Minueto con key: 1; 3 piezas nuevas
│   ├── import/
│   │   ├── full.ts          # NUEVO: convertFull
│   │   ├── convert.ts       # 6/8 en la simplificada
│   │   ├── midi.ts          # FF 59 → keys
│   │   ├── level.ts         # reglas de la versión completa
│   │   ├── fixtures.ts      # generadores con acordes, ligaduras, armadura, tresillos, 6/8
│   │   └── types.ts         # RawNote.spell, RawPiece.keys, ImportedSong.full/version
│   └── *.test.ts
├── import/
│   └── musicxml.ts          # <key>, <alter>, 6/8
├── engine/
│   └── lesson.ts            # pulse, xAt, win, puntuación por unit
├── state/
│   ├── imported.ts          # ensureFull, setVersion; borrar/editar con dos versiones
│   └── library.ts           # versión elegida; resolveSongId
├── components/
│   ├── ScoreView.tsx        # NUEVO: VexFlow + marcas + nombres/dedos + cursor + bucle
│   ├── Staff.tsx            # SE BORRA al final (FR-021)
│   ├── ImportDialog.tsx     # selector de versión en el resumen
│   └── ImportedSongDialog.tsx # cambiar de versión
├── screens/
│   ├── LessonScreen.tsx     # ScoreView, onReady, etiqueta de tempo en 6/8
│   ├── Songs.tsx            # estrellas de la versión elegida
│   └── Home.tsx             # «Continuar» con resolveSongId
└── styles.css               # .vf-* con variables del tema; marcas; «Cargando partitura…»
scripts/
└── export-fixtures.mjs      # piezas nuevas y de prueba
```

`MiniStaff.tsx` (dibujo decorativo de Inicio) no cambia: solo pinta notas sueltas de la derecha.

**Structure Decision**: mismo proyecto único. La música se queda en `src/music/` (pura) y la
única pieza que conoce VexFlow es `ScoreView`, igual que `audio/` encapsula Web Audio.

## Orden de trabajo sugerido

1. **Red de seguridad**: test de no regresión con notas, dedos y puntuación actuales de las 12
   piezas.
2. **Prueba de VexFlow** (research R2): un compás con acorde en segunda, alteraciones y tresillo
   colocado con `x` propias; si falla, alternativa de R2.
3. Tipos ampliados, ticks, acordes, ligadas, `unit`, `win` y validación del repertorio.
4. `spelling.ts` y `layout.ts`; motor con `xAt`, `pulse`, `win` y puntuación por `unit`.
5. `engrave.ts` (ligaduras, barras, tresillos, 6/8).
6. `ScoreView` con las 12 piezas (historia 4) y luego las nuevas; borrar `Staff`.
7. Digitación de acordes; piezas nuevas del repertorio.
8. Importación: armadura y ortografía en la lectura, `convertFull`, versiones en estado e interfaz.
9. Quickstart completo, medidas en móvil (SC-004, SC-005) y decisión sobre dibujo por tramos.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Dependencia de producción `vexflow` (≈ 389 KB gzip, chunk aparte) | Grabado correcto de acordes con segundas, armaduras, alteraciones, ligaduras, tresillos, barras y 6/8 (SC-003) | El dibujo propio exigiría reimplementar colocación y colisiones de un motor de grabado; OSMD y Verovio son más pesados y dan menos control (research R1) |
| Posiciones propias en lugar del formateo de VexFlow | Cursor a velocidad constante y posiciones puras que comparten motor y vista | Leer las posiciones de VexFlow obliga a dibujar antes de saber dónde está cada pulso y no se prueba sin navegador; queda como alternativa si falla la prueba del paso 2 |
| Dos versiones por pieza importada | Decisión del usuario (Q2): elegir simplificada o completa, cada una con sus estrellas | Sustituir automáticamente cambiaría el nivel y las estrellas sin avisar |

# Implementation Plan: Ruta de aprendizaje (Curso) para los niveles 1–2

**Branch**: `010-ruta-aprendizaje` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-ruta-aprendizaje/spec.md`

## Summary

Se añade un **Curso** de 3 unidades con tres tipos de elemento:

- 14 lecciones (lectura, ritmo, posiciones y acordes);
- 7 piezas‑hito del repertorio;
- 13 consejos ilustrados.

**Contenido y lógica.** Todo es de datos y lógica puros en `src/course/`. Los ejercicios son
`SongDef` cortos que ejecuta el motor `Lesson` de siempre, con dos opciones nuevas:

- `rhythm`: cualquier tecla vale; solo cuenta el momento.
- `chordSpread`: ventana para completar un acorde, de 0,15 s con MIDI o táctil y de 1,5 s con
  ratón.

**Avance.** El estado del mapa (bloqueado, disponible, superado, opcional o visto) es una función
pura del progreso:

- Las estrellas de las lecciones van en un almacén nuevo, `tecla-course`.
- Las de los hitos se leen de `progress.best`, compartidas con Canciones.

**Pantallas.** La parte de práctica de `LessonScreen` se extrae a un componente `Practice`, que
usan Canciones, los hitos y los ejercicios. Además:

- Las explicaciones tienen teclado libre y mini partitura que se puede escuchar.
- Las ilustraciones son SVG en línea con los colores del tema.
- Inicio y Progreso muestran el Curso aparte.
- «Continuar» elige entre el Curso y Canciones según qué se practicó después.

Detalles en [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (modo estricto)

**Primary Dependencies**: React 18, Vite 5, VexFlow 5 (ya presentes). Ninguna nueva.

**Storage**: `localStorage` vía `createStore`, con un almacén nuevo `tecla-course`
(`best`, `seen`, `skipped`, `last`). No hace falta migrar nada: `progress` y `settings` no
cambian.

**Testing**: Vitest 2 (`npm test`)

**Target Platform**: navegadores actuales en escritorio, tablet y móvil apaisado. PWA sin
conexión. Web MIDI en Chrome y Edge.

**Project Type**: aplicación web estática (SPA)

**Performance Goals**:

- La respuesta a una nota sigue por debajo de 50 ms: las opciones nuevas del motor solo cambian
  la comparación en `inputPlay`.
- `pathState` recorre unos 35 elementos en cada render, un coste despreciable.
- Las ilustraciones pesan menos de 4 KB cada una.

**Constraints**:

- Sin las opciones nuevas, el motor se comporta igual (las pruebas actuales sin cambios).
- Canciones no cambia de aspecto (FR-023). Su único cambio de comportamiento es el margen de
  acordes en las piezas con acordes (FR-014a, R5).
- `repertoireStars` no cambia (FR-037).
- Los ejercicios caben sin desplazamiento en móvil apaisado (FR-032).
- Los textos tienen límites de palabras (FR-007, FR-024).

**Scale/Scope**:

- **Nuevo**: `src/course/` (6 módulos con tests), `src/state/course.ts`, 4 pantallas, 3
  componentes y 7 ilustraciones.
- **Cambios**: `lesson.ts`, `types.ts`, `validate.ts`, `router.ts`, `App.tsx`, `Keyboard.tsx`,
  `LessonScreen.tsx` (extracción de `Practice`), `Home.tsx`, `ProgressScreen.tsx`,
  `SettingsScreen.tsx`, `Icons.tsx` y `styles.css`.
- **Contenido**: 14 lecciones (unas 20 pantallas de explicación y 14 ejercicios), 6 ejercicios de
  prueba de nivel y 13 consejos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Comprobación | Estado |
|-----------|--------------|--------|
| I. Motor separado de la interfaz | `src/course/` es puro: datos, `pathState`, `renderText` y las comprobaciones. El motor recibe `rhythm`, `chordSpread` y el origen de la pulsación como datos, sin DOM. El `pointerType` se lee en `Keyboard`. El indicador de pulso usa el `click()` que ya existe en `LessonHost`. | ✅ |
| II. Lógica musical probada | Hay tests de `pathState` (tabla de casos), `renderText`, las comprobaciones de estructura, el almacén `course` y el motor (ritmo y acordes, más la no regresión sin opciones). Cada ejercicio pasa `validateSong`. Las comprobaciones de `checks.ts` se ejecutan en `npm test`. | ✅ |
| III. Funciona sin hardware | Todo ejercicio se completa con el teclado en pantalla. Los acordes con ratón se aceptan en notas seguidas (R5), también en las piezas del repertorio con acordes, que antes no se podían tocar a tempo con ratón (FR-014a). El ritmo se toca con cualquier tecla. Sin MIDI no cambia nada. | ✅ |
| IV. Para quien empieza | Explicaciones breves en español, que respetan la notación (`renderText`), los nombres de nota, los dedos y el tema. Los ejercicios usan la disposición compacta en móvil apaisado. Los ejercicios con notas siguen Escuchar, Aprender y Tocar; los de ritmo, Escuchar y Tocar (lo justifica la sección de complejidad). | ✅ |
| V. Sencillez y datos en el dispositivo | Sin dependencias nuevas. Contenido en el código, ilustraciones en SVG en línea y progreso en `localStorage`. Los textos y dibujos son propios, sin materiales con derechos. | ✅ |
| Flujo de trabajo | `npm test` y `npm run build` antes de integrar, en la rama `010-ruta-aprendizaje`. | ✅ |

**Post-design re-check**:

- Los cambios de tipos son opcionales: `SongDef.kind`, `LessonOptions.rhythm` y `chordSpread`,
  y el argumento `via` de `input`.
- La extracción de `Practice` no cambia lo que se ve en Canciones. Las piezas con acordes ganan
  el margen de FR-014a.
- No hay violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/010-ruta-aprendizaje/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/course.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/course/                      # NUEVO: puro, sin React ni navegador
├── types.ts                     # Block, Unit, PathItem, Lesson, ExplainPage, Tip, CourseProgress, PathState
├── exercises.ts                 # ejercicios de lección y de prueba (SongDef con kind)
├── tips.ts                      # 13 consejos (texto, nivel, art)
├── content.ts                   # COURSE: 3 unidades con lecciones, hitos y consejos en orden
├── path.ts                      # pathState, findItem, courseStars, testOutcome
├── text.ts                      # renderText (marcas {60} / {C} según la notación)
├── checks.ts                    # comprobaciones de estructura (FR-034, FR-035)
├── path.test.ts
├── text.test.ts
└── checks.test.ts
src/state/
├── course.ts                    # NUEVO: almacén tecla-course y sus acciones
└── course.test.ts               # NUEVO
src/music/
├── types.ts                     # + SongDef.kind
└── validate.ts                  # kind "rhythm" ⇒ 4/4
src/engine/
├── lesson.ts                    # LessonOptions.rhythm / chordSpread; input(m, via?)
└── lesson.test.ts               # + ritmo, acordes, no regresión
src/components/
├── Practice.tsx                 # NUEVO: práctica extraída de LessonView (partitura, teclado, pasos, tempo)
├── ExplainPage.tsx              # NUEVO: texto + ScoreView de solo lectura + teclado libre
├── BeatIndicator.tsx            # NUEVO: indicador visual del pulso
├── illustrations/               # NUEVO: 7 SVG en línea con colores del tema
│   ├── Posture.tsx, HandShape.tsx, FingerNumbers.tsx, FindC.tsx,
│   └── ArmWeight.tsx, ArmJump.tsx, EyesOnScore.tsx, index.ts
├── Keyboard.tsx                 # onPress(m, via) con pointerType
└── Icons.tsx                    # iconos para consejos sin ilustración y para el Curso
src/screens/
├── CourseMap.tsx                # NUEVO: mapa de unidades y estados, prueba de nivel por unidad
├── CourseLesson.tsx             # NUEVO: explicación (1–2 páginas) → Practice
├── CourseTip.tsx                # NUEVO: ficha + «Entendido»
├── CourseTest.tsx               # NUEVO: ejercicios seguidos y resultado
├── LessonScreen.tsx             # usa Practice; prop back (hito desde el Curso)
├── Home.tsx                     # tarjeta Curso; Continuar Curso o Canciones
├── ProgressScreen.tsx           # estadística y lista del Curso aparte
└── SettingsScreen.tsx           # Borrar el progreso también vacía el Curso
src/router.ts                    # rutas course, courseItem, courseTest
src/App.tsx                      # nuevas pantallas
src/styles.css                   # mapa, fichas, explicación, indicador de pulso
```

**Structure Decision**:

- El Curso es una capa de contenido y avance sobre lo que ya existe: los datos y las reglas van
  en `src/course/` (puros y probados) y la vista en `screens/` y `components/`.
- El único cambio de comportamiento compartido está en el motor (dos opciones) y en `Keyboard`
  (el origen de la pulsación). `rhythm` solo se usa en el Curso. `chordSpread` se activa en toda
  pieza con acordes (FR-014a), y las piezas sin acordes de Canciones no cambian.

## Fases de implementación (orientativas para `/speckit-tasks`)

1. **Base (bloquea el resto)**: tipos del curso, almacén `course`, rutas y la extracción de
   `Practice`, comprobando que Canciones queda igual.
2. **Historias 1 y 2 (P1)**:
   - `pathState` con sus tests y `renderText`;
   - mapa, lección con explicación, ficha de consejo;
   - contenido de la Unidad 1 y sus 4 ilustraciones (postura, forma de la mano, números de los
     dedos, encontrar el Do), más «tocar sin golpear».
3. **Historia 3 (P2)**: opción `rhythm` en el motor con sus tests, indicador de pulso y lecciones
   de ritmo.
4. **Historia 4 (P2)**: `chordSpread` y `via` con sus tests, `Keyboard` con `pointerType` y la
   Unidad 3 (clave de fa y acordes).
5. **Historia 5 (P2)**: hitos con `LessonScreen` y `back` hacia el Curso, regla de frontera y
   opcionales, y contenido de la Unidad 2 con sus 2 ilustraciones (saltar con el brazo, ojos en
   la partitura).
6. **Historia 6 (P3)**: prueba de nivel (ejercicios, pantalla, `testOutcome`, `skipped`).
7. **Historia 7 (P3) y totales**: tarjeta en Inicio, «Continuar», Progreso y el borrado en
   Ajustes.
8. **Cierre**: `checks.ts` completo, revisión de textos, verificación manual
   ([quickstart.md](quickstart.md)) y hoja de ruta.

## Complexity Tracking

| Desviación | Por qué hace falta | Alternativa más simple descartada porque |
|------------|--------------------|------------------------------------------|
| Los ejercicios de ritmo no tienen paso Aprender (Principio IV: «cada pieza sigue los tres pasos») | Aprender espera a la **altura** correcta, y en ritmo la altura no importa y el tiempo es lo único que se evalúa. Un Aprender sin tempo no enseña nada de ritmo. | Un Aprender que solo pide «pulsa cualquier tecla» sin tempo es un paso vacío que confunde. Los ejercicios no son piezas del repertorio, que siguen con sus tres pasos. |
| La prueba de nivel ofrece solo Escuchar y Tocar (Principio IV) | Es una evaluación, no una práctica: Aprender no da estrellas que cuenten. Los mismos contenidos se practican con los tres pasos en las lecciones. | Ofrecer Aprender en la prueba alarga la evaluación sin cambiar su resultado. |
| Opción del motor que depende del origen de la pulsación (`via`) | Solo así se distingue «tres dedos a la vez» (MIDI o táctil) de «tres clics» (ratón), como pide FR-013/FR-014. | Una ventana única de 1,5 s aceptaría acordes arpegiados con MIDI, y detectar el ratón con `matchMedia` falla en dispositivos híbridos (R5). |

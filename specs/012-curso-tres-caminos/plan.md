# Implementation Plan: Curso en tres caminos y técnica (niveles 1–4)

**Branch**: `012-curso-tres-caminos` | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/012-curso-tres-caminos/spec.md`

## Summary

El Curso deja de ser una lista lineal de unidades y pasa a **4 niveles**, cada uno con tres
caminos: Lecciones, Técnica y Canciones.

**Contenido.** Las unidades actuales se reparten: la U1 es el nivel 1 y la U2 y la U3 forman el
nivel 2. Los niveles 3 y 4 tienen contenido nuevo. Los ids de 010 se conservan.

**Estado y recomendación.** Son funciones puras sobre el progreso de siempre, que gana dos
campos opcionales (`tests` y `recent`); no hay migración.

- Un nivel se abre con las lecciones del anterior en 2★ o con su prueba.
- Dentro de un nivel, todo está libre.
- «Siguiente recomendado» aplica reglas deterministas: nada que exija MIDI si no lo hay,
  alternar caminos y preferir lo pendiente del nivel más alto.

**Técnica.**

- **Escalas**: se generan desde una tabla de tonalidades y digitaciones estándar. Usan un dedo
  explícito por nota (cambio mínimo en `src/music/`) y siguen el flujo de lección: explicación
  del paso del pulgar, ejercicio y tres tempos.
- **Independencia de manos**: ejercicios a dos manos que exigen MIDI. `Practice` lo hace cumplir
  según la constitución 1.1.0.

Decisiones en [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (modo estricto)

**Primary Dependencies**: React 18, Vite 5 y VexFlow 5 (ya presentes). Ninguna nueva.

**Storage**: `localStorage` vía `createStore`. `tecla-course` gana dos campos opcionales,
`tests` y `recent`, y las estrellas por tempo de cada escala (`best["<id>@<i>"]`). No hay
migración (research R3).

**Testing**: Vitest (`npm test`)

**Target Platform**: navegadores actuales en escritorio, tablet y móvil apaisado; PWA sin
conexión. Web MIDI en Chrome y Edge, obligatorio solo para la independencia de manos.

**Project Type**: aplicación web estática (SPA)

**Performance Goals**:

- `courseState` y `recommend` recorren unos 120 elementos por render: coste despreciable.
- La respuesta a una nota sigue por debajo de 50 ms (el motor no cambia).

**Constraints**:

- Los ids existentes son estables.
- Sin MIDI, todos los niveles se pueden abrir (SC-003).
- Una escala de una octava cabe en el teclado en pantalla en móvil apaisado.

**Scale/Scope**:

- Contenido: 4 niveles, unas 24 lecciones (14 actuales y 8–12 nuevas), unos 20 consejos,
  14 escalas (7 tonalidades × 2 manos), al menos 6 ejercicios de independencia más 2 escalas a
  dos manos, y 3 pruebas.
- Interfaz: 1 pantalla rehecha (mapa del Curso), 3 adaptadas (`CourseItem`, `CourseLesson`,
  `Home`) y 3 props nuevas en `Practice`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumple | Cómo |
|-----------|--------|------|
| I. Motor separado de la interfaz | ✅ | El motor `Lesson` no cambia. `courseState`, `recommend` y `scale` son puros y están en `src/course/`. El cambio en `src/music/` (dedo explícito) no toca el navegador. El estado MIDI entra como argumento (`midiOk`). |
| II. Lógica musical probada | ✅ | Tests nuevos para `scales` (notas, armadura y dedos de las 7 tonalidades × 2 manos), `buildScore` con `f`, `courseState` (apertura de niveles, datos antiguos, MIDI), `recommend` (reglas y SC-004), `checkCourse` (mínimos), y `validateSong` de los ejercicios de independencia y de las pruebas nuevas. |
| III. Funciona sin hardware | ✅ con excepción 1.1.0 | Lecciones, escalas por mano y canciones funcionan con el teclado en pantalla. La independencia de manos (y las escalas a dos manos del nivel 4) exigen MIDI: se ven y se escuchan, avisan, no bloquean el avance y la recomendación no las propone sin MIDI. Es exactamente la excepción aprobada. |
| IV. Para quien empieza, en cualquier pantalla | ✅ | «Siguiente recomendado» con motivo, orden sugerido en cada camino, textos en español, notación y tema respetados, escalas de una octava que caben en móvil apaisado. |
| V. Sencillez y datos en el dispositivo | ✅ | Sin dependencias. Escalas generadas en lugar de escritas. Estado derivado sin migración. Repertorio de dominio público ya existente. |
| Rutas por hash | ✅ | `#curso/nivel/<n>/<camino>`, `#curso/prueba/<n>` (compatible con `u2`). |

**Post-design re-check (tras la Fase 1)**: sin desviaciones. Requisito previo: la enmienda 1.1.0
de la constitución debe estar en `main` antes de integrar esta funcionalidad.

## Project Structure

### Documentation (this feature)

```text
specs/012-curso-tres-caminos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── course.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── music/
│   ├── types.ts               # EventOpts.f
│   ├── score.ts               # respeta f; assignFingering solo para notas sin f
│   └── score.test.ts          # + casos de dedo explícito
├── course/
│   ├── types.ts               # Level, CourseItem, ScaleSpec, CourseState, Path, Recommendation
│   ├── content.ts             # LEVELS: U1→N1, U2+U3→N2, N3 y N4 nuevos
│   ├── tips.ts                # + consejos de los niveles 3–4
│   ├── exercises.ts           # + ejercicios de lecciones nuevas y pruebas N3/N4 (TEST_U2 = prueba N2)
│   ├── scales.ts              # NUEVO: tabla, scale(), thumbPasses(), tempoStep()
│   ├── scales.test.ts         # NUEVO
│   ├── independence.ts        # NUEVO: ejercicios a dos manos por nivel
│   ├── independence.test.ts   # NUEVO (validateSong, dos manos, nivel)
│   ├── state.ts               # NUEVO: courseState, findItem, courseStars, testOutcome, continueTarget (sustituye path.ts)
│   ├── state.test.ts          # NUEVO (incluye datos antiguos de 010)
│   ├── recommend.ts           # NUEVO
│   ├── recommend.test.ts      # NUEVO
│   └── checks.ts / checks.test.ts  # mínimos por nivel
├── state/
│   ├── course.ts              # touchCourse + recent, recordScaleStars, markLevelTest
│   ├── course.test.ts
│   └── useCourse.ts           # levels + midiOk
├── components/
│   └── Practice.tsx           # forceFingers, needsMidi, initialTempo, tempo en onPlayResult
├── screens/
│   ├── CourseMap.tsx          # niveles + caminos + recomendado
│   ├── CourseItem.tsx         # nuevos tipos de elemento
│   ├── CourseLesson.tsx       # admite escala (explicación generada + tempos)
│   ├── CourseTest.tsx         # por nivel; markLevelTest
│   ├── Home.tsx               # tarjeta del Curso por nivel; Continuar = recomendado
│   ├── ProgressScreen.tsx     # pestaña Piezas: Curso por niveles
│   └── PieceHistory.tsx       # destinos de escalas/independencia
├── router.ts                  # rutas de nivel/camino y prueba por nivel
└── styles.css                 # selector de niveles, pestañas de camino, aviso MIDI
```

**Structure Decision**: es la estructura única del proyecto. La lógica pura nueva vive en
`src/course/` (como en 010), el único cambio en `src/music/` es el dedo explícito, y la interfaz
se adapta en `src/screens/` y `Practice`. `path.ts` se sustituye por `state.ts`, porque cambia
el modelo (de unidades a niveles); sus funciones que siguen igual se mueven sin cambios.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Ejercicios que exigen MIDI (Principio III) | Con ratón o pantalla no se pueden pulsar dos teclas a la vez con independencia real | Enmienda 1.1.0 aprobada para este caso; las alternativas (una mano la toca la app) no entrenan la independencia |

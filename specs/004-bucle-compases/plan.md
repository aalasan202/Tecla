# Implementation Plan: Bucle de compases

**Branch**: `004-bucle-compases` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-bucle-compases/spec.md`

## Summary

Permitir marcar un fragmento de compases en la partitura y repetirlo indefinidamente en
Escuchar, Aprender (libre y «A tempo») y Tocar. El motor (`Lesson`) recibe una opción
`loop: { from, to }` y, con ella, limita las notas a `[start, end)` y traduce su reloj a una
posición local que vuelve al inicio; en Tocar intercala un compás de descanso con metrónomo
entre repeticiones. Cada repetición se puntúa con el criterio actual, y al parar se muestra un
resumen sin tocar las estrellas ni el progreso de la pieza. La selección (dos toques + ±1
compás) es lógica pura probada en `src/engine/fragment.ts`; la partitura solo traduce el toque
a un número de compás y resalta el rango. Ver [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (modo estricto)

**Primary Dependencies**: React 18, Vite 5 (sin dependencias nuevas)

**Storage**: ninguno nuevo; `progress` solo recibe tiempo practicado (`addPractice`)

**Testing**: Vitest 2 (`npm test`), host falso con reloj controlado y temporizadores falsos

**Target Platform**: navegadores actuales (Chrome, Edge, Firefox, Safari); escritorio, tablet
y móvil en horizontal

**Project Type**: aplicación web estática (SPA) publicada en GitHub Pages

**Performance Goals**: salto al inicio sin pérdida de pulso (±5 % de un pulso, SC-003); cursor
a 60 fps; respuesta a la nota < 50 ms (constitución)

**Constraints**: el motor no accede al DOM; sin `options.loop` todo es idéntico a hoy; sin
cambios en el formato de canciones, ajustes ni datos guardados; sin API de audio nueva

**Scale/Scope**: 1 módulo de motor + 1 módulo puro nuevo, 1 función de partitura, 1 componente,
1 pantalla; 12 canciones existentes (4/4 y 3/4)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Comprobación | Estado |
|-----------|--------------|--------|
| I. Motor separado de la interfaz | Repetición, límites, puntuación y metrónomo en `lesson.ts` vía `LessonHost` sin callbacks nuevos; selección en `fragment.ts` (puro); `Staff` solo convierte el toque en compás. El corte de sonido se resuelve con la duración que ya pasa el motor (R2), sin tocar `src/audio/`. | ✅ |
| II. Lógica musical probada | Tests nuevos para `fragment.ts`, `measureAt` y cada escenario del bucle en `lesson.test.ts` (ver [quickstart.md](quickstart.md)); los existentes no se modifican. | ✅ |
| III. Funciona sin hardware | Las notas siguen entrando por `Lesson.input(m)`; el fragmento se marca con ratón o toque, sin depender del MIDI. | ✅ |
| IV. Para quien empieza, cualquier pantalla | Textos en español que guían la selección; los tres pasos se conservan; validación en móvil apaisado (quickstart, paso 12). | ✅ |
| V. Sencillez y datos en el dispositivo | Sin dependencias; sin datos persistentes nuevos; opción en lugar de modo nuevo; se reutilizan los caminos actuales de Aprender y el reloj de Escuchar/Tocar. | ✅ |
| Restricciones técnicas | Stack actual; reloj continuo para no perder el pulso. | ✅ |
| Flujo de trabajo | `npm test` y `npm run build` antes de integrar. | ✅ |

**Post-design re-check**: [data-model.md](data-model.md) y
[contracts/lesson-engine.md](contracts/lesson-engine.md) mantienen los cambios aditivos, sin
callbacks nuevos en `LessonHost` y sin datos persistentes nuevos. Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/004-bucle-compases/
├── plan.md              # Este archivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── lesson-engine.md # Phase 1: motor, selección, partitura y pantalla
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
src/
├── engine/
│   ├── lesson.ts           # LoopRange, LoopSummary, options.loop, reloj local, repeticiones
│   ├── lesson.test.ts      # tests del bucle en los tres pasos
│   ├── fragment.ts         # NUEVO: selección del fragmento (tapMeasure, nudge, rangeOf…)
│   └── fragment.test.ts    # NUEVO
├── music/
│   ├── score.ts            # measureAt(score, x)
│   └── score.test.ts       # tests de measureAt
├── components/
│   └── Staff.tsx           # props loop y onMeasure: resaltado y toque de compás
├── screens/
│   └── LessonScreen.tsx    # casilla Bucle, rango y ±1, resumen al parar, sin recordStars
└── styles.css              # estilo del resaltado del fragmento y de los botones ±1
```

**Structure Decision**: proyecto único existente (SPA en `src/`). La lógica nueva va al motor
y a un módulo puro hermano; la interfaz solo añade controles y el resaltado.

### Enfoque de implementación (resumen)

1. **Selección pura** (`fragment.ts` + tests) y `measureAt` (+ tests): sin dependencias del
   resto; pueden hacerse primero.
2. **Motor — límites**: calcular `start`, `end`, `L`, `P` en el constructor; `active()` y el
   sonido de automáticas filtran por `[start, end)`; duración recortada (R2).
3. **Motor — Aprender**: en `start()` y al completar el último grupo (libre) o al pasar `end`
   («A tempo»), cerrar repetición (resultado, limpiar marcas y estado de notas) y volver al
   inicio en lugar de `complete()` (R5).
4. **Motor — Escuchar/Tocar**: `loop()` traduce `beat()` a `(k, local)`; posición, sonido,
   metrónomo, juicio de fallos y estado usan `local`; descanso en Tocar; cierre de repetición
   en `L + HIT_WINDOW + 0.15`; `inputPlay` con desplazamiento a la repetición siguiente (R3, R4).
5. **Motor — resumen y vacío**: `loopSummary()`; `start()` sin notas activas no arranca (R6, R7).
6. **Partitura**: rectángulo de fondo del fragmento y manejador de clic con `measureAt`.
7. **Pantalla**: estado `FragmentSelection`, casilla Bucle, rango y botones ±1, mensajes de
   guía, `options.loop` en el efecto, resumen al parar, y nada de `recordStars`/`recordSession`
   con bucle (R6, R8, R9).
8. **Verificación**: quickstart completo, incluido móvil apaisado.

## Complexity Tracking

Sin violaciones de la constitución; no aplica.

# Implementation Plan: Aprender con espera a tempo

**Branch**: `001-aprender-espera-tempo` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-aprender-espera-tempo/spec.md`

## Summary

Añadir al paso Aprender una opción «A tempo»: la partitura avanza al ritmo de la pieza y se
detiene sobre la siguiente nota del alumno hasta que la toca. Se implementa en el motor
(`Lesson`) como una variante de Aprender con un **reloj musical virtual** que avanza cada
fotograma y se limita al pulso de la primera nota pendiente; detenerse, reanudar y cambiar el
tempo salen gratis de ese modelo. La pantalla añade una casilla persistente (`learnAtTempo`) y
muestra el control de tempo cuando está activada. Ver [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (modo estricto)

**Primary Dependencies**: React 18, Vite 5 (sin dependencias nuevas)

**Storage**: `localStorage` mediante `createStore` (`tecla-settings`)

**Testing**: Vitest 2 (`npm test`), con host falso y temporizadores falsos

**Target Platform**: navegadores actuales (Chrome, Edge, Firefox, Safari); escritorio, tablet y
móvil en horizontal

**Project Type**: aplicación web estática (SPA) publicada en GitHub Pages

**Performance Goals**: cursor fluido a 60 fps; reanudación perceptiblemente inmediata al tocar
(< 50 ms de la pulsación al movimiento, según la constitución)

**Constraints**: el motor no accede al DOM; sin cambios en el formato de canciones ni en el
progreso guardado; Aprender sin «A tempo» idéntico al actual

**Scale/Scope**: 1 módulo del motor, 1 ajuste, 1 pantalla; ~12 canciones existentes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Comprobación | Estado |
|-----------|--------------|--------|
| I. Motor separado de la interfaz | Toda la lógica nueva vive en `src/engine/lesson.ts` y usa solo `LessonHost` (`now`, `frame`, `playhead`…). La pantalla solo pasa la opción y muestra controles. | ✅ |
| II. Lógica musical probada | Tests nuevos en `lesson.test.ts` para cada escenario de la spec (ver [quickstart.md](quickstart.md)); los existentes no se tocan. | ✅ |
| III. Funciona sin hardware | Todas las entradas pasan por `Lesson.input(m)`, común a pantalla, teclado del ordenador y MIDI. | ✅ |
| IV. Para quien empieza, cualquier pantalla | Casilla y texto de ayuda en español; tempo con el mismo control que Tocar; se valida en móvil apaisado. | ✅ |
| V. Sencillez y datos en el dispositivo | Sin dependencias nuevas; un booleano en los ajustes locales; sin nuevo `Mode`. | ✅ |
| Restricciones técnicas | Stack actual; respuesta a la nota dentro del mismo fotograma. | ✅ |
| Flujo de trabajo | `npm test` y `npm run build` antes de integrar. | ✅ |

**Post-design re-check**: el diseño de Phase 1 ([data-model.md](data-model.md),
[contracts/lesson-engine.md](contracts/lesson-engine.md)) mantiene los cambios aditivos y
dentro del motor. Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/001-aprender-espera-tempo/
├── plan.md              # Este archivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── lesson-engine.md # Phase 1: API del motor + contrato de la pantalla
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
src/
├── engine/
│   ├── lesson.ts          # LessonOptions, atTempo, reloj virtual, bucle de Aprender a tempo
│   └── lesson.test.ts     # tests nuevos de «A tempo» (host falso con tick())
├── state/
│   └── settings.ts        # learnAtTempo: boolean (defecto false)
└── screens/
    └── LessonScreen.tsx   # casilla «A tempo», tempo visible, texto de ayuda, pasa la opción
```

**Structure Decision**: proyecto único existente (SPA en `src/`). Los cambios se limitan a los
tres módulos anteriores; los tests conviven con el motor, como ya hace el proyecto.

### Enfoque de implementación (resumen)

1. **Motor**: `start()` en Aprender + `atTempo` inicializa `pos = 0` y `lastFrame = now()` y
   arranca un bucle propio (`loopLearnTempo`) en lugar de los temporizadores por grupo. En cada
   fotograma: avanzar `pos` limitado a `sPendiente`, hacer sonar automáticas con
   `n.s < sPendiente`, actualizar cursor, guía y estado, y terminar al pasar `total + 0,6`.
   `input()` reutiliza las reglas de `inputLearn` sin llamar a `playAutos`/`showGroup` por
   temporizador (el bucle se encarga del acompañamiento).
2. **Ajustes**: añadir `learnAtTempo` a `Settings` y a los valores por defecto.
3. **Pantalla**: casilla «A tempo» visible solo en Aprender; tempo visible si
   `mode !== "learn" || prefs.learnAtTempo`; texto de ayuda propio; pasar `{ atTempo }` al
   constructor y añadir `prefs.learnAtTempo` a las dependencias del efecto que crea la lección.

## Complexity Tracking

Sin violaciones de la constitución; no aplica.

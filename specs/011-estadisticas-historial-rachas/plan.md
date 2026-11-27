# Implementation Plan: Estadísticas, historial y rachas

**Branch**: `011-estadisticas-historial-rachas` | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/011-estadisticas-historial-rachas/spec.md`

## Summary

Progreso pasa a tener tres pestañas (Resumen, Historial y Piezas) y una ficha por pieza, lección
o prueba.

**Historial.** Cada intento terminado en Aprender o Tocar se guarda en un almacén nuevo,
`tecla-history`. Lo registra el componente `Practice`, a partir de una prop `record` que le
pasan las pantallas. Los bucles detenidos se guardan como fragmento, y las pruebas del Curso
como un único intento.

**Límite.** Se guardan como mucho 1000 intentos. Un resumen por pieza conserva el número de
intentos y la primera y la mejor nota aunque se recorten los antiguos.

**Rachas.** La mejor racha y el calendario de 13 semanas se calculan con los días de práctica
que ya existen (`progress.days`), así que no hay migración. Además:

- Un objetivo diario opcional en Ajustes.
- Avisos de récord y de objetivo, una vez al día.
- Un recordatorio de racha en Inicio.

**Lógica.** Todo es puro en `src/stats/`, con tests. Las gráficas son CSS y SVG en línea, sin
dependencias nuevas.

Decisiones en [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (modo estricto)

**Primary Dependencies**: React 18 y Vite 5 (ya presentes). Ninguna nueva.

**Storage**: `localStorage` vía `createStore`:

- Almacén nuevo `tecla-history` (`attempts`, `pieces`, `cheered`).
- Campo nuevo `settings.dailyGoal`.
- `tecla-progress` y `tecla-course` no cambian de forma.

**Testing**: Vitest (`npm test`)

**Target Platform**: navegadores actuales en escritorio, tablet y móvil apaisado. PWA sin
conexión.

**Project Type**: aplicación web estática (SPA)

**Performance Goals**:

- Progreso abre en menos de 1 s con 1000 intentos (SC-005). Las agregaciones son O(n) sobre como
  mucho 1000 intentos y unos cientos de días, memorizadas por periodo.
- Registrar un intento reescribe unos 200 KB una vez por intento, fuera del bucle de notas. No
  afecta a la latencia de menos de 50 ms.

**Constraints**:

- Sin desplazamiento horizontal en móvil apaisado.
- Funciona sin almacenamiento: los fallos de escritura se ignoran, como hace hoy `createStore`.
- Respeta el tema y la notación.

**Scale/Scope**:

- Datos: como mucho 1000 intentos y unas 40 claves de pieza (29 piezas, más lecciones y
  pruebas, más importadas).
- Interfaz: 1 pantalla rehecha (Progreso), 1 pantalla nueva (ficha), 3 componentes de gráfica
  y 1 aviso global.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumple | Cómo |
|-----------|--------|------|
| I. Motor separado de la interfaz | ✅ | El motor no cambia. Ya expone `result()` y `loopSummary()`. La lógica nueva vive en `src/stats/` (pura, recibe `today` como argumento) y el almacenamiento en `src/state/history.ts`. |
| II. Lógica musical probada | ✅ | Tests para `src/stats/*` (rachas, calendario, periodos, `counts`, recorte, `milestones`) y `src/state/history.ts` (registro, recorte, olvido, reset, datos corruptos). La puntuación no cambia (FR-008); la suite actual sigue pasando. |
| III. Funciona sin hardware | ✅ | El registro no depende de cómo se toca: MIDI y teclado en pantalla terminan en el mismo `finish`. |
| IV. Para quien empieza, en cualquier pantalla | ✅ | Pestañas para no alargar Progreso, calendario de 13 columnas que cabe en móvil apaisado, textos en español, colores del tema y nombres de pieza según la notación. Mensaje amable en periodos vacíos. |
| V. Sencillez y datos en el dispositivo | ✅ | Sin dependencias nuevas (gráficas CSS y SVG). Todo en `localStorage`. Mejor racha calculada, no guardada. Sin exportación ni sincronización. |
| Rutas por hash | ✅ | `#progreso/historial`, `#progreso/piezas`, `#progreso/pieza/<clave>`. |

**Post-design re-check (tras la Fase 1)**: sin cambios ni desviaciones. Ningún módulo de
`src/engine/` ni `src/music/` se modifica. `src/stats/` no importa nada de React ni del
navegador.

## Project Structure

### Documentation (this feature)

```text
specs/011-estadisticas-historial-rachas/
├── plan.md              # este archivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   └── history.md       # Fase 1: API de stats/history, prop record, rutas
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── stats/                       # NUEVO · lógica pura
│   ├── types.ts                 # Attempt, PieceKey, PieceSummary, HistoryData, Period
│   ├── attempts.ts              # makeAttempt, addAttempt (recorte + resumen)
│   ├── attempts.test.ts
│   ├── streaks.ts               # bestStreak, dayLevel, goalMet, calendar, milestones
│   ├── streaks.test.ts
│   ├── period.ts                # periodStats
│   └── period.test.ts
├── state/
│   ├── history.ts               # NUEVO · almacén tecla-history, recordAttempt, forgetHistory, notice
│   ├── history.test.ts          # NUEVO
│   ├── progress.ts              # addPractice → milestones/notice; forgetSong → forgetHistory
│   ├── progress.test.ts         # + casos de aviso
│   └── settings.ts              # + dailyGoal
├── components/
│   ├── Practice.tsx             # + prop record; registra en finish y al detener bucle
│   ├── Toast.tsx                # NUEVO · aviso global (récord / objetivo)
│   ├── StreakCalendar.tsx       # NUEVO
│   ├── ScoreTrend.tsx           # NUEVO · SVG de evolución
│   └── TimeBars.tsx             # NUEVO · extraído del week-chart actual
├── screens/
│   ├── ProgressScreen.tsx       # pestañas Resumen / Historial / Piezas
│   ├── PieceHistory.tsx         # NUEVO · ficha
│   ├── LessonScreen.tsx         # pasa record
│   ├── CourseLesson.tsx         # pasa record
│   ├── CourseTest.tsx           # guarda notas por ejercicio; registra la prueba completa
│   ├── Home.tsx                 # recordatorio de racha y objetivo de hoy
│   └── SettingsScreen.tsx       # selector de objetivo; reset incluye history
├── router.ts                    # + tab en progress, + ruta piece
├── App.tsx                      # + ruta piece, + <Toast/>
└── styles.css                   # pestañas, calendario, gráfica, toast
```

**Structure Decision**: es la estructura única que ya tiene el proyecto. La lógica pura nueva va
en `src/stats/`, con el mismo patrón que `src/course/`, para que sea comprobable sin navegador.
La persistencia va en `src/state/` y la interfaz en `src/screens/` y `src/components/`.

## Complexity Tracking

Sin violaciones de la constitución que justificar.

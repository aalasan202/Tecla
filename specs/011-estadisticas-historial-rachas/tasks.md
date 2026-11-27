---
description: "Lista de tareas de Estadísticas, historial y rachas (011)"
---

# Tasks: Estadísticas, historial y rachas

**Input**: Documentos de diseño en `specs/011-estadisticas-historial-rachas/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/history.md](contracts/history.md), [quickstart.md](quickstart.md)

**Tests**: SÍ. La constitución (Principio II) exige tests para todo cambio en `src/state/`, y el
plan añade la lógica pura de `src/stats/` con sus tests. Se escriben antes de la implementación
y deben fallar primero. Los componentes visuales se verifican a mano (quickstart).

**Organization**: por historia de usuario. Cada fase es un incremento que se puede probar por
separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivo distinto y sin depender de tareas pendientes).
- **[Story]**: historia a la que pertenece (US1–US4).

Las rutas son relativas a la raíz del repositorio (proyecto único: `src/`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: tipos compartidos de la funcionalidad.

- [X] T001 Crear `src/stats/types.ts` con los tipos de [data-model.md](data-model.md) y [contracts/history.md](contracts/history.md):
  - `PieceKey` (`` `song:${string}` | `course:${string}` ``).
  - `AttemptSource` (`{ key; src: "song" | "course"; title; unit? }`).
  - `Attempt`: `at`, `key`, `src`, `title`, `unit?`, `mode: "learn" | "play"`, `hands: HandChoice`, `twoHands`, `tempo`, `score` (0–1), `stars` (0–3), `frag?: { from; to; reps }` (compases 1‑based) y `counts`.
  - `PieceSummary`: `count`, `title`, `src`, `first?: { at; score }`, `best?: { at; score }`, `last: { at; score; mode }`.
  - `HistoryData`: `{ attempts: Attempt[]; pieces: Record<PieceKey, PieceSummary>; cheered: { record?: string; goal?: string } }`.
  - `Period` (`"7d" | "30d" | "all"`) y `DayLevel` (`0 | 1 | 2`).
  - `HandChoice` se importa como tipo desde `src/engine/lesson.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: rutas y estructura de pestañas de Progreso, que usan todas las historias.

**⚠️ CRITICAL**: ninguna historia empieza antes de terminar esta fase.

- [X] T002 Ampliar `src/router.ts` según la tabla de rutas de [contracts/history.md](contracts/history.md):
  - `{ name: "progress"; tab: "summary" | "history" | "pieces" }` para `#progreso`, `#progreso/historial` y `#progreso/piezas`; cualquier valor desconocido abre `summary`.
  - `{ name: "piece"; key: string }` para `#progreso/pieza/<key>`, con `encodeURIComponent` y `decodeURIComponent`.
  - Actualizar `hrefFor` y todos los usos de `{ name: "progress" }` en `src/` (Home, TopBar `back`, etc.) para que pasen `tab: "summary"`.
- [X] T003 [P] Añadir tests de las rutas nuevas (ida y vuelta de `parseRoute` y `hrefFor`, pestaña desconocida, clave con `:`) en `src/router.test.ts`.
- [X] T004 Conectar en `src/App.tsx` la ruta `piece` con un marcador provisional `src/screens/PieceHistory.tsx` (título con TopBar y Atrás a `#progreso/piezas`), y pasar `route.tab` a `ProgressScreen`.
- [X] T005 Reorganizar `src/screens/ProgressScreen.tsx` en tres pestañas (FR-025), como enlaces con `role="tablist"`/`role="tab"` y `aria-selected`:
  - **Resumen**: tarjetas de estadísticas actuales y gráfico de 7 días.
  - **Historial**: vacía por ahora, con el texto «Aún no hay intentos».
  - **Piezas**: las listas actuales de Curso y Canciones.
  - Al abrir Progreso se muestra Resumen.
- [X] T006 [P] Estilos de las pestañas en `src/styles.css`: barra fija bajo la TopBar, que quepa en móvil apaisado (740×360) sin desplazamiento horizontal y use los colores del tema claro y oscuro.

**Checkpoint**: Progreso tiene pestañas navegables con Atrás; `npm test` y `npm run build` pasan.

---

## Phase 3: User Story 1 - Ver mi historial de práctica (Priority: P1) 🎯 MVP

**Goal**: cada intento terminado en Aprender o Tocar (Canciones y Curso) se guarda y se ve en
Historial y en la ficha de cada pieza, lección o prueba, con su gráfica de evolución.

**Independent Test**: tocar una pieza tres veces en Tocar y otra en Aprender. En
`#progreso/historial` deben salir los cuatro intentos, del más nuevo al más antiguo, y la ficha
de la primera pieza debe mostrar sus tres intentos y la gráfica (quickstart 1–4).

### Tests for User Story 1 ⚠️

- [X] T007 [P] [US1] Tests de `makeAttempt` y `addAttempt` en `src/stats/attempts.test.ts`:
  - `counts` vale `mode==="play" && !frag && (!twoHands || hands==="both")`: Aprender, un fragmento y una mano en pieza a dos manos dan `false`; una mano en pieza de una mano da `true`.
  - `addAttempt` añade al final y, al pasar de `limit` (por defecto 1000), recorta los más antiguos.
  - `pieces[key].count` sigue sumando tras recortar (1200 intentos dan `count` 1200 y 1000 guardados).
  - `first` y `best` solo cambian con intentos que cuentan; si la nota empata, `best` conserva el primero.
  - `last` se actualiza siempre.
  - No muta la entrada.
- [X] T008 [P] [US1] Tests del almacén en `src/state/history.test.ts`:
  - `recordAttempt` pone `at`, guarda en `tecla-history` y actualiza el resumen.
  - `forgetHistory(key)` quita intentos y resumen de esa clave.
  - `history.reset()` lo vacía todo.
  - Al cargar se descartan las entradas sin `key`, sin `at` numérico o con `score` fuera de 0–1, y un JSON corrupto da un almacén vacío sin lanzar errores.
  - `progress.forgetSong(id)` borra también el historial de `song:<id>`.

### Implementation for User Story 1

- [X] T009 [P] [US1] Implementar `makeAttempt` y `addAttempt(data, a, limit = 1000)` en `src/stats/attempts.ts`, puras y sin importar React ni el navegador (research R3, R4).
- [X] T010 [US1] Crear `src/state/history.ts`:
  - Almacén `history = createStore<HistoryData>("tecla-history", { attempts: [], pieces: {}, cheered: {} })` con la validación de carga de T008.
  - `recordAttempt(a)` (pone `at: Date.now()` y usa `addAttempt`), `forgetHistory(key)` y `useHistory()`.
  - Depende de T009.
- [X] T011 [US1] En `src/state/progress.ts`, `forgetSong(id)` llama a `forgetHistory(\`song:${id}\`)` (research R11). Depende de T010.
- [X] T012 [US1] En `src/screens/SettingsScreen.tsx`, «Borrar el progreso» llama también a `history.reset()`, y el texto de confirmación pasa a «¿Borrar estrellas, racha, historial, estadísticas, tiempo de práctica y el avance del Curso?» (FR-022).
- [X] T013 [US1] Añadir a `src/components/Practice.tsx` la prop `record?: AttemptSource` (research R1):
  - En `finish`, si `record` y el paso es `learn` o `play`, llamar a `recordAttempt(makeAttempt({ source: record, mode, hands, twoHands: score.twoHands, tempo, score: r.score, stars: r.stars }))`.
  - En `toggleRun`, al detener un bucle con `summary` (al menos 1 repetición) y paso distinto de Escuchar, registrar la mejor repetición con `frag: { from: loopFrom + 1, to: loopTo + 1, reps }`. Comprobar si `loopFrom`/`loopTo` son índices de compás 0‑based y ajustar.
  - Los intentos abandonados no se registran (FR-003).
- [X] T014 [P] [US1] En `src/screens/LessonScreen.tsx`, pasar `record={{ key: \`song:${song.id}\`, src: "song", title: song.title }}` a `Practice`. Los hitos del Curso usan la misma pantalla, así que también quedan cubiertos.
- [X] T015 [P] [US1] En `src/screens/CourseLesson.tsx`, pasar `record={{ key: \`course:${lesson.id}\`, src: "course", title: <título de la lección>, unit: "Unidad N · <título>" }}`, con el número y el título de la unidad que contiene la lección.
- [X] T016 [US1] En `src/screens/CourseTest.tsx`, registrar la prueba completa (research R2):
  - Guardar en cada pasada la mejor nota (0–1) de cada ejercicio, junto a `got`.
  - En «Ver resultado» (último ejercicio), llamar a `recordAttempt` con `key: \`course:test:${unitId}\``, `src: "course"`, `mode: "play"`, `hands: "both"`, `twoHands: false`, el tempo del primer ejercicio, `score` = media de las mejores notas y `stars` = mínimo de las estrellas de los ejercicios.
  - Sin `record` en el `Practice` de cada ejercicio.
- [X] T017 [P] [US1] Crear `src/components/ScoreTrend.tsx`: SVG en línea y adaptable al ancho (`viewBox` y `width: 100%`), con una `polyline` y puntos para los intentos que cuentan en orden de fecha.
  - Eje de 0 a 100 %, con líneas guía en 40, 70 y 90 % (umbrales de estrellas).
  - La mejor nota destacada y colores tomados de variables CSS del tema.
  - `aria-label` con un resumen («N intentos, mejor X %»).
  - Con menos de 2 puntos muestra un texto en lugar de la gráfica.
- [X] T018 [US1] Implementar `src/screens/PieceHistory.tsx` (FR-006):
  - TopBar con el título del resumen (o del último intento si la pieza ya no existe).
  - Datos: número de intentos, mejor nota, última nota, `ScoreTrend` e intentos de la pieza del más nuevo al más antiguo.
  - Enlace «Practicar»: `hrefFor({ name: "lesson" })` para `song:`, `courseItem` para `course:<itemId>` y `course` para las pruebas. Se omite si la pieza o la lección ya no existe.
  - Depende de T010 y T017.
- [X] T019 [US1] Crear el componente de fila de intento `src/components/AttemptRow.tsx`:
  - Datos: fecha y hora local, título (con la unidad si es del Curso), etiqueta Canciones o Curso, paso («Aprender»/«Tocar»), manos («Derecha»/«Izquierda»/«Ambas»; se omite si `twoHands` es `false`), tempo, % redondeado y estrellas ★☆ con `aria-label`.
  - Fragmento: «Compases A–B · N repeticiones».
- [X] T020 [US1] Pestaña **Historial** en `src/screens/ProgressScreen.tsx` (FR-004):
  - Intentos del más nuevo al más antiguo con `AttemptRow`, cada uno enlazado a su ficha.
  - Muestra 30 y un botón «Ver más» añade 30 más.
  - Mensaje de invitación si está vacía.
- [X] T021 [US1] Pestaña **Piezas** en `src/screens/ProgressScreen.tsx`:
  - Cada canción, cada lección del Curso y cada prueba con intentos enlaza a su ficha (`#progreso/pieza/<key>`).
  - Se mantienen las estrellas y el estado de unidad actuales.
  - Las importadas con intentos aparecen en Canciones.
- [X] T022 [P] [US1] Estilos de la ficha, la fila de intento y la gráfica en `src/styles.css` (tema claro y oscuro, móvil apaisado).

**Checkpoint**: US1 completa y comprobable sola (quickstart 1–4 y 10).

---

## Phase 4: User Story 2 - Rachas con récord y calendario (Priority: P2)

**Goal**: racha actual, mejor racha (calculada con los días ya guardados), calendario de 13
semanas, felicitación de récord y recordatorio en Inicio.

**Independent Test**: con 5 días seguidos guardados hace un mes y práctica ayer y hoy, Resumen
muestra «Racha 2 días» y «Mejor racha 5 días» y el calendario marca esos días (quickstart
5–7).

### Tests for User Story 2 ⚠️

- [X] T023 [P] [US2] Tests en `src/stats/streaks.test.ts`:
  - `bestStreak`: vacío da 0; días sueltos; varias rachas; claves desordenadas; cambio de mes y de año; segundos a 0 no cuentan.
  - `dayLevel(seconds, goalMin)`: 0 sin práctica, 2 si `seconds ≥ (goalMin || 10) * 60`, 1 en el resto.
  - `goalMet`: `false` siempre con `goalMin` 0.
  - `calendar(days, goal, today, 13)`: 13 columnas de 7 días (lunes a domingo), la última contiene `today`, los días posteriores a hoy van marcados `future`, y los niveles son correctos.
  - `milestones` (solo `"record"` aquí): récord con racha ≥ 2 que supera la mejor anterior; nada con racha 1; nada si `cheered.record === hoy`.
- [X] T024 [P] [US2] Ampliar `src/state/progress.test.ts`:
  - `addPractice` que bate el récord publica un aviso `"record"` y marca `history.cheered.record` con el día de hoy.
  - Una segunda práctica el mismo día no publica otro aviso.

### Implementation for User Story 2

- [X] T025 [US2] Implementar en `src/stats/streaks.ts`, puras y con `today` como argumento: `bestStreak`, `dayLevel`, `goalMet`, `calendar` y `milestones(before, after, goalMin, today, cheered)` (research R5, R6, R10). Reutilizar `dayKey` y `streak` de `src/state/progress.ts`, moviéndolas a `src/stats/streaks.ts` y reexportándolas desde `progress.ts` para no romper importaciones.
- [X] T026 [US2] Añadir a `src/state/history.ts` el almacén en memoria `notice` (`use()`, `push(n)`, `clear()`; `Notice = { kind: "record" | "goal"; text: string }`), sin persistencia.
- [X] T027 [US2] En `src/state/progress.ts`, `addPractice` guarda los días antes de sumar y, tras sumar, evalúa `milestones` con `settings.get().dailyGoal ?? 0`. Por cada aviso: `notice.push` (récord: «¡Nueva mejor racha: N días!») y `history.set` de `cheered.<kind> = dayKey()`. Depende de T025 y T026.
- [X] T028 [P] [US2] Crear `src/components/Toast.tsx`: muestra `notice` 4 s con `role="status"` y `aria-live="polite"`, se puede cerrar y no tapa el teclado en móvil apaisado (arriba, centrado). Montarlo en `src/App.tsx` junto a `PwaToast`.
- [X] T029 [P] [US2] Crear `src/components/StreakCalendar.tsx` (FR-011):
  - Rejilla CSS de 7×13 con `calendar(...)`.
  - Celdas con nivel 0, 1 o 2 por clase; los días futuros quedan vacíos.
  - Cada celda es un botón con `aria-label` («lunes 3 de noviembre: 12 min»).
  - Al pulsarla, una línea de estado bajo la rejilla muestra el día y `formatDuration`.
  - Leyenda «Poca · Mucha». Iniciales de los días (L, X, V) a la izquierda.
- [X] T030 [US2] Pestaña **Resumen** en `src/screens/ProgressScreen.tsx`: tarjetas «Racha» y «Mejor racha» (con `bestStreak(p.days)`) y `StreakCalendar` bajo las tarjetas (FR-010).
- [X] T031 [US2] En `src/screens/Home.tsx`, si `streak(days) > 0`, hoy no hay práctica y ayer sí, la tarjeta de Progreso dice «Racha de N días. Practica hoy para mantenerla.» (FR-013). El resto de casos queda como hoy.
- [X] T032 [P] [US2] Estilos del calendario y del toast en `src/styles.css`: tres niveles con colores del tema claro y oscuro, celdas que quepan en 740×360 sin desplazamiento horizontal y foco visible.

**Checkpoint**: US1 y US2 funcionan por separado (quickstart 5–7).

---

## Phase 5: User Story 3 - Estadísticas más allá de la semana (Priority: P3)

**Goal**: selector de periodo (7 días, 30 días, Todo) con totales, gráfico de tiempo, nota media
separada por Canciones y Curso, piezas más practicadas y más mejoradas.

**Independent Test**: con varios días e intentos, elegir «Últimos 30 días» y comprobar que los
totales cuadran con los datos; un periodo vacío muestra la invitación (quickstart 8).

### Tests for User Story 3 ⚠️

- [X] T033 [P] [US3] Tests de `periodStats` en `src/stats/period.test.ts` (research R9):
  - `7d` y `30d` incluyen hoy.
  - `seconds` y `daysPracticed` cuadran exactamente con `days` (SC-004).
  - `attempts` y `avgPlay` van separados por `song`/`course`; `avgPlay` solo cuenta Tocar sin fragmento y es `null` sin datos.
  - `series`: diaria en `7d` (7 puntos) y `30d` (30 puntos); en `all`, semanal si el primer día es de hace ≤ 26 semanas y mensual si no.
  - `top`: máximo 3, ordenado por intentos; en `all` usa `pieces[].count`.
  - `improved`: necesita al menos 2 intentos que cuenten; `to − from` > 0; máximo 3; en `all` usa `first`/`best` del resumen.
  - Los intentos con `at` futuro se ignoran.
  - `empty` es `true` sin tiempo ni intentos.

### Implementation for User Story 3

- [X] T034 [US3] Implementar `periodStats(period, days, history, today)` en `src/stats/period.ts`, pura y con la forma de [contracts/history.md](contracts/history.md).
- [X] T035 [P] [US3] Extraer el gráfico de barras actual («Últimos 7 días») de `src/screens/ProgressScreen.tsx` a `src/components/TimeBars.tsx`, con la entrada `series: { label; seconds }[]` y altura relativa al máximo (mínimo 60 s). Con 30 barras, las etiquetas se muestran solo cada 5 para que quepan.
- [X] T036 [US3] Pestaña **Resumen** en `src/screens/ProgressScreen.tsx` (FR-014–018):
  - Selector de periodo «7 días · 30 días · Todo» (botones con `aria-pressed`, 7 días por defecto, recordado en `sessionStorage` dentro de `try/catch`).
  - Tarjetas: tiempo, días con práctica, intentos (Canciones · Curso) y nota media en Tocar (Canciones · Curso).
  - `TimeBars` con `series`.
  - Listas «Más practicadas» y «Más mejoradas» («de 45 % a 82 %»), con etiqueta de origen y enlace a la ficha.
  - Si `empty`, un mensaje que invita a practicar en lugar de tarjetas y gráficos.
  - Usar `useMemo` por periodo.
  - Depende de T034 y T035.

**Checkpoint**: US1–US3 funcionan por separado (quickstart 8).

---

## Phase 6: User Story 4 - Objetivo diario (Priority: P3)

**Goal**: objetivo de minutos al día opcional en Ajustes, avance de hoy en Inicio y Resumen,
aviso al cumplirlo y nivel «mucha» del calendario según el objetivo.

**Independent Test**: con un objetivo de 10 min y 4 min practicados, Inicio muestra «4 de 10
min»; tras 6 min más sale el aviso una vez y el día queda en «mucha» (quickstart 9).

### Tests for User Story 4 ⚠️

- [X] T037 [P] [US4] Ampliar `src/state/settings.test.ts`: `dailyGoal` vale `0` por defecto y se conserva en datos guardados sin ese campo (`createStore` combina con los valores por defecto). Valores válidos: `0 | 5 | 10 | 15 | 20 | 30`; un valor no válido al cargar se trata como `0`.
- [X] T038 [P] [US4] Ampliar `src/stats/streaks.test.ts`:
  - `milestones` devuelve `"goal"` solo cuando el tiempo de hoy cruza `goalMin * 60` (antes por debajo, después por encima o igual), nunca con `goalMin` 0 ni si `cheered.goal === hoy`.
  - `calendar` marca `goal: true` en los días que lo cumplen.
  - `dayLevel` usa el objetivo como umbral de «mucha».
- [X] T039 [P] [US4] Ampliar `src/state/progress.test.ts`: `addPractice` que cruza el objetivo publica `"goal"` («¡Objetivo de hoy cumplido!») una vez al día.

### Implementation for User Story 4

- [X] T040 [US4] Añadir a `src/state/settings.ts` el campo `dailyGoal: 0 | 5 | 10 | 15 | 20 | 30` (defecto `0`), con la normalización de valores no válidos de T037.
- [X] T041 [US4] Completar en `src/stats/streaks.ts` la rama `"goal"` de `milestones` y el campo `goal` de `calendar` (si T025 no los dejó ya hechos). Comprobar que T027 pasa `dailyGoal`.
- [X] T042 [US4] Añadir en `src/screens/SettingsScreen.tsx` el selector «Objetivo diario» (Desactivado, 5, 10, 15, 20, 30 min) con un texto de ayuda: «Solo te muestra cuánto llevas; la racha cuenta cualquier día con práctica.»
- [X] T043 [P] [US4] En `src/screens/Home.tsx`, si `dailyGoal > 0`, la tarjeta de Progreso muestra «Hoy: X de Y min» (o «Objetivo de hoy cumplido») con una barra de avance accesible (`role="progressbar"`).
- [X] T044 [P] [US4] En la pestaña **Resumen** de `src/screens/ProgressScreen.tsx`, si `dailyGoal > 0`, añadir la tarjeta «Hoy: X de Y min»; `StreakCalendar` recibe `dailyGoal` (FR-011, FR-020). Ningún indicador si está desactivado.

**Checkpoint**: las cuatro historias funcionan por separado.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T045 [P] Prueba de rendimiento en `src/stats/period.test.ts`: `periodStats("all")` con 1000 intentos y 400 días termina en menos de 50 ms (margen para SC-005).
- [X] T046 Revisar a mano `ProgressScreen` y `PieceHistory` en móvil apaisado (740×360), tablet y escritorio, con tema claro y oscuro y notación Do‑Re‑Mi y C‑D‑E. Sin desplazamiento horizontal (SC-006).
- [ ] T047 Ejecutar los 12 escenarios de [quickstart.md](quickstart.md) y anotar cualquier desviación.
  - Comprobados en el navegador con datos de prueba (2026-11-27): 2, 5, 6, 8, 9, 11 y 12. Tema claro y oscuro; sin desplazamiento horizontal a 740×360.
  - Pendientes a mano: 1, 3, 4, 7 y 10, que piden tocar de verdad (registro desde la práctica, bucle, lección y prueba del Curso, felicitación de récord y borrado). La lógica está cubierta por tests unitarios.
- [X] T048 Ejecutar `npm test` y `npm run build`; los dos deben pasar (constitución, flujo de trabajo).
- [X] T049 [P] Marcar «Estadísticas, historial y rachas.» con ✅ en `old_docs/ROADMAP.md`, sin tocar los cambios locales que ya tiene ese archivo.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: sin dependencias.
- **Foundational (T002–T006)**: depende de Setup y bloquea todas las historias.
- **US1 (Fase 3)**: tras Foundational. Es el MVP.
- **US2 (Fase 4)**: tras Foundational. Usa `history.ts` (T010) para `cheered` y `notice`; si se
  hace antes que US1, crear primero el almacén de T010.
- **US3 (Fase 5)**: tras Foundational. Necesita `history.ts` (T010) para los intentos; sin
  intentos registrados (sin T013–T016) solo muestra tiempo.
- **US4 (Fase 6)**: tras US2 (amplía `milestones`, `calendar` y la pestaña Resumen).
- **Polish (Fase 7)**: al final.

### Within Each User Story

- Tests primero (deben fallar), luego lógica pura (`src/stats/`), luego almacén (`src/state/`),
  luego componentes y pantallas.
- T009 → T010 → T011, T013 → T014, T015, T016; T017 → T018.
- T025 + T026 → T027; T029 → T030.
- T034 + T035 → T036.
- T040 → T042, T043, T044.

### Parallel Opportunities

- T003 y T006 en paralelo con T004/T005.
- US1: T007, T008 y T009 a la vez; tras T013, T014 y T015 en paralelo; T017, T019 y T022 en
  paralelo con T016.
- US2: T023 y T024 a la vez; T028, T029 y T032 en paralelo tras T025/T026.
- US3: T033 y T035 en paralelo.
- US4: T037, T038 y T039 a la vez; T043 y T044 en paralelo tras T040.

---

## Parallel Example: User Story 1

```bash
# Tests y lógica pura a la vez (archivos distintos):
Task: "Tests de makeAttempt/addAttempt en src/stats/attempts.test.ts"          # T007
Task: "Tests del almacén en src/state/history.test.ts"                          # T008
Task: "Implementar makeAttempt/addAttempt en src/stats/attempts.ts"             # T009

# Tras T013, cada pantalla pasa su record:
Task: "record en src/screens/LessonScreen.tsx"                                  # T014
Task: "record en src/screens/CourseLesson.tsx"                                  # T015
Task: "Gráfica ScoreTrend en src/components/ScoreTrend.tsx"                      # T017
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 (Setup) y T002–T006 (pestañas y rutas).
2. T007–T022 (historial y fichas).
3. **Parar y validar**: quickstart 1–4 y 10; `npm test` y `npm run build`.
4. Publicable: cada push a `main` despliega.

### Incremental Delivery

1. Setup + Foundational: Progreso con pestañas.
2. US1: historial y fichas (MVP).
3. US2: récord, calendario, avisos y recordatorio.
4. US3: periodos y rankings.
5. US4: objetivo diario.
6. Polish: rendimiento, revisión visual y hoja de ruta.

---

## Notes

- `src/stats/` no importa React ni APIs del navegador (Principio I); las fechas entran como
  argumento.
- La puntuación, las estrellas y el desbloqueo del Curso no cambian (FR-008). Si un test
  existente de `src/engine/` o `src/course/` falla, es una regresión.
- Hacer un commit por tarea o grupo lógico; validar en cada checkpoint.

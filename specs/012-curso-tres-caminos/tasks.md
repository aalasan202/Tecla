---
description: "Lista de tareas del Curso en tres caminos y técnica (012)"
---

# Tasks: Curso en tres caminos y técnica (niveles 1–4)

**Input**: Documentos de diseño en `specs/012-curso-tres-caminos/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/course.md](contracts/course.md), [quickstart.md](quickstart.md)

**Tests**: SÍ. La constitución (Principio II) exige tests para todo cambio en `src/music/` y
`src/state/`, y el plan añade lógica pura en `src/course/` con sus tests. Se escriben antes de la
implementación. Las pantallas se verifican a mano (quickstart).

**Organization**: por historia de usuario (US1–US5 de la spec).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivo distinto y sin depender de tareas pendientes).
- **[Story]**: historia a la que pertenece.

Las rutas son relativas a la raíz del repositorio.

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Crear la rama `012-curso-tres-caminos` desde `main`. La enmienda de la constitución 1.1.0 (`.specify/memory/constitution.md`) va en un commit propio en esa rama, sin el Sync Impact Report si así se decide, antes que el código.
  - Hecho: rama creada. Pendiente: el commit de la enmienda (sin pedir todavía).
- [X] T002 Definir en `src/course/types.ts` los tipos de [data-model.md](data-model.md):
  - `Path = "lessons" | "technique" | "songs"`.
  - `ScaleSpec`: `tonic: "C" | "G" | "F" | "D" | "A" | "E" | "Bb"`, `mode: "major" | "minor"`, `hand: "R" | "L"`, `tempos: [number, number, number]` (inicial < intermedio < objetivo).
  - `CourseItem` como unión de:
    - `lesson`;
    - `tip`;
    - `scale` (`scale: ScaleSpec`);
    - `independence` (`song: SongDef`, `needsMidi: true`);
    - `song` (`songId`, `recommended: boolean`).
  - `Level`: `n: 1 | 2 | 3 | 4`, `title`, `lessons`, `technique`, `songs`, `test: SongDef[] | null`.
  - `ItemStatus = "locked" | "available" | "done" | "needsMidi"`.
  - `CourseState` y `Recommendation` (`{ itemId; level; path; reason }`).
  - `CourseProgress` gana `tests?: Partial<Record<"2" | "3" | "4", true>>` y `recent?: string[]`.
  - `Tip.level` pasa a `1 | 2 | 3 | 4`.
  - Se mantienen `Unit`, `PathItem` y `PathState` hasta T011, para que compile mientras se migra.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: nuevo modelo por niveles con el contenido actual, estado calculado, almacén y rutas.
Al terminar, la app compila y funciona con el contenido de 010 reorganizado.

**⚠️ CRITICAL**: ninguna historia empieza antes de terminar esta fase.

### Tests (deben fallar primero)

- [X] T003 [P] Tests de `courseState` en `src/course/state.test.ts` (research R2 y R3, reglas 1–6 de [data-model.md](data-model.md)):
  - **Alumno nuevo**: solo el nivel 1 abierto; todos sus elementos `available`; los niveles 2–4 `locked`.
  - **Paso de nivel**: las 5 lecciones del nivel 1 con 2★ abren el nivel 2. Técnica y canciones no influyen.
  - **Prueba superada**: `tests["3"]` abre los niveles 1–3.
  - **Datos antiguos de 010**: `skipped: { u1: true }` y `skipped: { u1: true, u2: true }` abren solo los niveles 1–2.
  - **Antiguas `best`**: conservadas; `best["prueba-u3-reading"]` se ignora sin error.
  - Los consejos vistos quedan `done`.
  - Una canción con 2★ en `songBest` queda `done`.
  - **Avance por camino** `done/total`, que excluye los `independence` cuando `midiOk` es `false`.
  - `current` es el nivel abierto más alto.
- [X] T004 [P] Ampliar `src/state/course.test.ts`:
  - `touchCourse` mantiene `recent` con como mucho 6 ids, el más nuevo al final y sin repetir el último.
  - `markLevelTest(3)` pone `tests["3"] = true`.
  - Un almacén antiguo sin `tests` ni `recent` carga con los valores por defecto.
- [X] T005 [P] Tests de rutas en `src/router.test.ts`, de ida y vuelta:
  - `#curso` → `{ name: "course" }`.
  - `#curso/nivel/3/tecnica` → `{ name: "course", level: 3, path: "technique" }`.
  - `#curso/prueba/3` → `{ name: "courseTest", level: 3 }`.
  - `#curso/prueba/u2` → `{ name: "courseTest", level: 2 }`.
  - Nivel o camino desconocido → `{ name: "course" }`.
  - `#curso/<itemId>` sin cambios.

### Implementación

- [X] T006 Reescribir `src/course/content.ts` como `export const LEVELS: Level[]` (research R1 y R10):
  - **Nivel 1** «Primeros pasos»: los elementos de la U1 actual. Lecciones y consejos van en `lessons`, en su orden; los hitos (`hito-*`) van en `songs` con `recommended: true`, seguidos de las demás piezas de `SONGS` con `levelOf === 1` como `{ type: "song", id: "cancion-<songId>", recommended: false }`.
  - **Nivel 2** «Moverse por el teclado»: los elementos de la U2 y luego los de la U3, con el mismo reparto. `test: EX.TEST_U2`.
  - **Niveles 3 y 4**: `lessons: []`, `technique: []`, las canciones de su nivel y `test: null` por ahora (se completan en US3–US5).
  - Todos los ids existentes (`l-*`, `consejo-*`, `hito-*`) se mantienen sin cambios.
  - Se retira `COURSE`.
- [X] T007 Crear `src/course/state.ts` con `courseState(levels, cp, songBest, midiOk)` (rama `needsMidi` incluida), `findItem(levels, itemId)` (devuelve `{ level, path, item, index }`) y `courseStars(levels, cp)` (solo lecciones). Mover sin cambios `PASS_STARS`, `testOutcome` y `continueTarget` desde `src/course/path.ts`. `recommended` devuelve `null` hasta US2. Depende de T006.
- [X] T008 En `src/state/course.ts`:
  - `touchCourse(itemId)` actualiza `last` y `recent` (como mucho 6, sin repetir el último).
  - Añadir `markLevelTest(level: 2 | 3 | 4)` y `recordScaleStars(id, step, stars)`, que guarda en `best["<id>@<step>"]` solo si mejora.
  - Retirar `markSkipped`; los datos `skipped` antiguos solo se leen.
- [X] T009 En `src/state/useCourse.ts`, devolver `{ levels: LEVELS, cp, best, state }`, con `state = courseState(LEVELS, cp, best, midiOk)` y `midiOk = useMidiContext().status === "ok"`.
- [X] T010 En `src/router.ts`:
  - `{ name: "course"; level?: 1 | 2 | 3 | 4; path?: Path }`, con los caminos en español en la URL (`lecciones`, `tecnica`, `canciones`).
  - `{ name: "courseTest"; level: 2 | 3 | 4 }`, aceptando `u2` como nivel 2.
  - Actualizar `hrefFor` y `src/App.tsx`.
- [X] T011 Adaptar al nuevo modelo los consumidores de la API antigua:
  - `src/screens/CourseItem.tsx`: `findItem` nuevo; tipo `song` igual que un hito, con `LessonScreen`, `back` al camino Canciones del nivel y `onSession={() => touchCourse(id)}`.
  - `src/screens/CourseLesson.tsx`: `unitLabel` pasa a `levelLabel` («Nivel N · título»).
  - `src/screens/CourseTest.tsx`: recibe `level`, usa `LEVELS[level-1].test` y, al aprobar, `markLevelTest(level)`. Clave de historial `course:test:<level>`.
  - `src/screens/CourseTip.tsx`.
  - `src/screens/Home.tsx`: tarjeta «Nivel N · Lecciones x de y» con `state.current`.
  - `src/screens/ProgressScreen.tsx`: pestaña Piezas con el Curso por niveles.
  - `src/screens/PieceHistory.tsx`: destinos de `course:<itemId>` y `course:test:<n>`.
  - `src/components/Practice.tsx`: si importa algo del Curso.
  - Borrar `src/course/path.ts` y `src/course/path.test.ts` cuando ya nada los use. Retirar `Unit`, `PathItem` y `PathState` de `src/course/types.ts`.
- [X] T012 Adaptar `src/course/checks.ts` y `src/course/checks.test.ts` a `LEVELS`, conservando las comprobaciones de 010: ids únicos, hitos en el repertorio, los 13 consejos requeridos, palabras por texto y validación de ejercicios.

**Checkpoint**: `npm test` y `npm run build` pasan; el Curso actual funciona con el nuevo modelo
(con la pantalla del mapa todavía provisional).

---

## Phase 3: User Story 1 - Elegir camino dentro de un nivel (Priority: P1) 🎯 MVP

**Goal**: mapa del Curso por niveles con tres caminos libres y su avance.

**Independent Test**: abrir el Curso, entrar en Canciones del nivel 1 y tocar una pieza; volver y
abrir la última lección del nivel sin bloqueo (quickstart 1–4).

- [X] T013 [US1] Reescribir `src/screens/CourseMap.tsx`:
  - **Selector de niveles 1–4**: cada nivel abierto o bloqueado; los bloqueados con su motivo («Supera las lecciones del nivel N‑1 o haz la prueba») y el enlace a `#curso/prueba/<n>`.
  - **Pestañas** Lecciones · Técnica · Canciones, con el avance («3 de 5»); navegan a `#curso/nivel/<n>/<camino>`.
  - **Lista del camino** en el orden sugerido, con el estado de cada elemento: sin empezar, estrellas, visto, dominada y «Requiere teclado MIDI».
  - **Camino vacío**: un texto que lo explica (Edge Cases).
  - Sin ruta explícita se abre `state.current` en Lecciones.
- [X] T014 [P] [US1] Estilos en `src/styles.css`: selector de niveles, pestañas de camino (reutilizando `.tabs`), filas de elemento y estado bloqueado. Tema claro y oscuro; sin desplazamiento horizontal a 740×360.
- [X] T015 [US1] Comprobar que `#curso/<itemId>` lleva de vuelta al camino de origen: el `back` de `TopBar` es `{ name: "course", level, path }` en `src/screens/CourseItem.tsx`, `src/screens/CourseLesson.tsx` y `src/screens/CourseTip.tsx`.

**Checkpoint**: US1 se puede probar sola (quickstart 1–4).

---

## Phase 4: User Story 2 - Siguiente recomendado (Priority: P1)

**Goal**: una recomendación única con motivo, en el Curso y en «Continuar».

**Independent Test**: tras dos lecciones seguidas, la recomendación cambia de camino; sin MIDI
nunca propone independencia (quickstart 5 y 12).

- [X] T016 [P] [US2] Tests de `recommend` en `src/course/recommend.test.ts` (research R8):
  - **Alumno nuevo**: la primera lección del nivel 1, motivo «Sigue con las lecciones del nivel 1.».
  - **Dos lecciones seguidas en `recent`**: un elemento de Técnica o Canciones del mismo nivel.
  - **Sin MIDI**: nunca un `independence`.
  - **Nivel actual completo**: la prueba del siguiente nivel, con motivo «¿Te atreves con el nivel N?».
  - **Todo hecho**: `null`.
  - **SC-004**: simular 6 pasos marcando como hecho cada recomendación y añadiéndola a `recent`; al menos 2 caminos distintos.
- [X] T017 [US2] Implementar `recommend(levels, st, recent, midiOk)` en `src/course/recommend.ts`, con las reglas 1–5 de research R8 y los motivos fijos. Para una prueba, `itemId` es `test:<n>`. Conectarla en `courseState` (`recommended`) en `src/course/state.ts`.
- [X] T018 [US2] Tarjeta «Siguiente recomendado» arriba de `src/screens/CourseMap.tsx`: camino, título, motivo y botón «Empezar» que abre el elemento (o `#curso/prueba/<n>`) con un toque (SC-001).
- [X] T019 [US2] En `src/screens/Home.tsx`, «Continuar el Curso» usa `continueTarget(cp.last, p.last, state.recommended?.itemId ?? null)` y muestra el título del elemento recomendado (FR-011).

**Checkpoint**: US1 y US2 completas; es la estructura publicable con el contenido actual.

---

## Phase 5: User Story 3 - Escalas con digitación (Priority: P2)

**Goal**: escalas generadas, con los dedos a la vista, el paso del pulgar y tres tempos.

**Independent Test**: escala de Do mayor con la mano derecha: dedos 1‑2‑3‑1‑2‑3‑4‑5, explicación
del pulgar, 3★ a 60 ppm propone 80 (quickstart 6–7).

- [X] T020 [P] [US3] Tests en `src/music/score.test.ts`: una nota con `EventOpts.f = 3` sale en la partitura con `f === 3`; las notas sin `f` siguen con la digitación de `assignFingering`; un acorde respeta `f` por nota si se da.
- [X] T021 [P] [US3] Tests de escalas en `src/course/scales.test.ts`, para las 7 tonalidades × 2 manos de la tabla de research R4:
  - Alturas al subir y bajar: 8 + 7 notas y un silencio de negra; 4 compases de 4/4.
  - `key` correcta y alteraciones de las menores armónicas: Sol♯ en La m y Re♯ en Mi m.
  - Dedos exactos de la tabla (al bajar, invertidos).
  - Mano derecha desde la octava 4 en `n` o `r`; mano izquierda una octava abajo en `l`.
  - `thumbPasses` devuelve las notas del paso del pulgar.
  - `tempoStep` da el primer escalón sin 3★ (2 si todos tienen 3★).
  - `stepForTempo([60,80,100], 85)` da 1, y con 50 da −1.
  - Cada escala supera `validateSong`.
- [X] T022 [US3] Añadir `f?: number` a `EventOpts` en `src/music/types.ts` y respetarlo en `src/music/score.ts`, aplicando `assignFingering` solo a las notas sin `f` (research R5).
- [X] T023 [US3] Implementar `src/course/scales.ts`: `SCALE_TABLE` con la tabla de research R4, `scale(spec, tempo): SongDef` con `f` explícito, `thumbPasses(spec)`, `tempoStep(best, id)` y `stepForTempo(tempos, used)`. Ids `escala-<tonica>-<R|L>`, por ejemplo `escala-bb-L`.
- [X] T024 [US3] En `src/components/Practice.tsx`:
  - Prop `forceFingers`: pasa `showFingers={prefs.showFingers || forceFingers}` a `ScoreView`.
  - Prop `initialTempo`: valor inicial del regulador de tempo.
  - `onPlayResult(result, hands, tempo)`, con el tempo de la lección al terminar.
  - Actualizar los usos actuales para que compilen.
- [X] T025 [US3] En `src/screens/CourseLesson.tsx`, admitir elementos `scale`:
  - Página de explicación generada: texto del paso del pulgar de esa mano y tonalidad, mini partitura y `keys` con dedos, resaltando `thumbPasses`.
  - Ejercicio `scale(spec, tempos[tempoStep])` con `forceFingers` e `initialTempo`.
  - `onPlayResult` → `recordScaleStars(id, stepForTempo(tempos, tempo), stars)`, si el escalón no es −1.
  - `record` del historial con la clave `course:<id>` (FR-025).
  - El resultado indica el siguiente tempo o «Escala dominada».
- [X] T026 [US3] Añadir a `technique` de cada nivel, en `src/course/content.ts`, las escalas de FR-012 (aclaración Q4), mano derecha y luego izquierda:
  - Nivel 1: Do M. Nivel 2: Sol M y Fa M. Nivel 3: Re M y La m. Nivel 4: Mi m y Si♭ M.
  - Tempos `[60, 80, 100]` en los niveles 1–2 y `[72, 96, 120]` en los 3–4.
- [X] T027 [US3] En `src/course/state.ts`, el estado de una escala es `done` con 2★ o más en `@2` y lleva `tempoStep`. Ampliar `src/course/state.test.ts` con estos casos.
- [X] T028 [P] [US3] En `src/screens/CourseMap.tsx`, las filas de escala muestran el tempo actual («60 ppm · siguiente 80») o «Dominada».

**Checkpoint**: Técnica tiene escalas en los 4 niveles (quickstart 6–7).

---

## Phase 6: User Story 4 - Independencia de manos con MIDI (Priority: P2)

**Goal**: ejercicios a dos manos que exigen MIDI, sin bloquear el avance.

**Independent Test**: sin MIDI se escuchan, con aviso y sin poder empezar; con MIDI se puntúan;
al desconectar se detienen (quickstart 8–9).

- [X] T029 [P] [US4] Tests en `src/course/independence.test.ts`:
  - `INDEPENDENCE[2]`, `[3]` y `[4]` tienen al menos 2 ejercicios cada uno.
  - Todos son a dos manos (`r` y `l`) y superan `validateSong`.
  - Los del nivel 2 tienen en la mano izquierda solo blancas o redondas.
  - Los del nivel 4 incluyen dos escalas a dos manos (Do M y Sol M, movimiento paralelo, una octava).
- [X] T030 [P] [US4] Ampliar `src/course/state.test.ts` y `src/course/recommend.test.ts`. Sin MIDI:
  - los `independence` quedan `needsMidi`;
  - no cuentan en el avance de Técnica;
  - no impiden abrir el nivel siguiente (SC-003);
  - nunca se recomiendan.
- [X] T031 [US4] Escribir los ejercicios en `src/course/independence.ts` (FR-017), con ids `indep-<n>-<k>`:
  - Nivel 2: melodía con la mano derecha sobre notas largas de la izquierda (2 ejercicios).
  - Nivel 3: blancas contra negras y negras contra corcheas (2 ejercicios).
  - Nivel 4: ritmos distintos en cada mano (2 ejercicios) y las escalas de Do M y Sol M a dos manos.
- [X] T032 [US4] Añadir los elementos `{ type: "independence", id, song, needsMidi: true }` al final de `technique` de los niveles 2–4 en `src/course/content.ts`.
- [X] T033 [US4] Prop `needsMidi` en `src/components/Practice.tsx` (research R7):
  - **Sin MIDI** (`useMidiContext().status !== "ok"`): solo se puede escuchar; los pasos Aprender y Tocar están deshabilitados; un aviso dice «Este ejercicio necesita un teclado MIDI: con ratón o pantalla no se pueden tocar dos teclas a la vez.», más el texto de `MIDI_HELP` si lo hay y el botón «Conectar teclado MIDI».
  - **Al conectar**, se habilita sin salir.
  - **Si se desconecta durante un intento**: `lesson.stop()` sin `finish`, sin registro en el historial y sin estrellas; se muestra el aviso (FR-020).
- [X] T034 [US4] En `src/screens/CourseItem.tsx`, abrir los elementos `independence` con `Practice`: `needsMidi`, `record` (clave `course:<id>`), `onPlayResult` → `recordCourseStars`, `back` al camino Técnica y `touchCourse`.
- [X] T035 [P] [US4] Estilos del aviso MIDI en `src/styles.css` (colores de aviso del tema y botón visible en móvil apaisado).

**Checkpoint**: quickstart 8–9.

---

## Phase 7: User Story 5 - Lecciones y consejos de los niveles 3 y 4 (Priority: P3)

**Goal**: contenido nuevo y pruebas de los niveles 3 y 4.

**Independent Test**: superar la prueba del nivel 3 y completar una de sus lecciones nuevas
(quickstart 10).

- [X] T036 [P] [US5] Ampliar `src/course/checks.ts` y `src/course/checks.test.ts` (FR-021, FR-022 y SC-005):
  - Los niveles 3 y 4 tienen 4–6 lecciones y 3–4 consejos cada uno.
  - Los niveles 2–4 tienen `test` no vacío, y la prueba del nivel 3 incluye un ejercicio de acordes.
  - Cada nivel tiene al menos 2 escalas por mano o, en el nivel 1, Do M en las dos manos.
  - Los niveles 2–4 tienen al menos 2 `independence`.
  - Los textos cumplen los límites de palabras de 010 y no mencionan «pantalla», «ratón» ni «táctil».
- [X] T037 [P] [US5] Escribir en `src/course/tips.ts` 3–4 consejos por nivel (`level: 3 | 4`) con iconos existentes (`IconId`), según research R12:
  - Nivel 3: «Manos separadas primero», «Escucha el pedal», «Respira con la frase».
  - Nivel 4: «Lento y sin parar», «Marca los dedos difíciles», «Grábate y escúchate».
- [X] T038 [US5] Escribir en `src/course/exercises.ts` los ejercicios de las lecciones nuevas, validados con `validateSong` y con duración dentro de los límites de 010:
  - Nivel 3: dos manos en bloques, 3/4, armaduras de Sol y Fa, pedal (`pedal`, que no puntúa) y ligaduras.
  - Nivel 4: 6/8 (`time: "6/8"`), semicorcheas, dos voces, dos claves y arpegios (`arpFingering`).
- [X] T039 [US5] Escribir en `src/course/exercises.ts` las pruebas `TEST_N3` (lectura, ritmo, posiciones y acordes con mano izquierda: aclaración Q3) y `TEST_N4` (dos manos, 3/4, armadura y pedal). Ids `prueba-n3-<bloque>` y `prueba-n4-<bloque>`, para que `testOutcome` detecte el bloque más flojo.
- [X] T040 [US5] Añadir en `src/course/content.ts` las lecciones de los niveles 3 (4–6) y 4 (4–6), con 1–2 páginas de explicación cada una, los consejos de T037 intercalados y `test: TEST_N3` y `test: TEST_N4`. Títulos de los niveles: 3 «Las dos manos juntas» y 4 «Más allá del 4/4».
- [X] T041 [US5] En `src/screens/CourseTest.tsx`, ajustar los textos de la introducción y del resultado al nivel: «Prueba del nivel N: si ya sabes lo del nivel N‑1, puedes saltarlo».

**Checkpoint**: las cinco historias completas.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T042 [P] Revisar a mano `CourseMap`, una escala, un ejercicio de independencia y una lección nueva en móvil apaisado (740×360) y escritorio, con tema claro y oscuro y notación Do‑Re‑Mi y C‑D‑E (FR-026). Sin desplazamiento horizontal.
  - Comprobado (2026-11-27): sin desplazamiento horizontal a 740×360 en el mapa, los caminos, una escala, independencia, la prueba 3, Inicio y Progreso; tema oscuro en escritorio. Pendiente: tema claro, notación C‑D‑E y tablet.
- [ ] T043 Ejecutar los 13 escenarios de [quickstart.md](quickstart.md), incluido el progreso antiguo (escenario 4), y anotar las desviaciones.
  - Comprobados en el navegador: 2 (en parte), 4, 6 (explicación, dedos y tempo inicial), 7, 8 y 13 (en parte). El resto lo cubren tests unitarios. Pendientes a mano: 5, 9 (con teclado MIDI real), 10, 11 y 12.
- [X] T044 Ejecutar `npm test` y `npm run build`; los dos deben pasar.
- [ ] T045 [P] Revisión humana de los textos nuevos (lecciones, consejos y motivos de la recomendación) antes de publicar (Assumptions de la spec).
- [X] T046 [P] Marcar con ✅ en `old_docs/ROADMAP.md` los puntos de la v0.7 terminados.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T002)**: sin dependencias. T001 deja la enmienda 1.1.0 en la rama.
- **Foundational (T003–T012)**: bloquea todas las historias. Orden interno: tests (T003–T005) →
  T006 → T007 → T008/T009 → T010 → T011 → T012.
- **US1 (T013–T015)**: tras Foundational.
- **US2 (T016–T019)**: tras US1 (la tarjeta va en `CourseMap`). La lógica (T016–T017) puede
  empezar tras Foundational.
- **US3 (T020–T028)**: tras Foundational. T028 toca `CourseMap` (después de T013).
- **US4 (T029–T035)**: tras Foundational. T033 y T024 tocan `Practice.tsx`: hacerlas en serie.
- **US5 (T036–T041)**: tras Foundational; es independiente de US3 y US4 salvo por `content.ts`
  (editar en serie).
- **Polish**: al final.

### Parallel Opportunities

- Foundational: T003, T004 y T005 a la vez.
- US3: T020 y T021 a la vez; T022 y T023 en paralelo (archivos distintos).
- US4: T029 y T030 a la vez; T031 en paralelo con T033.
- US5: T036 y T037 a la vez; T038 y T039 van en el mismo archivo (en serie).
- Entre historias: con Foundational terminada, la lógica pura de US2 (`recommend.ts`), US3
  (`scales.ts`) y US4 (`independence.ts`) se puede desarrollar en paralelo.

---

## Parallel Example: User Story 3

```bash
Task: "Tests de dedo explícito en src/music/score.test.ts"        # T020
Task: "Tests de escalas en src/course/scales.test.ts"              # T021
# después:
Task: "EventOpts.f en src/music/types.ts y score.ts"               # T022
Task: "Generador de escalas en src/course/scales.ts"               # T023
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Setup y Foundational: el Curso de 010 funciona por niveles, sin perder progreso.
2. US1: mapa por niveles y caminos.
3. US2: «Siguiente recomendado».
4. **Parar y validar**: quickstart 1–5 y 12; `npm test` y `npm run build`. Publicable.

### Incremental Delivery

1. MVP (estructura y recomendación).
2. US3: escalas en los 4 niveles.
3. US4: independencia con MIDI.
4. US5: contenido de los niveles 3 y 4.
5. Polish y revisión de textos.

---

## Notes

- Ids estables: `l-*`, `consejo-*`, `hito-*` y `prueba-u2-*` no cambian (FR-024).
- `src/course/` no importa React ni el navegador; el estado MIDI entra como argumento.
- El motor `Lesson` no cambia. Si falla un test de `src/engine/`, es una regresión.
- Hacer un commit por tarea o grupo lógico y validar en cada checkpoint.

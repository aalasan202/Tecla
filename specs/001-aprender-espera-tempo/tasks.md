---

description: "Task list for Aprender con espera a tempo"
---

# Tasks: Aprender con espera a tempo

**Input**: Design documents from `specs/001-aprender-espera-tempo/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/lesson-engine.md](contracts/lesson-engine.md),
[quickstart.md](quickstart.md)

**Tests**: incluidos. La constitución (Principio II) exige tests para todo cambio en
`src/engine/` y `src/state/`. Se escriben antes de implementar y deben fallar primero.

**Organization**: tareas agrupadas por historia de usuario de la spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede hacerse en paralelo (otro archivo, sin dependencias pendientes)
- **[Story]**: historia de usuario de la spec (US1–US4)

## Path Conventions

Proyecto único (SPA): código en `src/`, tests junto al módulo (`*.test.ts`), entorno de Vitest
`node` (sin DOM ni `localStorage`).

---

## Phase 1: Setup

**Purpose**: confirmar que el punto de partida está en verde

- [X] T001 Ejecutar `npm install`, `npm test` y `npm run build` en la raíz y confirmar que todo pasa antes de cambiar código (línea base para SC-004)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: opción en el motor, ajuste persistente y utilidades de test que usan todas las historias

**⚠️ CRITICAL**: ninguna historia puede empezar hasta completar esta fase

- [X] T002 [P] Añadir el campo `learnAtTempo: boolean` a la interfaz `Settings` y `learnAtTempo: false` a los valores por defecto de `settings` en `src/state/settings.ts` ("Defecto `false`"; sin migración: `createStore` mezcla los valores por defecto con lo guardado)
- [X] T003 [P] En `src/engine/lesson.ts`, exportar `interface LessonOptions { atTempo?: boolean }`, añadir un sexto parámetro opcional `options: LessonOptions = {}` al constructor de `Lesson` y un campo `readonly atTempo: boolean` igual a `mode === "learn" && options.atTempo === true` ("`options.atTempo` se ignora si `mode !== \"learn\"`"); sin cambiar aún ningún comportamiento
- [X] T004 En `src/engine/lesson.test.ts`, ampliar `fakeHost` para que `frame(cb)` guarde la última `cb` (y devuelva un id) y exponer un ayudante `tick(ms)` que sume `ms` a `clock.t` y ejecute la `cb` guardada; registrar también las llamadas a `playhead` y `status` para poder comprobarlas. Añadir un test "atTempo se ignora fuera de Aprender" (`new Lesson(score, "play", "both", 80, host, { atTempo: true }).atTempo === false`) (depende de T003)

**Checkpoint**: `npm test` sigue en verde; la opción existe pero no hace nada

---

## Phase 3: User Story 1 - Practicar a tempo con espera (Priority: P1) 🎯 MVP

**Goal**: en Aprender con «A tempo», el cursor avanza al tempo de la pieza, se detiene sobre la
siguiente nota del alumno si aún no la ha tocado y reanuda al tocarla.

**Independent Test**: con «Cinco dedos», tocar todas las notas a tiempo → el cursor no se
detiene; dejar una sin tocar → el cursor se detiene en ella y sigue al tocarla.

### Tests for User Story 1 ⚠️

> Escribir primero y comprobar que fallan. Todos en `src/engine/lesson.test.ts`, dentro de un
> `describe("Aprender a tempo", …)`; usar `song("cinco")`, tempo 60 (1 pulso = 1000 ms),
> `vi.useFakeTimers()` y `tick()` de T004.

- [X] T005 [US1] Test "tocando cada nota a su tiempo el cursor no se detiene": por cada nota, avanzar con `tick` hasta su pulso `n.s` y llamar a `input(n.m)`; comprobar que la posición del cursor (último `playhead`) crece en cada fotograma, que `finish` se llama una vez y que el tiempo total del reloj falso es `≈ (score.total + 0,6) · 1000 ms` (±1 pulso) (SC-001, US1-1/2)
- [X] T006 [US1] Test "sin tocar, el cursor se detiene en la nota pendiente y reanuda al tocarla": tras `start()` hacer `tick` hasta el pulso de la segunda nota sin tocarla (tras tocar la primera), luego varios `tick` más; el `playhead` debe quedarse en `STAFF_LEFT + nota.s · score.px + 16`; tras `input(nota.m)` y un `tick(100)`, el `playhead` debe ser mayor y avanzar 0,1 pulsos (sin salto) (FR-005, FR-006, US1-3/4)
- [X] T007 [US1] Test "tecla equivocada cuenta fallo y no avanza": con el cursor detenido, `input(61)` debe llamar a `flash(61, "wrong", …)`, no mover el `playhead`, y el resultado final con un fallo debe ser `score = n / (n + 1)` con `n = score.notes.length` (FR-007, FR-012, US1-5/6)
- [X] T008 [US1] Test "nota adelantada": antes de que el cursor llegue a la nota siguiente, `input` de esa nota la marca `"hit"` y el cursor pasa por su pulso sin detenerse; la nota posterior a esa no se acepta (cuenta como fallo) hasta completar la actual (FR-004, caso límite "nota tocada antes de tiempo")

### Implementation for User Story 1

- [X] T009 [US1] En `src/engine/lesson.ts`, añadir los campos privados `pos` (pulsos) y `lastFrame` (ms) y, en `start()`, cuando `this.atTempo`: calcular `this.groups = groupByTime(this.active())`, terminar si no hay grupos, poner `pos = 0`, `lastFrame = host.now()`, marcar `"now"` el grupo 0, llamar a `host.guide` con él y arrancar el bucle nuevo `loopLearnTempo` mediante `host.frame`; NO usar `later`/`showGroup` ni la rama "Escucha la otra mano…" (la rama de Aprender sin `atTempo` queda idéntica)
- [X] T010 [US1] Implementar `private loopLearnTempo = (): void => {…}` en `src/engine/lesson.ts` según [data-model.md](data-model.md): `sPendiente = groups[gi]?.[0].s ?? Infinity`; `pos = Math.min(pos + (now − lastFrame) / 1000 / this.spb, sPendiente)`; `lastFrame = now`; `x = STAFF_LEFT + pos · score.px + 16` → `host.playhead(x)` y `host.scrollTo(x, false)`; `host.status(\`Compás ${n} de ${total} · ${fallos}\`, gi < groups.length ? \`Toca: ${label(grupo)}\` : "")`; si `gi >= groups.length && pos > score.total + 0.6` → `complete()`; si no, `this.raf = host.frame(loopLearnTempo)`. `host.click` no se usa
- [X] T011 [US1] En `inputLearn` de `src/engine/lesson.ts`, cuando `this.atTempo` y se completa el grupo actual: hacer `gi++`, marcar `"now"` y guiar el nuevo grupo pendiente (o `guide([])` si no quedan), sin llamar a `playAutos`, `showGroup` ni `later` (el bucle hace avanzar el cursor y termina la pieza); las reglas de acierto / fallo / nota neutra y `mistakes` se mantienen. Con `atTempo` el estado de fallos lo pinta el bucle, así que en ese caso no llamar a `learnStatus()`
- [X] T012 [P] [US1] En `src/screens/LessonScreen.tsx`: añadir en `.controls`, solo cuando `mode === "learn"`, una casilla `<label className="field"><input type="checkbox" …/> A tempo</label>` ligada a `prefs.learnAtTempo` / `settings.set({ learnAtTempo })`; pasar `{ atTempo: prefs.learnAtTempo }` como sexto argumento de `new Lesson(…)`; añadir `prefs.learnAtTempo` a las dependencias del efecto que crea la lección; y mostrar en Aprender con la opción activada el texto de ayuda «La partitura avanza a tempo y se detiene en la nota hasta que la toques.» (dos manos: añadir «Si eliges una sola mano, la otra suena y espera contigo.»)

**Checkpoint**: T005–T008 en verde; «A tempo» funciona en piezas de una mano a su tempo original

---

## Phase 4: User Story 2 - Elegir el tempo para practicar (Priority: P2)

**Goal**: con «A tempo» activado se puede elegir el tempo, también durante la práctica.

**Independent Test**: bajar el tempo a la mitad y comprobar que el cursor tarda el doble en
recorrer un compás, sin reiniciar.

### Tests for User Story 2 ⚠️

- [X] T013 [US2] Test en `src/engine/lesson.test.ts` "cambiar el tempo cambia la velocidad sin salto": `song("cinco")` con `atTempo` a 60 ppm; tras `start()`, tocar la primera nota y, por adelantado, la segunda (pulso 1), para que el cursor avance libre hasta el pulso 2; `tick(500)` → cursor en el pulso 0,5; cambiar `l.tempo = 30`; `tick(1000)` → cursor en el pulso 1,0 (avanza 0,5, no 1), sin retroceder ni saltar (FR-010, US2-2)

### Implementation for User Story 2

- [X] T014 [US2] En `src/screens/LessonScreen.tsx`, cambiar la visibilidad del control Tempo de `mode === "learn" ? "hidden" : "visible"` a oculto solo si `mode === "learn" && !prefs.learnAtTempo` (US2-1). Verificar que `loopLearnTempo` usa `this.spb` en cada fotograma (ya lo hace por T010) y que el efecto existente `lesson.current.tempo = tempo` basta para el cambio en caliente

**Checkpoint**: tempo visible y efectivo en Aprender a tempo; oculto en Aprender libre como hoy

---

## Phase 5: User Story 3 - Acompañamiento de la otra mano a tempo (Priority: P2)

**Goal**: con una sola mano elegida, la otra suena siguiendo al cursor y se pausa con él; los
acordes esperan a estar completos.

**Independent Test**: «Himno a la alegría a dos manos», solo mano derecha, dejar una nota sin
tocar → el acompañamiento se detiene en el mismo punto y sigue al tocarla.

### Tests for User Story 3 ⚠️

- [X] T015 [US3] Test en `src/engine/lesson.test.ts` "el acompañamiento no suena por delante de la nota pendiente": `song("oda2")`, `hands = "R"`, `atTempo`; sin tocar nada, hacer `tick` varias veces; ninguna nota de la mano izquierda con `s ≥` pulso de la primera nota pendiente debe haber llamado a `host.tone`; tras tocar el grupo pendiente y un `tick`, las notas automáticas simultáneas a ese grupo suenan (SC-003, US3-1/2, research R3)
- [X] T016 [US3] Test en `src/engine/lesson.test.ts` "acorde a medias mantiene el cursor detenido": `song("oda2")`, `hands = "both"`, `atTempo`; el primer grupo tiene 2 notas; tocar solo una y hacer `tick` → el `playhead` no pasa del pulso del grupo; tocar la otra y `tick` → avanza (FR-008, US3-3)

### Implementation for User Story 3

- [X] T017 [US3] En `loopLearnTempo` de `src/engine/lesson.ts`, recorrer `score.notes` y, para cada nota automática (`rt[id].auto`) no sonada con `n.s <= pos && n.s < sPendiente` (`sPendiente = Infinity` si no quedan grupos), marcar `played`, llamar a `this.sound(n)`, `host.mark(n.id, "now")` y programar con `later` su `mark(n.id, null)` a `n.d · spb · 900` ms (mismo patrón que `loop`). Calcular `sPendiente` después de procesar las pulsaciones del fotograma para que las automáticas simultáneas suenen en el mismo fotograma en que se completa el grupo

**Checkpoint**: piezas a dos manos funcionan en «A tempo» con una o con ambas manos

---

## Phase 6: User Story 4 - Recordar la preferencia (Priority: P3)

**Goal**: «A tempo» se recuerda entre sesiones y piezas.

**Independent Test**: activar «A tempo», recargar, abrir otra canción en Aprender → sigue activado.

### Tests for User Story 4 ⚠️

- [X] T018 [P] [US4] Crear `src/state/settings.test.ts`: con `vi.stubGlobal("localStorage", …)` (un objeto con `getItem`/`setItem` sobre un `Map`) y `vi.resetModules()` + `await import("./settings")`, comprobar que (a) unos ajustes guardados sin `learnAtTempo` cargan con `learnAtTempo === false`, y (b) tras `settings.set({ learnAtTempo: true })`, una nueva importación del módulo lee `true` (FR-013, US4-1)

### Implementation for User Story 4

- [X] T019 [US4] Si T018 falla, corregir `src/state/settings.ts` hasta que pase (con T002 y T012 debería pasar sin cambios: la casilla escribe en `settings`, que persiste en `tecla-settings`)

**Checkpoint**: todas las historias funcionan de forma independiente

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T020 Ejecutar `npm test` y `npm run build`; confirmar que los tests existentes de Aprender y Tocar en `src/engine/lesson.test.ts` pasan sin modificar (SC-004)
- [X] T021 Recorrer la prueba manual de [quickstart.md](quickstart.md) (pasos 1–11) con `npm run dev`, incluidos teclado del ordenador, MIDI si hay, y vista de móvil apaisado sin desplazamiento (SC-006, FR-014)
- [X] T022 [P] Revisar `src/engine/lesson.ts`: el modo a tempo no importa nada del DOM ni de React (Principio I) y la rama de Aprender sin `atTempo` no ha cambiado
- [X] T023 [P] Marcar «Aprender con espera a tempo» como hecho en la sección v0.4 de `old_docs/ROADMAP.md` (o en la hoja de ruta vigente si se ha movido)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → historias → **Polish (Phase 7)**
- T004 depende de T003. T002 y T003 son independientes.

### User Story Dependencies

- **US1 (P1)**: tras Phase 2. Base de US2 y US3 (el bucle `loopLearnTempo`).
- **US2 (P2)**: tras US1 (T013 necesita el bucle). Solo toca la visibilidad en la pantalla.
- **US3 (P2)**: tras US1 (amplía `loopLearnTempo`). Independiente de US2.
- **US4 (P3)**: tras Phase 2 (T002); independiente del motor. Puede hacerse en paralelo con US1.

### Within Each User Story

- Tests primero (deben fallar) → motor → pantalla.
- Los tests de una historia comparten `src/engine/lesson.test.ts`: van en secuencia, sin [P].

### Parallel Opportunities

- T002 ∥ T003 (archivos distintos).
- T012 (pantalla) ∥ T009–T011 (motor), una vez fijada la API de T003.
- T018 (US4, `settings.test.ts`) ∥ toda la fase de US1.
- US2 ∥ US3 tras US1, salvo que ambas tocan `lesson.test.ts`: coordinar si se hacen a la vez.
- T022 ∥ T023 en el pulido.

---

## Parallel Example: User Story 1

```bash
# Tras T003, en paralelo:
Task: "T009–T011: bucle y entrada de Aprender a tempo en src/engine/lesson.ts"
Task: "T012: casilla «A tempo», opción y ayuda en src/screens/LessonScreen.tsx"

# Y, independiente de US1:
Task: "T018: persistencia de learnAtTempo en src/state/settings.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2 (T001–T004)
2. US1 (T005–T012)
3. **STOP and VALIDATE**: pasos 1–5 y 7 de [quickstart.md](quickstart.md) con «Cinco dedos»
4. Publicable: piezas de una mano a su tempo original

### Incremental Delivery

1. MVP (US1)
2. + US2: tempo ajustable → validar paso 6 del quickstart
3. + US3: piezas a dos manos → validar paso 8
4. + US4: preferencia recordada → validar paso 9
5. Pulido (T020–T023) y merge a `main` (despliegue automático)

---

## Notes

- Cada tarea cita su requisito (FR/SC/US) para la trazabilidad.
- Hacer commit tras cada tarea o grupo lógico; `main` siempre publicable.
- No cambiar el formato de canciones, `Mode`, `LastSession` ni la pantalla de progreso.

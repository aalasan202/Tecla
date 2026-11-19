---

description: "Task list for Bucle de compases"
---

# Tasks: Bucle de compases

**Input**: Design documents from `specs/004-bucle-compases/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/lesson-engine.md](contracts/lesson-engine.md),
[quickstart.md](quickstart.md)

**Tests**: incluidos. La constitución (Principio II) exige tests para todo cambio en
`src/engine/` y `src/music/`. Se escriben antes de implementar y deben fallar primero.

**Organization**: tareas agrupadas por historia de usuario de la spec (US1–US4).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede hacerse en paralelo (otro archivo, sin dependencias pendientes)
- **[Story]**: historia de usuario de la spec

## Path Conventions

Proyecto único (SPA): código en `src/`, tests junto al módulo (`*.test.ts`), entorno de Vitest
`node` (sin DOM). En los tests del motor se usa `fakeHost()` de `src/engine/lesson.test.ts`
con `clock.t` controlado y `vi.useFakeTimers()`; para avanzar fotogramas, guardar el `cb` que
recibe `host.frame` y llamarlo tras mover `clock.t` (como en los tests de «A tempo»).

Notación usada abajo (ver [data-model.md](data-model.md)): `start = from·bar`,
`end = (to+1)·bar`, `L = end − start`, `P = L` (Escuchar) o `L + bar` (Tocar),
`k = floor(g / P)`, `local = g − k·P` con `g` = pulsos desde el fin de la cuenta atrás.

---

## Phase 1: Setup

**Purpose**: confirmar que el punto de partida está en verde

- [X] T001 Crear y cambiar a la rama `004-bucle-compases` desde `main`; ejecutar `npm install`, `npm test` y `npm run build` en la raíz y confirmar que todo pasa (línea base para SC-004)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tipos, límites del fragmento y piezas puras que usan todas las historias

**⚠️ CRITICAL**: ninguna historia puede empezar hasta completar esta fase

### Tests (escribir primero, deben fallar)

- [X] T002 [P] Crear `src/engine/fragment.test.ts` con tests de: `emptySelection` es `{ on: false, a: null, b: null }`; `toggleLoop(sel, true)` activa con `a = b = null` y `toggleLoop(sel, false)` vuelve a `emptySelection`; `tapMeasure` sin bucle activado no cambia nada; primer toque fija `a`, segundo fija `b`; `rangeOf` devuelve `{ from: min(a,b), to: max(a,b) }` (tocar 5 y luego 2 → `{2,5}`) y `null` si falta `a` o `b` o `on` es `false`; tocar el mismo compás dos veces → `{ from: i, to: i }`; con fragmento completo, un toque `k` deja `a = k, b = null`; `nudge`/`canNudge` nunca producen `from < 0`, `to ≥ measures` ni `from > to` (p. ej. `{0,0}` con inicio −1 → sin cambio y `canNudge` falso; `{2,3}` inicio +1 → `{3,3}`, inicio +1 otra vez → sin cambio)
- [X] T003 [P] Añadir a `src/music/score.test.ts` tests de `measureAt(score, x)`: en `cinco` (4/4, `px` 50) `x = STAFF_LEFT + 2` → 0, justo antes de `STAFF_LEFT + 4·50 + 2` → 0, justo después → 1; en `minueto` (3/4, `px` 64) el límite del compás 1 está en `STAFF_LEFT + 3·64 + 2`; `x` negativo → 0 y `x` más allá del final → `measures − 1`
- [X] T004 [P] Añadir a `src/engine/lesson.test.ts` un `describe("Bucle — límites")` con tests de: `new Lesson(score, mode, hands, tempo, host, { loop: { from: 3, to: 1 } }).loop` es `{ from: 1, to: 3 }` (se intercambia); `{ from: -2, to: 99 }` se recorta a `[0, measures − 1]`; sin `loop`, `l.loop === null`

### Implementation

- [X] T005 [P] Crear `src/engine/fragment.ts` con `FragmentSelection { on: boolean; a: number | null; b: number | null }`, `emptySelection`, `toggleLoop`, `tapMeasure`, `nudge(sel, edge: "from" | "to", delta: 1 | -1, measures)`, `canNudge` y `rangeOf(sel): LoopRange | null`, según [contracts/lesson-engine.md §2](contracts/lesson-engine.md); funciones puras sin DOM (hace pasar T002). `nudge` opera sobre el rango ordenado y lo guarda como `a = from, b = to`
- [X] T006 [P] Añadir `measureAt(score: Score, x: number): number` en `src/music/score.ts`: `floor((x − STAFF_LEFT − 2) / (bar · px))` recortado a `[0, measureCount(score) − 1]` (hace pasar T003)
- [X] T007 En `src/engine/lesson.ts`: exportar `LoopRange { from: number; to: number }` y `LoopSummary { reps: number; best: LessonResult; last: LessonResult }`; añadir `loop?: LoopRange` a `LessonOptions`; en el constructor normalizar (intercambiar si `from > to`, recortar a `[0, measures − 1]`) y exponer `readonly loop: LoopRange | null`; calcular campos privados `start`, `end` (sin bucle: `0` y `score.total`); hacer que `active()` y la generación de notas automáticas consideren solo notas con `start ≤ n.s < end` mediante un helper `inRange(n)`. Sin bucle, el comportamiento no cambia (hace pasar T004; los tests existentes siguen en verde)

**Checkpoint**: `npm test` en verde; selección, `measureAt` y límites listos

---

## Phase 3: User Story 1 - Elegir un fragmento y repetirlo en bucle (Priority: P1) 🎯 MVP

**Goal**: en Aprender (espera libre), marcar dos compases en la partitura y repetir solo ese
fragmento hasta pulsar Parar; desactivar el bucle vuelve a la pieza entera.

**Independent Test**: en `cinco`, marcar los compases 2–3, Empezar en Aprender, tocar sus notas
y comprobar que tras la última se vuelve a la primera del compás 2; ninguna nota fuera del
fragmento aparece como pendiente (quickstart, pasos 1–2).

### Tests for User Story 1 ⚠️

- [X] T008 [US1] Añadir a `src/engine/lesson.test.ts` un `describe("Bucle — Aprender")` con tests de: con `loop: { from: 2, to: 2 }` en `cinco` (el compás 2 solo tiene una nota), el primer grupo guiado (`host.guide`) es el de la primera nota con `n.s ≥ 8` y nunca se guía una nota fuera de `[8, 12)`; tras tocar todas las notas del fragmento y `vi.runAllTimers()`, se vuelve a guiar el primer grupo del fragmento, `host.mark(id, null)` se llama para todas las notas del fragmento y `finished` sigue vacío; una tecla fuera del fragmento cuenta como fallo; con `pregunta` y mano `"L"` y un fragmento donde solo toca la derecha, `start()` deja `running === false` y llama a `host.status("No hay notas de esta mano en el fragmento", "Elige otros compases u otra mano")`

### Implementation for User Story 1

- [X] T009 [US1] En `src/engine/lesson.ts`, Aprender libre con bucle: en `start()`, si `groups` está vacío y hay bucle, emitir el estado de T008 y salir sin poner `running = true` (sin bucle, mantener el `complete()` actual); el «Escucha la otra mano…» inicial usa `playAutos(start, first)` y el retraso `(first − start)·spb`; en `inputLearn`, al completar el último grupo con bucle, llamar a `playAutos(from, end)` y, pasado `(end − from)·spb` (mín. 300 ms), a un nuevo `nextRepetition()` en lugar de `complete()`. `nextRepetition()` reinicia `played`/`done`/`judged` y marcas de las notas del fragmento, `gi = 0`, y vuelve a mostrar el primer grupo (o el acompañamiento previo) (hace pasar T008)
- [X] T010 [P] [US1] En `src/components/Staff.tsx`, añadir props opcionales `loop?: { from: number; to: number | null } | null` y `onMeasure?: (i: number) => void`: dibujar, antes de las líneas del pentagrama, un `<rect className="loop-range">` desde `STAFF_LEFT + from·bar·px + 2` hasta `STAFF_LEFT + ((to ?? from) + 1)·bar·px + 2` y alto `top − 18 … bottom + 30`; si hay `onMeasure`, añadir `onClick` al `<svg>` que calcula `x = e.clientX − svg.getBoundingClientRect().left` (el rectángulo del `<svg>` ya se mueve con el scroll del contenedor, así que no se suma `scrollLeft`) y llama `onMeasure(measureAt(score, x))`, y clase `pickable` en el `<svg>`. Sin estas props, nada cambia
- [X] T011 [P] [US1] En `src/styles.css`, estilos `.staff .loop-range` (fondo de acento translúcido, legible en tema claro y oscuro con las variables existentes), `.staff.pickable { cursor: pointer }` y el grupo de controles del bucle en `.controls` sin desbordar en móvil apaisado
- [X] T012 [US1] En `src/screens/LessonScreen.tsx`: estado `sel` (`FragmentSelection`, inicial `emptySelection`) y `loopRange = useMemo(() => rangeOf(sel))`; casilla **«Bucle»** en `.controls` (los tres pasos) con `toggleLoop`; con el bucle activado pasar a `Staff` `loop` (`{ from: min, to: max }`, o `{ from: a, to: null }` si solo hay `a`) y `onMeasure={(i) => setSel((s) => tapMeasure(s, i))}`; mostrar «Compases X–Y» (base 1) cuando hay rango; mientras no esté completo y no corre la práctica, estado «Pulsa en la partitura el compás donde empieza el fragmento» / «…donde acaba»; pasar `{ atTempo, loop: loopRange ?? undefined }` al crear la `Lesson` y añadir `loopRange?.from, loopRange?.to` a las dependencias del efecto (cambiar el fragmento para la práctica, FR-016). Sacar `recordSession({ songId, mode, hands, progress: … })` de ese efecto a un `useEffect` propio con dependencias `[songId, mode, hands]`, para que cambiar el fragmento (o «A tempo») no reescriba `progress.last` (data-model, «Efecto en datos persistentes»)
- [X] T013 [US1] En `src/screens/LessonScreen.tsx`: tras `l.start()`, `setRunning(l.running)` (FR-017); `saveAttempt` con `l.loop` solo llama a `addPractice` (no a `recordSession`); el `finish` nunca llega con bucle, y al pulsar Parar con bucle se mantiene el fragmento marcado (US1-4)

**Checkpoint**: MVP — bucle de Aprender (espera libre) usable de punta a punta

---

## Phase 4: User Story 2 - El bucle en los tres pasos (Priority: P1)

**Goal**: el mismo fragmento se respeta en Escuchar, Aprender «A tempo» y Tocar (con cuenta
atrás una vez y compás de descanso con metrónomo), con acompañamiento limitado al fragmento.

**Independent Test**: marcar un fragmento y recorrer Escuchar → Aprender → Tocar sin volver a
marcarlo (quickstart, pasos 4–5, 8–9).

### Tests for User Story 2 ⚠️

- [X] T014 [US2] Añadir a `src/engine/lesson.test.ts` un `describe("Bucle — Escuchar y Tocar")` con tests de: Escuchar con `loop {1,1}` en `cinco` a 60 ppm, avanzando fotogramas 3 períodos, ninguna llamada a `host.tone` corresponde a una nota con `n.s` fuera de `[4, 8)` y la primera nota del fragmento suena 3 veces; Tocar a 60 ppm (`P = 8` pulsos): `host.click` se llama en cada pulso desde la cuenta atrás sin huecos durante ≥ 2 repeticiones y con `strong` en `local % bar === 0`; durante `local ∈ [L, P)` el estado es `Otra vez… n`; la 2.ª repetición juzga la primera nota en `g = P` (`clock.t = (COUNT_IN + P)·1000`) como «perfect»; una pulsación en `g = P − 0.3` cuenta como acierto de esa nota; una nota del alumno que cruza `end` llama a `tone` con duración `≤ (end − n.s)·spb·0.95`; nunca se llama a `finish`; Tocar con `pregunta`, mano `"L"` y `loop: { from: 0, to: 1 }` (solo toca la derecha): `start()` deja `running === false`, emite el estado de R7 y no llama a `click`
- [X] T015 [US2] Añadir a `src/engine/lesson.test.ts` tests de: Aprender «A tempo» con bucle — tras tocar todas las notas del fragmento y avanzar hasta `pos ≥ end`, el siguiente `playhead` es `STAFF_LEFT + start·px + 16` y se vuelve a guiar el primer grupo; una mano (`oda2`, mano `"R"`, bucle) en Tocar — solo suenan automáticas con `start ≤ n.s < end` y vuelven a sonar en la repetición siguiente

### Implementation for User Story 2

- [X] T016 [US2] En `src/engine/lesson.ts`: en `start()`, con bucle en Tocar, si `active()` está vacío, emitir `host.status("No hay notas de esta mano en el fragmento", "Elige otros compases u otra mano")` y salir sin poner `running = true`. `loop()` con bucle: calcular `g` (el `beat()` actual); si `g < 0` (cuenta atrás), mantener el comportamiento actual (cursor en `start`, un clic por pulso, «Preparados… n») y calcular `k`/`local` solo con `g ≥ 0`; `P` según el paso, `k` y `local`; posición de cursor `start + min(local, L)` (en el descanso, `start`); sonido de notas de Escuchar/automáticas por repetición (usar `played` reiniciado en cada repetición y `local ≥ n.s − start`); metrónomo con `floor(g)` y fuerte si `floor(local) % bar === 0`, también en el descanso; marcar fallos con `local > n.s − start + HIT_WINDOW`; guía con notas de la repetición actual; estado `Otra vez… ${ceil(P − local)}` en el descanso; cerrar la repetición una sola vez por `k` con `nextRepetition()`: en Tocar al pasar `local ≥ L + HIT_WINDOW + 0.15`; en Escuchar cuando `k` es mayor que el de la última repetición cerrada, antes de hacer sonar las notas del fotograma; no llamar a `complete()` con bucle; al empezar cada repetición, `scrollTo` al compás de inicio (hace pasar T014)
- [X] T017 [US2] En `src/engine/lesson.ts`, `inputPlay` con bucle: comparar contra `local` (o `local − P` si `local > P − HIT_WINDOW`) en vez de `beat`, solo entre notas del fragmento; `sound(n)` recorta la duración a `min(n.d, end − n.s)` (FR-011) (hace pasar el resto de T014)
- [X] T018 [US2] En `src/engine/lesson.ts`, `loopLearnTempo` con bucle: `start()` pone `pos = start`; cuando no quedan grupos y `pos ≥ end`, `nextRepetition()` vuelve `pos = start`, reinicia `gi` y marca el grupo pendiente; las automáticas usan `inRange` (hace pasar T015)
- [X] T019 [US2] En `src/screens/LessonScreen.tsx`, comprobar que `sel` sobrevive a cambiar de paso, mano y tempo (vive en `LessonView`, no se resetea en el efecto) y que salir de la lección lo descarta (`key={song.id}`); en Tocar con bucle, el texto de ayuda de `HINTS` menciona el compás de descanso («Entre repeticiones hay un compás de descanso para volver a colocar la mano.») cuando hay rango

**Checkpoint**: bucle completo en los tres pasos

---

## Phase 5: User Story 3 - Ver cómo va cada repetición (Priority: P2)

**Goal**: número de repetición y resultado de la anterior durante la práctica; resumen al parar.

**Independent Test**: tres repeticiones en Tocar fallando solo en la primera; el contador muestra
3 y la última refleja el acierto completo (quickstart, paso 6).

### Tests for User Story 3 ⚠️

- [X] T020 [US3] Añadir a `src/engine/lesson.test.ts` un `describe("Bucle — repeticiones")` con tests de: el texto de `host.status` empieza por `Repetición 1` y, desde la 2.ª, contiene `anterior NN %` con el porcentaje de la anterior (Aprender y Tocar); en Escuchar el estado es `Repetición k · Compás X de Y` sin resultado; `loopSummary()` es `null` antes de completar ninguna repetición y en Escuchar; tras 3 repeticiones de Aprender (1 fallo en la 1.ª, 0 en las demás) `reps === 3`, `best.score === 1` y `last.score === 1`; el resultado por repetición usa el criterio de `result()` contando solo fallos/teclas extra de esa repetición

### Implementation for User Story 3

- [X] T021 [US3] En `src/engine/lesson.ts`: contador `rep` (desde 1), lista de resultados por repetición; `nextRepetition()` calcula el resultado de la que termina (reutilizar el cálculo de `result()` sobre notas del fragmento y contadores de la repetición) y luego pone a cero `mistakes`/`extra`; prefijo de estado `Repetición k` (+ `· anterior NN %`) en `learnStatus`, `loopLearnTempo` y `loop`; `loopSummary(): LoopSummary | null` (hace pasar T020)
- [X] T022 [US3] En `src/screens/LessonScreen.tsx`, al pulsar Parar con bucle: tras `l.stop()` leer `l.loopSummary()`; si no es `null`, `setResult` con la mejor (`score`, `stars`) y un mensaje `"${reps} repeticiones · mejor ${best} % · última ${last} %"`; el panel de resultado oculta «Siguiente paso» y «Repetir» vuelve a empezar el bucle; no llamar a `recordStars` (SC-005)

**Checkpoint**: repeticiones medibles y resumen al parar

---

## Phase 6: User Story 4 - Ajustar el fragmento rápidamente (Priority: P3)

**Goal**: botones ±1 compás para inicio y fin sin desactivar el bucle.

**Independent Test**: con 3–4 marcado, «fin +» lo deja en 3–5 (quickstart, paso 3).

### Implementation for User Story 4

- [X] T023 [US4] En `src/screens/LessonScreen.tsx`, con rango completo, mostrar junto a «Compases X–Y» cuatro botones con `aria-label` («Inicio un compás antes», «Inicio un compás después», «Fin un compás antes», «Fin un compás después») que llaman a `nudge` y se deshabilitan con `canNudge(sel, edge, delta, measureCount(score))`; cambiar el rango con la práctica en marcha la detiene por la dependencia del efecto (T012)

**Checkpoint**: todas las historias funcionales

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T024 Ejecutar `npm test` y `npm run build` y corregir lo que falle (incluidos los tests anteriores sin modificar, SC-004)
- [X] T025 Recorrer [quickstart.md](quickstart.md) §2 completo en escritorio y en móvil apaisado (o modo responsive): fiabilidad del toque en la partitura y que los controles del bucle no provocan desplazamiento (SC-006, FR-018)
- [X] T026 [P] Actualizar `specs/004-bucle-compases/spec.md`: quitar «pendiente de confirmar» de la aclaración del compás de descanso cuando la persona responsable lo confirme, o ajustar spec y tareas si elige otra opción

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: tras Setup; bloquea todas las historias
- **US1 (Phase 3)**: tras Foundational
- **US2 (Phase 4)**: tras Foundational; usa `nextRepetition()` de T009 y la UI de T012 para probar a mano
- **US3 (Phase 5)**: tras US1 (amplía `nextRepetition()`); para Tocar, tras US2
- **US4 (Phase 6)**: tras T012
- **Polish**: al final

### Within Each User Story

- Tests antes que la implementación, y deben fallar primero
- Motor antes que pantalla
- Las tareas que tocan `src/engine/lesson.ts` o `src/screens/LessonScreen.tsx` son secuenciales entre sí

### Parallel Opportunities

- T002, T003 y T004 (tres archivos de test distintos) en paralelo; luego T005 y T006 en paralelo con T007
- En US1, T010 (`Staff.tsx`) y T011 (`styles.css`) en paralelo con T008–T009 (motor)
- T026 en paralelo con T024–T025

---

## Parallel Example: Foundational + User Story 1

```bash
# Tests de la fase 2 a la vez:
Task: "Tests de selección en src/engine/fragment.test.ts"
Task: "Tests de measureAt en src/music/score.test.ts"
Task: "Tests de límites del bucle en src/engine/lesson.test.ts"

# US1: interfaz mientras se hace el motor:
Task: "Resaltado y toque de compás en src/components/Staff.tsx"
Task: "Estilos del fragmento en src/styles.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2
2. Phase 3 (US1): bucle en Aprender con selección en la partitura
3. **STOP and VALIDATE**: quickstart pasos 1–2

### Incremental Delivery

1. Setup + Foundational
2. US1 → validar → commit
3. US2 → validar Escuchar y Tocar → commit
4. US3 → validar repeticiones y resumen → commit
5. US4 → validar ±1 → commit
6. Polish → integrar en `main` (despliegue automático)

---

## Notes

- Sin `options.loop`, ningún camino del motor debe cambiar: comprobar tras cada tarea del motor que los tests anteriores siguen en verde
- No llamar a `recordStars` ni `recordSession` con bucle; sí a `addPractice`
- Commit tras cada fase

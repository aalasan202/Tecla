---

description: "Task list for Lección en móvil apaisado"
---

# Tasks: Lección en móvil apaisado

**Input**: Design documents from `specs/005-leccion-movil-apaisado/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/lesson-layout.md](contracts/lesson-layout.md),
[quickstart.md](quickstart.md)

**Tests**: incluidos solo para las funciones puras de `src/ui/layout.ts` (plan, R8). El resto
es presentación: se verifica a mano (Principio II) con [quickstart.md](quickstart.md). El motor
(`src/engine/`) no se toca y sus tests no cambian.

**Organization**: tareas agrupadas por historia de usuario de la spec (US1–US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede hacerse en paralelo (otro archivo, sin dependencias pendientes)
- **[Story]**: historia de usuario de la spec

## Path Conventions

Proyecto único (SPA): código en `src/`, tests junto al módulo (`*.test.ts`), Vitest con entorno
`node` (sin DOM). «Modo compacto» = `(orientation: landscape) and (max-height: 500px)`
([research.md](research.md), R1). Fuera del modo compacto nada debe cambiar (FR-013, SC-005):
toda prop nueva es opcional y todo estilo nuevo va dentro de esa media query o de la clase
`.lesson.compact`.

---

## Phase 1: Setup

**Purpose**: línea base en verde

- [X] T001 En la rama `005-leccion-movil-apaisado`, ejecutar `npm test` y `npm run build` en la raíz y confirmar que todo pasa (línea base); hacer captura de la lección en escritorio 1280 × 800 y tablet 1024 × 768 (Cinco dedos y Himno a la alegría a dos manos, paso Aprender) para comparar al final (SC-005)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: funciones puras de disposición y detección del modo compacto, que usan todas las historias

**⚠️ CRITICAL**: ninguna historia puede empezar hasta completar esta fase

### Tests (escribir primero, deben fallar)

- [X] T002 [P] Crear `src/ui/layout.test.ts` con tests de `fitScale(content, avail, min = 0.55)`: `fitScale(200, 120)` → 0.6; `fitScale(100, 300)` → 1 (nunca amplía); `fitScale(400, 100)` → 0.55 (mínimo); `content ≤ 0` o `avail ≤ 0` → 1; y de `keyScroll({ targets, whites, keyW, view, left, margin = 1 })`: `targets` vacío → `left`; con 27 teclas de 28 (`content` 756) y `view` 600, `left` 0 y `targets` [3] → 0 (ya se ve); `targets` [25] → valor que deja la tecla 25 y una de margen (26) dentro: `26·28 + 28 − 600` = 156; `targets` [1] con `left` 400 → `(1 − 1)·28` = 0; el resultado siempre en `[0, max(0, whites·keyW − view)]`; `targets` [2, 24] (no caben juntas en 600) → prioriza la más grave (deja visible la 2 con margen)

### Implementation

- [X] T003 [P] Crear `src/ui/layout.ts` con `fitScale` y `keyScroll` según [contracts/lesson-layout.md §1](contracts/lesson-layout.md); funciones puras sin DOM (hace pasar T002)
- [X] T004 [P] Crear `src/ui/useCompactLesson.ts` con `export const COMPACT_QUERY = "(orientation: landscape) and (max-height: 500px)"` y `useCompactLesson(): boolean` que lee `window.matchMedia(COMPACT_QUERY)` al montar y se actualiza con su evento `change` (limpiar el listener al desmontar); si `typeof window === "undefined"` o no hay `matchMedia`, devuelve `false`

**Checkpoint**: `npm test` en verde con los tests nuevos

---

## Phase 3: User Story 1 - Practicar viendo partitura y teclado a la vez (Priority: P1) 🎯 MVP

**Goal**: en modo compacto, la lección es una rejilla de altura fija con fila de práctica
(Atrás, pasos, mano, Empezar/Parar), partitura escalada, estado de una línea y teclado, sin
desplazamiento de página.

**Independent Test**: en 640 × 320, «Himno a la alegría a dos manos»: recorrer los tres pasos;
la página nunca se desplaza y partitura (dos pentagramas), estado, teclado y Empezar/Parar
están siempre visibles (quickstart, pasos 1, 2, 6, 7).

### Implementation for User Story 1

- [X] T005 [P] [US1] En `src/components/Staff.tsx`, añadir prop opcional `fit?: boolean`. Con `fit`: (a) envolver pentagramas y notas en un `<g ref={content}>` y, en un `useLayoutEffect` con dependencias `[score, showNames, showFingers, notation]`, medir `content.current.getBBox()` y guardar `{ y: bbox.y − 6, h: bbox.height + 12 }`; (b) con un `ResizeObserver` sobre `.staff-wrap` leer su `clientHeight` como `avail`; (c) `scale = fitScale(h, avail)` de `src/ui/layout.ts`; (d) `<svg>` con `viewBox={\`0 ${y} ${width} ${h}\`}`, `width={width·scale}` y `height={h·scale}`; (e) `scrollTo(x, smooth)` usa `x·scale` en lugar de `x`; (f) el `onClick` del bucle llama `onMeasure(measureAt(score, x / scale))`. Sin `fit`, el `viewBox`, el tamaño, `scrollTo` y el clic quedan exactamente como hoy (scale = 1, viewBox `0 0 width height`). `setPlayhead` no cambia (unidades del `viewBox`)
- [X] T006 [P] [US1] En `src/components/Keyboard.tsx`, añadir prop opcional `fit?: boolean`. Con `fit`: el `.kb` usa `height: 100%` (ignora `height`), `minWidth = whites.length · 28` (en vez de 34) y no pinta las letras (`letters` efectivo `false`); el contenedor `.kb-wrap` recibe la clase `fit` y un `ref`; en un `useEffect` con dependencia `[guide, whites]`, si `wrap.scrollWidth > wrap.clientWidth`, calcular los índices de tecla blanca de `guide` (una negra `m` cuenta como el índice de `m − 1`), `keyW = wrap.scrollWidth / whites.length` y asignar `wrap.scrollLeft = keyScroll({ targets, whites: whites.length, keyW, view: wrap.clientWidth, left: wrap.scrollLeft })`. Sin `fit`, sin cambios
- [X] T007 [P] [US1] En `src/styles.css`, al final de la sección «lección», un bloque `@media (orientation: landscape) and (max-height: 500px)` con reglas bajo `.lesson.compact`: `body:has(.lesson.compact)` con relleno `max(6px, env(safe-area-inset-*))` en los cuatro lados; `.lesson.compact` como `display: grid; height: calc(100dvh − arriba − abajo); grid-template-rows: 44px minmax(0, 1fr) auto clamp(110px, 34dvh, 170px); gap: 6px`; `.board` como `display: contents` o rejilla de dos filas para que la partitura ocupe la fila `1fr` y la barra de estado la suya; `.staff-wrap` con `height: 100%; overflow-x: auto; overflow-y: hidden`; `.statusbar` de una línea (`flex-wrap: nowrap`, alto 24, `padding: 2px 12px`, cada `span`/`strong` con `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`); `.kb-wrap.fit` y `.kb` con `height: 100%`; `.practice-row` en una línea (`display: flex; gap: 6px; align-items: center; flex-wrap: nowrap; min-width: 0`); pasos compactos (`.modes.compact .mode` alto 40, el seleccionado muestra número y nombre y los demás solo el número); mano compacta (`.seg.compact`, «Ambas» + dos puntos de color, botones de 40 × 40); todos los botones de la fila con zona táctil ≥ 40 × 40 (FR-010). Ninguna regla fuera de `.lesson.compact`
- [X] T008 [US1] En `src/screens/LessonScreen.tsx`: `const compact = useCompactLesson()`; clase `compact` en `.screen.lesson` cuando lo es. Con `compact`: no renderizar `<TopBar>` ni `.lesson-head` (línea informativa) ni `.hint` ni `.controls`; renderizar en su lugar `<div className="practice-row">` con: botón Atrás (`icon-btn`, `aria-label="Atrás"`, `goBack({ name: "songs" })` como hace `TopBar`), selector de pasos con clase `compact` (cada botón con `aria-label` = nombre completo del paso; el texto visible del no seleccionado es solo el número), selector de mano con clase `compact` solo si `score.twoHands` («Ambas» y dos botones de punto con `aria-label` «Derecha» / «Izquierda», `aria-pressed` como hoy) y el botón Empezar/Parar (`toggleRun`). Pasar `fit` a `<Staff>` y a `<Keyboard>`. Sin `compact`, el JSX actual sin cambios. `compact` no entra en las dependencias del efecto que crea la `Lesson` (data-model: «Cambiar `compact` MUST NOT recrear la `Lesson`»). Hasta US2, en modo compacto Bucle, tempo, «A tempo», nombres, dedos y ayuda no se muestran (provisional)

**Checkpoint**: MVP — en 640 × 320 se practica sin desplazamiento de página; escritorio igual que en T001

---

## Phase 4: User Story 2 - Controles de la lección compactos y al alcance (Priority: P1)

**Goal**: panel de opciones (tempo, «A tempo», nombres, dedos, ayuda, título, MIDI, Ajustes) y
Bucle en la fila con rango «X–Y ▾» que abre los ±1.

**Independent Test**: en 640 × 320, cambiar a Tocar, mano derecha, subir el tempo, activar el
bucle y marcar 2–3, mover el fin con «+», activar nombres de nota: todo alcanzable en ≤ 2
toques y sin desplazamiento (quickstart, pasos 2–4, 12).

### Implementation for User Story 2

- [X] T009 [P] [US2] Crear `src/components/Popover.tsx` con `Popover({ open, onClose, label, anchor, children })` según [contracts/lesson-layout.md §3](contracts/lesson-layout.md): si `open`, renderiza una capa transparente a pantalla completa (`.popover-backdrop`, un `pointerdown` en ella llama `onClose`) y una caja `.popover` con `role="dialog"`, `aria-label={label}`, clase `start`/`end` según `anchor`, un botón «Cerrar» (`aria-label="Cerrar"`) y `children`; Escape (`keydown` en `document`, solo mientras está abierto) llama `onClose`. No captura otras teclas (las del teclado del ordenador siguen llegando a `Keyboard`)
- [X] T010 [P] [US2] Extraer de `src/components/TopBar.tsx` el chip de estado MIDI, el chip «Sin conexión» y el párrafo `.midihelp` a un componente exportado `ConnectionStatus` (mismo marcado, mismo `onClick` con `ensureAudio()` y `midi.connect()`) que `TopBar` usa sin cambiar su resultado visible
- [X] T011 [P] [US2] En `src/styles.css`, dentro de `.lesson.compact`: `.popover-backdrop` (`position: fixed; inset: 0; z-index: 20`), `.popover` (`position: fixed; top: calc(max(6px, env(safe-area-inset-top)) + 50px)`; `.end` anclado a la derecha y `.start` a la izquierda con `max(6px, env(safe-area-inset-*))`; `z-index: 21`; `max-height: calc(100dvh − 68px)`; `overflow-y: auto`; fondo `var(--surface)`, borde `var(--line)`, radio 14, sombra; ancho máx. 360), y el botón de rango del bucle `.loop-chip` (alto 40, color `var(--warm-ink)`); los controles dentro de `.popover` en columna con zonas táctiles ≥ 40
- [X] T012 [US2] En `src/screens/LessonScreen.tsx`: estado `panel: "options" | "loop" | null` (inicial `null`); `useEffect` que pone `panel = null` cuando `compact` pasa a `false`, y cuando `panel === "loop"` y `loopRange` es `null` (data-model, «Paneles superpuestos»). En la fila de práctica, tras Empezar/Parar, añadir la casilla **Bucle** (`toggleLoop`) y, al final, el botón Opciones (`icon-btn`, `aria-label="Opciones"`, icono de ajustes) que abre `<Popover open={panel === "options"} anchor="end" label="Opciones de la lección">` con, en este orden: título de la pieza (`h2`), texto de ayuda del paso (el mismo de `.hint`, incluido `LOOP_PLAY_HINT`), tempo (el mismo `<input type="range">`, visible con las mismas condiciones de hoy), «A tempo» (solo en Aprender), «Nombres de las notas», «Números de dedo», `<ConnectionStatus />` y un enlace «Ajustes» a `#ajustes`. Abrir o cerrar el panel no llama a `stop()` ni cambia `running` (FR-007)
- [X] T013 [US2] En `src/screens/LessonScreen.tsx`, en la fila de práctica y con `loopRange`: junto a la casilla Bucle, botón `.loop-chip` con texto `${from+1}–${to+1} ▾` y `aria-label="Compases X–Y: ajustar inicio y fin"` que abre `<Popover open={panel === "loop"} anchor="end" label="Ajustar fragmento">` con los dos grupos `.loop-edge` actuales (inicio −/+, fin −/+ con `edge(...)`, deshabilitados según `canNudge`). Mientras el bucle está activado sin fragmento completo, el estado sigue mostrando la guía de selección de hoy

**Checkpoint**: todos los controles alcanzables en modo compacto

---

## Phase 5: User Story 3 - Resultado sin perder la pantalla (Priority: P2)

**Goal**: el resultado se superpone a la lección y se cierra.

**Independent Test**: en 640 × 320, terminar Aprender de «Cinco dedos»: el resultado se ve
entero, Repetir, Siguiente paso y Cerrar funcionan y la disposición no cambia (quickstart, paso 5).

### Implementation for User Story 3

- [X] T014 [P] [US3] En `src/styles.css`, dentro de `.lesson.compact`: `.result` como tarjeta `position: fixed`, centrada (`left: 50%; top: 50%; transform: translate(-50%, -50%)`), `z-index: 22`, ancho `min(520px, calc(100vw − 24px))`, sombra, `.big` a 32 px, botones ≥ 40 de alto; botón `.result-close` arriba a la derecha
- [X] T015 [US3] En `src/screens/LessonScreen.tsx`, solo con `compact`: añadir al panel de resultado un botón `.result-close` (`aria-label="Cerrar"`, `onClick={() => setResult(null)}`); Repetir y Siguiente paso sin cambios. Sin `compact`, el resultado se ve como hoy

**Checkpoint**: las tres historias funcionan en modo compacto

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T016 Ejecutar `npm test` y `npm run build` y corregir lo que falle (tests anteriores sin cambios)
- [X] T017 Recorrer [quickstart.md](quickstart.md) §2 completo: 640 × 320, 667 × 375 y 844 × 390 en modo responsive (las 12 piezas × 3 pasos, SC-001/002), comparar escritorio y tablet con las capturas de T001 (SC-005) y probar en un móvil real con barra del navegador visible/oculta y como app instalada (SC-003, SC-006, FR-011, FR-012)
- [X] T018 [P] Si en T017 alguna pieza queda con la partitura por debajo de la escala 0,55 o algún elemento no cabe en 640 × 320, ajustar los altos de la rejilla en `src/styles.css` (fila, estado, `clamp` del teclado respetando el mínimo de 110) y anotar el cambio en `specs/005-leccion-movil-apaisado/research.md` (R2)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: tras Setup; bloquea todas las historias
- **US1 (Phase 3)**: tras Foundational
- **US2 (Phase 4)**: tras T008 (usa la fila de práctica y el modo compacto de la pantalla)
- **US3 (Phase 5)**: tras T008; independiente de US2
- **Polish**: al final

### Within Each User Story

- Componentes y estilos ([P], archivos distintos) antes que la pantalla
- Las tareas que tocan `src/screens/LessonScreen.tsx` (T008, T012, T013, T015) son secuenciales
- Las que tocan `src/styles.css` (T007, T011, T014) son secuenciales entre sí aunque estén en historias distintas

### Parallel Opportunities

- T002, T003 y T004 (archivos distintos; T003 tras escribir T002)
- En US1: T005 (`Staff.tsx`), T006 (`Keyboard.tsx`) y T007 (`styles.css`) a la vez
- En US2: T009 (`Popover.tsx`), T010 (`TopBar.tsx`) y T011 (`styles.css`) a la vez
- US3 (T014) en paralelo con US2 si T011 ya está hecho

---

## Parallel Example: User Story 1

```bash
# Componentes y estilos a la vez:
Task: "Prop fit en src/components/Staff.tsx (viewBox recortado y escala)"
Task: "Prop fit en src/components/Keyboard.tsx (alto, 28 por tecla, seguimiento)"
Task: "Rejilla compacta de la lección en src/styles.css"
# Después, la pantalla:
Task: "Modo compacto y fila de práctica en src/screens/LessonScreen.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "Popover en src/components/Popover.tsx"
Task: "ConnectionStatus extraído de src/components/TopBar.tsx"
Task: "Estilos de paneles y .loop-chip en src/styles.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2
2. Phase 3 (US1): rejilla, partitura escalada, teclado ajustado y fila mínima
3. **STOP and VALIDATE**: quickstart pasos 1, 2, 6, 7 y escritorio sin cambios

### Incremental Delivery

1. Setup + Foundational
2. US1 → validar → commit
3. US2 → validar paneles y bucle → commit
4. US3 → validar resultado → commit
5. Polish → integrar en `main` (despliegue automático)

---

## Notes

- No tocar `src/engine/` ni los tests existentes
- Toda regla CSS nueva dentro de `.lesson.compact`; toda prop nueva opcional
- Commit tras cada fase

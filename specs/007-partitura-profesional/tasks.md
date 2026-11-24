---

description: "Task list for Partitura profesional (acordes, ligaduras y armaduras)"
---

# Tasks: Partitura profesional (acordes, ligaduras y armaduras)

**Input**: Design documents from `specs/007-partitura-profesional/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/score.md](contracts/score.md),
[quickstart.md](quickstart.md)

**Tests**: incluidos. La constitución (Principio II) exige tests para todo cambio en
`src/music/`, `src/engine/` y `src/state/`; el plan y el quickstart §1 los detallan. En
`src/import/` se usan tests con `// @vitest-environment happy-dom`. `ScoreView` (VexFlow necesita
`<canvas>`) se verifica a mano con el quickstart §3.

**Organization**: tareas agrupadas por historia de usuario de la spec. La historia 4 (las piezas
de siempre con la nueva partitura) va primero entre las P1 porque es la que introduce
`ScoreView`, que las demás necesitan para verse; su lógica pura (acordes, armaduras, ligaduras,
ritmo) puede avanzar en paralelo en cuanto termina la Fase 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede hacerse en paralelo (otro archivo, sin dependencias pendientes)
- **[Story]**: historia de usuario de la spec (US1–US6)

## Path Conventions

Proyecto único (SPA): código en `src/`, tests junto al módulo (`*.test.ts`). Pulsos = negras
(negra = 1); internamente 48 ticks por negra (research R3). `src/music/` y `src/engine/` MUST NOT
importar VexFlow ni usar DOM (Principio I); VexFlow solo se importa en
`src/components/ScoreView.tsx`. Las 12 piezas actuales de `src/music/songs.ts` no se reescriben
(FR-015) y puntúan exactamente igual (FR-013).

---

## Phase 1: Setup

**Purpose**: línea base, red de seguridad antes de tocar nada y prueba de VexFlow

- [X] T001 En la rama `007-partitura-profesional`, ejecutar `npm test` y `npm run build` en la raíz y confirmar que todo pasa (línea base); actualizar `.specify/feature.json` para que apunte a `specs/007-partitura-profesional`
- [X] T002 Crear la red de seguridad de no regresión **antes de cambiar ningún módulo**: `src/music/regression.test.ts` que, para cada una de las 12 piezas de `SONGS`, compara con `src/music/__fixtures__/baseline.json` (a) las `ScoreNote` de `buildScore` reducidas a `{ m, d, s, h, f }` y (b) el `LessonResult` de Tocar a tempo 60 con una secuencia fija de pulsaciones (todas las notas de la derecha a su hora exacta; las de la izquierda con +0,3 pulsos; cada quinta nota omitida) usando el host falso de `src/engine/lesson.test.ts` (extraerlo a `src/engine/testHost.ts` y reutilizarlo en los dos tests). Generar el JSON con el código actual (`UPDATE_BASELINE=1 npm test -- regression` escribe el archivo si falta) y comprobar que el test pasa sin cambios (SC-001, FR-013)
- [X] T003 [P] Añadir la dependencia de producción exacta `vexflow@5.0.0` (`npm i -E vexflow@5.0.0`) en `package.json`; comprobar que `package-lock.json` solo añade `vexflow` y `structured-clone-es` (research R1)
- [X] T004 Prueba de VexFlow (research R2): crear `spike/vexflow.html` + `spike/vexflow.ts` (servidos por `npm run dev` en `/spike/vexflow.html`, fuera de `src/` y del build) que dibuja con `import("vexflow/bravura")` un compás de 4/4 en clave de sol con armadura de un sostenido, un acorde Do–Re–Sol (segunda), un Fa natural con becuadro, un tresillo de corcheas con su «3» y una negra con puntillo, fijando la `x` de cada `TickContext` con `setX` tras `Formatter.format` a posiciones `inicio + s·50`. Verificar que cabezas, alteraciones y puntillos no se descolocan; anotar el resultado en una sección «Resultado de la prueba» de `specs/007-partitura-profesional/research.md` (R2) y, si falla, adoptar la alternativa de R2 (formatear por compás con el ancho de `layout.ts` y leer de vuelta las `x`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: modelo de datos ampliado y compatible, ticks, posiciones y ortografía puras, motor
que lee posiciones de `layout`, grabado básico. Al terminar, la app (aún con `Staff`) se
comporta exactamente igual que hoy y `regression.test.ts` sigue en verde.

**⚠️ CRITICAL**: ninguna historia puede empezar hasta completar esta fase

### Tests (escribir primero, deben fallar)

- [X] T005 [P] Ampliar `src/music/score.test.ts` (`describe("buildScore")`): un `Track` con tuplas de 2 elementos (formato de hoy) y con 3 elementos (`[60, 1, {}]`) da las mismas notas; duraciones `1/3`, `0.25` aceptadas y `0.1` rechazada con `Error` («Toda duración es múltiplo de 1/48 de negra y > 0»); cada nota suelta recibe un `unit` distinto; `score.keys` por defecto es `[{ at: 0, key: 0 }]`; `score.pulse === 1` y `score.time` es `{ beats: bar, unit: 4 }` sin `time`; para toda nota, `score.layout.xAt(n.s) === n.x`; `n.spell` de 61 en Do es `{ step: "C", alter: 1 }`. Sustituir las aserciones de `x` absolutas existentes («posiciona las notas…», `describe("measureAt")`) por aserciones relativas a `score.layout`
- [X] T006 [P] Crear `src/music/layout.test.ts`: `layoutScore` con 50 px por negra por defecto; `xAt` estrictamente creciente en toda la pieza; `xAt` interpola linealmente entre dos inicios; `measures[i].start === i·bar` y `measures[i+1].x === measures[i].x + measures[i].width`; `left` crece con el número de alteraciones de la armadura (0, 1, 7); `measureAt(x)` devuelve el compás de esa `x`, recortado a `[0, n−1]`; con un inicio a 0,25 de otro, `px` sube hasta que la separación es ≥ 18 px (research R2); `px` de la pieza (`song.px`) se respeta si ya cumple el mínimo
- [X] T007 [P] Crear `src/music/spelling.test.ts`: `spell(61, 0)` → Do♯ (`C`, +1, octava 4); `spell(70, -1)` → Si♭; `spell(66, 1)` → Fa♯; `spell(61, 0, "b")` → Re♭; Mi♯/Si♯/Do♭/Fa♭ solo con `override` (`spell(65, 0, "#")` → Mi♯); `noteLabel` da «Do♯», «Si♭» en latín y «C♯», «B♭» en inglés; `accidentals` en Do: dos Do♯ en el mismo compás y mano → solo el primero lleva `#`; Do♯ y luego Do natural en el mismo compás → el segundo lleva `n`; el compás siguiente vuelve a empezar; la mano izquierda no hereda alteraciones de la derecha
- [X] T008 [P] Ampliar la validación del repertorio en `src/music/score.test.ts` (`describe("canciones")`) con una función reutilizable `validateSong(song)` en `src/music/validate.ts` que aplique las reglas de [data-model.md](data-model.md) verbatim: «Toda duración es múltiplo de 1/48 de negra y > 0»; «Cada mano llena compases completos; las dos manos duran lo mismo»; «Alturas 21–108; un acorde no repite altura»; «`tie` solo entre un evento y el siguiente de la misma mano con exactamente las mismas alturas»; «`slur` `start` y `end` emparejados en la misma mano, sin anidar»; «`key` y `keyChanges[].key` en −7…7; `keyChanges` ordenado y con `at` dentro de la pieza»; «`time: "6/8"` implica que cada mano suma múltiplos de 3 negras»; acordes de 2–6 alturas. Las 12 piezas pasan; casos inválidos construidos a mano fallan con un mensaje que nombra la regla (FR-017)
- [X] T009 [P] Ampliar `src/engine/lesson.test.ts`: el cursor de `playhead` en Aprender a tempo y en Tocar pasa por `score.layout.xAt(beat)` (comparar `xs` con `xAt` en varios pulsos); `l.spb === 60 / (tempo · score.pulse)`; con una pieza sin acordes `result()` coincide con el de hoy (cubierto también por `regression.test.ts`)

### Implementation

- [X] T010 Ampliar `src/music/types.ts` según [data-model.md](data-model.md): `Spell = "#" | "b" | "n" | "##" | "bb"`; `EventOpts = { tie?: true; slur?: "start" | "end"; spell?: Spell | Spell[] }`; `Event = [nota: number | number[], pulsos: number, opciones?: EventOpts]`; `Track = Event[]`; `RawTrack` se mantiene exportado como alias compatible (`= Track`); en `SongDef` añadir `time?: "6/8"`, `key?: number` («−7 (7 bemoles) … +7 (7 sostenidos); 0 por defecto»), `keyChanges?: { at: number; key: number }[]` («`at` = compás (base 0) desde el que rige») y cambiar `n`/`r`/`l` a `Track`; en `ScoreNote` añadir `unit: number`, `win: { hit: number; perfect: number }`, `spell: { step: string; alter: number }`, `slur?: "start" | "end"`; `Rest` pasa a `{ h; s; d }` (sin `x`); en `Score` añadir `pulse`, `time: { beats: number; unit: 4 | 8 }`, `keys: { at: number; key: number }[]`, `layout: Layout`. Ajustar a los nuevos tipos (sin cambiar comportamiento) los usos de `RawTrack` en `src/music/songs.ts`, `src/music/import/convert.ts`, `src/music/import/level.ts`, `src/music/import/fixtures.ts` y `src/components/MiniStaff.tsx` (en `MiniStaff`, de un acorde se pinta la nota más aguda)
- [X] T011 [P] Crear `src/music/spelling.ts` con `spell(m, key, override?)`, `noteLabel(spelled, notation)` y `accidentals(notes, keys, bar): Map<number, Acc>` según research R4 y el contrato (hace pasar T007); `Acc = "#" | "b" | "n" | "##" | "bb"`
- [X] T012 [P] Crear `src/music/layout.ts` con `layoutScore(input: LayoutInput): Layout` (`measures`, `width`, `left`, `xAt`, `measureAt`) según research R2: margen inicial para claves + armadura + compás, margen por compás si hay alteraciones, `x = inicioDelCompás + margen + (s − inicio)·px`, mínimo de `px` por separación ≥ 18 px; `STAFF_LEFT` se mueve aquí y deja de usarse fuera (hace pasar T006)
- [X] T013 Reescribir `buildScore` en `src/music/score.ts` (firma igual): leer eventos `[nota, pulsos, opts?]`, convertir duraciones a ticks (48 por negra) y lanzar `Error` si alguna no cae en un tick; un acorde genera una `ScoreNote` por altura con el mismo `s`, `h` y `unit`; cada evento suelto su propio `unit`; silencios como `Rest { h, s, d }` sin partir (el grabado los parte); `keys` desde `key`/`keyChanges`; `bar`, `time` y `pulse` (1 en x/4); `spell` con `spelling.spell` y la armadura vigente; `win = { hit: HIT_WINDOW, perfect: PERFECT_WINDOW }` (el recorte llega en US6); `layout = layoutScore(...)` y `x = layout.xAt(s)`; mantener orden por `s`, derecha primero, y la digitación actual. `measureAt(score, x)` delega en `score.layout.measureAt`. Mover `HIT_WINDOW`/`PERFECT_WINDOW` a `src/music/score.ts` (o a un `src/music/constants.ts`) y reexportarlos desde `src/engine/lesson.ts` (hace pasar T005; `regression.test.ts` en verde)
- [X] T014 [P] Crear `src/music/validate.ts` con `validateSong(song): string[]` (lista de errores, vacía si es válida) con las reglas de T008 (hace pasar T008)
- [X] T015 Adaptar `src/engine/lesson.ts`: quitar el import de `STAFF_LEFT`; cursor con `score.layout.xAt(this.pos)` (líneas de `x = STAFF_LEFT + … + 16`); `spb = 60 / (tempo · score.pulse)`; el margen de cada nota sale de `n.win.hit`/`n.win.perfect` en vez de las constantes; nombres de nota con `noteLabel(n.spell, …)` cuando el host no da `name` (hace pasar T009; `regression.test.ts` en verde)
- [X] T016 Adaptar `src/components/Staff.tsx` y `src/screens/LessonScreen.tsx` al nuevo `Score` sin cambiar lo que se ve: `Staff` toma anchos y posiciones de `score.layout` y los silencios con `x = layout.xAt(r.s)` (partidos en la barra como hoy); `LessonScreen` sigue usando `Staff`. Comprobar a mano que una pieza de 4/4 y una de 3/4 se ven y se practican como antes
- [X] T017 Crear `src/music/engrave.test.ts` (test primero) para el grabado básico: con las 12 piezas, cada compás de figuras de cada mano suma exactamente su compás; un silencio de 6 pulsos en 4/4 se parte en la barra; corcheas del mismo pulso con plica forman una barra (`beams`) de dos; `acc` solo en las figuras que `accidentals` marca; cada `noteId` aparece en al menos una figura; `engrave` es determinista
- [X] T018 Crear `src/music/engrave.ts` con `engrave(score): Engraving` (tipos `Engraving`, `HandStaff`, `EngravedMeasure`, `Figure` de [data-model.md](data-model.md)) para lo que ya existe: notas sueltas y silencios en figuras `w`/`h`/`q`/`8` con o sin puntillo, silencios partidos en la barra, barras de corcheas por negra en x/4, clave `treble` para R y `bass` para L, `key` en el compás 0 y `acc` desde `spelling.accidentals` (hace pasar T017)

**Checkpoint**: tipos ampliados, `buildScore`/`layout`/`spelling`/`engrave` puros y probados, motor
leyendo `layout`; `npm test` en verde incluida la no regresión; la app se ve y se practica igual

---

## Phase 3: User Story 4 - Las piezas de siempre siguen igual o mejor (Priority: P1) 🎯 MVP

**Goal**: la partitura pasa a dibujarse con VexFlow (`ScoreView`) para las 12 piezas, con nombres,
dedos, marcas de color, cursor, bucle, móvil apaisado, tema oscuro y sin conexión (FR-005–FR-007,
FR-021).

**Independent Test**: recorrer las 12 piezas en escritorio y en móvil apaisado, tema claro y
oscuro, con nombres y dedos activados y desactivados, y practicar un fragmento en bucle en cada
una (quickstart §3.1, §3.8, §3.9).

### Implementation for User Story 4

- [X] T019 [US4] Crear `src/components/ScoreView.tsx` con la misma interfaz que `Staff` (`StaffHandle`: `setPlayhead(x | null)`, `scrollTo(x, smooth)`; props `score, marks, autoIds, showNames, showFingers, notation, loop, onMeasure, fit`) más `onReady?: () => void`; mover `StaffHandle` y el tipo de props a `src/components/scoreTypes.ts` para que no dependan de `Staff.tsx`. Cargar `import("vexflow/bravura")` una vez (promesa en módulo); mientras carga, mostrar «Cargando partitura…»
- [X] T020 [US4] En `src/components/ScoreView.tsx`, dibujar en un efecto (al cambiar `score`, `notation`, `showNames`, `showFingers`) las figuras de `engrave(score)` con VexFlow en un `<svg>` propio: un `Stave` por compás y mano con el ancho de `score.layout.measures`, clave/armadura/compás al principio, `StaveConnector` de llave y barra en dos manos, `StaveNote`/silencios con sus `acc` (`Accidental`) y puntillos (`Dot`), `Beam` desde `beams`; colocar cada `TickContext` en `score.layout.xAt(fig.s)` como se decidió en T004; llamar a `onReady` cuando termina
- [X] T021 [US4] En `src/components/ScoreView.tsx`, construir tras dibujar un mapa `noteId → SVGElement[]` (el `<g>` de cada cabeza; varias si la nota va ligada) y aplicar `marks` (`now`, `hit`, `miss`) y `autoIds` (`auto`) como clases solo en los elementos que cambian respecto al render anterior, sin volver a dibujar (research R10, SC-005)
- [X] T022 [US4] En `src/components/ScoreView.tsx`, superponer SVG propio con las clases de hoy: cursor (`setPlayhead`), fragmento en bucle resaltado (`loop` con `layout.measures`), selección de compás al tocar la partitura (`onMeasure(layout.measureAt(x))`), nombres de nota con `noteLabel(n.spell, notation)` y dedos (`n.f`) en las posiciones de hoy; `fit` mide el `<g>` dibujado y escala como `Staff`; `scrollTo` desplaza el contenedor como hoy
- [X] T023 [P] [US4] Añadir en `src/styles.css` las reglas `.vf-*` (pentagramas, cabezas, plicas, barras, alteraciones, textos) con `fill`/`stroke` desde las variables del tema claro y oscuro, las marcas `now`/`hit`/`miss`/`auto` sobre las cabezas de VexFlow con los colores de hoy, y el estilo de «Cargando partitura…» (FR-006)
- [X] T024 [US4] En `src/screens/LessonScreen.tsx`, sustituir `Staff` por `ScoreView` y no arrancar la lección (ni Escuchar, ni Aprender, ni la cuenta atrás de Tocar) hasta que llegue `onReady`
- [X] T025 [US4] Comprobar con `npm run build` que VexFlow sale en un chunk aparte (no en el bundle principal) y que ese chunk aparece en el precache de `dist/sw.js` (`globPatterns` de `vite.config.ts`); si supera `maximumFileSizeToCacheInBytes`, subir el límite en `vite.config.ts` (FR-007)
- [X] T026 [US4] Validación manual quickstart §3.1, §3.8 (pasos 1 solo) y §3.9: las 12 piezas con mismas notas, nombres y dedos; colores de acierto/fallo y cursor; bucle en dos piezas; móvil apaisado 640 × 320 sin desplazar la página (SC-006); tema oscuro; sin conexión con la app instalada. Corregir lo que salga en `ScoreView.tsx`/`styles.css`
- [X] T027 [US4] Borrar `src/components/Staff.tsx` y cualquier import restante (FR-021); `npm test` y `npm run build` en verde

**Checkpoint**: la app entera dibuja con VexFlow; las piezas de siempre se ven y puntúan igual

---

## Phase 4: User Story 1 - Practicar piezas con acordes (Priority: P1)

**Goal**: acordes dentro de una mano: se dibujan apilados en una plica, suenan juntos, Aprender
espera a todas sus notas y Tocar los cuenta como una unidad (FR-001, FR-008–FR-010, FR-013,
FR-014).

**Independent Test**: abrir «Himno a la alegría con acordes» y completar Escuchar, Aprender y Tocar
con el teclado en pantalla (ratón) y con un teclado MIDI (quickstart §3.3, SC-002).

### Tests for User Story 1

- [X] T028 [P] [US1] Ampliar `src/engine/lesson.test.ts` con una pieza de prueba con un acorde Do–Mi–Sol (`[[48, 52, 55], 2]`) en la izquierda: en Aprender, tras tocar 48 y 52 la lección sigue esperando, 48 y 52 marcados `hit` y 55 `now`; al tocar 55 avanza (cualquier orden); en Tocar, las tres dentro de su margen → el acorde cuenta como un acierto en `result()`; si falta 55 → un fallo y 55 marcada `miss`, sin desmarcar las otras dos; una nota equivocada dentro del acorde no anula las acertadas; en Escuchar las tres se marcan `auto` a la vez (FR-008–FR-010)
- [X] T029 [P] [US1] Ampliar `src/music/score.test.ts` (`describe("digitación")`): tríada Do–Mi–Sol → dedos 1-3-5 en la derecha y 5-3-1 en la izquierda; acorde de octava Do–Do → 1-5 / 5-1; cada nota de un acorde con dedo distinto; las 12 piezas con los dedos de `baseline.json` (FR-014)
- [X] T030 [P] [US1] Ampliar `src/music/engrave.test.ts`: un acorde se graba como una sola `Figure` con varias `keys` (ordenadas de grave a aguda) y una sola plica; un acorde con segunda (Do–Re) mantiene las dos `keys`; `acc` por altura dentro del acorde

### Implementation for User Story 1

- [X] T031 [US1] Cambiar `assignFingering` en `src/music/fingering.ts` para que trabaje con eventos (`events: ScoreNote[][]`, una lista por `unit`) según research R9: un acorde que cabe en la mano (≤ una octava) recibe dedos distintos y crecientes según la distancia (derecha, pulgar en la más grave; izquierda, en la más aguda); las posiciones de mano agrupan eventos seguidos que caben en cinco dedos; con notas sueltas el resultado es el de hoy. Ajustar la llamada en `src/music/score.ts` (agrupar por `unit`) (hace pasar T029; `regression.test.ts` en verde)
- [X] T032 [US1] En `src/engine/lesson.ts`, puntuar en `result()` por `unit` según research R6: perfecto si todas sus notas son perfectas, bien si todas aciertan, fallo si falta alguna; cada nota se sigue juzgando y marcando por separado; Escuchar ya programa por nota (comprobar que las de un mismo `s` suenan y se marcan juntas) (hace pasar T028; `regression.test.ts` en verde)
- [X] T033 [US1] En `src/music/engrave.ts`, agrupar las `ScoreNote` de un mismo `unit` en una sola `Figure` con varias `keys` y sus `acc` (hace pasar T030)
- [X] T034 [US1] En `src/components/ScoreView.tsx`, dibujar las figuras con varias `keys` como un `StaveNote` con varias cabezas (VexFlow desplaza las segundas), mapear cada cabeza a su `noteId` para las marcas y apilar los nombres y los dedos de un acorde sin taparse (también con segundas y acordes de más de una octava)
- [X] T035 [US1] Añadir a `src/music/songs.ts` la pieza «Himno a la alegría con acordes» (Beethoven, dominio público), id `oda-acordes`, nivel 3, dos manos: derecha con la melodía de `oda` y izquierda con tríadas de blanca (Do–Mi–Sol, Sol–Si–Re…), que pase `validateSong` (FR-016)
- [X] T036 [US1] Validación manual con `specs/007-partitura-profesional/quickstart.md` §3.3: acordes apilados con dedos 5-3-1; Aprender y Tocar completos con el ratón en el teclado en pantalla y con teclado MIDI (SC-002)

**Checkpoint**: piezas con acordes practicables en los tres pasos

---

## Phase 5: User Story 2 - Leer piezas con armadura (Priority: P1)

**Goal**: armadura al principio de cada sistema y donde cambie; alteraciones solo cuando la nota se
aparta de la armadura o de una anterior del compás; nombres con la alteración real (FR-002, FR-005).

**Independent Test**: abrir «Minueto en Sol» con un sostenido de armadura y comprobar que se ve
como una edición impresa, con los mismos sonidos y nombres (quickstart §3.2).

### Tests for User Story 2

- [X] T037 [P] [US2] Ampliar `src/music/spelling.test.ts`: en Sol mayor (`key: 1`) los Fa♯ no llevan `acc`; un Fa natural lleva `n` y un Fa♯ posterior del mismo compás vuelve a llevar `#`; en Fa mayor (`key: -1`) 70 se escribe Si♭ sin `acc` y 71 lleva `n`; con 7 sostenidos y 7 bemoles las teclas blancas alteradas por la armadura salen sin `acc`; con `keyChanges: [{ at: 2, key: -1 }]` el compás 2 usa la nueva armadura y las alteraciones de la anterior que dejan de valer llevan `n`
- [X] T038 [P] [US2] Ampliar `src/music/engrave.test.ts` y `src/music/layout.test.ts`: `EngravedMeasure.key` solo en el compás 0 y en los compases de `keyChanges`; el margen de `layout` en un compás con cambio de armadura deja sitio a la nueva armadura (y a los becuadros de anulación) sin tapar la primera nota; con 7 alteraciones la primera nota no queda tapada

### Implementation for User Story 2

- [X] T039 [US2] Completar en `src/music/spelling.ts` las armaduras de −7 a +7 y los cambios de armadura (`keys` por compás) en `spell` y `accidentals` (hace pasar T037)
- [X] T040 [US2] En `src/music/engrave.ts` y `src/music/layout.ts`, emitir `key` en los compases donde cambia y reservar su ancho (hace pasar T038)
- [X] T041 [US2] En `src/components/ScoreView.tsx`, dibujar la armadura con `Stave.addKeySignature` al principio de cada sistema y en los compases con `key` (con la anulación de la anterior), y verificar que los nombres usan `noteLabel(n.spell, notation)` («Fa♯» / «F♯» aunque la cabeza no lleve alteración)
- [X] T042 [US2] Añadir `key: 1` a «Minueto en Sol» en `src/music/songs.ts` sin cambiar sus notas; comprobar que `regression.test.ts` sigue en verde (FR-016)
- [X] T043 [US2] Validación manual con `specs/007-partitura-profesional/quickstart.md` §3.2: armadura de un sostenido, ningún Fa con sostenido propio, nombres «Fa♯»; con C‑D‑E, «F♯»; una pieza en Do se ve como antes

**Checkpoint**: armaduras y alteraciones correctas; el Minueto se lee como una edición impresa

---

## Phase 6: User Story 3 - Notas ligadas y ligaduras de expresión (Priority: P2)

**Goal**: notas que cruzan la barra o sin figura propia se dibujan como figuras ligadas y se tocan
una vez; las ligaduras de expresión solo se ven (FR-003, FR-004, FR-011, FR-012).

**Independent Test**: abrir «Canción de cuna» (notas ligadas a través de la barra) y una pieza de
prueba con una ligadura de expresión de cuatro notas, y completar los tres pasos (quickstart §3.4).

### Tests for User Story 3

- [X] T044 [P] [US3] Ampliar `src/music/score.test.ts`: `[[64, 2, { tie: true }], [64, 1]]` produce una sola `ScoreNote` de `d = 3`; `[64, 2.5]` sin `tie` es válida (una nota de 2,5); `tie` entre alturas distintas o hacia un silencio es inválido en `validateSong`; `slur: "start"`/`"end"` llega a `ScoreNote.slur` y no cambia `m`, `d`, `s`
- [X] T045 [P] [US3] Ampliar `src/music/engrave.test.ts`: una nota de 3 pulsos que empieza en el pulso 3 de un 4/4 → blanca con `tieToNext` + negra en el compás siguiente; 2,5 pulsos en el pulso 1 → blanca + corchea ligadas; 1,5 en el pulso 2 de 4/4 → negra con puntillo (no cruza pulso fuerte); en un acorde ligado `tieToNext` por altura; las figuras de una ligadura de expresión llevan `slur` en la primera y la última; cada compás sigue sumando exacto
- [X] T046 [P] [US3] Ampliar `src/engine/fragment.test.ts` y `src/engine/lesson.test.ts`: una nota ligada se toca una vez y cuenta como una sola nota; un bucle que empieza en un compás que continúa una ligada no exige esa nota (el fragmento empieza en la primera nota que comienza dentro); una ligada que sale del fragmento se toca al final y la repetición empieza a su hora (FR-012)

### Implementation for User Story 3

- [X] T047 [US3] En `src/music/score.ts`, unir cada evento con `tie` y el siguiente de la misma mano en una sola `ScoreNote` (por altura en acordes) con la duración sumada; pasar `slur` a la `ScoreNote` del evento (hace pasar T044)
- [X] T048 [US3] En `src/music/validate.ts`, aplicar las reglas de `tie` y `slur` de T008 si aún no están (T044)
- [X] T049 [US3] En `src/music/engrave.ts`, partir cada nota en la barra y en figuras representables (redonda… corchea, con puntillo) unidas por `tieToNext`, sin cruzar el pulso cuando se puede escribir sin cruzarlo (salvo blancas y redondas en pulso fuerte); marcar `slur` en las figuras de inicio y fin (hace pasar T045)
- [X] T050 [US3] En `src/engine/fragment.ts` y `src/engine/lesson.ts`, aplicar las reglas de ligadas en bucle de los casos límite: excluir de un fragmento las notas que empiezan antes de su primer compás; la duración de una nota que sale del fragmento se recorta a su final (hace pasar T046)
- [X] T051 [US3] En `src/components/ScoreView.tsx`, dibujar `StaveTie` entre figuras con `tieToNext` (también entre compases y entre sistemas) y `Curve` para las ligaduras de expresión; aplicar la marca de color de una nota ligada a todas sus figuras
- [X] T052 [US3] Añadir a `src/music/songs.ts` «Canción de cuna» (Brahms, dominio público), id `cuna`, nivel 3, 3/4, con al menos una nota ligada a través de la barra y una ligadura de expresión, que pase `validateSong` (FR-016)
- [X] T053 [US3] Validación manual con `specs/007-partitura-profesional/quickstart.md` §3.4: las ligadas se tocan una vez; empezar un bucle en el compás donde continúa una ligada no la exige; ligaduras de expresión visibles

**Checkpoint**: ligaduras de prolongación y de expresión dibujadas y tratadas como una sola nota

---

## Phase 7: User Story 6 - Semicorcheas, tresillos y compás de 6/8 (Priority: P2)

**Goal**: semicorcheas, corchea con puntillo + semicorchea, tresillos de corchea y de negra y 6/8
con pulso de negra con puntillo, metrónomo de dos pulsos y tempo en «♩. por minuto» (FR-007a,
FR-012a, FR-012b).

**Independent Test**: abrir «Greensleeves» (6/8) y una pieza de prueba con tresillos y
semicorcheas y completar los tres pasos con el metrónomo (quickstart §3.5, SC-007).

### Tests for User Story 6

- [X] T054 [P] [US6] Ampliar `src/music/score.test.ts`: con `time: "6/8"`, `bar === 3`, `pulse === 1.5`, `time === { beats: 6, unit: 8 }`; `validateSong` rechaza una mano de 6/8 que no suma múltiplos de 3 negras; `win` de una semicorchea entre otras dos (separación 0,25) es `{ hit: 0.125, perfect: 0.125 }` (mitad de la distancia, `perfect` recortado igual sin superar 0,18); el de una corchea (0,5) sigue siendo `{ 0.45, 0.18 }` (research R7); tresillo `1/3` cae en tick exacto (16)
- [X] T055 [P] [US6] Ampliar `src/music/engrave.test.ts`: tres corcheas de `1/3` en un pulso → grupo `tuplets` de 3 con barra; corchea de tresillo + silencio de tresillo + corchea → grupo con el silencio dentro; tresillo de negras (`2/3` × 3) en dos pulsos; semicorcheas con barras por negra; corchea con puntillo + semicorchea con barra y `dots: 1`; en 6/8 corcheas agrupadas de tres en tres y una negra con puntillo por pulso; cada compás suma exacto
- [X] T056 [P] [US6] Ampliar `src/engine/lesson.test.ts`: en 6/8 a tempo 60 (`pulse = 1.5`) `spb` es 2/3 s y el metrónomo suena dos veces por compás, fuerte en la primera; la cuenta atrás son `COUNT_IN` pulsos; en Tocar un tresillo se espera a un tercio de pulso del anterior; corchea con puntillo y semicorchea se evalúan a 0,75 y 0,25 con el margen recortado; en 4/4 el metrónomo no cambia

### Implementation for User Story 6

- [X] T057 [US6] En `src/music/score.ts`, deducir `bar = 3`, `pulse = 1.5` y `time = { beats: 6, unit: 8 }` con `time: "6/8"`, y calcular `win` por nota según research R7 (mitad de la distancia al inicio anterior o siguiente de la misma mano cuando es menor que una corchea; `perfect` recortado igual) (hace pasar T054)
- [X] T058 [US6] En `src/music/validate.ts`, aplicar la regla de 6/8 (T054)
- [X] T059 [US6] En `src/music/engrave.ts`, añadir `16` y `8.` + `16`, detectar tresillos (inicios y duraciones en tercios de pulso → grupo de 3 con `num: 3`, también con silencio interior), barras por pulso (negra en x/4, negra con puntillo en 6/8) (hace pasar T055)
- [X] T060 [US6] En `src/music/layout.ts`, comprobar el mínimo de `px` con semicorcheas y tresillos (≥ 18 px entre inicios) y en `src/engine/lesson.ts` el clic del metrónomo y la cuenta atrás cada `score.pulse` negras con acento al inicio del compás (hace pasar T056)
- [X] T061 [US6] En `src/components/ScoreView.tsx`, dibujar `Tuplet` con su «3», barras de semicorchea, compás 6/8 (`addTimeSignature("6/8")`) y silencios de tresillo
- [X] T062 [US6] En `src/screens/LessonScreen.tsx`, mostrar el tempo en «♩. por minuto» junto al control cuando `score.pulse === 1.5` (en x/4, la etiqueta de hoy) (FR-012a)
- [X] T063 [US6] Añadir a `src/music/songs.ts` «Greensleeves» (popular inglesa, dominio público), id `greensleeves`, nivel 4, 6/8, con negras con puntillo y negra–corchea, que pase `validateSong` (FR-016)
- [X] T064 [US6] Validación manual con `specs/007-partitura-profesional/quickstart.md` §3.5: compás 6/8, corcheas de tres en tres, dos clics por compás, tempo en «♩. por minuto»; 3 estrellas tocando a tempo (SC-007)

**Checkpoint**: ritmos ricos y 6/8 dibujados, tocados y evaluados a su hora

---

## Phase 8: User Story 5 - Elegir la versión completa de una pieza importada (Priority: P3)

**Goal**: cada pieza importada tiene versión simplificada y, si se puede, completa (desde el
original); el alumno elige por pieza y cada versión guarda sus estrellas (FR-019–FR-020).

**Independent Test**: importar una pieza con acordes y armadura, practicar las dos versiones,
cambiar entre ellas y comprobar que cada una conserva sus estrellas (quickstart §3.6, §3.7, SC-008).

**Depends on**: US1, US2, US3 y US6 (la versión completa usa acordes, ligaduras, armadura y ritmo)

### Tests for User Story 5

- [X] T065 [P] [US5] Ampliar `src/music/import/fixtures.ts` con generadores (MIDI y MusicXML) de piezas con acordes en una mano, notas que cruzan la barra, armadura (Sol mayor, Fa mayor), tresillos, semicorcheas, 6/8, varias voces en una mano y 5/4; y `scripts/export-fixtures.mjs` para que escriba en `dev-fixtures/` las piezas nuevas del repertorio y estas piezas de prueba
- [X] T066 [P] [US5] Crear `src/music/import/full.test.ts`: `convertFull` de un `RawPiece` con acordes, armadura y tresillos → `ok` con acordes por mano, `key`, duraciones exactas (cuantizadas a semicorchea o tercio de pulso, la más cercana) y `spell` del original; 6/8 → `time: "6/8"`; varias voces en una mano → `{ ok: false, reason: "voices" }`; 5/4 → `"timeSignature"`; cambio de compás → `"timeChange"`; el `song` resultante pasa `validateSong`; ida y vuelta de las 3 piezas nuevas del repertorio (exportar con `fixtures` y convertir) da las mismas notas
- [X] T067 [P] [US5] Ampliar `src/music/import/convert.test.ts` y `src/music/import/level.test.ts`: `convertPiece` admite 6/8 con las reglas de simplificación de 006 (FR-020); nivel de la versión completa: armadura distinta de Do o 6/8 → al menos 3; acordes de 3 o más notas, semicorcheas o tresillos en más del 10 % de las notas → 4 (research R11)
- [X] T068 [P] [US5] Ampliar `src/music/import/midi.test.ts` y `src/import/musicxml.test.ts`: `FF 59` → `RawPiece.keys`; `<key><fifths>` → `keys`; `<step>`/`<alter>` → `RawNote.spell`; `<time>` 6/8 aceptado
- [X] T069 [P] [US5] Ampliar `src/state/imported.test.ts` y `src/state/library.test.ts`: una importada de 006 (sin `full` ni `version`) se trata como `"simple"`; `ensureFull` calcula `full` desde el original (deps inyectadas) y lo guarda, o guarda `{ unavailable: reason }`; `setVersion("imp-x", "full")` cambia la versión y devuelve `true`; `allSongs()` expone solo la versión elegida (id `imp-x.full` para la completa); `findSong` acepta los dos ids; `resolveSongId("imp-x")` con versión completa → `"imp-x.full"`; `editImported` cambia el título de las dos versiones y el nivel solo de la elegida; `removeImported` quita la pieza, su original, `best[id]`, `best[id + ".full"]` y `last` si apunta a cualquiera de los dos; `repertoireStars` sigue ignorando las dos versiones

### Implementation for User Story 5

- [X] T070 [US5] Ampliar `src/music/import/types.ts`: `RawNote.spell?`, `RawPiece.keys?: { at: number; key: number }[]`, `FullReason = "voices" | "timeSignature" | "timeChange" | "unreadable"`, `ImportedSong.full?: { def: SongDef; level: Level; warnings: Warning[] } | { unavailable: FullReason }` («`def.id` = id de la simplificada + `.full`. Ausente = aún sin calcular») y `ImportedSong.version?: "simple" | "full"` («Ausente = `"simple"`»)
- [X] T071 [P] [US5] En `src/music/import/midi.ts`, leer el meta `FF 59` a `RawPiece.keys` (hace pasar su parte de T068)
- [X] T072 [P] [US5] En `src/import/musicxml.ts`, leer `<key><fifths>` a `keys`, `<step>`/`<alter>` a `RawNote.spell` y admitir `<time>` 6/8 (hace pasar su parte de T068)
- [X] T073 [US5] En `src/music/import/convert.ts`, admitir 6/8 en `convertPiece` con las reglas de 006; en `src/music/import/level.ts`, añadir las reglas de nivel de la versión completa (hace pasar T067)
- [X] T074 [US5] Crear `src/music/import/full.ts` con `convertFull(raw)` según research R11 y el contrato: reparto de manos como 006, cuantización a semicorchea / tercio de pulso, acordes por mano, duraciones exactas (con `tie` donde haga falta o duraciones sin figura propia), `key`/`keyChanges`, `spell`, nivel y avisos; `{ ok: false, reason }` si no es representable (hace pasar T066)
- [X] T075 [US5] En `src/state/imported.ts`, añadir `ensureFull(id, deps?)` y `setVersion(id, version)`, y adaptar `addImported` (guardar `full` y la `version` elegida), `editImported` y `removeImported` a las dos versiones; en `src/state/library.ts`, `allSongs()` con la versión elegida, `findSong` con los dos ids y `resolveSongId` (hace pasar T069)
- [X] T076 [US5] En `src/components/ImportDialog.tsx`, cuando las dos versiones difieren, mostrar el selector «Versión completa» (por defecto) / «Versión simplificada» con los datos, el nivel sugerido y los avisos de la seleccionada; si la completa no está disponible, solo la simplificada con el motivo en español; añadir con la versión elegida (FR-019a, FR-019c)
- [X] T077 [US5] En `src/components/ImportedSongDialog.tsx` (⋯ de la tarjeta en `src/screens/Songs.tsx`), añadir «Versión completa» / «Versión simplificada» (la activa marcada); al elegir la completa sin `full`, llamar a `ensureFull` con estado de carga; si no está disponible, opción deshabilitada con el motivo (FR-019, FR-019c)
- [X] T078 [US5] En `src/screens/Songs.tsx`, `src/screens/Home.tsx` y las rutas `#leccion/…` de `src/screens/LessonScreen.tsx`, usar las estrellas de la versión elegida y `resolveSongId` para «Continuar» (si se cambió de versión de la última practicada, abrir la elegida en el paso en que estaba) (FR-019b)
- [X] T079 [US5] Validación manual con `specs/007-partitura-profesional/quickstart.md` §3.6 y §3.7: importar el archivo de prueba con acordes, armadura y tresillos, añadir la completa y practicarla; cambiar a la simplificada y volver conservando estrellas (SC-008); una importada de 006 sigue en simplificada y puede pasar a la completa; con varias voces en una mano, la opción explica por qué no

**Checkpoint**: importadas con dos versiones, cada una con sus estrellas

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: rendimiento, limpieza y cierre

- [X] T080 Medir en un móvil de gama media el tiempo hasta ver la partitura con una pieza de 100 y de 300 compases (generadas con `src/music/import/fixtures.ts`) y la respuesta a la nota y el cursor (SC-004, SC-005); anotar los valores en `specs/007-partitura-profesional/quickstart.md` §3.10. Si no se llega, dibujar por tramos de 32 compases alrededor del cursor en `src/components/ScoreView.tsx` (research R10)
- [X] T081 [P] Revisar la notación de las piezas de `src/music/songs.ts` con armadura, acordes y ligaduras (Minueto, Himno con acordes, Canción de cuna, Greensleeves) contra una edición impresa de referencia: 0 errores de alteraciones, ligaduras o cabezas tapadas (SC-003)
- [X] T082 [P] Borrar `spike/` (T004) y comprobar que no quedan usos de `STAFF_LEFT` fuera de `src/music/layout.ts` ni imports de `vexflow` fuera de `src/components/ScoreView.tsx` (Principio I)
- [X] T083 [P] Actualizar la hoja de ruta (v0.5) en `README.md` / `docs/` con la partitura profesional completada y mencionar la nueva dependencia `vexflow` y su licencia (MIT)
- [X] T084 Ejecutar `npm test` y `npm run build` y recorrer `specs/007-partitura-profesional/quickstart.md` completo (§1–§3) en escritorio y móvil apaisado

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias. T002 (no regresión) MUST terminar antes de cambiar cualquier módulo de `src/music/` o `src/engine/`
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias
- **US4 (Phase 3)**: depende de Foundational y de la decisión de T004
- **US1, US2, US3, US6 (Phases 4–7)**: sus tests y su lógica pura (`score`, `spelling`, `engrave`, `fingering`, `lesson`) pueden empezar tras Foundational; sus tareas de `ScoreView` y su validación manual dependen de US4
- **US5 (Phase 8)**: depende de US1, US2, US3 y US6
- **Polish (Phase 9)**: depende de las historias que se quieran entregar

### User Story Dependencies

- **US4 (P1)**: solo Foundational. MVP
- **US1 (P1)**: Foundational (+ US4 para verse)
- **US2 (P1)**: Foundational (+ US4 para verse)
- **US3 (P2)**: Foundational (+ US4 para verse)
- **US6 (P2)**: Foundational (+ US4 para verse)
- **US5 (P3)**: US1, US2, US3, US6

### Within Each User Story

- Los tests se escriben primero y fallan antes de implementar
- Tipos → `score`/`validate` → `spelling`/`layout`/`engrave` → motor → `ScoreView` → repertorio → validación manual
- `regression.test.ts` MUST seguir en verde tras cada tarea que toque `src/music/` o `src/engine/`

### Shared-file notes

- `src/music/score.ts`, `src/music/engrave.ts`, `src/engine/lesson.ts` y `src/components/ScoreView.tsx` se tocan en varias historias: las tareas de una misma historia sobre un mismo archivo son secuenciales, y entre historias conviene no trabajarlas a la vez

### Parallel Opportunities

- Setup: T003 en paralelo con T002
- Foundational: tests T005–T009 en paralelo; T011, T012 y T014 en paralelo tras T010
- US4: T023 (CSS) en paralelo con T019–T022
- Tras Foundational: tests de US1, US2, US3 y US6 en paralelo entre sí
- US5: T065–T069 en paralelo; T071 y T072 en paralelo

---

## Parallel Example: Foundational

```bash
# Tests en paralelo (archivos distintos):
Task: "Ampliar src/music/score.test.ts con ticks, unit, keys, pulse y layout (T005)"
Task: "Crear src/music/layout.test.ts (T006)"
Task: "Crear src/music/spelling.test.ts (T007)"
Task: "Validación del repertorio con validateSong (T008)"
Task: "Cursor y spb en src/engine/lesson.test.ts (T009)"

# Tras T010 (tipos):
Task: "Crear src/music/spelling.ts (T011)"
Task: "Crear src/music/layout.ts (T012)"
Task: "Crear src/music/validate.ts (T014)"
```

## Parallel Example: User Story 1

```bash
Task: "Acordes en Aprender, Tocar y Escuchar en src/engine/lesson.test.ts (T028)"
Task: "Digitación de acordes en src/music/score.test.ts (T029)"
Task: "Acordes en src/music/engrave.test.ts (T030)"
```

## Parallel Example: User Story 5

```bash
Task: "Generadores de prueba en src/music/import/fixtures.ts (T065)"
Task: "Crear src/music/import/full.test.ts (T066)"
Task: "6/8 y niveles en convert.test.ts y level.test.ts (T067)"
Task: "Armadura y ortografía en midi.test.ts y musicxml.test.ts (T068)"
Task: "Versiones en imported.test.ts y library.test.ts (T069)"
```

---

## Implementation Strategy

### MVP First (User Story 4)

1. Phase 1: línea base, no regresión y prueba de VexFlow
2. Phase 2: tipos, ticks, `layout`, `spelling`, `engrave` básico y motor con `xAt`
3. Phase 3: `ScoreView` para las 12 piezas y retirada de `Staff`
4. **STOP and VALIDATE**: quickstart §3.1, §3.8, §3.9; las piezas de siempre igual o mejor

### Incremental Delivery

1. Setup + Foundational → la app igual que hoy, con la base nueva
2. US4 → nueva partitura para todo (MVP)
3. US1 → acordes + «Himno a la alegría con acordes»
4. US2 → armaduras + Minueto con `key: 1`
5. US3 → ligaduras + «Canción de cuna»
6. US6 → semicorcheas, tresillos y 6/8 + «Greensleeves»
7. US5 → versión completa de las importadas
8. Polish → rendimiento, revisión de notación y cierre

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- [Story] enlaza cada tarea con su historia de la spec
- Hacer commit tras cada tarea o grupo lógico; `npm test` en verde antes de cada commit
- Parar en cada checkpoint para validar la historia por separado
- Las cifras exactas de las piezas nuevas se escriben al implementarlas y pasan `validateSong`

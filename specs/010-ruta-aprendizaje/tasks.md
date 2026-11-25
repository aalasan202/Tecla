# Tasks: Ruta de aprendizaje (Curso) para los niveles 1–2

**Input**: Design documents from `specs/010-ruta-aprendizaje/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/course.md](contracts/course.md), [quickstart.md](quickstart.md)

**Tests**: incluidos. La constitución (Principio II) exige tests para todo cambio en
`src/engine/`, `src/music/` y `src/state/`, y aquí también en `src/course/`, que es lógica pura.

**Organization**: por historia de usuario de la especificación:

| Historia | Contenido | Prioridad |
|----------|-----------|-----------|
| US1 | Curso desde cero | P1 |
| US2 | Consejos ilustrados | P1 |
| US3 | Ritmo | P2 |
| US4 | Acordes | P2 |
| US5 | Hitos y progreso previo | P2 |
| US6 | Prueba de nivel | P3 |
| US7 | Continuar y totales | P3 |

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia de usuario (US1…US7)

## Path Conventions

Proyecto único: `src/` y tests junto al código (`*.test.ts`), en la raíz del repositorio.

## Ruta de referencia (contenido que crean las fases)

Ids estables. Se guardan en el progreso y aparecen en las URL.

| Unidad | Orden de elementos |
|--------|--------------------|
| `u1` · Primeros pasos (nivel 1) | `consejo-postura`, `consejo-mano`, `consejo-dedos`, `consejo-do`, `l-posicion-do` (posiciones), `l-pentagrama` (lectura), `l-pulso` (ritmo), `hito-cinco`, `consejo-sin-golpear`, `l-redondas` (ritmo), `l-pasos-saltos` (lectura), `hito-oda`, `consejo-poco-a-menudo` |
| `u2` · Moverse por el teclado (nivel 2) | `consejo-lento`, `l-puntillo` (ritmo), `hito-jingle`, `consejo-contar`, `l-corcheas` (ritmo), `hito-martinillo`, `consejo-ojos`, `consejo-adelantado`, `l-fuera-posicion` (lectura), `hito-macdonald`, `consejo-brazo`, `l-saltos` (posiciones), `hito-susana`, `consejo-bucle` |
| `u3` · La mano izquierda y los primeros acordes | `l-mi-do` (posiciones), `l-clave-fa` (lectura), `consejo-metronomo`, `l-acorde-do` (acordes), `l-acordes-fa-sol` (acordes), `l-cambios` (acordes), `hito-oda-acordes` |

Totales: 14 lecciones (lectura 4, ritmo 4, posiciones 3, acordes 3), 7 hitos y 13 consejos.

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Crear la carpeta `src/course/` y `src/components/illustrations/` (vacías salvo un `index.ts` por carpeta si hace falta para el build); confirmar que la rama activa es `010-ruta-aprendizaje` y que `npm test` y `npm run build` pasan antes de empezar

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tipos, almacén, rutas y extracción de `Practice`, que usan todas las historias.

**⚠️ CRITICAL**: ninguna historia puede empezar sin esta fase.

- [X] T002 Añadir a `SongDef` en `src/music/types.ts` el campo opcional `kind?: "rhythm" | "chords"` con el comentario «Ejercicio del Curso: ritmo (cualquier tecla) o acordes (ventana de simultaneidad). Las piezas del repertorio no lo usan.»
- [X] T003 [P] Crear `src/course/types.ts` con los tipos de [data-model.md](data-model.md):
  - `Block = "reading" | "rhythm" | "position" | "chords"` y `BLOCK_LABEL` (Lectura, Ritmo, Posiciones, Acordes).
  - `Unit { id; title; level: 1 | 2; items: PathItem[]; test: string[] | null }`.
  - `PathItem`, la unión discriminada `lesson` / `milestone` (`songId`) / `tip`.
  - `Lesson { id; block; title; pages: ExplainPage[]; exercise: SongDef }`.
  - `ExplainPage { text; staff?: SongDef; keys?: { m: number; finger?: number }[] }`.
  - `Tip { id; level: 1 | 2; title; text; art: IllustrationId | IconId | null }`.
  - `IllustrationId` (`"posture" | "hand-shape" | "finger-numbers" | "find-c" | "arm-weight" | "arm-jump" | "eyes-on-score"`) e `IconId`.
  - `CourseProgress { best: Record<string, number>; seen: Record<string, true>; skipped: Record<string, true>; last: { itemId: string; at: number } | null }`.
  - `ItemStatus = "locked" | "available" | "passed" | "optional" | "seen"` y `UnitStatus = "locked" | "current" | "passed" | "skipped"`.
  - `PathState`.
  
  Sin React ni APIs del navegador (Principio I).
- [X] T004 [P] Escribir `src/state/course.test.ts`:
  - `recordCourseStars` guarda solo si mejora.
  - `markSeen` y `markSkipped` añaden ids.
  - `touchCourse` pone `last = { itemId, at }`.
  - `course.reset()` vuelve a `{ best: {}, seen: {}, skipped: {}, last: null }`.
  
  Seguir el patrón de `src/state/progress.test.ts`.
- [X] T005 Crear `src/state/course.ts` con `export const course = createStore<CourseProgress>("tecla-course", { best: {}, seen: {}, skipped: {}, last: null })` y las acciones `recordCourseStars(id, stars)`, `markSeen(tipId)`, `markSkipped(unitIds)` y `touchCourse(itemId)`, hasta que pase `src/state/course.test.ts`
- [X] T006 [P] Ampliar `Route` en `src/router.ts` con `{ name: "course" }` (`#curso`), `{ name: "courseItem"; itemId }` (`#curso/<itemId>`) y `{ name: "courseTest"; unitId }` (`#curso/prueba/<unitId>`), en `parseRoute` y en `hrefFor` (con `encodeURIComponent`). Añadir los casos a un test de rutas: si no existe, crear `src/router.test.ts` con ida y vuelta `parseRoute(hrefFor(r))` para las tres rutas nuevas y las existentes.
- [X] T007 Extraer la práctica de `LessonView` en `src/screens/LessonScreen.tsx` a `src/components/Practice.tsx`, con las props de [contracts/course.md](contracts/course.md) §4:
  - `song`, `modes`, `initialMode`, `engine`, `allowLoop`, `beat`, `onPlayResult`, `onSession`.
  - Además, `handsChoice?: boolean`, que por defecto es `true` y en el Curso es `false` (siempre ambas manos).
  
  `Practice` conserva partitura, teclado, pasos, tempo, disposición compacta, ayuda del pedal y `addPractice`. `LessonScreen` lo usa pasando `recordStars` y `recordSession` como callbacks, para que **Canciones quede exactamente igual** (mismo marcado, textos y comportamiento). `LessonScreen` acepta además una prop `back?: Route`, que por defecto es `{ name: "songs" }`, para el botón Atrás.
- [ ] T008 Verificar a mano que Canciones no ha cambiado tras T007: abrir «Himno a la alegría a dos manos» en escritorio y en móvil apaisado y probar Escuchar, Aprender (con y sin «A tempo»), Tocar, bucle, tempo y mano. Ejecutar `npm test` y `npm run build`.
- [X] T008a Crear `src/course/exercises.ts` (de momento con `export const EXERCISES: SongDef[] = []`) y `src/course/exercises.test.ts` con un test mínimo: cada `SongDef` de `EXERCISES` pasa `validateSong` sin errores. Cada fase que añada ejercicios los registra en `EXERCISES`, y así quedan validados desde el principio. T055 amplía las comprobaciones.

**Checkpoint**: `npm test` y `npm run build` pasan. Canciones funciona igual y hay almacén y rutas
del Curso, todavía sin pantallas.

---

## Phase 3: User Story 1 - Empezar desde cero con el Curso (Priority: P1) 🎯 MVP

**Goal**: mapa de unidades con desbloqueo lineal y lecciones (explicación interactiva y
ejercicio puntuado) de lectura y posiciones de la Unidad 1.

**Independent Test**: con el progreso vacío, abrir el Curso desde Inicio y recorrer las
lecciones `l-posicion-do`, `l-pentagrama` y `l-pasos-saltos` con el teclado en pantalla:
- 2★ en Tocar abre la siguiente;
- 1★ la deja bloqueada;
- tocar un elemento bloqueado explica qué falta.

### Tests for User Story 1

- [X] T009 [P] [US1] Escribir `src/course/path.test.ts` para `pathState(units, cp, songBest)`, con un curso de prueba pequeño (2 unidades, lecciones, un hito y consejos) definido en el propio test. Casos:
  - Progreso vacío: el primer puntuable `available`, los consejos previos `available` y el resto `locked`.
  - 2★ en la lección 1: la 2 pasa a `available`.
  - 1★: sigue `locked`.
  - Consejo no visto: no bloquea.
  - `next` apunta al primer consejo no visto antes del disponible y, si no hay, al disponible.
  - `summary` da la unidad actual con superados y total.
  - Ruta terminada: `next === null`.
  - Repetir con menos estrellas no rebaja nada (la mejor marca la guarda el almacén).
- [X] T010 [P] [US1] Escribir `src/course/text.test.ts`: `renderText("Pulsa {60} y luego {67}", "latin")` → «Pulsa Do y luego Sol»; con `"english"` → «Pulsa C y luego G»; `{C}` y `{G}` (marca por nombre) funcionan igual; un texto sin marcas queda intacto. Usar el nombre real del tipo `Notation` y de sus valores en `src/music/theory.ts`.

### Implementation for User Story 1

- [X] T011 [P] [US1] Crear `src/course/text.ts` con `renderText(text, notation)`, que sustituye `{<número MIDI>}` por `noteName(m, notation)` sin octava y `{<C…B>}` por el nombre en la notación elegida, hasta que pase `src/course/text.test.ts`
- [X] T012 [US1] Crear `src/course/path.ts` con `pathState`, `findItem(units, itemId)` y `courseStars(units, cp)` (solo lecciones, máximo `lecciones × 3`), según las reglas 1–6 de [data-model.md](data-model.md):
  - superado = 2 o más estrellas;
  - la frontera es el último puntuable superado o perteneciente a una unidad `skipped`;
  - antes de la frontera y no superado → `optional`;
  - el primero no superado tras la frontera → `available`;
  - los consejos nunca influyen en la frontera.
  
  Las estrellas de las lecciones salen de `cp.best[lesson.id]` y las de los hitos, de `songBest[songId]`. Debe pasar `src/course/path.test.ts`.
- [X] T013 [P] [US1] Añadir a `src/course/exercises.ts` (y a `EXERCISES`, T008a) los ejercicios de lectura y posiciones de la Unidad 1, como `SongDef` de una mano (`n`), en 4/4 y con como máximo 8 compases y 30 s a su tempo:
  - `curso-posicion-do`: Do‑Re‑Mi‑Fa‑Sol‑Fa‑Mi‑Re en negras y Do redonda (60–67, tempo 80).
  - `curso-pentagrama`: notas de la posición de Do en orden variado, negras y blancas (tempo 80).
  - `curso-pasos-saltos`: pasos (Do‑Re) y saltos de tercera (Do‑Mi, Re‑Fa, Mi‑Sol) en negras y blancas (tempo 80).
  
  Cada uno con `id`, `title`, `level: "Nivel 1 · Curso"` y `origin: "Ejercicio del proyecto"`.
- [X] T014 [US1] Crear `src/course/content.ts` con `export const COURSE: Unit[]`, que de momento tiene la Unidad 1 con sus tres lecciones de lectura y posiciones (`l-posicion-do`, `l-pentagrama`, `l-pasos-saltos`), en el orden de la tabla «Ruta de referencia». Cada lección tiene 1–2 `ExplainPage` (como máximo 80 palabras; al menos `staff` o `keys`):
  - `l-posicion-do`, página 1: el teclado y los grupos de dos teclas negras, con `keys` en los Do 48, 60 y 72. Página 2: la posición de Do de la mano derecha, con `keys` 60‑62‑64‑65‑67 y dedos 1‑5.
  - `l-pentagrama`: clave de sol, Do4 en línea adicional y Re…Sol, con `staff` de las cinco notas en redondas.
  - `l-pasos-saltos`: paso = nota vecina y salto = se salta una, con `staff` de ejemplo.
  
  Los nombres de nota van con marcas `{60}` (T011). Los consejos y los hitos de la tabla se añaden en US2 y US5. Las lecciones de ritmo, en US3.
- [X] T015 [P] [US1] Crear `src/components/ExplainPage.tsx`:
  - Texto con `renderText` según `settings.notation`.
  - Si hay `staff`: `ScoreView` de solo lectura (`buildScore(staff)`, sin marcas) y un botón «Escuchar» que crea un `Lesson` en modo `listen` con un host mínimo, como en `Practice`.
  - Si hay `keys`: `Keyboard` con rango de las teclas ±2 y `guide` con las teclas resaltadas (convertidas a `ScoreNote` mínimas o con la prop que ya use `Keyboard` para guiar). `onPress` hace sonar `playTone(m, 0.5)` y destella `"ok"` si la tecla está resaltada o `"down"` si no.
  - Escucha también el MIDI con `useMidiInput`.
  - No evalúa nada (FR-007a).
- [X] T016 [US1] Crear `src/screens/CourseLesson.tsx` (`#curso/<id>` de una lección):
  - `TopBar` con el título y Atrás a `#curso`.
  - Pasos: páginas de `ExplainPageView` con «Siguiente»; tras la última, `Practice` con `song = lesson.exercise`, `modes = ["listen", "learn", "play"]`, `allowLoop = false` y `handsChoice = false`.
  - `onPlayResult` llama a `recordCourseStars(lesson.id, r.stars)` y `touchCourse(lesson.id)`.
  - Con 2 o más estrellas, el resultado ofrece «Siguiente: <título>», que lleva a `pathState(...).next`.
  - Con menos de 2, «Repetir» y un texto que anima a volver a intentarlo.
  - Al entrar se llama a `touchCourse(lesson.id)`.
  - Salir a mitad no guarda estrellas, porque `Practice` solo informa al terminar Tocar. Al volver, la lección empieza en la primera página de explicación.
- [X] T017 [US1] Crear `src/screens/CourseMap.tsx` (`#curso`):
  - `TopBar` «Curso» con Atrás a Inicio.
  - Una sección por unidad (título, nivel, estado) con sus elementos en orden. Cada elemento lleva un icono por tipo y bloque, su título y su estado: bloqueado (candado), disponible (destacado), superado (★ 0–3), opcional (etiqueta «Opcional») o visto (✓).
  - El elemento `next` va destacado y con desplazamiento automático hasta él.
  - Un elemento bloqueado, al tocarlo, no navega: muestra un aviso «Supera antes “<título del puntuable anterior>” con 2 estrellas» (FR-018).
  - Se lee bien en móvil apaisado y en vertical, sin desplazamiento horizontal.
- [X] T018 [US1] Conectar las pantallas en `src/App.tsx`:
  - `course` → `CourseMap`.
  - `courseItem` → según `findItem`: lección → `CourseLesson`; consejo → `CourseTip` (US2; hasta entonces, un marcador); hito → `LessonScreen` con `back = { name: "course" }` (US5).
  - Si el id no existe: «No encontrado» con enlace a `#curso`.
  - Si el elemento está `locked`: el mismo aviso que el mapa, con enlace al mapa.
- [X] T019 [US1] Añadir en `src/screens/Home.tsx` una tarjeta «Curso» en `.tiles`, la primera, con icono nuevo `IconCourse` en `src/components/Icons.tsx`, el texto «Aprende desde cero: lectura, ritmo, posiciones y acordes» y enlace a `#curso`. El avance detallado se añade en US7.
- [X] T020 [US1] Estilos del mapa, la lección y la explicación en `src/styles.css`, con las variables de tema existentes: estados del mapa, elemento destacado, etiqueta «Opcional», páginas de explicación y botones «Siguiente»/«Repetir». Comprobar en tema claro y oscuro.

**Checkpoint**: la Unidad 1 se recorre con lecciones de lectura y posiciones. US1 funciona por sí
sola (MVP).

---

## Phase 4: User Story 2 - Consejos prácticos ilustrados (Priority: P1)

**Goal**: los 13 consejos en su sitio de la ruta, como fichas de unos 30 s con «Entendido» y
7 ilustraciones propias que siguen el tema.

**Independent Test**: abrir cada ficha:
- se lee en menos de un minuto;
- las 7 ilustraciones se ven bien en tema claro y oscuro;
- marcar o no marcar «Entendido» no cambia qué lecciones están abiertas.

### Tests for User Story 2

- [X] T021 [P] [US2] Añadir a `src/course/path.test.ts` los casos de consejos:
  - `seen` pasa a `"seen"`.
  - Un consejo antes de un puntuable `locked` está `locked`.
  - Los consejos iniciales de la unidad 1 están `available` con el progreso vacío.
  - Marcar consejos nunca cambia el estado de ningún puntuable.

### Implementation for User Story 2

- [X] T022 [P] [US2] Crear `src/course/tips.ts` con los 13 `Tip`, en español, para quien empieza, con como máximo 60 palabras cada uno y sin mencionar pantalla, ratón ni táctil (FR-024, FR-025):

  | id | Nivel | Título | Contenido | Arte |
  |----|-------|--------|-----------|------|
  | `consejo-postura` | 1 | Postura al sentarse | Altura de la banqueta con los antebrazos paralelos al suelo, codos un poco por delante del cuerpo, pies apoyados y centrado frente al Do central | `posture` |
  | `consejo-mano` | 1 | Forma de la mano | Redondeada como sujetando una pelota, tocar con la yema, pulgar de lado y muñeca recta | `hand-shape` |
  | `consejo-dedos` | 1 | Los números de los dedos | 1 = pulgar … 5 = meñique, igual en las dos manos | `finger-numbers` |
  | `consejo-do` | 1 | Encontrar el Do | Justo a la izquierda de cada grupo de dos teclas negras | `find-c` |
  | `consejo-sin-golpear` | 1 | Tocar sin golpear | Dedos cerca de las teclas, el peso del brazo y hombros sueltos | `arm-weight` |
  | `consejo-poco-a-menudo` | 1 | Practicar poco y a menudo | 10–15 min al día rinden más que una hora a la semana | icono reloj |
  | `consejo-lento` | 2 | Lento primero | Usa Aprender antes de Tocar | icono tortuga |
  | `consejo-contar` | 2 | Contar en voz alta | «1 y 2 y…» | icono voz |
  | `consejo-ojos` | 2 | Ojos en la partitura | Buscar la posición por el tacto, con las teclas negras como guía | `eyes-on-score` |
  | `consejo-adelantado` | 2 | Leer por adelantado | Mientras tocas una nota, mira ya la siguiente | icono flecha |
  | `consejo-brazo` | 2 | Saltar con el brazo | Mover el brazo entero y preparar la mano antes de llegar | `arm-jump` |
  | `consejo-bucle` | 2 | No volver al principio | Aislar el compás difícil con el bucle de Canciones | icono bucle |
  | `consejo-metronomo` | 2 | El metrónomo es tu aliado | Empezar lento y subir el tempo poco a poco | icono metrónomo |
- [X] T023 [P] [US2] Crear 7 ilustraciones como componentes React con SVG en línea en `src/components/illustrations/`. Todas con `viewBox` fijo, colores solo con variables CSS del tema (`var(--ink)`, `var(--muted)`, `var(--accent)`, `var(--ok)`, `var(--bad)` o las equivalentes que ya defina `src/styles.css`), sin imágenes externas y de menos de 4 KB cada una:
  - `Posture.tsx`: figura de perfil en la banqueta, con guías de antebrazo horizontal, distancia y pies apoyados.
  - `HandShape.tsx`: mano de lado sobre las teclas, correcta (arqueada, `--ok`) frente a incorrecta (plana o con muñeca hundida, `--bad`).
  - `FingerNumbers.tsx`: dos manos con los números 1–5.
  - `FindC.tsx`: fragmento de teclado con los grupos de dos negras y los Do resaltados.
  - `ArmWeight.tsx`: brazo y mano relajados, con una flecha de peso hacia abajo.
  - `ArmJump.tsx`: teclado con el arco del brazo entre dos posiciones.
  - `EyesOnScore.tsx`: esquema de la mirada sobre la partitura y no sobre las manos.
  
  Exportar `Illustration({ id }: { id: IllustrationId })` desde `src/components/illustrations/index.ts`, con `role="img"` y `aria-label` descriptivo.
- [X] T024 [P] [US2] Añadir a `src/components/Icons.tsx` los iconos que falten para los consejos sin ilustración (reloj, tortuga, voz, flecha, bucle, metrónomo), con el estilo de los existentes
- [X] T025 [US2] Crear ya en `COURSE` de `src/course/content.ts` las unidades `u2` («Moverse por el teclado», nivel 2) y `u3` («La mano izquierda y los primeros acordes», nivel 2), con `test: null` provisional. Insertar los 13 consejos en las tres unidades, en el orden de la tabla «Ruta de referencia», como `{ type: "tip", id, tip }`. Las lecciones e hitos se insertan después en su sitio (T033, T039, T041, T042).
- [X] T026 [US2] Crear `src/screens/CourseTip.tsx` (`#curso/<consejo>`):
  - `TopBar` con el título y Atrás a `#curso`.
  - La ilustración o el icono grande, el texto y el botón «Entendido».
  - «Entendido» llama a `markSeen(id)` y `touchCourse(id)` y navega a `pathState(...).next` (o al mapa si no hay).
  - Se lee sin desplazamiento horizontal en móvil apaisado. En vertical se muestra el aviso «Gira el móvil», como en el resto de la app.
  
  Conectarla en `src/App.tsx` en lugar del marcador de T018.
- [ ] T027 [US2] Estilos de la ficha de consejo en `src/styles.css`. Comprobar las 7 ilustraciones en tema claro y oscuro, en escritorio y en móvil apaisado (SC-006).

**Checkpoint**: la Unidad 1 tiene sus 6 consejos de nivel 1 en orden. Los consejos de nivel 2
quedan en su sitio para cuando existan las Unidades 2 y 3.

---

## Phase 5: User Story 3 - Lecciones de ritmo con metrónomo (Priority: P2)

**Goal**: ejercicios de ritmo sobre cualquier tecla, con cuenta previa de un compás, metrónomo
audible y visible, y puntuación solo por el momento de cada golpe.

**Independent Test**: lección `l-pulso` con el teclado en pantalla:
- tocar a tiempo da 3★;
- tocar fuera de la ventana da 0★;
- dos teclas a la vez cuentan un golpe;
- se ve y se oye la cuenta previa de 4 pulsos.

### Tests for User Story 3

- [X] T028 [P] [US3] Añadir a `src/engine/lesson.test.ts` un `describe("ritmo (010)")` con `testHost` y reloj simulado, para una pieza de 4/4 con negras en Do4 y `rhythm: true`:
  - Golpes exactos con teclas distintas (60, 72, 65…) → 3★.
  - Cada golpe a más de `HIT_WINDOW` → 0★.
  - Dos `input` a menos de 80 ms → un solo acierto y ningún sobrante.
  - Un golpe sin nota cercana → sobrante.
  
  Añadir también un caso de no regresión: la misma pieza **sin** `rhythm`, tocada con alturas erróneas, sigue dando 0★.
- [X] T029 [P] [US3] Añadir a `src/music/validate.ts` (con su test donde ya se pruebe `validateSong`) la regla: si `kind === "rhythm"`, el compás debe ser 4/4 (sin `time` y `bar` 4 o ausente). El mensaje debe nombrar la regla.

### Implementation for User Story 3

- [X] T030 [US3] Implementar `rhythm?: boolean` en `LessonOptions` de `src/engine/lesson.ts`:
  - En `inputPlay`, si `rhythm` está activo, buscar la nota pendiente más cercana dentro de `win.hit` **sin comparar `n.m`**.
  - Ignorar (ni acierto ni sobrante) las pulsaciones a menos de `RHYTHM_MERGE = 0.08` s del último golpe contado, usando `host.now()`.
  - Sin la opción, el comportamiento es idéntico al actual.
  
  Debe pasar T028 y todos los tests existentes.
- [X] T031 [P] [US3] Crear `src/components/BeatIndicator.tsx`: un círculo que late en cada pulso, más fuerte en el primero del compás y con `aria-hidden`. Expone `pulse(strong)` por `ref`. En `Practice` (`src/components/Practice.tsx`), con `beat`, el `click` del host llama a `playClick(strong)` y a `pulse(strong)`. Se muestra junto al estado, sin romper la disposición compacta en móvil apaisado.
- [X] T032 [P] [US3] Añadir a `src/course/exercises.ts` los ejercicios de ritmo, todos `kind: "rhythm"`, en 4/4, sobre Do4 (60), con como máximo 8 compases y 30 s:
  - `curso-pulso`: negras y blancas (tempo 80).
  - `curso-redondas`: redondas, blancas y silencios de negra y de blanca (pistas con `0` como silencio; tempo 80).
  - `curso-puntillo`: blanca con puntillo y negra con puntillo + corchea (tempo 72).
  - `curso-corcheas`: pares de corcheas mezclados con negras (tempo 72).
- [X] T033 [US3] Añadir a `COURSE` en `src/course/content.ts` las lecciones `l-pulso` y `l-redondas` (Unidad 1), y `l-puntillo` y `l-corcheas` (Unidad 2, en su sitio entre los consejos ya insertados en T025), con 1–2 `ExplainPage` cada una (≤ 80 palabras, `staff` del ritmo que se puede escuchar). En `CourseLesson` (`src/screens/CourseLesson.tsx`), si `exercise.kind === "rhythm"`:
  - `modes = ["listen", "play"]`;
  - `engine = { rhythm: true }`;
  - `beat = true`;
  - una pista en el ejercicio: «Toca el ritmo con cualquier tecla».
  
  Activar `beat = true` en todos los ejercicios del Curso.

**Checkpoint**: las cuatro lecciones de ritmo se completan con el teclado en pantalla y se puntúan
solo por el tiempo.

---

## Phase 6: User Story 4 - Primeros acordes con la mano izquierda (Priority: P2)

**Goal**: Unidad 3 con la mano izquierda en posición de Do, la clave de fa y los acordes de Do,
Fa y Sol (Si‑Re‑Sol). Los acordes se aceptan a la vez con MIDI o táctil, o seguidos con ratón en
un margen de 1,5 s.

**Independent Test**: las tres lecciones de acordes:
- con MIDI o en móvil, tres dedos a la vez aciertan;
- con ratón, tres clics en menos de 1,5 s aciertan y en más de 1,5 s fallan;
- una nota ajena estropea el acorde.

### Tests for User Story 4

- [X] T034 [P] [US4] Añadir a `src/engine/lesson.test.ts` un `describe("acordes (010)")` con `chordSpread: (via) => (via === "screen-mouse" || via === "computer-keys" ? 1.5 : 0.15)` y una pieza de acordes de tres notas en la mano izquierda:
  - Tres `input(m, "midi")` en 0,05 s → acierto y 3★ si todos los acordes van así.
  - Tres `input(m, "screen-mouse")` repartidos en 1,2 s → acierto.
  - En 2 s → fallo.
  - Con MIDI repartidos en 0,6 s → fallo.
  - Una altura ajena con el acorde abierto → el acorde vale 0 puntos.
  
  Sin `chordSpread`, el comportamiento es el actual (un caso de no regresión).
- [X] T035 [P] [US4] Comprobar con un test en `src/music/score.test.ts` que `buildScore` acepta un `SongDef` a dos manos con la pista `r` hecha solo de silencios (`[[0, 4], …]`) y `l` con notas o acordes. Si falla, corregirlo en `src/music/score.ts` o `src/music/validate.ts` sin cambiar el resultado de las piezas existentes. Lo necesitan los ejercicios de mano izquierda.

### Implementation for User Story 4

- [X] T036 [US4] Implementar en `src/engine/lesson.ts`:
  - `chordSpread?: number | ((via: InputVia) => number)` en `LessonOptions`.
  - `export type InputVia = "screen-touch" | "screen-mouse" | "midi" | "computer-keys"`.
  - `input(m: number, via?: InputVia)`.
  
  En Tocar, al acertar la primera nota de un `unit` con más de una nota, abrir el acorde hasta `now + chordSpread(via)`. Mientras está abierto:
  - sus notas restantes se aceptan aunque estén fuera de `win.hit`, juzgadas como `"good"` (o `"perfect"` si están dentro de `win.perfect`);
  - sus notas acertadas siguen sonando con `host.tone(m, duración del acorde)`;
  - una altura ajena marca el acorde como estropeado (todas sus notas sin puntos en `result()`) y suma un sobrante.
  
  Sin la opción, idéntico a hoy. Debe pasar T034 y los tests existentes.
- [X] T037 [US4] Cambiar `src/components/Keyboard.tsx` para que `onPress(m, via)` informe de `"screen-touch"` o `"screen-mouse"` según `e.pointerType` (`"touch"`/`"pen"` → touch, el resto → mouse) y de `"computer-keys"` para las letras. En `src/components/Practice.tsx`, pasar `via` a `lesson.input(m, via)` y `"midi"` desde `useMidiInput`. Además, `Practice` pasa al motor `chordSpread: (via) => (via === "screen-mouse" || via === "computer-keys" ? 1.5 : 0.15)` **siempre que la partitura tenga algún acorde** (algún `unit` con más de una nota), en el Curso y en Canciones (FR-014a). Actualizar las demás llamadas a `Keyboard` (`src/screens/FreePiano.tsx`, `src/components/ExplainPage.tsx`), que pueden ignorar `via`.
- [X] T038 [P] [US4] Añadir a `src/course/exercises.ts` los ejercicios de la Unidad 3. Los de mano izquierda son a dos manos, con `r` solo de silencios y `l` con las notas (T035), en 4/4, con como máximo 8 compases y 30 s:
  - `curso-mi-do`: posición de Do de la mano izquierda, 48‑50‑52‑53‑55 y vuelta, dedos 5‑1 (tempo 72).
  - `curso-clave-fa`: lectura en clave de fa de Si2 (47) a Sol3 (55), más La2 (45) y Fa2 (41) (tempo 72).
  - `curso-acorde-do`: acorde `DO = [48, 52, 55]` en blancas y redondas, `kind: "chords"` (tempo 60).
  - `curso-acordes-fa-sol`: `FA = [41, 45, 48]` y `SOL = [47, 50, 55]` (Si‑Re‑Sol), por separado y luego alternando con Do, `kind: "chords"` (tempo 60).
  - `curso-cambios`: progresión Do‑Fa‑Do‑Sol‑Do en blancas a tempo, como en `oda-acordes`, `kind: "chords"` (tempo 66).
  
  Digitación 5‑3‑1 en los tres acordes.
- [X] T039 [US4] Añadir a `COURSE` en `src/course/content.ts` la unidad `u3` con `l-mi-do`, `l-clave-fa`, `l-acorde-do`, `l-acordes-fa-sol` y `l-cambios` (más el consejo `consejo-metronomo` en su sitio), con sus `ExplainPage`:
  - `l-mi-do`: `keys` 48–55 con dedos 5‑1.
  - `l-clave-fa`: `staff` en clave de fa.
  - `l-acorde-do`: «Qué es un acorde: tres notas a la vez», con `keys` 48/52/55 y dedos 5/3/1, y `staff` del acorde apilado.
  - `l-acordes-fa-sol`: Fa mayor, y Sol mayor «con el Si abajo para no mover la mano».
  - `l-cambios`: cambiar a tempo.
  
  En `CourseLesson`, si `exercise.kind === "chords"`, mostrar una pista: «Pulsa las tres notas a la vez. Con el ratón, una tras otra y rápido». El margen de acordes ya lo activa `Practice` (T037).
- [ ] T039a [US4] Verificar a mano en Canciones, con ratón, que «Himno a la alegría con acordes» se puede tocar en Tocar con las dos manos y sacar 2★ o más, y que una pieza sin acordes («Himno a la alegría a dos manos») puntúa igual que antes (FR-014a)

**Checkpoint**: la Unidad 3 se completa con MIDI, en móvil táctil y con ratón.

---

## Phase 7: User Story 5 - Piezas‑hito y progreso que ya existe (Priority: P2)

**Goal**: los 7 hitos del repertorio en la ruta, con estrellas compartidas con Canciones, y la
regla de frontera que respeta el progreso previo.

**Independent Test**: con 2★ en «Martinillo» desde Canciones y nada más:
- en el Curso todo hasta Martinillo está abierto y lo anterior sin estrellas es «Opcional»;
- un hito tocado desde el Curso suma en Canciones.

### Tests for User Story 5

- [X] T040 [P] [US5] Añadir a `src/course/path.test.ts`:
  - Un hito con 2★ en `songBest` → `passed`, todo lo anterior abierto y los puntuables anteriores sin 2★ → `optional`.
  - Un hito superado en la unidad 2 sin nada en la 1 → la unidad 1 `passed` (con opcionales) y la 2 `current`.
  - Un hito con 1★ no mueve la frontera.
  - Las estrellas del hito se leen siempre de `songBest`, nunca de `cp.best`.

### Implementation for User Story 5

- [X] T041 [US5] Insertar en `COURSE` de `src/course/content.ts` los hitos `{ type: "milestone", id: "hito-<songId>", songId }` de la tabla «Ruta de referencia»: `cinco` y `oda` (u1); `jingle`, `martinillo`, `macdonald` y `susana` (u2); `oda-acordes` (u3).
- [X] T042 [US5] Añadir a `src/course/exercises.ts` los ejercicios de la Unidad 2 que faltan, de una mano, en 4/4, con como máximo 8 compases y 30 s:
  - `curso-fuera-posicion`: Sol3 (55), La3 (57), La4 (69) y Si4 (71) junto a la posición de Do (tempo 80).
  - `curso-saltos`: frase en posición de Do y la misma en posición de Sol (67–74), con cambio de mano preparado en un silencio (tempo 80).
  
  Añadir a `COURSE` (u2) las lecciones `l-fuera-posicion` y `l-saltos` con sus `ExplainPage`.
- [X] T043 [US5] Hito desde el Curso: en `src/App.tsx`, `courseItem` de tipo hito renderiza `LessonScreen` con `songId` y `back = { name: "course" }`. En `LessonScreen` (mediante una prop, p. ej. `fromCourse`), llamar a `touchCourse("hito-<songId>")` al entrar y **después** de cada `recordSession` (entrar, cambiar de paso, terminar), para que el `at` del Curso sea siempre posterior aunque se salga sin terminar (R12). Al abrir un hito desde el Curso, la cabecera muestra «Curso · Unidad X» y un enlace «Volver al Curso». Las estrellas se guardan con `recordStars`, como siempre.
- [X] T044 [US5] En `src/screens/CourseMap.tsx`, mostrar los hitos con el título de la pieza, su nivel y sus estrellas de `progress.best`, y la etiqueta «Opcional» en los puntuables `optional`. Con la ruta terminada (`next === null`), el mapa muestra «¡Ruta completada!» y un enlace a Canciones para seguir con las piezas de nivel 3 (desplazado o filtrado a ese nivel si Canciones lo permite; si no, a `#canciones`). Verificar a mano el recorrido de la historia 5 (quickstart, recorrido 4).

**Checkpoint**: la ruta completa existe (3 unidades) y el progreso previo se respeta.

---

## Phase 8: User Story 6 - Prueba de nivel para saltar una unidad (Priority: P3)

**Goal**: en las unidades 2 y 3, «Prueba de nivel» con un ejercicio por bloque trabajado antes.
Si se aprueba, se saltan las anteriores.

**Independent Test**: con el progreso vacío, la prueba de la Unidad 2:
- si se suspende, no se desbloquea nada y se indica el bloque a repasar;
- si se aprueba, la Unidad 1 queda «superada por prueba» y la 2 se abre.

### Tests for User Story 6

- [X] T045 [P] [US6] Añadir a `src/course/path.test.ts`:
  - `testOutcome(ids, stars)`: todos con 2★ o más → `passed`; uno con 1★ → no aprobado y `weakest` es su bloque; sin estrellas → no aprobado.
  - `pathState` con `skipped: { u1: true }`: la unidad 1 queda `skipped`, sus puntuables sin estrellas son `optional` y el primer puntuable de la u2 queda `available`.

### Implementation for User Story 6

- [X] T046 [P] [US6] Añadir a `src/course/exercises.ts` los 6 ejercicios de prueba, distintos de los de las lecciones, con como máximo 8 compases:
  - Unidad 2: `curso-prueba-u2-reading`, `curso-prueba-u2-rhythm` (`kind: "rhythm"`) y `curso-prueba-u2-position`, de nivel 1.
  - Unidad 3: `curso-prueba-u3-reading`, `curso-prueba-u3-rhythm` (`kind: "rhythm"`) y `curso-prueba-u3-position`, de nivel 2 (corcheas, puntillo, notas fuera de la posición).
  
  Rellenar `test` de `u2` y `u3` en `src/course/content.ts`, con `test: null` en `u1`.
- [X] T047 [US6] Implementar en `src/course/path.ts` la función `testOutcome(exerciseIds, stars): { passed: boolean; weakest: Block | null }` (bloque deducido del id) y, en `pathState`, el tratamiento de `skipped` según la regla de la frontera. Debe pasar T045.
- [X] T048 [US6] Crear `src/screens/CourseTest.tsx` (`#curso/prueba/<unitId>`):
  - Introducción («Un ejercicio de cada bloque. Necesitas 2 estrellas en todos») y luego los ejercicios seguidos con `Practice` (modo Tocar, con Escuchar disponible; `rhythm` o nada según `kind`).
  - Se guarda cada resultado con `recordCourseStars(exerciseId, stars)`.
  - Al final, `testOutcome`: si aprueba, `markSkipped(ids de las unidades anteriores)` y el mensaje «Unidad X abierta» con un botón al mapa; si no, «Te conviene repasar <bloque>» con «Repetir prueba» y «Volver al mapa».
  - Sin límite de intentos.
  
  Conectarla en `src/App.tsx`. Añadir en `src/screens/CourseMap.tsx` el botón «Prueba de nivel» en cada unidad bloqueada que tenga `test`.

**Checkpoint**: se puede saltar la Unidad 1 (o la 1 y la 2) aprobando su prueba.

---

## Phase 9: User Story 7 - Continuar donde lo dejé y totales (Priority: P3)

**Goal**: «Continuar» en Inicio va al Curso o a Canciones según lo último practicado. Inicio y
Progreso muestran el avance y las estrellas del Curso aparte, y el tiempo y la racha incluyen el
Curso (FR-028, FR-030, FR-036, FR-037).

**Independent Test**:
- Tras una lección, «Continuar» abre el siguiente elemento del Curso; tras una pieza de
  Canciones, abre esa pieza.
- El total de estrellas del repertorio no cambia al ganar estrellas en lecciones.

### Tests for User Story 7

- [X] T049 [P] [US7] Añadir a `src/course/path.test.ts`:
  - `courseStars` suma solo lecciones, con máximo `14 × 3` en el curso real.
  - Una función pura `continueTarget(courseLast, songLast, next)` (en `src/course/path.ts`) devuelve `{ kind: "course", itemId }` si `courseLast.at > songLast.at` y queda `next`, y `{ kind: "song" }` en los demás casos (sin `courseLast`, ruta terminada o `songLast` más reciente).

### Implementation for User Story 7

- [X] T050 [US7] Implementar `continueTarget` en `src/course/path.ts` hasta que pase T049
- [X] T051 [US7] En `src/screens/Home.tsx`:
  - La tarjeta «Curso» muestra «Unidad X · N de M» (`pathState(...).summary`) y «Curso: N de M estrellas» (`courseStars`); con la ruta terminada, «Ruta completada».
  - La sección «Continuar» usa `continueTarget`: si es el Curso, muestra el título del elemento `next`, su unidad y el botón «Continuar» a `#curso/<next>`; si no, como hoy.
  - `repertoireStars` y la tarjeta de Canciones no cambian.
- [X] T052 [US7] En `src/screens/ProgressScreen.tsx`, añadir la estadística «Curso» («N de M estrellas») y una sección «Curso» con cada unidad y sus lecciones superadas de su total. Las estadísticas de Canciones quedan igual (FR-037). Cambiar el texto de ayuda del tiempo a «Cuenta el tiempo con una lección o ejercicio en marcha y el que tocas en Piano libre».
- [X] T053 [US7] En `src/screens/SettingsScreen.tsx`, «Borrar el progreso» llama también a `course.reset()`, y el texto de confirmación menciona el Curso.
- [ ] T054 [US7] Verificar que el tiempo de los ejercicios del Curso suma a `progress.days`, porque `Practice` llama a `addPractice`. Para comprobarlo, practicar solo en el Curso un día limpio y ver que la racha y la semana de Inicio se actualizan (FR-036).

**Checkpoint**: todas las historias funcionan.

---

## Phase 10: Polish & Cross-Cutting Concerns

- [X] T055 Crear `src/course/checks.ts` y `src/course/checks.test.ts` con las comprobaciones de [data-model.md](data-model.md) sobre `COURSE` (FR-034, FR-035):
  - ids únicos;
  - todo `milestone.songId` existe en `SONGS`;
  - entre 12 y 16 lecciones, con al menos 2 por bloque;
  - los 13 ids de consejo de T022 están todos presentes, y `consejo-postura` y `consejo-mano` van antes de la primera lección;
  - cada ejercicio de lección y de prueba pasa `validateSong` sin errores, tiene como máximo 8 compases y dura como máximo 30 s a su tempo;
  - los ejercicios `kind: "rhythm"` están en 4/4 y los `kind: "chords"` tienen acordes de 3 notas;
  - cada lección tiene 1–2 páginas de como máximo 80 palabras, con `staff` o `keys`;
  - los consejos tienen como máximo 60 palabras y no contienen «pantalla», «ratón» ni «táctil»;
  - los 7 consejos con ilustración obligatoria (FR-026) tienen un `IllustrationId`.
- [ ] T056 [P] Revisar todos los textos (explicaciones y consejos) en español claro para quien empieza, con los nombres de nota como marcas `{…}` para que respeten Do‑Re‑Mi o C‑D‑E. Comprobar en la app con las dos notaciones (FR-031).
- [ ] T057 [P] Comprobar la disposición en móvil apaisado: el ejercicio cabe sin desplazamiento (FR-032), el mapa y las fichas no tienen desplazamiento horizontal y en vertical se muestra el aviso de girar, como en el resto de la app. Corregir en `src/styles.css` lo que haga falta.
- [ ] T058 [P] Comprobar sin conexión tras una visita (modo avión): mapa, lecciones, consejos con ilustraciones y ejercicios (SC-007). No debería hacer falta tocar `src/pwa/`.
- [ ] T059 Ejecutar todos los recorridos de [quickstart.md](quickstart.md) en escritorio (Chrome) y en móvil apaisado, con teclado en pantalla y, si está disponible, con MIDI
- [X] T060 Ejecutar `npm test` y `npm run build`, y que pasen sin errores
- [ ] T061 Marcar en `old_docs/ROADMAP.md`, sección v0.6, la línea «Ruta de aprendizaje: lecciones de lectura, ritmo, posiciones de mano y acordes.» con ✅, con el mismo formato que las versiones anteriores

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** → **Foundational (2)**: bloquea todas las historias.
- **US1 (3)**: tras la fase 2. Es el MVP.
- **US2 (4)**: tras la fase 2. Usa el mapa y `findItem` de US1 (T012, T017), así que en la
  práctica va después de US1.
- **US3 (5)**: tras US1, porque añade lecciones a `COURSE` y usa `CourseLesson`. Los tests y el
  motor (T028–T031) pueden empezar tras la fase 2.
- **US4 (6)**: tras US1. El motor (T034, T036) y `Keyboard` (T037) pueden empezar tras la fase 2.
- **US5 (7)**: tras US1. Completa la Unidad 2 (junto con las lecciones de ritmo de US3).
- **US6 (8)**: tras US1, US3, US4 y US5, porque la prueba cubre bloques de unidades completas.
- **US7 (9)**: tras US1. Se luce mejor con toda la ruta.
- **Polish (10)**: tras todas las historias.

### Within Each User Story

- Los tests (T009, T010, T021, T028, T034, T040, T045, T049) se escriben primero y deben fallar.
- Lógica pura (`src/course/`, motor) antes que las pantallas.
- Contenido (`exercises.ts`, `tips.ts`, `content.ts`) antes de verificar a mano.

### Parallel Opportunities

- Fase 2: T003, T004 y T006 en paralelo, y después T005 y T007.
- US1: T009, T010, T011, T013 y T015 en paralelo.
- US2: T022, T023 y T024 en paralelo. Las 7 ilustraciones de T023 se pueden repartir.
- US3 y US4: los cambios del motor (T030 y T036) tocan el mismo archivo, así que van uno detrás
  del otro. T031, T032 y T038 son paralelos entre sí.
- Polish: T056, T057 y T058 en paralelo.

---

## Parallel Example: User Story 1

```bash
Task: "T009 Tests de pathState en src/course/path.test.ts"
Task: "T010 Tests de renderText en src/course/text.test.ts"
Task: "T013 Ejercicios de lectura y posiciones de la Unidad 1 en src/course/exercises.ts"
Task: "T015 ExplainPage en src/components/ExplainPage.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T022 Los 13 consejos en src/course/tips.ts"
Task: "T023 Ilustraciones en src/components/illustrations/"
Task: "T024 Iconos de consejos en src/components/Icons.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Fases 1 y 2: base y extracción de `Practice`, con Canciones igual.
2. Fase 3 (US1): mapa y lecciones de lectura y posiciones de la Unidad 1.
3. **Parar y validar**: recorrer la Unidad 1 con el teclado en pantalla.

### Incremental Delivery

1. Añadir US2 (consejos ilustrados), con lo que la Unidad 1 queda completa salvo ritmo e hitos.
2. Añadir US3 (ritmo) y US5 (hitos y Unidad 2): Unidades 1 y 2 completas.
3. Añadir US4: Unidad 3 con acordes. La ruta queda completa.
4. Añadir US6 (prueba de nivel) y US7 (Continuar y totales).
5. Pulido, comprobaciones de estructura y hoja de ruta.

Cada incremento deja `main` publicable (`npm test` y `npm run build`).

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes.
- Los tests del motor existentes deben pasar **sin cambios** en cada fase (no regresión).
- Hacer un commit por tarea o por grupo lógico.
- Las ids de elementos y ejercicios son estables: no se renombran después de publicar.

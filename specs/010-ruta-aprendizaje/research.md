# Research: Ruta de aprendizaje (Curso) para los niveles 1–2

Decisiones técnicas de la funcionalidad 010. Cada una resuelve una pregunta del Technical
Context de [plan.md](plan.md) o algo que la especificación dejaba al plan.

## R1. Dónde vive el contenido del Curso

- **Decision**: módulo nuevo `src/course/` de datos y lógica puros (sin React ni navegador):
  - `content.ts`: unidades, elementos y lecciones.
  - `tips.ts`: textos de los consejos.
  - `exercises.ts`: ejercicios como `SongDef`.
  - `path.ts`: estado derivado del mapa.
  - `checks.ts`: comprobaciones de estructura.
  
  Las ilustraciones van en `src/components/illustrations/`, porque son vista.
- **Rationale**: es el mismo reparto que `src/music/` (datos y teoría puros, probados) frente a
  `src/components/` (Principios I y II). El desbloqueo es la lógica con más casos (progreso con
  huecos, prueba de nivel, opcionales), así que tiene que poder probarse sin navegador.
- **Alternatives considered**: meter el curso en `src/music/` mezclaría pedagogía con teoría
  musical. Cargarlo desde JSON en `public/` añade una petición y un caso «sin conexión» que hoy
  no existe; además, TypeScript ya valida la forma de los datos al compilar.

## R2. Cómo se representan los ejercicios

- **Decision**: cada ejercicio es un `SongDef` normal, con id `curso-<lección>` (o
  `curso-prueba-<unidad>-<bloque>`) y un campo nuevo opcional `kind?: "rhythm" | "chords"`. Se
  construye con `buildScore` y lo ejecuta el motor `Lesson` de siempre. Pasa `validateSong`
  como cualquier pieza (FR-034).
- **Rationale**: reutilizar todo lo que ya existe (partitura VexFlow, digitación, ventanas de
  acierto, estrellas, tempo, MIDI) es la vía más simple (Principio V). Sin `kind`, un ejercicio
  de lectura o posiciones es literalmente una pieza muy corta.
- **Alternatives considered**: crear un modelo de ejercicio propio duplicaría la partitura y la
  puntuación. Meter los ejercicios en `SONGS` haría que aparecieran en Canciones y en los
  totales de estrellas, lo que va contra FR-037.

## R3. Ritmo: cualquier tecla y un solo golpe por pulsación (FR-011, FR-012)

- **Decision**: opción `rhythm?: boolean` en `LessonOptions`. Si está activa, en Tocar:
  - `inputPlay` compara con la nota pendiente más cercana **sin mirar la altura**.
  - Las pulsaciones a menos de `RHYTHM_MERGE` (80 ms) de un golpe ya contado se ignoran, así que
    varias teclas a la vez cuentan como un solo golpe y no como notas sobrantes.
  - El resto (ventanas `HIT_WINDOW` y `PERFECT_WINDOW`, notas sobrantes, estrellas) no cambia.
  
  La pista de un ejercicio de ritmo es una sola altura (Do4) para que la partitura lea bien.
- **Rationale**: FR-012 pide la misma tolerancia que Tocar, y eso sale gratis porque se reutiliza
  el bucle de juego. Basta con quitar la comparación de altura.
- **Alternatives considered**: una pantalla de «tap» aparte sin partitura obligaría a duplicar
  el metrónomo y la puntuación, y no enseñaría a leer el ritmo.

## R4. Cuenta previa y metrónomo visible (FR-011)

- **Decision**: se mantiene `COUNT_IN = 4` pulsos, que en compás de 4/4 es exactamente un compás.
  Todos los ejercicios de ritmo se escriben en 4/4 y una comprobación de `checks.ts` lo
  garantiza. Para que el pulso se **vea**, el `LessonHost` de la pantalla usa el `click(strong)`
  que ya existe para encender un indicador de pulso (círculo que late; el primer pulso del
  compás es más fuerte). El indicador se muestra en todos los ejercicios del Curso.
- **Rationale**: ni el motor ni la cuenta previa de las piezas cambian. El indicador visual es
  solo vista.
- **Alternatives considered**: hacer `COUNT_IN` igual a un compás para todas las piezas cambiaría
  la cuenta de las piezas en 3/4 y 6/8, que está fuera del alcance.

## R5. Acordes: simultaneidad y teclado en pantalla con ratón (FR-013, FR-014)

- **Decision**: opción `chordSpread?: number | ((via) => number)` (segundos) en `LessonOptions`.
  `Practice` la activa en **toda pieza cuya partitura tenga algún acorde** (un `unit` con más de
  una nota): ejercicios `kind: "chords"` y también piezas del repertorio como «Himno a la alegría
  con acordes», en el Curso y en Canciones (FR-014a). Corrige un problema anterior: con ratón,
  esas piezas no se podían tocar a tempo. Las piezas sin acordes no cambian. En Tocar:
  - Cuando se acierta la primera nota de un acorde (un `unit` con más de una nota), las demás
    notas de ese acorde se aceptan hasta `chordSpread` segundos después, aunque ya estén fuera de
    `win.hit`.
  - Una nota ajena pulsada mientras ese acorde está abierto lo **estropea**: cuenta como fallo
    entero (`result()` no le da puntos), además de la penalización habitual por sobrante.
  
  La ventana depende de **de dónde viene la pulsación**: `input(m, via)` con
  `via: "screen-touch" | "screen-mouse" | "midi" | "computer-keys"` (contrato en
  [contracts/course.md](contracts/course.md)).
  - MIDI o pantalla táctil: 0,15 s.
  - Pantalla con ratón o teclado del ordenador: 1,5 s. El teclado del ordenador sí permite
    pulsar varias teclas a la vez, pero se le da el margen amplio porque es menos preciso y
    hacerlo así no perjudica a nadie.
  
  `Keyboard` informa del `pointerType` de cada pulsación.
- **Rationale**: es la única forma fiable de distinguir «tres dedos a la vez» de «tres clics».
  El motor sigue sin saber nada del DOM (recibe un número y una etiqueta). En Aprender los
  acordes ya funcionan (el grupo espera a que estén todas las notas), así que no cambia.
  - **Sonar juntas**: con ratón, las notas ya pulsadas de un acorde abierto suenan durante la
    figura completa (`tone` con la duración del acorde), de modo que al llegar la tercera suenan
    las tres.
- **Alternatives considered**:
  - Una ventana única de 1,5 s para todos dejaría pasar acordes «arpegiados» con MIDI, que la
    especificación quiere a la vez.
  - Detectar el ratón con `matchMedia("(pointer: fine)")` falla en portátiles táctiles y en
    tabletas con ratón. El `pointerType` de cada evento no falla.

## R6. Cómo se puntúa y desbloquea (FR-009, FR-016, FR-019)

- **Decision**: solo cuentan las estrellas del paso Tocar.
  - Las de las lecciones y las pruebas se guardan en un almacén nuevo, `tecla-course`.
  - Las de los hitos siguen en `progress.best`, el mismo almacén que Canciones (FR-021).
  
  El estado del mapa es una **función pura** `pathState(course, best)` que se recalcula en cada
  render, sin guardar estados derivados.
- **Rationale**: si se derivan, no hay estados incoherentes que migrar. Por ejemplo, si alguien
  consigue 2 estrellas en un hito desde Canciones, el mapa lo refleja sin escribir nada (FR-021,
  historia 5).
- **Alternatives considered**: guardar el «desbloqueado» de cada elemento obligaría a
  sincronizarlo desde Canciones y desde el borrado de progreso.

## R7. Progreso que ya existe y elementos opcionales (FR-022)

- **Decision**: en `pathState`, la **frontera** es el último elemento puntuable superado o saltado
  de toda la ruta. Puede venir de:
  - un hito con 2 o más estrellas en `progress.best`;
  - una lección con 2 o más estrellas;
  - una unidad superada por prueba.
  
  Lo anterior a la frontera queda abierto. Lo que está antes y no tiene 2 estrellas se marca
  `optional`. El siguiente elemento puntuable tras la frontera es `available`, y el resto,
  `locked`.
- **Rationale**: una sola regla cubre el progreso previo, los huecos («manda el hito superado más
  avanzado») y la prueba de nivel. Es fácil de probar con tablas.

## R8. Prueba de nivel (FR-020)

- **Decision**: la prueba de la unidad *k* es la lista de ejercicios
  `curso-prueba-<k>-<bloque>`, uno por bloque trabajado en las unidades 1…k−1:
  - Unidad 2: lectura, ritmo y posiciones.
  - Unidad 3: lectura, ritmo y posiciones, con dificultad de nivel 2.
  
  Se hacen seguidos en una pantalla. Se aprueba con 2 o más estrellas en todos. Al aprobar, se
  guarda `skipped[unidad]` para cada unidad anterior, y nada más. Al suspender, se indica el
  bloque con menos estrellas.
- **Rationale**: son ejercicios nuevos y cortos para no repetir los de las lecciones (si no, la
  prueba se aprueba de memoria). Mismo formato que cualquier ejercicio.

## R9. Rutas y pantallas

- **Decision**: rutas nuevas por hash:
  - `#curso`: mapa.
  - `#curso/<itemId>`: lección, consejo o hito.
  - `#curso/prueba/<unitId>`: prueba de nivel.
  
  Un hito usa `LessonScreen` con un `back` hacia el Curso y con su `songId` de siempre. La parte
  de práctica de `LessonView` se extrae a un componente `Practice` que recibe el `SongDef`, las
  opciones del motor, los pasos disponibles y un `onPlayResult`. Lo usan `LessonScreen`
  (Canciones e hitos) y `CourseLesson` (ejercicios y pruebas).
- **Rationale**: los ejercicios necesitan la partitura, el teclado, el metrónomo y la disposición
  compacta de móvil apaisado tal cual (FR-032). Copiarlos sería el doble de código que mantener.
  Las opciones de bucle y de «A tempo» se ocultan en el Curso para que siga siendo sencillo.
- **Alternatives considered**: abrir los ejercicios por `#leccion/curso-…` metiéndolos en
  `findSong` mezclaría el Curso con la biblioteca y con «Continuar».

## R10. Explicaciones interactivas (FR-007, FR-007a, aclaración Q3)

- **Decision**: cada pantalla de explicación es `{ text, staff?, keys? }`:
  - `staff` es un `SongDef` muy corto que se dibuja con `ScoreView` (solo lectura) y se puede
    escuchar con un motor en modo Escuchar.
  - `keys` es la lista de teclas resaltadas, con su dedo opcional.
  
  El teclado de la explicación es el componente `Keyboard`, con `onPress` que solo hace sonar
  e iluminar la tecla. Las resaltadas se muestran con la clase de guía, y al pulsarlas, con un
  destello «ok». El MIDI también responde, vía `useMidiInput`. «Siguiente» no exige nada.
- **Notación en el texto**: los nombres de nota se escriben como marcas `{60}` (número MIDI) o
  `{C}` (nombre), y se resuelven con `noteName` según el ajuste Do‑Re‑Mi o C‑D‑E (FR-031). Una
  función pura `renderText(text, notation)` vive en `src/course/` y tiene tests.

## R11. Ilustraciones (FR-026, FR-027, SC-006, SC-007)

- **Decision**: siete componentes React con SVG en línea (`viewBox` fijo, sin texto incrustado
  salvo los números de los dedos). Se colorean con variables CSS del tema (`--ink`, `--muted`,
  `--accent`, `--ok`, `--bad`), así que cambian solos con el tema claro u oscuro.
  
  Van dentro del bundle JS, que el service worker ya precachea, así que funcionan sin conexión
  sin tocar la PWA. Cada uno pesa menos de 4 KB.
  
  Los consejos sin ilustración llevan un icono de `Icons.tsx` (metrónomo, reloj, tortuga, bucle,
  ojo, voz). Si falta alguno, se añade ahí.
- **Rationale**: es el mismo enfoque que la capa SVG del pedal (009): nada de imágenes externas
  y respeto del tema. No hay dependencias nuevas.
- **Alternatives considered**: los archivos `.svg` en `public/` no heredan las variables CSS
  (habría que duplicar cada imagen por tema). Los PNG pesan más y se ven peor en pantallas de
  alta densidad.

## R12. Tiempo, racha, estrellas en Inicio y Progreso, y Continuar (FR-028, FR-030, FR-036, FR-037)

- **Decision**:
  - **Tiempo y racha**: `Practice` llama a `addPractice` igual que hoy, así que el tiempo de los
    ejercicios suma y cuenta para la racha sin cambios. Los consejos y explicaciones no suman,
    porque no hay lección en marcha, igual que hoy fuera de la práctica.
  - **Estrellas**: `courseStars(course)` suma solo las lecciones (máximo `lecciones × 3`). Inicio
    añade una tarjeta «Curso» con «Unidad X · N de M» y «Curso: N de M estrellas». Progreso
    añade la estadística «Curso» y una lista de unidades. `repertoireStars` no cambia.
  - **Continuar**: el almacén `tecla-course` guarda `last: { itemId, at }`. Inicio compara
    `course.last.at` con `progress.last.at`:
    - Si gana el Curso, «Continuar» abre `#curso/<siguiente pendiente>` (o el mismo elemento, si
      no se superó).
    - Si no, «Continuar» funciona como hoy.
    
    Un hito abierto desde el Curso llama a `touchCourse` al entrar y después de cada
    `recordSession` (entrar, cambiar de paso, terminar). Así el `at` del Curso siempre es
    posterior y gana el Curso, aunque se salga sin terminar.
  - **Borrar el progreso** (Ajustes) también vacía `tecla-course`.
- **Rationale**: no cambia nada de lo que ya existe y la regla es clara y fácil de probar.

## R13. Contenido definitivo

- **Decision**: la ruta de la especificación (Contexto, tras la aclaración Q1) se adopta tal
  cual: 3 unidades, 14 lecciones (lectura 4, ritmo 4, posiciones 3, acordes 3), 7 hitos y
  13 consejos. Hitos:
  - Unidad 1: `cinco` y `oda`.
  - Unidad 2: `jingle`, `martinillo`, `macdonald` y `susana`.
  - Unidad 3: `oda-acordes`.
  
  Los ejercicios de acordes usan `DO = [48,52,55]`, `FA = [41,45,48]` y `SOL = [47,50,55]`, con
  digitación 5‑3‑1 en los tres (en Sol: Si con el 5, Re con el 3 y Sol con el 1, que no se
  mueve desde Do). Coincide con `oda-acordes`.
- **Textos**: se escriben en español, para quien empieza, con los límites de 60 palabras por
  consejo y 80 por pantalla. Una comprobación de `checks.ts` los vigila.

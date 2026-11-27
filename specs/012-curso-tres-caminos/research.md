# Research: Curso en tres caminos y técnica (012)

No quedan incógnitas en el Technical Context. Estas son las decisiones de diseño, con su razón y
las alternativas descartadas.

## R1 · Estructura: niveles en lugar de unidades

- **Decision**: el tipo `Unit` se sustituye por `Level`. Cada nivel tiene:
  - `n` (1–4);
  - `lessons`: lecciones y consejos en orden sugerido;
  - `technique`: escalas y ejercicios de independencia;
  - `songs`: canciones; las antiguas piezas‑hito van marcadas `recommended`;
  - `test`: prueba para abrir este nivel; `null` en el nivel 1.

  Reparto (aclaraciones Q2 y Q3):
  - **Nivel 1**: los elementos de la U1.
  - **Nivel 2**: los de U2 y U3, en ese orden.
  - **Niveles 3 y 4**: contenido nuevo.
- **Rationale**: el modelo refleja la nueva navegación (nivel, camino, elemento) y deja de mezclar
  tipos en una lista lineal. Los ids de lecciones (`l-*`), consejos (`consejo-*`) e hitos
  (`hito-*`) **no cambian**, así que el progreso guardado sigue valiendo (FR-024).
- **Alternatives**: mantener `Unit[]` y añadir caminos por etiqueta (obliga a filtrar en todas
  partes y deja la unidad como concepto fantasma); un árbol genérico (innecesario).

## R2 · Estado del Curso calculado (sin bloqueo dentro del nivel)

- **Decision**: `courseState(levels, cp, songBest, midiOk)` sustituye a `pathState`. Es pura.
  - **Nivel 1**: siempre abierto.
  - **Nivel N > 1**: abierto si todas las lecciones del N‑1 tienen 2★ o más, si se superó la
    prueba del N, o si el N+1 está abierto (por prueba).
  - **Elementos de un nivel abierto**: `available` o `done`. En uno bloqueado, todos `locked`.
    - Lección: `done` con 2★ o más.
    - Consejo: `done` si está visto.
    - Escala: `done` si está dominada.
    - Independencia: `done` con 2★ o más; si no hay MIDI, estado `needsMidi`.
    - Canción: `done` con 2★ o más.
  - **Avance por camino** (FR-006): `done / total`. Sin MIDI, no cuenta lo que exige MIDI.
- **Rationale**: aclaración Q1 (lecciones abiertas). El cálculo es mucho más sencillo que la
  «frontera» actual y se prueba sin navegador (Principio I).

## R3 · Conservación del progreso (sin migración de datos)

- **Decision**: `tecla-course` conserva sus campos y gana dos opcionales:
  - `tests: Record<"2" | "3" | "4", true>`: niveles abiertos por prueba.
  - `recent: string[]`: los últimos 6 elementos del Curso practicados, el más nuevo al final.

  El estado se **deriva** también de los datos antiguos:
  - `skipped.u1` (quien superó la prueba U2 o U3) abre el nivel 2. `skipped.u2` (prueba U3)
    también, y nada más (aclaración Q3).
  - Las estrellas de `prueba-u3-*` se quedan en `best` y no se muestran.
  - `last` sigue sirviendo para «Continuar».
- **Rationale**: no hay que escribir ni versionar nada al actualizar; `createStore` combina los
  campos nuevos con los valores por defecto (patrón de 011). SC-002 se prueba con datos antiguos
  reales en tests.

## R4 · Escalas generadas

- **Decision**: `scale(spec, tempo)` en `src/course/scales.ts`, pura, devuelve un `SongDef` de
  una octava, que sube y baja. Datos de cada tonalidad:

  | Tonalidad | Armadura | Mano derecha (sube) | Mano izquierda (sube) |
  |-----------|----------|---------------------|-----------------------|
  | Do M | 0 | 1 2 3 1 2 3 4 5 | 5 4 3 2 1 3 2 1 |
  | Sol M | +1 | 1 2 3 1 2 3 4 5 | 5 4 3 2 1 3 2 1 |
  | Fa M | −1 | 1 2 3 4 1 2 3 4 | 5 4 3 2 1 3 2 1 |
  | Re M | +2 | 1 2 3 1 2 3 4 5 | 5 4 3 2 1 3 2 1 |
  | La m (armónica) | 0, Sol♯ | 1 2 3 1 2 3 4 5 | 5 4 3 2 1 3 2 1 |
  | Mi m (armónica) | +1, Re♯ | 1 2 3 1 2 3 4 5 | 5 4 3 2 1 3 2 1 |
  | Si♭ M | −2 | 4 1 2 3 1 2 3 4 | 3 2 1 4 3 2 1 3 |

  - Al bajar se usa la digitación invertida.
  - **Mano derecha**: desde la tónica en la octava 4 (Do4 = 60), en clave de sol.
  - **Mano izquierda**: una octava más abajo, en clave de fa; se escribe en `l`, con `r` en
    silencio, como `staffL`.
  - **Ritmo**: negras; 8 notas al subir y 7 al bajar, más un silencio de negra para cerrar el
    4.º compás.
  - El **paso del pulgar** se calcula: notas donde el dedo pasa a 1 al subir y a 3 o 4 tras el
    1 al bajar.
- **Rationale**: FR-013 (generadas, no escritas a mano) y SC-006 (digitación estándar). La tabla
  es la de los métodos habituales y se prueba nota a nota.
- **Alternatives**: escribir 14 `SongDef` a mano (error fácil y nada reutilizable);
  `assignFingering` (agrupa en posiciones de cinco dedos y no conoce el paso del pulgar).

## R5 · Digitación explícita en la partitura

- **Decision**:
  - `EventOpts` gana un campo `f?: number` (dedo 1–5). `buildScore` lo respeta y solo usa
    `assignFingering` para las notas sin dedo.
  - `Practice` gana la prop `forceFingers`, que muestra los dedos aunque el ajuste esté
    desactivado (FR-013).
  - El teclado resalta las teclas del paso del pulgar con la guía existente (`keys` con
    `finger` en la página de explicación).
- **Rationale**: es el cambio mínimo en `src/music/`, con tests (Principio II), y sirve para
  cualquier ejercicio futuro con digitación fija.

## R6 · Una escala es un elemento con explicación, como una lección

- **Decision**:
  - Un elemento de escala se abre con `CourseLesson`. La página de explicación se genera:
    texto del paso del pulgar, mini partitura y teclas con dedos. Después viene el ejercicio
    (FR-014).
  - **Tempos** (FR-016): `[60, 80, 100]` ppm en negras en los niveles 1–2 y `[72, 96, 120]` en
    los 3–4.
  - El progreso guarda las estrellas por tempo en `cp.best["<id>@<i>"]`.
  - **Tempo propuesto**: el primero sin 3★.
  - **Dominada**: 2★ o más en el tempo objetivo.
  - `Practice.onPlayResult` pasa a recibir también el tempo usado. Las estrellas se anotan en el
    escalón más alto cuyo tempo sea menor o igual que el usado, así que tocar más rápido también
    vale.
- **Rationale**: reutiliza la pantalla y el flujo de lecciones (explicación, ejercicio,
  resultado). El regulador de tempo de `Practice` sigue libre sin romper la regla.

## R7 · Independencia de manos con MIDI

- **Decision**:
  - Los ejercicios son `SongDef` a dos manos escritos a mano en `src/course/independence.ts`,
    al menos 2 por nivel (2–4); en el nivel 4 se añaden escalas a dos manos (Do M y Sol M).
  - El elemento lleva `needsMidi: true`. `Practice` gana la prop `needsMidi`:
    - **Sin MIDI** (`useMidiContext().status !== "ok"`): solo se puede escuchar; Aprender y
      Tocar quedan deshabilitados y aparece un aviso con el texto de `MIDI_HELP` y el botón
      «Conectar teclado MIDI».
    - **Si el teclado se conecta**, se habilitan sin salir.
    - **Si se desconecta durante un intento**: `lesson.stop()` sin resultado, sin registrar el
      intento y con el aviso (FR-020).
- **Rationale**: constitución 1.1.0, Principio III (excepción), y FR-018–020. La regla de no
  bloquear el avance se cumple en `courseState`, que no cuenta estos elementos para abrir
  niveles.

## R8 · Siguiente recomendado

- **Decision**: `recommend(levels, state, recent, midiOk)`, pura, en `src/course/recommend.ts`.
  Devuelve `{ itemId, path, level, reason }` o `null`.
  1. Candidatos: elementos `available` (no `done`) de los niveles abiertos, sin `needsMidi`
     si no hay MIDI.
  2. Si los 2 últimos de `recent` son del mismo camino y otro camino del nivel tiene
     candidatos, se descarta ese camino (FR-009, regla 2).
  3. Se elige el nivel abierto más alto con candidatos y, dentro de él, el camino en el orden
     Lecciones → Técnica → Canciones (salvo el descartado). El primero en el orden sugerido.
  4. Si el nivel más alto abierto está completo y existe el siguiente, se recomienda su prueba.
  5. Motivo, una línea fija por caso:
     - «Sigue con las lecciones del nivel N.»
     - «Toca algo de lo aprendido.» (canción tras lecciones)
     - «Un poco de técnica.»
     - «¿Te atreves con el nivel N?» (prueba)
- **Rationale**: reglas deterministas y probables; SC-004 se verifica simulando 6 pasos en un
  test.
- **Alternatives**: aleatorio ponderado (no reproducible ni probable).

## R9 · Recientes y «Continuar»

- **Decision**:
  - `touchCourse(itemId)` añade a `recent` (como mucho 6, sin repetidos seguidos) además de
    actualizar `last`.
  - Las canciones del camino Canciones se abren por la ruta del Curso (`#curso/<itemId>`) y
    llaman a `touchCourse` al practicar, como los hitos.
  - `continueTarget` recibe el id recomendado en lugar del `next` lineal.
- **Rationale**: FR-011 sin cambiar la lógica de Inicio, que ya elige entre Curso y Canciones.

## R10 · Canciones de cada nivel

- **Decision**:
  - El camino Canciones de un nivel es: primero los hitos de ese nivel (en el orden actual),
    después el resto de piezas de `SONGS` con `levelOf(song) === n`, por orden del repertorio.
  - Las de fuera de los hitos tienen id `cancion-<songId>`.
  - Las importadas no entran.
  - Las estrellas salen de `progress.best`.
- **Rationale**: FR-007; las piezas son del repertorio incluido (dominio público, Principio V).

## R11 · Rutas

- **Decision**:
  - `#curso`: el nivel más alto abierto, camino Lecciones.
  - `#curso/nivel/<n>/<camino>`, con camino `lecciones`, `tecnica` o `canciones`.
  - `#curso/<itemId>`: elemento; sin cambios.
  - `#curso/prueba/<n>`: prueba del nivel n. `#curso/prueba/u2` sigue llevando a la del nivel
    2 por compatibilidad.
- **Rationale**: convención de hash routing; Atrás vuelve al nivel y camino de origen.

## R12 · Contenido de los niveles 3 y 4

- **Decision**: lecciones y consejos escritos a mano en `src/course/content.ts`, ampliando
  `checks.ts` con los nuevos mínimos (FR-021, SC-005).

  | Nivel | Lecciones (orientativas) | Consejos (orientativos) |
  |-------|--------------------------|-------------------------|
  | 3 | Dos manos a la vez (bloques) · El compás de 3/4 · Armaduras: Sol y Fa mayor · El pedal de resonancia · Ligaduras y frases | Practicar manos separadas · Escuchar el pedal · Respirar con la frase |
  | 4 | El compás de 6/8 · Semicorcheas · Contrapunto: dos voces · Leer dos claves a la vez · Arpegios | Lento y sin parar · Marcar los dedos difíciles · Grabarse |

  - Los consejos usan los iconos existentes; no se añaden ilustraciones nuevas en esta versión.
  - **Prueba del nivel 3**: lectura, ritmo, posiciones y acordes con mano izquierda (Q3).
  - **Prueba del nivel 4**: dos manos, 3/4, armadura y pedal; el pedal no puntúa (009).
- **Rationale**: los temas salen de lo que piden las piezas de nivel 3–4 del repertorio. Los
  textos los revisa una persona antes de publicar (Assumptions de la spec).

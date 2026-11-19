# Research: Bucle de compases

Decisiones de diseño tomadas a partir de la especificación y del código actual
(`src/engine/lesson.ts`, `src/screens/LessonScreen.tsx`, `src/components/Staff.tsx`).

## R1. Dónde vive el bucle: opción del motor, no un `Mode` nuevo

- **Decision**: `LessonOptions` gana un campo `loop?: { from: number; to: number }` (compases,
  base 0, inclusivos). Con él, el mismo `Lesson` limita la práctica al fragmento y repite. Sin
  él, el comportamiento es exactamente el actual.
- **Rationale**: el bucle es transversal a los tres pasos (FR-001, FR-007–FR-010); igual que
  «A tempo» (feature 001), encaja como opción y no multiplica los modos. Mantiene el motor
  como único dueño del tiempo y de la puntuación (Principio I).
- **Alternatives considered**: (a) recortar la `Score` en la pantalla y crear una lección con
  una partitura parcial: rompe los ids de nota, las marcas y el desplazamiento de la partitura
  completa, y obliga a reiniciar la lección en cada vuelta (perdiendo el pulso en Tocar);
  (b) un `Mode` `"loop"`: duplicaría Escuchar/Aprender/Tocar.

## R2. Qué notas forman el fragmento

- **Decision**: una nota pertenece al fragmento si `start ≤ n.s < end`, con
  `start = from·bar` y `end = (to+1)·bar` en pulsos. Las notas que empiezan dentro y se
  prolongan más allá se tocan y puntúan; su sonido automático se recorta a `end − n.s` pulsos.
- **Rationale**: coincide con el caso límite de la spec y evita que suene nada fuera del
  fragmento (SC-002) sin tocar el módulo de audio: el motor ya decide la duración en
  `host.tone(m, seconds)`.
- **Alternatives considered**: añadir `host.silence()` para cortar sonidos en curso: requiere
  cambiar `synth.ts`/`piano.ts` y la interfaz del host para un caso que el recorte cubre.

## R3. Reloj de Escuchar y Tocar en bucle

- **Decision**: se conserva el reloj absoluto (`beat()` desde `t0`) y se traduce a una posición
  local del fragmento: `k = floor(g / P)` (número de repetición) y `local = g − k·P`, con
  `L = end − start` y período `P = L` en Escuchar y `P = L + bar` en Tocar (compás de
  descanso, aclaración de la spec). La posición en la partitura es `start + local` mientras
  `local < L`; durante el descanso el cursor espera en `start` y el estado muestra
  «Otra vez… n».
- **Rationale**: un único reloj continuo garantiza SC-003 (el pulso no se pierde) y que el
  cambio de tempo en caliente siga funcionando como hoy. El metrónomo usa `floor(g)` y es
  fuerte cuando `local` cae en inicio de compás, también en el descanso. En Escuchar `P = L`,
  así que `local` nunca llega a `L`: allí la repetición se cierra al cambiar `k`, no por umbral.
  Durante la cuenta atrás de Tocar (`g < 0`) no se aplica esta traducción.
- **Alternatives considered**: reiniciar `t0` en cada vuelta: acumula error de fotograma y
  complica el cambio de tempo.

## R4. Puntuación por repetición en Tocar

- **Decision**: cada repetición se cierra cuando `local ≥ L + HIT_WINDOW + 0.15` (dentro del
  compás de descanso): se calcula su resultado con el criterio actual de `result()` sobre las
  notas del fragmento, se guarda, y se reinician `judged`, `played` y las marcas de esas notas.
  Una pulsación con `local > P − HIT_WINDOW` se compara con la repetición siguiente
  (`local − P`).
- **Rationale**: como `bar ≥ 2 > HIT_WINDOW·2 + 0.15`, el cierre siempre cae en el descanso y
  nunca se mezclan notas de dos repeticiones; las pulsaciones adelantadas a la primera nota de
  la vuelta siguiente se aceptan igual que hoy se aceptan antes del pulso.

## R5. Aprender en bucle

- **Decision**:
  - **Espera libre**: al completar el último grupo, suenan las automáticas hasta `end`
    (como hoy con `playAutos(from, to)`), y tras ese tiempo se cierra la repetición y se vuelve
    a `gi = 0` con marcas limpias. Si el fragmento empieza con acompañamiento antes de la
    primera nota del alumno, se repite la lógica de «Escucha la otra mano…» desde `start`.
  - **A tempo**: `pos` arranca en `start`; cuando no quedan grupos y `pos ≥ end`, se cierra la
    repetición, `pos = start` y se reinician `gi`, `played`/`done` y marcas. Sin compás de
    descanso (el cursor ya espera la primera nota).
  - Resultado por repetición: `n / (n + fallosDeEstaRepetición)`, el criterio actual.
- **Rationale**: reutiliza los dos caminos existentes de Aprender cambiando solo los límites y
  el final; el modo sin bucle no se toca (SC-004).

## R6. Fin de la práctica, resumen y progreso

- **Decision**: con bucle, el motor nunca llama a `complete()`/`host.finish` por sí solo. Al
  pulsar Parar, la pantalla llama a `stop()` y lee `lesson.loopSummary()`
  (`{ reps, best, last }`, `null` si no hay ninguna repetición completa o en Escuchar) para
  mostrar el panel de resultado. No se llama a `recordStars` ni a `recordSession` con el
  progreso del fragmento; **sí** se suma el tiempo de práctica (`addPractice`), porque es
  práctica real y alimenta la racha.
- **Rationale**: FR-013/FR-014 y SC-005. El tiempo practicado no es un «intento de la pieza
  completa» y la racha diaria debe reflejarlo.
- **Alternatives considered**: guardar la mejor repetición como progreso de la pieza: rechazado
  en la spec (el bucle es práctica parcial).

## R7. Fragmento sin notas del alumno

- **Decision**: en Aprender y Tocar, si el fragmento no contiene notas activas, `start()` no
  arranca (`running` queda en `false`) y emite `host.status("No hay notas de esta mano en el
  fragmento", "Elige otros compases u otra mano")`. La pantalla, tras llamar a `start()`, usa
  `lesson.running` para decidir si muestra «Parar».
- **Rationale**: FR-017 sin añadir un callback nuevo al host.

## R8. Selección del fragmento en la interfaz (aclaración Q1)

- **Decision**: lógica pura en `src/engine/fragment.ts` (sin DOM, con tests):
  `tapMeasure(sel, i)` (1.er toque = un extremo, 2.º = el otro, ordenados; con fragmento
  completo, un toque empieza uno nuevo) y `nudge(sel, edge, delta, measures)` (±1 con límites:
  no salir de la pieza ni cruzar inicio y fin). `Staff` recibe `loop` (rango y extremo
  pendiente) y `onMeasure(i)`; calcula el compás tocado con `measureAt(score, x)`
  (`src/music/score.ts`) y dibuja un rectángulo de fondo bajo los compases del fragmento.
  La barra de controles muestra la casilla «Bucle», el rango «Compases 3–4» y los botones
  ±1 de inicio y fin.
- **Rationale**: Principio II (la lógica de selección se prueba sin navegador) y Principio I
  (la partitura solo traduce el toque a un número de compás).
- **Alternatives considered**: guardar la selección en `settings`: la spec dice que no se
  recuerda entre sesiones ni piezas; basta con estado de `LessonView`, que además se descarta
  al salir (FR-015) porque `LessonScreen` monta `LessonView` con `key={song.id}`.

## R9. Cambiar el fragmento con la práctica en marcha

- **Decision**: el rango del fragmento entra en las dependencias del efecto que crea la
  `Lesson`; cambiarlo destruye la lección en marcha (con `stop()` y guardado del tiempo) y
  crea una nueva parada. Cambiar de paso, mano o tempo conserva el fragmento porque vive en el
  estado de `LessonView`.
- **Rationale**: FR-015 y FR-016 con el mecanismo que ya existe para mano y paso.

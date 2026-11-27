# Research: Estadísticas, historial y rachas (011)

No quedan incógnitas abiertas en el Technical Context. Estas son las decisiones de diseño, con su
razón y las alternativas descartadas.

## R1 · Dónde se registra un intento

- **Decision**: `Practice` recibe una prop nueva `record?: AttemptSource` (origen, id, título,
  unidad) y llama a `recordAttempt` en dos puntos:
  1. en `finish` del motor, para los pasos Aprender y Tocar (no Escuchar);
  2. al detener un bucle con al menos una repetición, con la **mejor** repetición de
     `loopSummary()` como nota y los compases `from`–`to`.
- **Rationale**: `Practice` ya conoce todo lo que hace falta (paso, manos, tempo, bucle, si la
  pieza es a dos manos) y es el único sitio donde termina un intento. Las pantallas solo dicen
  *qué* se practica. Hoy `onPlayResult` solo llega en Tocar; Aprender no avisaba a nadie.
- **Alternatives**: un callback `onResult` en cada pantalla (repite la misma lógica en
  `LessonScreen`, `CourseLesson` y `CourseTest`); registrar en el motor (rompe el Principio I).

## R2 · Intentos de las pruebas del Curso

- **Decision**: una prueba se registra como **un** intento cuando el alumno llega a «Ver
  resultado» tras su último ejercicio. Id `test:<unitId>`, paso Tocar, manos «ambas».
  - Nota: media de la mejor nota de cada ejercicio en esa pasada.
  - Estrellas: el mínimo de las estrellas de los ejercicios. Así, 2 o más estrellas coinciden
    con «prueba superada» (`testOutcome` exige 2 en cada ejercicio).
  - Los ejercicios sueltos de la prueba no se registran por separado (`record` sin definir en
    su `Practice`).
- **Rationale**: la prueba es la unidad que el alumno reconoce («hice la prueba de la unidad 2»).
  Mezclar en una ficha ejercicios distintos daría una gráfica sin sentido. Una prueba abandonada
  no se registra (FR-003).
- **Alternatives**: un intento por ejercicio (ruido en el historial y la ficha); un intento por
  ejercicio agrupado bajo la prueba (más interfaz por poco valor).

## R3 · Qué intento «cuenta para la evolución»

- **Decision**: `counts = mode === "play" && !frag && (!twoHands || hands === "both")`. Se
  calcula y guarda al registrar, junto a `twoHands`, para que no dependa de si la pieza sigue
  existiendo.
- **Rationale**: es la misma regla que ya usa `recordStars` (aclaración Q5). Calcularlo una vez
  simplifica las estadísticas y la ficha.

## R4 · Almacén y límite

- **Decision**: almacén nuevo `tecla-history` con `createStore`:
  - `attempts`: los intentos, del más antiguo al más nuevo. Al pasar de 1000 se recortan los más
    antiguos.
  - `pieces`: resumen por pieza (`count`, `first`, `best`, `last`), que se actualiza al
    registrar y **no** se recorta.
  - `cheered`: los días en que ya se felicitó por récord y por objetivo.
  - Tamaño estimado: unos 200 B por intento, unos 200 KB en total. Cabe de sobra en el cupo de
    `localStorage` (≈ 5 MB).
- **Rationale**: es el patrón de `tecla-course`; `progress` no cambia, así que no hay migración.
  Separarlo evita reescribir el historial cada vez que se suma tiempo de práctica.
- **Alternatives**: IndexedDB (asíncrono, más código, innecesario a esta escala); meterlo en
  `tecla-progress` (cada `addPractice` reescribiría 200 KB).

## R5 · Mejor racha

- **Decision**: se **calcula** con `bestStreak(days)` recorriendo los días guardados. No se
  persiste.
- **Rationale**: `progress.days` no se recorta nunca, así que el récord siempre se puede
  reconstruir, también con los datos de antes de esta versión (FR-010). Son unos cientos de
  claves, un coste despreciable.
- **Alternatives**: guardar el récord (puede desincronizarse con `days` y necesita migración).

## R6 · Felicitaciones (récord y objetivo)

- **Decision**:
  - Función pura `milestones(before, after, goalMin, today, cheered)`, que devuelve
    `"record"` o `"goal"`.
  - `addPractice` la evalúa tras sumar tiempo y publica el aviso en un almacén en memoria,
    `notice`. Un componente `Toast` en `App`, como `PwaToast`, lo muestra 4 s.
  - **Récord**: la racha actual ≥ 2, igual a la mejor tras sumar y mayor que la mejor antes.
  - **Objetivo**: el tiempo de hoy cruza el umbral del objetivo.
  - Cada uno se avisa una vez por día; el día queda en `cheered`.
- **Rationale**: Piano libre suma su tiempo al salir, así que un aviso global (fuera de la
  pantalla de práctica) también funciona allí. Con racha 1 no se felicita, para no hacerlo el
  primer día de todos.

## R7 · Organización y rutas de Progreso

- **Decision**: rutas por hash, para que Atrás y los enlaces funcionen:
  - `#progreso`: pestaña Resumen.
  - `#progreso/historial` y `#progreso/piezas`: las otras dos pestañas.
  - `#progreso/pieza/<clave>`: ficha de una pieza, lección o prueba. La clave es
    `song:<id>`, `course:<itemId>` o `course:test:<unitId>`.
  - Las pestañas son enlaces con `role="tab"`.
- **Rationale**: es la convención del proyecto (hash routing, constitución). La ficha es una
  pantalla y no un diálogo, porque en móvil apaisado necesita toda la altura.

## R8 · Gráficas y calendario sin dependencias

- **Decision**:
  - **Tiempo por periodo**: barras CSS, reutilizando `week-chart`.
  - **Evolución**: SVG en línea con una `polyline` y puntos, y la mejor nota marcada; el
    eje Y va de 0 a 100 %, con líneas guía en los umbrales de estrellas (40/70/90 %).
  - **Calendario**: rejilla CSS de 7 filas por 13 columnas (12 semanas completas más la
    actual), con colores del tema. Al pulsar un día se muestra su tiempo en una línea de
    estado bajo la rejilla, accesible con teclado.
- **Rationale**: Principio V (sin dependencias nuevas). Son tres gráficas sencillas; una
  librería de gráficos pesaría más que toda la funcionalidad.
- **Alternatives**: Recharts o Chart.js (justificación insuficiente).

## R9 · Agregación por periodo

- **Decision**:
  - **Periodos**: `7d` y `30d` incluyen hoy; `all` va desde el primer día con datos.
  - **Gráfico de tiempo**: un punto por día en `7d` y `30d`. En `all`, por semana hasta 26
    semanas y por mes si hay más.
  - **Nota media**: media de los intentos de Tocar no fragmento del periodo. Se muestra
    separada en Canciones y Curso (FR-017), igual que el número de intentos.
  - **Más practicadas**: por número de intentos del periodo. En `all` se usa
    `pieces[].count`, que sobrevive al recorte.
  - **Más mejoradas**: `best − first` entre los intentos que cuentan, con al menos 2. En
    `all` se usa el resumen por pieza.
  - Intentos con fecha futura (reloj cambiado): se ignoran en periodos y gráficas, pero se
    conservan.
- **Rationale**: los totales coinciden exactamente con los datos (SC-004). Con `all` no se
  pierde nada al recortar.

## R10 · Objetivo diario y umbral del calendario

- **Decision**:
  - `settings.dailyGoal: 0 | 5 | 10 | 15 | 20 | 30`, en minutos; 0 significa desactivado y es
    el valor por defecto.
  - Nivel de un día: `0` sin práctica; `2` («mucha») si alcanza `goal || 10` minutos; `1`
    («poca») en los demás casos.
  - Inicio muestra `X de Y min` en la tarjeta de Progreso si hay objetivo.
- **Rationale**: aclaraciones Q1 y Q4. `createStore` ya combina los valores por defecto con lo
  guardado, así que no hace falta migración.

## R11 · Borrado

- **Decision**:
  - «Borrar el progreso» llama también a `history.reset()`; el texto de confirmación lo
    menciona. `settings.dailyGoal` se conserva.
  - Borrar una pieza importada: `forgetSong(id)` llama a `forgetHistory("song:" + id)`, que
    quita sus intentos y su resumen. `imported.ts` ya llama a `forgetSong` para `base` y
    `base.full`.
- **Rationale**: FR-022 y el caso límite de las importadas, reutilizando el punto de borrado que
  ya existe.

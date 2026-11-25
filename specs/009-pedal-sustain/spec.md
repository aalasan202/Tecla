# Feature Specification: Pedal de resonancia (sustain) en la partitura desde el nivel 3

**Feature Branch**: `009-pedal-sustain`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Introducir el pedal sustain en las piezas a partir del nivel 3. Sale en la partitura pero no puntua para evaluar."

## Contexto

El repertorio incluido tiene cuatro niveles; los niveles 3 y 4 ya trabajan las dos manos,
acordes, arpegios y ligaduras (007, 008). En muchas de esas piezas (arpegios del Preludio en
Do, acordes por compás, canciones de cuna en 3/4) un pianista usaría el pedal de resonancia,
y la partitura impresa que el alumno encontrará fuera de la app lo indica. Hoy Tecla no lo
muestra ni lo hace sonar.

La especificación de 008 dejó el pedal fuera de su alcance como funcionalidad aparte. Esta
funcionalidad lo introduce **como indicación de lectura y de sonido**, no como habilidad
evaluada: aparece en la partitura y se oye al escuchar la pieza, pero la puntuación de «Tocar»
sigue dependiendo solo de las notas y el ritmo. Así el alumno se familiariza con el símbolo sin
que se le penalice por no tener pedal (la mayoría practica con el teclado en pantalla,
Principio III).

## Clarifications

### Session 2026-11-25

- Q: ¿Qué piezas de nivel 3 y 4 deben llevar pedal? → A: Todas las de nivel 3 y 4 donde musicalmente tenga sentido (acordes, arpegios, acompañamiento); las de una sola línea melódica quedan sin pedal.
- Q: Cuando el alumno toca con un teclado MIDI que tiene pedal, ¿debe el sonido de la app sostener las notas al pisarlo? → A: Sí, en todas las pantallas que suenan, sin efecto en la puntuación.
- Q: ¿Cómo deben dibujarse las marcas de pedal en la partitura? → A: Línea horizontal bajo el pentagrama, con gancho al pisar, muesca en «V» al cambiar y gancho al levantar.
- Q: Cuando el alumno importa un archivo MIDI o MusicXML que trae pedal, ¿debe la app mostrarlo y hacerlo sonar? → A: Sí, pero solo si la pieza importada queda en nivel 3 o superior.
- Q: ¿Debe el teclado en pantalla tener un botón de pedal para quien practica sin teclado MIDI? → A: No; con el teclado en pantalla el pedal solo se oye en «Escuchar».

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el pedal en la partitura (Priority: P1)

Una alumna abre una pieza del nivel 3 con acordes en la mano izquierda. Bajo el pentagrama de
la mano izquierda ve las marcas de pedal: dónde se pisa, dónde se levanta y dónde se cambia
(levantar y volver a pisar) al cambiar de acorde. La primera vez que aparece, una ayuda breve
le explica qué significa la marca.

**Why this priority**: es el núcleo de lo pedido («sale en la partitura»); sin ello no hay
funcionalidad.

**Independent Test**: abrir una pieza de nivel 3 o 4 con pedal, en escritorio y en móvil
apaisado, y comprobar que las marcas aparecen en los compases previstos, alineadas con las
notas, en los tres pasos y en el bucle de compases.

**Acceptance Scenarios**:

1. **Given** una pieza de nivel 3 o 4 con pedal, **When** se abre en cualquiera de los tres
   pasos (Escuchar, Aprender, Tocar), **Then** la partitura muestra las marcas de pedal bajo el
   pentagrama inferior, alineadas horizontalmente con la nota en la que se pisa, se levanta o se
   cambia.
2. **Given** dos tramos de pedal seguidos (cambio de pedal), **When** se ve la partitura,
   **Then** se distingue claramente el levantar‑y‑pisar de un tramo continuo.
3. **Given** una pieza a una mano de nivel 3 con pedal, **When** se abre, **Then** las marcas
   aparecen bajo su único pentagrama.
4. **Given** una pieza de nivel 1 o 2, **When** se abre, **Then** no aparece ninguna marca de
   pedal.
5. **Given** una pieza con pedal que se desplaza en pantalla, **When** un tramo de pedal cruza
   el borde visible, **Then** el tramo se ve continuo y no se corta de forma engañosa.
6. **Given** la primera vez que el alumno abre una pieza con pedal, **When** se muestra la
   partitura, **Then** una explicación breve en español indica qué es el pedal de resonancia y
   que no cuenta para la puntuación; puede cerrarse y no vuelve a salir.

---

### User Story 2 - La puntuación no tiene en cuenta el pedal (Priority: P1)

Un alumno sin teclado MIDI (o con teclado pero sin pedal) toca en «Tocar» una pieza de nivel 4
con pedal. Acierta todas las notas a tiempo y obtiene la máxima puntuación aunque nunca haya
pisado el pedal. Otra alumna con pedal real lo pisa en sitios distintos de los marcados: su
puntuación es la misma que si no lo hubiera pisado.

**Why this priority**: es la otra mitad explícita del pedido («no puntúa para evaluar») y
protege a la mayoría de alumnos, que practica sin pedal.

**Independent Test**: tocar una pieza con pedal en «Tocar» con el teclado en pantalla, y otra
vez con un teclado MIDI pisando el pedal al azar, con las mismas notas; comparar resultados.

**Acceptance Scenarios**:

1. **Given** una pieza con pedal, **When** el alumno la toca perfecta sin usar pedal, **Then**
   obtiene 3 estrellas y la misma precisión que tendría la misma pieza sin marcas de pedal.
2. **Given** un teclado MIDI con pedal, **When** el alumno pisa o suelta el pedal en cualquier
   momento, **Then** ni la precisión, ni las estrellas, ni el avance en «Aprender» cambian.
3. **Given** el resumen tras «Tocar», **When** se muestra, **Then** no menciona el pedal como
   criterio ni como error.

---

### User Story 3 - Oír el efecto del pedal (Priority: P2)

Al pulsar «Escuchar» en una pieza con pedal, la reproducción mantiene sonando las notas
mientras el pedal está pisado y las corta al levantarlo, de modo que el alumno oye cómo debería
sonar. Si practica con un teclado MIDI que tiene pedal, el sonido de la app también responde a
su pedal.

**Why this priority**: refuerza la relación entre símbolo y sonido, pero la marca en la
partitura ya es útil sin ella.

**Independent Test**: escuchar una pieza con pedal y compararla con la misma pieza sin marcas;
conectar un teclado MIDI con pedal y comprobar que las notas se sostienen al pisarlo.

**Acceptance Scenarios**:

1. **Given** una pieza con pedal en «Escuchar», **When** suena un tramo de pedal, **Then** las
   notas del tramo siguen sonando hasta que el pedal se levanta, y se apagan al levantarlo.
2. **Given** un cambio de pedal, **When** suena, **Then** las notas del acorde anterior se
   apagan y las del nuevo se sostienen, sin mezcla confusa entre acordes.
3. **Given** un teclado MIDI con pedal conectado, **When** el alumno lo pisa mientras toca,
   **Then** el sonido de la app se sostiene como en un piano, en cualquier paso y pieza.
4. **Given** el teclado en pantalla, **When** se toca, **Then** el sonido es el de siempre (sin
   pedal) y no se exige ningún control adicional.

---

### Edge Cases

- **Bucle de compases (004)**: si el fragmento empieza o termina dentro de un tramo de pedal,
  el tramo se muestra recortado al fragmento y, al repetirse el bucle, el sonido se corta al
  reiniciar (no se arrastra la resonancia del final al principio).
- **Pausa, salir o cambiar de paso**: el pedal de la reproducción se levanta; ninguna nota queda
  sonando indefinidamente.
- **Teclado MIDI desconectado con el pedal pisado**: el sostenido se libera; no quedan notas
  colgadas.
- **Teclados que envían el pedal de forma progresiva (medio pedal)**: se trata como pisado o
  levantado según un umbral a la mitad del recorrido.
- **Piezas importadas (006)**: si el archivo trae pedal y la pieza queda en nivel 3 o superior,
  se muestra y suena como en el repertorio incluido. Si queda en nivel 1 o 2, el pedal del
  archivo se ignora. Si el archivo no trae pedal, la pieza se comporta como antes.
- **Pedal del archivo importado incoherente** (tramos solapados, que no empiezan en una nota o
  que se salen de la pieza): se ajusta al inicio de nota más cercano dentro de la pieza o se
  descarta; la importación nunca falla por el pedal.
- **Progreso guardado**: estrellas y mejores resultados existentes se conservan; añadir pedal a
  una pieza no cambia su identificador ni sus notas.
- **Pieza densa en móvil apaisado**: las marcas de pedal no provocan desplazamiento vertical ni
  tapan notas, digitación o nombres de nota.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Una pieza incluida MUST poder indicar tramos de pedal de resonancia: dónde se
  pisa, dónde se levanta y dónde se cambia (levantar y pisar de nuevo en el mismo punto).
- **FR-002**: Solo las piezas de nivel 3 o superior MUST llevar indicaciones de pedal; la
  validación automática del repertorio MUST rechazar pedal en piezas de nivel 1 o 2.
- **FR-003**: Todas las piezas de los niveles 3 y 4 en las que el pedal tiene sentido musical
  MUST incluirlo: las que tienen acompañamiento (acordes, arpegios, notas largas en la mano
  izquierda o acompañamiento en 3/4). Las piezas de una sola línea melódica, sin acompañamiento,
  quedan sin pedal. La decisión de cada pieza MUST quedar registrada en el repertorio y tener
  esta justificación.
- **FR-004**: Las indicaciones de pedal MUST ser coherentes con la pieza: cada tramo empieza y
  termina en un inicio de nota o en el final de la pieza, dentro de su duración y sin tramos
  solapados; la validación automática MUST comprobarlo.
- **FR-005**: La partitura MUST mostrar los tramos de pedal bajo el pentagrama inferior como una
  línea horizontal, con un gancho vertical donde se pisa, una muesca en «V» donde se cambia y un
  gancho vertical donde se levanta (no se usan «Ped.» ni «✱»). La línea va alineada con las
  notas en escritorio y en móvil apaisado, en los tres pasos y en el bucle.
- **FR-006**: La notación del pedal MUST respetar el tema claro/oscuro y no tapar notas,
  digitación ni nombres de nota.
- **FR-007**: La puntuación de «Tocar», el avance de «Aprender» y cualquier resumen de
  resultados MUST ser independientes del pedal: idénticos se use o no, y se pise donde se pise.
- **FR-008**: La reproducción de «Escuchar» MUST aplicar el pedal indicado: las notas de un
  tramo se sostienen hasta que el pedal se levanta o cambia.
- **FR-009**: Si el alumno usa un teclado MIDI con pedal, el sonido de la app MUST responder al
  pedal (sostener mientras está pisado, liberar al soltarlo) en todas las pantallas que suenan,
  sin efecto en la evaluación.
- **FR-010**: Al detener, pausar, salir de la pieza, reiniciar el bucle o desconectar el teclado
  MIDI, el pedal MUST liberarse y ninguna nota quedar sonando.
- **FR-011**: La primera vez que el alumno ve una pieza con pedal MUST mostrarse una explicación
  breve en español (qué indica la marca, que se pisa con el pie derecho y que no cuenta para la
  puntuación), que puede cerrarse y no se repite.
- **FR-012**: Las piezas sin pedal (incluidas las de niveles 1–2 y las importadas sin pedal o de
  nivel 1–2) MUST verse, sonar y puntuar exactamente igual que antes.
- **FR-015**: Al importar un archivo MIDI o MusicXML (006), la app MUST leer las indicaciones de
  pedal de resonancia del archivo y, si la pieza queda en nivel 3 o superior, mostrarlas y
  aplicarlas al sonido igual que en el repertorio incluido (FR-005 a FR-008). Si queda en nivel
  1 o 2, MUST ignorarlas. Las indicaciones incoherentes se ajustan o se descartan sin impedir la
  importación, y la puntuación nunca depende de ellas (FR-007).
- **FR-013**: Añadir pedal a una pieza existente MUST NOT cambiar su identificador, notas,
  tempo ni nivel; el progreso guardado se conserva.
- **FR-014**: Las tarjetas de Canciones de las piezas con pedal MUST indicarlo como rasgo que
  trabajan (p. ej. «Nivel 4 · Bach · Pedal»).

### Key Entities

- **Tramo de pedal**: intervalo de una pieza durante el que el pedal está pisado, con inicio y
  final en la línea de tiempo de la pieza. Dos tramos contiguos sin hueco representan un cambio
  de pedal.
- **Pieza incluida o importada** (existente): obtiene una lista opcional de tramos de pedal,
  que solo se muestra y suena desde el nivel 3. En las incluidas la escribe el proyecto; en las
  importadas viene del archivo.
- **Estado del pedal del alumno**: pisado o levantado, procedente del teclado MIDI; afecta solo
  al sonido, nunca a la evaluación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las piezas de los niveles 3–4 con acompañamiento muestra pedal, y
  ninguna pieza de los niveles 1–2 lo muestra.
- **SC-002**: Tocar de forma perfecta y sin pedal cualquier pieza con pedal da 3 estrellas en el
  100 % de los casos; la puntuación con y sin pedal es idéntica para la misma interpretación.
- **SC-003**: El 100 % del repertorio incluido supera la validación automática con las nuevas
  reglas de pedal, y la prueba de no regresión de las piezas existentes sigue pasando.
- **SC-004**: En móvil apaisado, las piezas con pedal se ven y se practican sin desplazamiento
  vertical, igual que antes.
- **SC-005**: Tras detener, salir o reiniciar un bucle, ninguna nota sigue sonando más de un
  segundo.
- **SC-006**: Un alumno que ha visto la explicación del pedal puede señalar, mirando la
  partitura, en qué compases hay que pisarlo y dónde se cambia.
- **SC-007**: Un archivo importado de nivel 3 o superior que trae pedal lo muestra en los
  mismos puntos que el original. Un archivo de nivel 1–2, o uno con pedal incoherente, se importa
  sin errores.

## Assumptions

- Solo se modela el pedal de resonancia (derecho). El pedal celeste (una corda) y el tonal
  (sostenuto) quedan fuera.
- Las marcas de pedal las escribe el proyecto a mano en el repertorio incluido; no se generan
  automáticamente.
- El nivel que decide si una pieza importada muestra pedal es el que la importación le asigna
  (nivel sugerido de 006).
- No se añade un botón ni un interruptor de pedal al teclado en pantalla (decidido en las
  aclaraciones): como el pedal no puntúa, toda la práctica sigue siendo completa sin él
  (Principio III), y con el teclado en pantalla el pedal solo se oye en «Escuchar».
- El umbral de pisado del teclado MIDI es la mitad del recorrido del pedal (valor estándar);
  no se modela el medio pedal.
- La explicación de primera vez se recuerda en el dispositivo, igual que el resto de ajustes
  (Principio V).

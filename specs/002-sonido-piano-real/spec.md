# Feature Specification: Sonido de piano real

**Feature Branch**: `002-sonido-piano-real`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Sonido de piano real: sustituir el sintetizador actual por muestras de piano reales (v0.4 de la hoja de ruta, old_docs/ROADMAP.md), para que las notas tocadas y las de acompañamiento suenen como un piano."

## Contexto

Hoy todas las notas de Tecla (las que toca el alumno, las de Escuchar, el acompañamiento de la
otra mano y el Piano libre) suenan con un sintetizador sencillo que imita un piano solo de lejos.
Para alguien que aprende, el sonido es parte de la motivación y de la referencia auditiva: debe
sonar como un piano acústico. Esta funcionalidad sustituye ese timbre por grabaciones reales de
piano, sin cambiar cómo se practica ni la rapidez con que responde una tecla.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tocar y oír un piano real (Priority: P1)

El alumno abre cualquier pantalla con teclado (Piano libre, o una lección en Aprender o Tocar) y
pulsa teclas, en pantalla, con el teclado del ordenador o con un teclado MIDI. Cada nota suena
como un piano acústico grabado, con la altura correcta en toda la extensión del teclado, y se
apaga de forma natural.

**Why this priority**: es el objetivo de la funcionalidad; con solo esto el alumno ya percibe el
cambio en todas las pantallas en las que toca.

**Independent Test**: en Piano libre, tocar notas graves, medias y agudas y comprobar que suenan
como piano, afinadas y sin retraso apreciable respecto a la pulsación.

**Acceptance Scenarios**:

1. **Given** el sonido de piano ya está cargado, **When** el alumno pulsa una tecla, **Then**
   suena esa nota con timbre de piano grabado y sin retraso apreciable.
2. **Given** el sonido está cargado, **When** el alumno toca cualquier nota del teclado
   disponible en la app, **Then** suena con la altura correcta (misma afinación que hoy).
3. **Given** el alumno toca varias notas a la vez (un acorde) o repite la misma nota rápido,
   **When** suenan, **Then** se oyen todas sin cortes, chasquidos ni saturación.
4. **Given** una nota está sonando, **When** pasa su duración, **Then** se apaga de forma
   gradual como en un piano, sin cortes bruscos.

---

### User Story 2 - Escuchar y acompañamiento con piano real (Priority: P2)

En una lección, el paso Escuchar reproduce la pieza, y en Aprender y Tocar a una mano suena el
acompañamiento de la otra mano. Todo ello suena con el mismo piano grabado que las notas del
alumno, de modo que la pieza se oye coherente.

**Why this priority**: es la otra mitad de lo que oye el alumno; sin ella convivirían dos
timbres distintos en la misma práctica.

**Independent Test**: en «Himno a la alegría a dos manos», pulsar Escuchar y comprobar que ambas
manos suenan como piano; luego practicar solo la derecha y comprobar que la izquierda suena con
el mismo timbre que las notas que toca el alumno.

**Acceptance Scenarios**:

1. **Given** una lección con el sonido cargado, **When** el alumno pulsa Escuchar, **Then** toda
   la pieza suena con piano grabado, respetando duraciones y ritmo como hoy.
2. **Given** una práctica a una mano, **When** suena el acompañamiento, **Then** usa el mismo
   piano y un volumen que no tapa las notas del alumno.
3. **Given** el metrónomo está activo, **When** suena, **Then** sigue siendo un clic, distinto
   del piano.

---

### User Story 3 - Empezar sin esperas y sin quedarse mudo (Priority: P3)

La primera vez que el alumno abre la app el sonido de piano tarda en descargarse. Mientras tanto,
y si la descarga falla o no hay conexión, la app sigue sonando con el sintetizador actual, de
modo que nunca hay teclas mudas. En cuanto el piano está listo, las notas siguientes pasan a
sonar con él sin que el alumno tenga que hacer nada. En visitas posteriores, el piano está
disponible casi al instante.

**Why this priority**: protege la experiencia en conexiones lentas y en móviles, pero el valor
principal ya lo dan las historias 1 y 2.

**Independent Test**: simular una conexión lenta o cortada, abrir Piano libre y comprobar que
las teclas suenan (con el sintetizador) desde el primer momento; restaurar la conexión, recargar
y comprobar que pasa a sonar el piano.

**Acceptance Scenarios**:

1. **Given** el piano aún no se ha descargado, **When** el alumno pulsa una tecla, **Then** suena
   con el sintetizador actual, sin errores ni silencio.
2. **Given** la descarga del piano termina mientras el alumno toca, **When** pulsa la siguiente
   tecla, **Then** suena con el piano, sin cortar las notas que ya sonaban.
3. **Given** la descarga falla, **When** el alumno sigue usando la app, **Then** todo funciona con
   el sintetizador y no se muestran errores técnicos.
4. **Given** el alumno ya ha usado la app antes en ese navegador, **When** vuelve a abrirla,
   **Then** el piano está disponible sin volver a descargar todo el sonido.

---

### Edge Cases

- **Notas fuera de las muestras grabadas**: toda nota que la app pueda producir (teclado en
  pantalla, teclado del ordenador, MIDI de 88 teclas, repertorio) debe sonar con la altura
  correcta, aunque no exista una grabación exacta de ella.
- **Muchas notas a la vez** (acorde con acompañamiento y notas repetidas): el volumen total no
  satura ni distorsiona.
- **Navegador que bloquea el audio hasta un gesto del usuario**: se mantiene el comportamiento
  actual (el audio se activa con la primera interacción); la descarga del piano puede empezar
  antes de ese gesto.
- **Salir de la lección o cambiar de pantalla mientras suenan notas**: las notas se apagan igual
  que hoy; no quedan notas colgadas.
- **Navegador sin audio web**: la app sigue funcionando sin sonido, como hoy.
- **Móvil con datos limitados**: la descarga del piano es de un tamaño contenido (ver SC-003).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Todas las notas de piano de la app (notas del alumno, Escuchar, acompañamiento,
  Piano libre y la prueba de sonido de Ajustes) MUST sonar con grabaciones de piano acústico.
- **FR-002**: Cada nota MUST sonar con la misma altura que hoy en toda la extensión que la app
  puede producir, incluidas las 88 teclas de un teclado MIDI.
- **FR-003**: La respuesta a una pulsación MUST seguir siendo perceptiblemente inmediata, igual
  que con el sintetizador.
- **FR-004**: Las notas MUST respetar la duración que pide quien las toca (pieza, acompañamiento
  o Piano libre) y apagarse de forma gradual, sin cortes ni chasquidos.
- **FR-005**: Varias notas simultáneas o repetidas MUST sonar sin cortes ni saturación audible.
- **FR-006**: El clic del metrónomo MUST seguir siendo un sonido distinto del piano.
- **FR-007**: Mientras el piano no esté disponible (descargando, fallo de red, sin conexión), la
  app MUST sonar con el sintetizador actual, sin errores visibles ni teclas mudas.
- **FR-008**: Cuando el piano termine de cargarse, las notas siguientes MUST pasar a sonar con
  él sin acción del usuario y sin interrumpir las que ya suenan.
- **FR-009**: Tras la primera descarga, el sonido de piano MUST quedar guardado en el navegador
  para que las visitas siguientes no lo descarguen de nuevo.
- **FR-010**: La lógica de lección y la teoría musical MUST NOT cambiar: el cambio se limita a
  cómo suenan las notas (Principio I de la constitución).
- **FR-011**: Las grabaciones usadas MUST tener una licencia que permita incluirlas y
  redistribuirlas en la app, y su atribución, si la licencia la exige, MUST mostrarse en la app.

### Key Entities

- **Banco de sonido de piano**: conjunto de grabaciones de notas de piano a distintas alturas,
  con su licencia y atribución. Se descarga una vez y se guarda en el navegador.
- **Estado del sonido**: cargando, listo o no disponible; decide si una nota suena con el piano
  o con el sintetizador de reserva.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una escucha a ciegas, al menos 4 de cada 5 personas identifican el nuevo sonido
  como «piano» frente al actual.
- **SC-002**: El tiempo entre pulsar una tecla y oír la nota con el piano no aumenta de forma
  perceptible respecto al sintetizador (objetivo de la constitución: menos de 50 ms en un
  dispositivo de gama media).
- **SC-003**: Con una conexión de unos 10 Mbit/s, el piano está disponible en menos de 5
  segundos desde que se abre la app, y la descarga completa no supera unos 5 MB.
- **SC-004**: En una segunda visita, el piano está disponible en menos de 1 segundo.
- **SC-005**: Sin conexión o con la descarga fallida, el 100 % de las pulsaciones producen sonido
  (con el sintetizador).
- **SC-006**: Los tests existentes del motor y la música pasan sin modificaciones.

## Assumptions

- Se usa un banco de muestras de piano de libre distribución (dominio público o licencia
  abierta con atribución); el principio V se aplica por analogía con el repertorio.
- No se graba cada nota: se usan unas pocas notas por octava y las intermedias se obtienen
  ajustando la altura de la grabación más cercana, lo que es práctica habitual.
- Un único nivel de intensidad: el volumen no depende de la fuerza con que se pulsa la tecla
  MIDI. La sensibilidad a la pulsación y el pedal de resonancia quedan fuera de alcance.
- No se añade un ajuste para elegir entre piano y sintetizador: el sintetizador solo actúa como
  reserva automática.
- El modo sin conexión completo de la app (PWA) es otra funcionalidad de la v0.4; aquí basta con
  que el sonido descargado quede guardado en el navegador.
- El metrónomo y cualquier otro efecto que no sea una nota de piano siguen sonando como hoy.

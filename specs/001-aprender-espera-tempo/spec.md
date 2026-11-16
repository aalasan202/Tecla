# Feature Specification: Aprender con espera a tempo

**Feature Branch**: `001-aprender-espera-tempo`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Aprender con espera a tempo (la partitura avanza pero se detiene si fallas)"

## Contexto

Hoy el paso **Aprender** espera cada nota sin noción de tiempo: el alumno puede tardar lo que
quiera entre una nota y la siguiente, así que aprende *qué* tocar pero no *cuándo*. El paso
**Tocar** sí va a tempo, pero no espera: si el alumno falla, la canción sigue y la nota se pierde.
Falta un paso intermedio: la partitura avanza al ritmo de la pieza, como en Tocar, pero se detiene
en cada nota hasta que el alumno la toca correctamente, como en Aprender.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Practicar a tempo con espera (Priority: P1)

En el paso Aprender, el alumno activa la opción **«A tempo»**. Al empezar, el cursor de la
partitura avanza al ritmo de la pieza. Si el alumno toca la nota correcta cuando llega el cursor,
la partitura sigue sin pararse. Si no la toca a tiempo, el cursor se detiene sobre esa nota y
espera; en cuanto el alumno la toca, la partitura reanuda la marcha al tempo elegido.

**Why this priority**: es el núcleo de la funcionalidad; por sí sola ya da al alumno una forma
de interiorizar el ritmo sin la presión de perder notas.

**Independent Test**: con una pieza de una mano, activar «A tempo», tocar todas las notas en su
momento y comprobar que el cursor no se detiene nunca; repetir dejando sin tocar una nota y
comprobar que el cursor se detiene en ella y continúa al tocarla.

**Acceptance Scenarios**:

1. **Given** el paso Aprender con «A tempo» activado, **When** el alumno pulsa Empezar,
   **Then** el cursor avanza a la velocidad del tempo elegido y la nota siguiente se resalta
   antes de que llegue el cursor.
2. **Given** el cursor se acerca a una nota, **When** el alumno toca la nota correcta antes de
   que el cursor llegue a ella o justo al llegar, **Then** la nota se marca como acertada y el
   cursor sigue sin detenerse.
3. **Given** el cursor llega a una nota que el alumno aún no ha tocado, **When** el cursor
   alcanza la posición de la nota, **Then** el cursor se detiene sobre la nota, que queda
   resaltada como pendiente, y la música (incluido el acompañamiento) se pausa.
4. **Given** el cursor está detenido esperando una nota, **When** el alumno la toca, **Then** la
   nota se marca como acertada y el cursor reanuda la marcha al tempo elegido desde ese punto.
5. **Given** el cursor está detenido o avanzando, **When** el alumno toca una tecla que no
   corresponde a la nota esperada, **Then** suena la tecla, se indica visualmente el error, se
   cuenta un fallo y el cursor no avanza por ello.
6. **Given** el alumno ha tocado todas las notas, **When** termina la pieza, **Then** se
   muestra el resultado con estrellas y mensaje, igual que en el paso Aprender actual.

---

### User Story 2 - Elegir el tempo para practicar (Priority: P2)

Con «A tempo» activado, el alumno puede elegir el tempo de práctica (más lento que el original
para empezar) con el mismo control que se usa en Tocar.

**Why this priority**: sin poder bajar el tempo, una pieza rápida haría que el cursor se
detuviera en casi todas las notas y la opción perdería su valor; pero la funcionalidad P1 ya es
útil con el tempo original de cada pieza.

**Independent Test**: bajar el tempo a la mitad y comprobar que el cursor tarda el doble en
recorrer un compás.

**Acceptance Scenarios**:

1. **Given** el paso Aprender con «A tempo» activado, **When** el alumno mira la barra de
   controles, **Then** ve el control de tempo; **When** «A tempo» está desactivado, **Then** el
   control de tempo no aparece, como hoy.
2. **Given** una práctica en marcha, **When** el alumno cambia el tempo, **Then** el cursor
   adopta la nueva velocidad sin reiniciar la práctica.

---

### User Story 3 - Acompañamiento de la otra mano a tempo (Priority: P2)

En las piezas a dos manos, si el alumno practica una sola mano con «A tempo», la otra mano suena
sola siguiendo el cursor: avanza con él y se pausa cuando el cursor se detiene.

**Why this priority**: es como se practica una mano en las piezas a dos manos; sin ello la
opción solo serviría bien en piezas de una mano.

**Independent Test**: con una pieza a dos manos y solo la mano derecha, dejar sin tocar una nota
y comprobar que el acompañamiento se detiene en el mismo punto y continúa al tocarla.

**Acceptance Scenarios**:

1. **Given** una pieza a dos manos con una sola mano elegida y «A tempo» activado, **When** el
   cursor avanza, **Then** las notas de la otra mano suenan y se resaltan en su momento.
2. **Given** el cursor se detiene esperando una nota del alumno, **When** hay notas del
   acompañamiento posteriores, **Then** no suenan hasta que el cursor reanuda la marcha.
3. **Given** el alumno elige las dos manos, **When** llega un acorde o dos notas simultáneas,
   **Then** el cursor espera hasta que estén tocadas todas las notas de ese momento.

---

### User Story 4 - Recordar la preferencia (Priority: P3)

La elección de «A tempo» se recuerda entre sesiones: si el alumno la dejó activada, la próxima
vez que entre en Aprender seguirá activada.

**Why this priority**: comodidad; no cambia lo que se puede practicar.

**Independent Test**: activar «A tempo», recargar la app, entrar en otra canción en Aprender y
comprobar que sigue activada.

**Acceptance Scenarios**:

1. **Given** el alumno activó «A tempo» en una sesión anterior, **When** abre el paso Aprender
   de cualquier pieza, **Then** «A tempo» aparece activado.

---

### Edge Cases

- **Nota tocada antes de tiempo**: si el alumno toca la nota siguiente antes de que llegue el
  cursor, cuenta como acierto: se marca como acertada y el cursor sigue sin detenerse en ella (no
  se penaliza a quien va por delante, pero tampoco se adelanta el cursor). Solo se puede ir una
  nota (o acorde) por delante: la siguiente no se acepta hasta completar la actual.
- **Acordes**: si el alumno toca solo parte de las notas de un acorde a tiempo, el cursor se
  detiene hasta que estén todas.
- **Nota repetida**: si la misma tecla aparece en dos notas seguidas, una pulsación solo cuenta
  para una de ellas (la más cercana al cursor).
- **Silencios largos al principio** (la otra mano empieza antes): el cursor avanza con el
  acompañamiento hasta la primera nota del alumno, como hoy.
- **Salir o cambiar de paso** a mitad de la práctica: se detiene todo el sonido y el progreso de
  la práctica se descarta, igual que hoy.
- **Pausa larga**: si el cursor lleva mucho tiempo detenido, no ocurre nada especial; la
  partitura sigue esperando sin límite.
- **Sin teclado MIDI**: funciona igual con el teclado en pantalla y el del ordenador.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El paso Aprender MUST ofrecer una opción «A tempo» que el alumno puede activar o
  desactivar antes de empezar. Con la opción desactivada, Aprender MUST comportarse exactamente
  como hoy (espera cada nota, sin tempo).
- **FR-002**: Con «A tempo» activado, el cursor de la partitura MUST avanzar de forma continua
  a la velocidad del tempo elegido, igual que en Tocar.
- **FR-003**: La nota o notas que el alumno debe tocar a continuación MUST resaltarse y mostrarse
  en el teclado antes de que llegue el cursor.
- **FR-004**: Una nota correcta tocada en cualquier momento desde que es la siguiente pendiente
  hasta que el cursor llega a ella MUST marcarse como acertada sin detener el cursor.
- **FR-005**: Si el cursor llega a la posición de una nota sin que el alumno la haya tocado, el
  cursor MUST detenerse sobre ella y toda la reproducción MUST pausarse hasta que la toque.
- **FR-006**: Al tocar la nota pendiente, el cursor MUST reanudar la marcha desde la posición de
  esa nota al tempo vigente, sin saltos visibles.
- **FR-007**: Una tecla que no corresponda a ninguna nota esperada MUST sonar, indicarse como
  error en el teclado y contarse como fallo; MUST NOT hacer avanzar el cursor.
- **FR-008**: En acordes y notas simultáneas, el cursor MUST esperar a que estén tocadas todas
  las notas de ese momento que corresponden al alumno.
- **FR-009**: En piezas a dos manos con una sola mano elegida, las notas de la otra mano MUST
  sonar sincronizadas con el cursor y pausarse cuando este se detiene.
- **FR-010**: Con «A tempo» activado, el control de tempo MUST estar visible en el paso Aprender
  y su cambio MUST aplicarse en caliente, sin reiniciar la práctica.
- **FR-011**: La barra de estado MUST indicar el progreso (paso o compás actual) y el número de
  fallos, y cuando el cursor está detenido MUST indicar qué nota se espera.
- **FR-012**: Al terminar, el resultado (puntuación, estrellas y mensaje) MUST calcularse con el
  mismo criterio que el paso Aprender actual (aciertos frente a fallos) y guardarse en el
  progreso de la pieza como un intento de Aprender.
- **FR-013**: La preferencia «A tempo» MUST guardarse en el dispositivo y aplicarse a todas las
  piezas en sesiones posteriores.
- **FR-014**: Todo el comportamiento MUST funcionar igual con teclado en pantalla, teclado del
  ordenador y teclado MIDI.

### Key Entities

- **Práctica de Aprender**: un intento del alumno sobre una pieza; tiene modo de espera (libre o
  a tempo), tempo, manos elegidas, notas acertadas, número de fallos y estado del cursor
  (avanzando o detenido en una nota).
- **Preferencia «A tempo»**: ajuste del alumno que indica si Aprender empieza en modo a tempo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Si el alumno toca todas las notas a tiempo, el cursor recorre la pieza sin
  detenerse y la práctica dura lo mismo que la pieza a ese tempo (±1 pulso).
- **SC-002**: Cuando el alumno no toca una nota, el cursor se detiene sobre ella en todos los
  casos, y reanuda la marcha de forma perceptiblemente inmediata al tocarla.
- **SC-003**: El acompañamiento de la otra mano nunca suena por delante de una nota que el
  alumno tiene pendiente.
- **SC-004**: Con «A tempo» desactivado, el paso Aprender produce los mismos resultados que
  antes de esta funcionalidad para la misma secuencia de pulsaciones.
- **SC-005**: Un alumno que conoce la app activa «A tempo» y empieza a practicar en menos de
  10 segundos, sin instrucciones.
- **SC-006**: La práctica funciona en móvil apaisado sin desplazamiento, igual que el resto de
  la pantalla de lección.

## Assumptions

- «A tempo» es una **opción dentro de Aprender**, no un cuarto paso ni un sustituto del Aprender
  actual; por defecto viene desactivada para no cambiar la experiencia existente.
- Durante «A tempo» no suena metrónomo ni hay cuenta atrás: el cursor arranca al pulsar Empezar
  (el metrónomo puede añadirse más adelante si se pide).
- El tempo inicial es el de la pieza y el rango es el mismo que en Tocar (40–140 ppm); el tempo
  elegido en Aprender y en Tocar es el mismo valor compartido dentro de la pantalla de lección.
- No se usa el margen de tiempo de Tocar: en «A tempo» la nota cuenta desde que es la siguiente
  y el cursor espera sobre ella si llega tarde (ver `research.md`, R2).
- Las notas acertadas con retraso (después de que el cursor se detuviera) no restan puntuación
  más allá de lo que ya hace Aprender; solo cuentan como fallo las teclas equivocadas.
- No se cambian el formato de las canciones, el resto de pasos ni la pantalla de progreso.

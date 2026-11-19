# Feature Specification: Bucle de compases

**Feature Branch**: `004-bucle-compases`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "Bucle de compases: repetir un fragmento difícil."

## Contexto

Hoy cada paso de la lección (Escuchar, Aprender y Tocar) recorre siempre la pieza entera, del
primer al último compás. Cuando el alumno se atasca en un pasaje concreto (un salto, un acorde,
un cambio de ritmo), la única forma de repetirlo es volver a empezar desde el principio y tocar
todo lo anterior cada vez. Eso alarga la práctica, cansa y diluye la atención en lo que ya sale
bien. Falta poder **acotar un fragmento de compases y repetirlo en bucle** hasta dominarlo.

## Clarifications

### Session 2026-11-19

- Q: ¿Cómo marca el alumno el fragmento que quiere repetir? → A: Tocando dos compases en la
  partitura (inicio y fin) y afinando después con botones ±1 compás en la barra de controles.
- Q: ¿Qué pasa entre repeticiones en Tocar? → A: Un compás de descanso con metrónomo (sin
  notas), con «Otra vez… 4, 3, 2, 1», y la siguiente repetición sin cuenta atrás nueva.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Elegir un fragmento y repetirlo en bucle (Priority: P1)

El alumno, en la pantalla de lección, activa el **bucle** y marca en la partitura el compás de
inicio y el compás de fin del pasaje difícil. Al pulsar Empezar, la práctica arranca en el
compás de inicio y, al terminar el compás de fin, vuelve automáticamente al compás de inicio y
sigue repitiendo hasta que el alumno la detiene.

**Why this priority**: es el núcleo de la funcionalidad; por sí sola permite aislar y repetir
un pasaje difícil sin tocar el resto de la pieza.

**Independent Test**: en una pieza de 8 compases, marcar los compases 3–4, pulsar Empezar en
Aprender, tocar las notas de esos compases y comprobar que tras la última nota del compás 4 la
práctica vuelve a la primera nota del compás 3, y que nunca aparecen como pendientes notas fuera
del fragmento.

**Acceptance Scenarios**:

1. **Given** la pantalla de lección de una pieza, **When** el alumno activa el bucle, **Then**
   puede marcar en la partitura un compás de inicio y un compás de fin, y el fragmento elegido
   queda resaltado visualmente.
2. **Given** un fragmento marcado, **When** el alumno pulsa Empezar, **Then** la práctica
   empieza en el primer compás del fragmento, con la partitura situada de forma que ese compás
   esté visible.
3. **Given** la práctica en marcha dentro del fragmento, **When** se completa el último compás
   del fragmento, **Then** la práctica vuelve al compás de inicio sin intervención del alumno y
   continúa, y se indica que empieza una nueva repetición.
4. **Given** el bucle en marcha, **When** el alumno pulsa Parar, **Then** la práctica se
   detiene y el fragmento sigue marcado para la próxima vez.
5. **Given** el bucle activado, **When** el alumno lo desactiva, **Then** desaparece la marca
   del fragmento y la práctica vuelve a recorrer la pieza entera, como hoy.

---

### User Story 2 - El bucle en los tres pasos (Priority: P1)

El fragmento marcado se respeta en los tres pasos de la lección: en **Escuchar** suena solo el
fragmento una y otra vez; en **Aprender** (con o sin «A tempo») se esperan solo las notas del
fragmento; en **Tocar** se toca el fragmento a tempo, con cuenta atrás antes de la primera
repetición y un compás de descanso con metrónomo entre repeticiones, sin perder el pulso.

**Why this priority**: el ciclo natural de práctica de un pasaje difícil es escucharlo,
aprenderlo y tocarlo a tempo; si el bucle solo existiera en un paso, el alumno perdería el
fragmento al cambiar de paso.

**Independent Test**: marcar un fragmento, recorrer Escuchar → Aprender → Tocar sin volver a
marcarlo y comprobar que en los tres pasos solo suena y se practica ese fragmento, en bucle.

**Acceptance Scenarios**:

1. **Given** un fragmento marcado, **When** el alumno cambia de paso, **Then** el fragmento se
   conserva y el nuevo paso lo usa.
2. **Given** el paso Escuchar con bucle, **When** se reproduce, **Then** suena solo el
   fragmento y, al acabar, vuelve a empezar sin pausa audible más allá de la propia música.
3. **Given** el paso Tocar con bucle, **When** termina el último compás del fragmento, **Then**
   suena un compás de descanso con metrónomo (sin notas) y la siguiente repetición empieza justo
   después, sin cuenta atrás nueva, de modo que el alumno recoloca la mano sin perder el ritmo.
4. **Given** el paso Aprender con «A tempo» y bucle, **When** el cursor llega al final del
   fragmento, **Then** vuelve al compás de inicio y sigue avanzando a tempo y esperando las
   notas pendientes como hasta ahora.
5. **Given** una pieza a dos manos practicando una sola mano, **When** el bucle se repite,
   **Then** el acompañamiento de la otra mano también se limita al fragmento y se repite con él.

---

### User Story 3 - Ver cómo va cada repetición (Priority: P2)

Mientras practica en bucle, el alumno ve cuántas repeticiones lleva y cómo le ha ido en la
última (aciertos y fallos en Aprender; puntuación en Tocar), para saber si está mejorando.

**Why this priority**: da sentido a repetir: el alumno sabe cuándo el pasaje ya «sale» y puede
pasar a otro; pero el bucle ya es útil sin esta información.

**Independent Test**: practicar un fragmento en Tocar durante tres repeticiones, fallando a
propósito en la primera y acertando todo en las otras dos, y comprobar que el contador muestra
3 repeticiones y que el resultado de la última refleja el acierto completo.

**Acceptance Scenarios**:

1. **Given** el bucle en marcha, **When** empieza una nueva repetición, **Then** el contador de
   repeticiones aumenta en uno y se muestra el resultado de la repetición anterior.
2. **Given** el alumno detiene el bucle tras varias repeticiones, **When** se muestra el
   resumen, **Then** indica el número de repeticiones completadas y el resultado de la mejor y
   de la última.
3. **Given** el paso Escuchar con bucle, **When** se repite, **Then** solo se muestra el número
   de repetición (no hay resultado que medir).

---

### User Story 4 - Ajustar el fragmento rápidamente (Priority: P3)

El alumno puede cambiar el fragmento sin desactivar el bucle: ampliar o reducir el inicio o el
fin un compás, o marcar uno nuevo directamente sobre la partitura.

**Why this priority**: comodidad; al dominar un pasaje es habitual ampliarlo un compás para
enlazarlo con lo que viene, pero se puede conseguir igualmente desactivando y volviendo a marcar.

**Independent Test**: con el fragmento 3–4 marcado, ampliar el fin un compás y comprobar que el
fragmento pasa a ser 3–5 sin necesidad de desmarcarlo.

**Acceptance Scenarios**:

1. **Given** un fragmento marcado y la práctica detenida, **When** el alumno amplía o reduce el
   inicio o el fin en un compás, **Then** el fragmento se actualiza y se resalta el nuevo rango.
2. **Given** la práctica en marcha, **When** el alumno cambia el fragmento, **Then** la práctica
   se detiene y el nuevo fragmento queda listo para empezar.

---

### Edge Cases

- **Fragmento de un solo compás**: es válido; inicio y fin pueden ser el mismo compás (se toca
  dos veces el mismo compás).
- **Tocar la partitura con un fragmento ya completo**: empieza un fragmento nuevo; ese toque es
  el primer extremo del nuevo fragmento.
- **Botones ±1 compás en los límites**: no se puede mover el inicio antes del primer compás ni
  el fin después del último, ni cruzar el inicio por detrás del fin; el botón correspondiente
  queda deshabilitado.
- **Marcar el fin antes que el inicio**: si el alumno marca primero un compás posterior y luego
  uno anterior, el fragmento se ordena solo (del menor al mayor).
- **Fragmento sin notas del alumno**: si en el fragmento no hay ninguna nota de la mano elegida
  (p. ej., solo suena la otra mano), Aprender y Tocar avisan de que no hay nada que tocar en
  ese fragmento y no arrancan; Escuchar funciona igual.
- **Notas que cruzan la frontera del fragmento**: una nota que empieza dentro del fragmento y se
  prolonga más allá del compás de fin se toca y cuenta normalmente, pero su sonido se corta al
  volver al inicio; las notas que empiezan antes del compás de inicio no forman parte del
  fragmento.
- **Fragmento = pieza entera**: equivale a repetir la pieza completa en bucle.
- **Anacrusa / primer compás incompleto**: el compás de anacrusa se puede elegir como inicio
  igual que cualquier otro.
- **Cambiar de mano o de tempo con el bucle activado**: el fragmento se conserva; el cambio se
  aplica igual que hoy.
- **Salir de la lección o cambiar de pieza**: el bucle se desactiva; al volver a la pieza se
  empieza sin fragmento marcado.
- **Repeticiones sin fin**: el bucle no se detiene solo; sigue hasta que el alumno pulse Parar.
- **Partitura más larga que la pantalla**: al volver al inicio del fragmento la partitura se
  desplaza para mostrarlo, igual que lo hace al avanzar.
- **Sin teclado MIDI**: funciona igual con el teclado en pantalla y el del ordenador.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla de lección MUST ofrecer una opción **Bucle** que el alumno puede
  activar o desactivar. Con el bucle desactivado, los tres pasos MUST comportarse exactamente
  como hoy.
- **FR-002**: Con el bucle activado, el alumno MUST poder elegir el fragmento marcando un compás
  de inicio y un compás de fin directamente sobre la partitura (primer toque = un extremo,
  segundo toque = el otro), tanto con ratón como con toque. Una vez marcado, la barra de
  controles MUST ofrecer botones para mover el inicio y el fin un compás (ver FR-016).
- **FR-003**: El fragmento elegido MUST resaltarse en la partitura de forma claramente
  distinguible del resto, y la barra de controles MUST mostrar su rango (p. ej. «Compases 3–4»).
- **FR-004**: Mientras no haya un fragmento completo marcado, el bucle MUST indicar al alumno
  qué tiene que hacer (p. ej. «Pulsa en la partitura el compás donde empieza el fragmento») y Empezar MUST
  recorrer la pieza entera, como sin bucle; nunca un rango a medias.
- **FR-005**: Con un fragmento marcado, la práctica MUST empezar en la primera nota (o pulso) del
  compás de inicio y considerar solo las notas que empiezan dentro del fragmento.
- **FR-006**: Al completarse el último compás del fragmento, la práctica MUST volver al compás de
  inicio automáticamente y repetirse indefinidamente hasta que el alumno pulse Parar.
- **FR-007**: En Escuchar, MUST sonar solo el fragmento, en bucle.
- **FR-008**: En Aprender (en espera libre y en «A tempo»), MUST esperarse solo las notas del
  fragmento; al volver al inicio, las marcas de acierto/fallo del fragmento MUST limpiarse para
  la nueva repetición.
- **FR-009**: En Tocar, la cuenta atrás MUST sonar solo antes de la primera repetición. Entre
  repeticiones MUST haber exactamente un compás de descanso (sin notas ni acompañamiento) en el
  que el metrónomo sigue sonando y el estado indica la cuenta («Otra vez… 4, 3, 2, 1»); la
  repetición siguiente empieza en el primer pulso tras ese compás.
- **FR-010**: En piezas a dos manos con una sola mano elegida, el acompañamiento de la otra mano
  MUST limitarse al fragmento y repetirse sincronizado con él.
- **FR-011**: Al volver al inicio, MUST cortarse cualquier sonido que siga sonando del final del
  fragmento, y la partitura MUST desplazarse para mostrar el compás de inicio.
- **FR-012**: La barra de estado MUST mostrar el número de la repetición en curso y, a partir de
  la segunda, el resultado de la repetición anterior (Aprender y Tocar).
- **FR-013**: Al parar el bucle en Aprender o Tocar con al menos una repetición completa, MUST
  mostrarse un resumen con el número de repeticiones completadas y el resultado de la mejor y de
  la última, con el mismo criterio de puntuación y estrellas que el paso correspondiente.
- **FR-014**: Las prácticas en bucle MUST NOT registrarse como intentos de la pieza completa en
  el progreso (ni mejorar ni empeorar las estrellas de la pieza).
- **FR-015**: El fragmento MUST conservarse al cambiar de paso, de mano o de tempo dentro de la
  misma lección, y MUST descartarse al salir de la lección.
- **FR-016**: El alumno MUST poder ampliar o reducir el inicio y el fin del fragmento en un
  compás sin desactivar el bucle; cambiar el fragmento con la práctica en marcha MUST detenerla.
- **FR-017**: Si el fragmento no contiene notas que el alumno deba tocar, Aprender y Tocar MUST
  avisarlo y no arrancar.
- **FR-018**: Todo el comportamiento MUST funcionar igual con teclado en pantalla, teclado del
  ordenador y teclado MIDI, y caber sin desplazamiento en móvil apaisado.

### Key Entities

- **Fragmento**: rango de compases de una pieza elegido por el alumno; tiene compás de inicio y
  compás de fin (inclusivos, inicio ≤ fin). Vive mientras el alumno está en la lección.
- **Repetición**: cada pasada completa por el fragmento; tiene número de orden y, en Aprender y
  Tocar, un resultado (aciertos, fallos, puntuación).
- **Sesión de bucle**: conjunto de repeticiones desde Empezar hasta Parar; resume el número de
  repeticiones y los resultados mejor y último.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un alumno que conoce la app marca un fragmento de dos compases y empieza a
  practicarlo en menos de 15 segundos, sin instrucciones.
- **SC-002**: En el 100 % de las repeticiones, no suena ni se pide ninguna nota que empiece fuera
  del fragmento.
- **SC-003**: En Tocar, el salto del final al inicio del fragmento mantiene el pulso: la
  repetición siguiente empieza exactamente un compás después del final del fragmento (±5 % de un
  pulso) y el metrónomo no deja de sonar en ningún momento.
- **SC-004**: Con el bucle desactivado, los tres pasos producen los mismos resultados que antes
  de esta funcionalidad para la misma secuencia de pulsaciones.
- **SC-005**: Las estrellas y el historial de la pieza no cambian tras cualquier número de
  prácticas en bucle.
- **SC-006**: La práctica en bucle funciona en móvil apaisado sin desplazamiento, igual que el
  resto de la pantalla de lección.

## Assumptions

- El bucle es una **opción de la pantalla de lección**, común a los tres pasos, no un paso
  nuevo; por defecto viene desactivada y no se recuerda entre sesiones ni entre piezas.
- La unidad del fragmento es el **compás completo**; no se pueden elegir fragmentos que empiecen
  o acaben a mitad de compás.
- En Aprender sin «A tempo» el bucle vuelve al inicio en cuanto se completa la última nota del
  fragmento; en Aprender «A tempo», Escuchar y Tocar vuelve al acabar el último pulso del compás
  de fin.
- Entre repeticiones de Tocar hay un compás de descanso con metrónomo. En Escuchar y en
  Aprender no hay descanso: Escuchar enlaza sin pausa y Aprender ya espera la primera nota.
- No hay subida automática de tempo entre repeticiones ni número fijo de repeticiones; ambas
  cosas pueden añadirse más adelante si se piden.
- No se guarda el resultado de las repeticiones en el progreso: el bucle es práctica parcial y
  el progreso de la pieza sigue reflejando solo intentos completos.
- No se cambian el formato de las canciones, la pantalla de progreso ni el resto de pantallas.

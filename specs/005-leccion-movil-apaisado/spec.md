# Feature Specification: Lección en móvil apaisado

**Feature Branch**: `005-leccion-movil-apaisado`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "Pantalla de lección adaptada a móvil apaisado (partitura y teclado sin desplazamiento)."

## Contexto

La constitución (Principio IV) exige que las pantallas de práctica muestren partitura y teclado
sin desplazamiento en móvil apaisado. Hoy la pantalla de lección apila, de arriba abajo, la
cabecera, la elección de mano, los tres pasos, el texto de ayuda, la partitura con su barra de
estado, todos los controles (Empezar, «A tempo», Bucle y sus botones, tempo, nombres de nota,
números de dedo), el panel de resultado y el teclado. En un móvil en horizontal la altura útil
es de unos 320–400 puntos: solo la partitura a dos manos y el teclado ya la superan, así que el
alumno tiene que desplazar la página arriba y abajo para leer la nota y pulsar la tecla, justo
lo que impide practicar. La pantalla de inicio y el piano libre ya se adaptan; la de lección no.

## Clarifications

### Session 2026-11-19

- Q: En móvil apaisado, ¿qué controles quedan en la pantalla y cuáles pasan al panel de
  opciones? → A: Una sola fila de práctica con los pasos, la mano (piezas a dos manos),
  Empezar/Parar, Bucle (con su rango y botones ±1 solo cuando hay fragmento marcado; ver la
  cuarta respuesta) y el botón Opciones; tempo, «A tempo», nombres de nota y números de dedo van al panel de opciones.
- Q: En una pieza a dos manos practicando una sola mano, ¿qué pentagramas muestra la partitura
  en móvil apaisado? → A: Siempre los dos, reducidos para caber; la otra mano sigue visible
  atenuada, como hoy.
- Q: Con un teclado MIDI conectado, ¿se sigue mostrando el teclado en pantalla en móvil
  apaisado? → A: Sí, siempre; marca la tecla siguiente y la disposición es la misma con o sin
  MIDI.
- Q: En móvil apaisado, el rango del bucle y sus cuatro botones ±1 no caben en la fila de
  práctica de una pieza a dos manos (≈ 780 de 640 puntos). ¿Cómo se llega a los ±1? → A: La
  fila muestra el rango como un botón («2–3 ▾») que abre un pequeño panel sobre la partitura
  con los botones ±1 de inicio y fin (dos toques). Sustituye, solo en móvil apaisado, la parte
  de la primera respuesta que ponía los ±1 en la fila.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Practicar viendo partitura y teclado a la vez (Priority: P1)

El alumno abre una lección en el móvil, en horizontal. Sin desplazar la página ve a la vez la
partitura (con la nota que toca resaltada y el cursor), la barra de estado y el teclado
completo de la pieza, y tiene a mano Empezar/Parar. Practica Escuchar, Aprender y Tocar sin
tocar nunca la barra de desplazamiento de la página.

**Why this priority**: es el problema que motiva la funcionalidad; sin esto la práctica en
móvil no es viable y se incumple la constitución.

**Independent Test**: en un móvil (o simulación) de 640 × 320 puntos en horizontal, abrir
«Himno a la alegría a dos manos», recorrer los tres pasos y comprobar que la página nunca se
desplaza y que partitura, estado, teclado y Empezar/Parar están siempre visibles enteros.

**Acceptance Scenarios**:

1. **Given** un móvil en horizontal, **When** el alumno abre cualquier lección, **Then** la
   partitura, la barra de estado, el teclado completo de la pieza y el botón Empezar caben en
   pantalla sin desplazamiento vertical ni horizontal de la página.
2. **Given** una pieza a dos manos (dos pentagramas), **When** se muestra en móvil apaisado,
   **Then** se ven los dos pentagramas completos, con las notas, nombres y dedos legibles.
3. **Given** la práctica en marcha, **When** la partitura avanza, **Then** el cursor y la nota
   pendiente siguen visibles dentro de la partitura, que se desplaza sola en horizontal como hoy.
4. **Given** el teclado en pantalla, **When** el alumno pulsa una tecla con el dedo, **Then**
   suena la tecla que ha tocado; las teclas tienen tamaño suficiente para acertar con el dedo.
5. **Given** el móvil en vertical, **When** el alumno abre una lección, **Then** se le pide girar
   el dispositivo, como hoy.

---

### User Story 2 - Controles de la lección compactos y al alcance (Priority: P1)

El alumno cambia de paso, de mano y de tempo, activa «A tempo» o el bucle y ajusta el fragmento
sin salir de la pantalla y sin que esos controles empujen la partitura o el teclado fuera de la
vista. Los ajustes que se cambian menos durante la práctica (tempo, «A tempo», nombres de nota,
números de dedo) están agrupados en un lugar fácil de abrir y cerrar.

En pantalla queda una sola fila de práctica: pasos, mano, Empezar/Parar, Bucle y Opciones. El
tempo, «A tempo», los nombres de nota y los números de dedo están en el panel de opciones.

**Why this priority**: sin controles accesibles la pantalla cabe pero no se puede usar; ambas
historias juntas forman el mínimo viable.

**Independent Test**: en 640 × 320, cambiar de Aprender a Tocar, elegir mano derecha, subir el
tempo, activar el bucle y marcar los compases 2–3, mover el fin con «+», y activar los nombres
de nota; comprobar que todo se alcanza y que la página no se desplaza en ningún momento.

**Acceptance Scenarios**:

1. **Given** la lección en móvil apaisado, **When** el alumno quiere cambiar de paso o de mano,
   **Then** lo hace con un solo toque desde la pantalla, sin desplazarse.
2. **Given** la lección en móvil apaisado, **When** el alumno abre las opciones (tempo,
   «A tempo», nombres de nota y números de dedo), **Then** se muestran por encima del
   contenido sin cambiar la disposición, y se cierran tocando fuera o con un botón de cerrar.
3. **Given** el bucle activado con un fragmento marcado, **When** el alumno toca el rango
   («2–3 ▾») en la fila de práctica, **Then** se abre un pequeño panel sobre la partitura con
   los botones ±1 de inicio y fin, sin desplazamiento, y se cierra tocando fuera.
4. **Given** el texto de ayuda del paso, **When** no cabe con el resto, **Then** sigue
   disponible (por ejemplo, tras un botón de ayuda), sin ocupar espacio fijo.

---

### User Story 3 - Resultado sin perder la pantalla (Priority: P2)

Al terminar un paso (o parar un bucle), el resultado (porcentaje, estrellas, mensaje, Repetir y
Siguiente paso) aparece por encima de la lección, sin descolocar la partitura ni el teclado, y
se cierra para seguir practicando.

**Why this priority**: hoy el resultado se añade entre los controles y el teclado; en móvil lo
empujaría fuera de la vista. Es importante, pero la práctica ya funciona sin ello.

**Independent Test**: en 640 × 320, terminar Aprender de «Cinco dedos» y comprobar que el
resultado se ve entero, que Repetir y Siguiente paso funcionan y que al cerrarlo la pantalla
queda como antes.

**Acceptance Scenarios**:

1. **Given** un paso terminado en móvil apaisado, **When** aparece el resultado, **Then** se ve
   entero sin desplazamiento y no cambia la posición de la partitura ni del teclado.
2. **Given** el resultado visible, **When** el alumno pulsa Repetir, Siguiente paso o cerrar,
   **Then** se aplica la acción y el resultado desaparece.

---

### Edge Cases

- **Pieza con muchas teclas**: si el rango de la pieza es amplio, el teclado completo debe
  seguir cabiendo; si las teclas quedarían por debajo del tamaño mínimo para el dedo, se
  prioriza el tamaño mínimo y el teclado se desplaza solo hacia la zona de la nota pendiente
  (nunca la página).
- **Muescas, barras del sistema y bordes curvos**: nada interactivo queda bajo la muesca, la
  barra de inicio o los bordes redondeados (zonas seguras del dispositivo).
- **Barra del navegador visible u oculta**: la disposición se ajusta a la altura real disponible
  cuando aparece o desaparece la barra de direcciones, sin saltos que hagan perder la tecla.
- **App instalada (pantalla completa)**: aprovecha la altura extra.
- **Girar el dispositivo durante la práctica**: al pasar a vertical se pide girar; al volver a
  horizontal la práctica sigue donde estaba, sin perder la lección ni el fragmento.
- **Tablet en horizontal y escritorio**: sin cambios respecto a hoy (la adaptación solo se
  aplica cuando la altura disponible es pequeña).
- **Teclado físico o MIDI conectado al móvil**: funcionan igual; el teclado en pantalla se
  sigue mostrando siempre y marcando la nota pendiente (no hay opción de ocultarlo), y la
  disposición es la misma con o sin MIDI.
- **Opciones abiertas mientras se practica**: la práctica no se detiene; las teclas del
  teclado físico y MIDI siguen llegando.
- **Textos largos** (título de la pieza, mensajes de estado del bucle): se recortan con puntos
  suspensivos en una línea, sin empujar el resto ni desbordar.
- **Tema oscuro, notación Do‑Re‑Mi o C‑D‑E y tamaño de letra del sistema**: se respetan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En móvil apaisado, la pantalla de lección MUST mostrar a la vez, sin
  desplazamiento vertical ni horizontal de la página, la partitura, la barra de estado, el
  teclado en pantalla y el botón Empezar/Parar, en los tres pasos y en piezas de una y dos manos.
- **FR-002**: La partitura MUST ajustar su altura al espacio disponible mostrando siempre todos
  sus pentagramas completos (en piezas a dos manos, los dos, también cuando se practica una sola
  mano, con la otra atenuada como hoy); las cabezas de nota, los nombres y los números de dedo MUST seguir
  siendo legibles.
- **FR-003**: La partitura MUST seguir desplazándose sola en horizontal para mantener visibles el
  cursor y la nota pendiente, como hoy.
- **FR-004**: El teclado en pantalla MUST ocupar el ancho disponible, con cada tecla blanca de
  al menos 28 puntos de ancho y el teclado de al menos 110 puntos de alto. Si todas las teclas
  de la pieza caben con ese ancho, MUST mostrarse todas; si no, el teclado (no la página) MUST
  desplazarse solo para mostrar la nota pendiente.
- **FR-005**: El selector de paso (Escuchar, Aprender, Tocar) y, en piezas a dos manos, el de
  mano MUST estar visibles y alcanzables con un toque.
- **FR-006**: En móvil apaisado, los controles de la pantalla MUST reducirse a una sola fila de
  práctica con: selector de paso, selector de mano (solo piezas a dos manos), Empezar/Parar,
  Bucle y botón Opciones. Con un fragmento completo marcado, el Bucle MUST mostrar su rango como
  un botón («2–3 ▾») que abre un panel pequeño sobre la partitura con los botones ±1 de inicio
  y fin. Esa fila MUST caber en el ancho sin desplazamiento.
- **FR-007**: El tempo, «A tempo» (en Aprender), los nombres de nota y los números de dedo MUST
  estar en un panel de opciones que se abre con el botón Opciones y se muestra por encima del
  contenido sin cambiar la disposición; abrirlo o cerrarlo MUST NOT detener la práctica, y los
  cambios hechos en él se aplican igual que hoy (el tempo, en caliente cuando hoy se aplica así).
- **FR-008**: El texto de ayuda del paso MUST seguir disponible para el alumno, pero en móvil
  apaisado MUST NOT ocupar espacio fijo (p. ej., accesible desde un botón de ayuda).
- **FR-009**: El resultado de un paso o de un bucle MUST mostrarse por encima de la lección, con
  las mismas acciones de hoy y un modo de cerrarlo, sin desplazar la partitura ni el teclado.
- **FR-010**: Todos los elementos táctiles (botones, casillas, teclas) MUST tener una zona de
  toque de al menos 40 × 40 puntos, salvo las teclas negras, que mantienen su proporción.
- **FR-011**: Nada interactivo MUST quedar bajo muescas, barras del sistema o bordes redondeados.
- **FR-012**: La disposición MUST adaptarse a la altura real disponible cuando cambia (barra del
  navegador, app instalada, giro) sin recargar la lección ni detener la práctica.
- **FR-013**: En escritorio y tablet (altura disponible holgada) la pantalla de lección MUST
  verse y comportarse como hoy.
- **FR-014**: En vertical, se MUST seguir pidiendo girar el dispositivo, como hoy.
- **FR-015**: Los ajustes del usuario (notación, nombres, dedos, tema) y la entrada por teclado
  del ordenador y MIDI MUST funcionar igual que hoy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En pantallas apaisadas de 640 × 320 puntos o más, las 12 piezas del repertorio se
  pueden practicar en los tres pasos sin desplazar la página ni una vez.
- **SC-002**: En el 100 % de esas combinaciones (pieza × paso × mano), partitura completa (todos
  sus pentagramas), barra de estado, teclado completo de la pieza (o su zona activa, ver FR-004)
  y Empezar/Parar están visibles a la vez.
- **SC-003**: Un alumno acierta la tecla que pretende pulsar con el dedo en al menos el 95 % de
  los toques en un móvil de 6 pulgadas en horizontal.
- **SC-004**: Cualquier control de la lección se alcanza en como máximo dos toques (uno para
  abrir opciones o ayuda, otro para el control).
- **SC-005**: En escritorio (1280 × 800) y tablet en horizontal (1024 × 768), la pantalla de
  lección no cambia respecto a la versión anterior.
- **SC-006**: La nota pendiente se lee en la partitura a un brazo de distancia (unos 40 cm) en
  un móvil de 6 pulgadas sin hacer zoom.

## Assumptions

- «Móvil apaisado» es una pantalla en horizontal con poca altura disponible (aproximadamente
  500 puntos o menos), el mismo criterio que ya usan la pantalla de inicio y el piano libre;
  el tamaño mínimo que se garantiza es 640 × 320 puntos (móvil pequeño con la barra del
  navegador visible).
- La adaptación es solo de disposición y presentación: no cambian los tres pasos, la
  puntuación, el bucle, los ajustes ni los datos guardados.
- La cabecera de la lección (volver y título) puede reducirse a una sola línea compacta y la
  línea informativa (nivel, número de notas y compases) puede ocultarse en móvil apaisado.
- El tempo, «A tempo», los nombres de nota y los números de dedo pasan al panel de opciones solo
  en móvil apaisado; en escritorio y tablet siguen en la barra de controles, como hoy.
- Con 28 puntos por tecla blanca caben unas 21 teclas blancas (3 octavas) en 640 puntos; se
  espera que la mayoría de las piezas actuales quepan enteras y que el desplazamiento del
  teclado (FR-004) sea la excepción (se comprobará pieza a pieza en el plan).
- La pantalla de inicio, el piano libre, Canciones, Progreso y Ajustes quedan fuera de alcance.
- Depende de la funcionalidad 004 (bucle de compases): sus controles forman parte de lo que
  debe caber.

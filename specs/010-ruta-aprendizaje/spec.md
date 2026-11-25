# Feature Specification: Ruta de aprendizaje (Curso) para los niveles 1–2

**Feature Branch**: `010-ruta-aprendizaje`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Ruta de aprendizaje (Curso) para los niveles 1–2: 12–16 lecciones en cuatro bloques (lectura, ritmo, posiciones de mano, acordes), con explicación y ejercicio puntuado, piezas del repertorio como hitos, fichas de consejos prácticos ilustradas, avance lineal con desbloqueo y prueba de nivel, nueva entrada «Curso» en el inicio y respeto del progreso existente."

## Contexto

Hoy la app ofrece un repertorio de 29 piezas ordenadas por niveles (13 en los niveles 1 y 2),
pero nada explica cómo leer la partitura, contar el ritmo, colocar la mano o tocar un acorde.
Quien empieza desde cero (público principal, Principio IV) llega a «Cinco dedos» sin saber
dónde está el Do ni qué significa el número sobre cada nota.

Esta funcionalidad añade un **Curso**: un camino guiado que alterna tres tipos de elemento:

| Elemento | Qué es | ¿Puntúa? | ¿Bloquea el avance? |
|----------|--------|----------|---------------------|
| **Lección** | 1–2 pantallas de explicación + un ejercicio corto que se toca | Sí (0–3 estrellas) | Sí: la siguiente se abre con 2 estrellas |
| **Pieza‑hito** | Una pieza del repertorio existente que pone en práctica lo aprendido | Sí (sus estrellas de siempre) | Sí: igual que una lección |
| **Consejo** | Ficha práctica de unos 30 s, con ilustración propia | No | No |

La entrega cubre lo que piden los niveles 1 y 2 del repertorio, más la preparación de acordes
con la mano izquierda para el nivel 3. Los consejos de los niveles 3–4 quedan en reserva.

### Ruta orientativa

El orden y los títulos definitivos se ajustan durante la planificación, respetando los
requisitos. Esta es la ruta de referencia (14 lecciones, 7 hitos, 13 consejos):

**Unidad 1 · Primeros pasos (nivel 1)**

1. Consejo · Postura al sentarse
2. Consejo · Forma de la mano
3. Consejo · Los números de los dedos
4. Consejo · Encontrar el Do
5. Lección (posiciones) · El teclado y la posición de Do con la mano derecha
6. Lección (lectura) · Do‑Re‑Mi‑Fa‑Sol en el pentagrama (clave de sol)
7. Lección (ritmo) · El pulso: negras y blancas
8. Hito · Cinco dedos
9. Consejo · Tocar sin golpear
10. Lección (ritmo) · Redondas y silencios
11. Lección (lectura) · Pasos y saltos en el pentagrama
12. Hito · Himno a la alegría
13. Consejo · Practicar poco y a menudo

**Unidad 2 · Moverse por el teclado (nivel 2)**

1. Consejo · Lento primero
2. Lección (ritmo) · El puntillo
3. Hito · Jingle Bells (estribillo)
4. Consejo · Contar en voz alta
5. Lección (ritmo) · Corcheas
6. Hito · Martinillo
7. Consejo · Ojos en la partitura
8. Consejo · Leer por adelantado
9. Lección (lectura) · Notas fuera de la posición de Do: por debajo (Sol y La graves) y por encima (La y Si)
10. Hito · Old MacDonald
11. Consejo · Saltar con el brazo
12. Lección (posiciones) · Cambiar de posición y saltos
13. Hito · Oh! Susana
14. Consejo · No volver al principio

**Unidad 3 · La mano izquierda y los primeros acordes (nivel 2 → 3)**

1. Lección (posiciones) · La posición de Do con la mano izquierda
2. Lección (lectura) · La clave de fa: de Si a Sol graves
3. Consejo · El metrónomo es tu aliado
4. Lección (acordes) · Qué es un acorde: Do mayor
5. Lección (acordes) · Fa mayor y Sol mayor «con el Si abajo»
6. Lección (acordes) · Cambiar entre Do, Fa y Sol a tempo
7. Hito · Himno a la alegría con acordes (cierre de la ruta)

## Clarifications

### Session 2026-11-25

- Q: ¿Cómo se enseña el acorde de Sol mayor en las lecciones de acordes? → A: Do mayor
  (Do‑Mi‑Sol) y Fa mayor (Fa‑La‑Do) en posición fundamental; Sol mayor como Si‑Re‑Sol, explicado
  como «Sol con el Si abajo para no mover la mano». Así coincide con el hito «Himno a la alegría
  con acordes», que no se modifica.
- Q: ¿Cuenta lo practicado en el Curso para el tiempo de práctica, la racha y las estrellas de
  Inicio y Progreso? → A: el tiempo y la racha cuentan siempre. Las estrellas de las lecciones se
  muestran aparte («Curso: N de M») y no se suman al total del repertorio.
- Q: En las pantallas de explicación, ¿se puede tocar el teclado o solo se lee y se escucha? → A:
  el teclado responde: cualquier tecla suena y se ilumina, las resaltadas con énfasis especial. No
  se evalúa nada y se pasa al ejercicio con «Siguiente».

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Empezar desde cero con el Curso (Priority: P1)

Una alumna que nunca ha tocado el piano abre la app y pulsa «Curso» en el inicio. Ve el mapa
de la Unidad 1 con la primera ficha abierta y el resto bloqueado. Lee los consejos de postura,
forma de la mano y números de los dedos, cada uno con su dibujo. Después hace su primera
lección: una pantalla le explica dónde está el Do y le muestra la posición de cinco dedos
resaltada en el teclado, y un ejercicio corto le pide tocar Do‑Re‑Mi‑Fa‑Sol. Consigue 2
estrellas y se abre la lección siguiente. Al acabar la unidad toca «Himno a la alegría» como
hito.

**Why this priority**: es el núcleo de la funcionalidad. Sin lecciones, desbloqueo y mapa no
hay curso. Por sí sola ya da valor a quien empieza desde cero.

**Independent Test**: con el progreso vacío, recorrer la Unidad 1 completa con el teclado en
pantalla y comprobar que cada lección se abre al conseguir 2 estrellas en la anterior, y que
los consejos se pueden leer o saltar sin bloquear nada.

**Acceptance Scenarios**:

1. **Given** el progreso vacío, **When** la alumna abre el Curso, **Then** ve el mapa de
   unidades, con la Unidad 1 abierta, su primer elemento disponible y los demás elementos
   puntuables bloqueados.
2. **Given** una lección abierta, **When** la alumna la empieza, **Then** ve 1–2 pantallas de
   explicación (texto breve, mini partitura y/o teclado con teclas resaltadas) en las que puede
   pulsar teclas libremente para oírlas, sin puntuación, y después el ejercicio.
3. **Given** el ejercicio de una lección, **When** la alumna lo toca a tempo, **Then** recibe de
   0 a 3 estrellas con el mismo criterio que las piezas, y se guarda la mejor marca.
4. **Given** una lección con 2 o más estrellas, **When** vuelve al mapa, **Then** el siguiente
   elemento puntuable (lección o hito) está desbloqueado.
5. **Given** una lección con 0 o 1 estrella, **When** vuelve al mapa, **Then** el siguiente
   elemento puntuable sigue bloqueado y la app le anima a repetir.
6. **Given** un elemento bloqueado, **When** lo toca en el mapa, **Then** la app le dice qué
   tiene que superar antes, sin abrirlo.

---

### User Story 2 - Consejos prácticos ilustrados (Priority: P1)

Antes de la primera lección, la alumna encuentra tres fichas de consejo. «Postura al sentarse»
muestra una figura de perfil en la banqueta con los antebrazos paralelos al suelo, y explica en
cuatro frases la altura, la distancia, los pies y dónde centrarse. Pulsa «Entendido» y la ficha
queda marcada como vista. Otro día un alumno que ya sabe todo esto pasa directamente a la
lección: los consejos no le bloquean.

**Why this priority**: forma parte del curso desde el primer minuto (la postura se enseña antes
que la primera nota) y es lo que lo distingue de un simple listado de ejercicios.

**Independent Test**: abrir cada ficha de los niveles 1 y 2, comprobar que se lee en menos de un
minuto, que las que llevan ilustración la muestran bien en tema claro y oscuro, y que marcarla o
no marcarla no cambia qué lecciones están abiertas.

**Acceptance Scenarios**:

1. **Given** una ficha de consejo en el mapa, **When** se abre, **Then** muestra un título, un
   texto de 60 palabras como máximo y, si le corresponde, una ilustración.
2. **Given** una ficha abierta, **When** se pulsa «Entendido», **Then** queda marcada como vista
   en el mapa y se vuelve al mapa o se sigue al siguiente elemento.
3. **Given** un consejo sin leer, **When** se mira el elemento puntuable que viene después,
   **Then** su estado (abierto o bloqueado) depende solo de las lecciones e hitos, no del consejo.
4. **Given** el tema oscuro, **When** se abre una ficha con ilustración, **Then** la ilustración
   usa los colores del tema y se distingue bien. Igual en tema claro.
5. **Given** cualquier ficha, **When** se lee, **Then** no hace referencia al teclado en
   pantalla.

---

### User Story 3 - Lecciones de ritmo con metrónomo (Priority: P2)

Un alumno llega a la lección «El pulso: negras y blancas». La explicación le muestra un compás
con negras y blancas y se lo hace escuchar con el metrónomo. En el ejercicio suena una cuenta
previa de un compás («1, 2, 3, 4») y después debe tocar el ritmo sobre una tecla mientras el
metrónomo marca el pulso. La app puntúa lo cerca del tiempo que cae cada golpe, no qué tecla
pulsa.

**Why this priority**: el ritmo es uno de los cuatro bloques y prepara corcheas y puntillo para
el nivel 2, pero la Unidad 1 tiene valor aunque esta forma de ejercicio llegue después.

**Independent Test**: completar una lección de ritmo con el teclado en pantalla tocando
correctamente, luego adelantándose y luego retrasándose, y comprobar que la puntuación lo refleja.

**Acceptance Scenarios**:

1. **Given** el ejercicio de una lección de ritmo, **When** empieza, **Then** suena una cuenta
   previa de un compás, con indicación visual de cada pulso, antes de la primera nota.
2. **Given** el ejercicio en marcha, **When** el alumno toca, **Then** el metrónomo marca el
   pulso de forma audible y visible durante todo el ejercicio.
3. **Given** un ejercicio de ritmo, **When** el alumno toca el ritmo correcto con cualquier
   tecla, **Then** cada golpe se evalúa solo por su momento, con la misma tolerancia que el modo
   «Tocar» de las piezas.
4. **Given** un golpe que falta o sobra, **When** termina el ejercicio, **Then** cuenta como
   fallo en la puntuación.

---

### User Story 4 - Primeros acordes con la mano izquierda (Priority: P2)

Una alumna que ya ha superado la posición de Do con la mano izquierda aprende qué es un acorde:
tres notas a la vez. La explicación resalta Do‑Mi‑Sol en el teclado con los dedos 5‑3‑1 y
los muestra apilados en la clave de fa. En el ejercicio toca acordes de Do, luego de Fa y Sol, y
por último cambia entre los tres a tempo. Toca con un teclado MIDI, pero su hermano lo prueba en
el ordenador con el ratón y también puede hacerlo.

**Why this priority**: cierra la ruta y prepara el nivel 3. Depende de las lecciones de mano
izquierda, así que llega al final.

**Independent Test**: completar las tres lecciones de acordes con un teclado MIDI (notas a la
vez) y con el teclado en pantalla usando el ratón (notas seguidas), y comprobar que ambas formas
puntúan igual si se hacen bien.

**Acceptance Scenarios**:

1. **Given** el ejercicio de acordes, **When** la alumna pulsa las tres notas del acorde a la
   vez, **Then** el acorde cuenta como acertado.
2. **Given** el ejercicio de acordes, **When** falta una nota o sobra una nota ajena al acorde,
   **Then** el acorde cuenta como fallado.
3. **Given** el teclado en pantalla sin pulsación simultánea (ratón), **When** se pulsan las
   tres notas una tras otra dentro de la ventana de tiempo, **Then** el acorde cuenta como
   acertado y suena como acorde.
4. **Given** el teclado en pantalla en un dispositivo táctil, **When** se tocan las tres notas
   con tres dedos, **Then** funciona igual que con un teclado MIDI.
5. **Given** cualquier lección de acordes, **When** se muestra la partitura, **Then** los
   acordes aparecen apilados en la clave de fa. La explicación muestra los dedos 5‑3‑1 en el
   teclado, y la partitura los muestra según el ajuste «Números de dedo».

---

### User Story 5 - Piezas‑hito y progreso que ya existe (Priority: P2)

Un alumno que lleva semanas usando la app tiene 3 estrellas en «Himno a la alegría» y 2 en
«Martinillo». Al abrir el Curso por primera vez, la ruta está abierta hasta Martinillo, que ya
figura como superado. Las lecciones nuevas que hay antes aparecen como opcionales: puede hacerlas,
pero no le bloquean. Cuando toca un hito desde el Curso usa la pieza de siempre, y lo que consiga
cuenta en el Curso y en Canciones.

**Why this priority**: evita castigar a quien ya practica y une el Curso con el repertorio, pero
el Curso funciona aunque al principio nadie tenga progreso previo.

**Independent Test**: preparar un progreso con estrellas en un hito de la Unidad 2, abrir el
Curso y comprobar qué está abierto, superado y opcional. Después tocar un hito desde el Curso y
comprobar que sus estrellas aparecen también en Canciones.

**Acceptance Scenarios**:

1. **Given** un progreso con 2 o más estrellas en una pieza‑hito, **When** se abre el Curso,
   **Then** ese hito figura como superado y todo lo anterior queda desbloqueado.
2. **Given** ese mismo progreso, **When** se mira una lección anterior al hito más avanzado
   superado, **Then** está abierta, marcada como opcional y no impide avanzar aunque no tenga
   estrellas.
3. **Given** un hito abierto en el Curso, **When** se empieza, **Then** se practica la pieza
   existente con sus pasos Escuchar, Aprender y Tocar, sin ningún cambio en ella.
4. **Given** un hito tocado desde Canciones, **When** consigue 2 o más estrellas, **Then** el
   Curso lo cuenta como superado igual que si se hubiera tocado desde el Curso.
5. **Given** el Curso, **When** se mira Canciones, **Then** todas las piezas siguen disponibles,
   sin bloqueos.

---

### User Story 6 - Prueba de nivel para saltar una unidad (Priority: P3)

Un alumno que ya sabe leer en clave de sol y tocar con cinco dedos no quiere repasar la
Unidad 1. En el mapa pulsa «Prueba de nivel» en la Unidad 2. La app le propone un ejercicio
corto de cada bloque trabajado en la Unidad 1. Los supera con 2 estrellas o más, y la Unidad 1
queda marcada como superada por prueba, con la Unidad 2 abierta.

**Why this priority**: mejora la experiencia de quien no empieza de cero, pero el curso es
completo sin ella.

**Independent Test**: con el progreso vacío, hacer la prueba de nivel de la Unidad 2 una vez
aprobando y otra suspendiendo un ejercicio, y comprobar el estado de las unidades en cada caso.

**Acceptance Scenarios**:

1. **Given** una unidad bloqueada que no es la primera, **When** se pulsa su «Prueba de nivel»,
   **Then** la app propone un ejercicio de cada bloque (lectura, ritmo, posiciones, acordes)
   trabajado en las unidades anteriores, con las mismas reglas de puntuación que las lecciones.
2. **Given** la prueba, **When** se consiguen 2 o más estrellas en todos sus ejercicios, **Then**
   la unidad se abre y las anteriores se marcan como superadas por prueba. Sus lecciones,
   hitos y consejos quedan disponibles como opcionales.
3. **Given** la prueba, **When** algún ejercicio queda por debajo de 2 estrellas, **Then** no se
   desbloquea nada, se indica qué bloque conviene repasar y se puede repetir la prueba cuando se
   quiera.

---

### User Story 7 - Continuar donde lo dejé (Priority: P3)

Una alumna dejó ayer el Curso en la lección de corcheas. Hoy abre la app y pulsa «Continuar» en
el inicio: va directamente a esa lección. Otro día, si lo último que hizo fue tocar una pieza
desde Canciones, «Continuar» la lleva a esa pieza, como hasta ahora.

**Why this priority**: comodidad. El Curso es útil sin ello porque el mapa muestra el siguiente
paso.

**Independent Test**: hacer una lección del Curso, volver al inicio y pulsar «Continuar». Después
tocar una pieza desde Canciones y repetir.

**Acceptance Scenarios**:

1. **Given** que lo último practicado fue un elemento del Curso, **When** se pulsa «Continuar»,
   **Then** se abre el siguiente elemento pendiente del Curso (o el mismo, si no se superó).
2. **Given** que lo último practicado fue una pieza desde Canciones, **When** se pulsa
   «Continuar», **Then** funciona como hoy.
3. **Given** el inicio, **When** se mira, **Then** hay una entrada «Curso» que muestra el avance
   (p. ej. «Unidad 2 · 5 de 14»).

---

### Edge Cases

- **Ruta terminada**: al superar el último elemento, el mapa muestra la ruta completa y sugiere
  seguir con las piezas de nivel 3 en Canciones; «Continuar» deja de proponer elementos del Curso.
- **Progreso con huecos**: alguien tiene estrellas en un hito de la Unidad 2 pero no en los de la
  Unidad 1. Manda el hito superado más avanzado: todo lo anterior queda abierto y opcional.
- **Pieza‑hito retirada o renombrada**: la ruta no puede apuntar a una pieza que no existe. Una
  comprobación automática debe fallar si un hito no está en el repertorio incluido.
- **Salir a mitad**: si se sale de una lección durante la explicación o el ejercicio, no se guarda
  puntuación ni se cambia el desbloqueo. Al volver se empieza la lección desde el principio.
- **Repetir lo ya superado**: se puede repetir cualquier lección, hito o consejo abierto. Solo se
  guarda la mejor marca y nunca se vuelve a bloquear nada.
- **Cambio de ajustes**: la notación (Do‑Re‑Mi o C‑D‑E), los nombres de nota, los dedos y el tema
  se aplican en explicaciones, ejercicios y fichas, también en el texto de las explicaciones.
- **Móvil en vertical**: como en el resto de la app, se pide girar el dispositivo (también en el
  mapa, las explicaciones y las fichas).
- **Teclado MIDI que se desconecta durante el ejercicio**: se comporta como en las piezas, y se
  puede seguir con el teclado en pantalla.
- **Sin conexión**: el Curso, incluidas las ilustraciones, funciona sin conexión una vez instalada
  o visitada la app.
- **Acorde con el ratón demasiado lento**: si las tres notas no llegan dentro de la ventana, cuenta
  como fallo. La pista del ejercicio recuerda que hay que pulsarlas seguidas y rápido.
- **Ritmo con varias teclas a la vez**: en un ejercicio de ritmo, varias teclas pulsadas a la vez
  cuentan como un solo golpe.
- **Borrar el progreso** (si los ajustes lo permiten): el Curso vuelve al estado inicial.

## Requirements *(mandatory)*

### Functional Requirements

**Estructura del curso**

- **FR-001**: La app MUST ofrecer un Curso organizado en **unidades** ordenadas. Cada unidad es
  una secuencia ordenada de elementos de tres tipos: lección, pieza‑hito y consejo.
- **FR-002**: El Curso MUST contener entre **12 y 16 lecciones** repartidas entre los cuatro
  bloques (lectura, ritmo, posiciones de mano y acordes), con al menos **2 lecciones por bloque**.
- **FR-003**: El contenido de las lecciones MUST limitarse a lo que piden los niveles 1 y 2 del
  repertorio, más tres acordes con la mano izquierda como preparación para el nivel 3: Do mayor
  (Do‑Mi‑Sol) y Fa mayor (Fa‑La‑Do) en posición fundamental, y Sol mayor como Si‑Re‑Sol («con el
  Si abajo»), la misma forma que usa el hito «Himno a la alegría con acordes».
- **FR-004**: El Curso MUST incluir como hitos al menos **4 piezas del repertorio existente** de
  los niveles 1 y 2, cada una después de las lecciones que preparan lo que trabaja. Puede cerrar
  con una pieza de nivel 3 que use los acordes aprendidos.
- **FR-005**: El Curso MUST incluir los **13 consejos** de los niveles 1 y 2:
  - Nivel 1: postura al sentarse, forma de la mano, los números de los dedos, encontrar el Do,
    tocar sin golpear, practicar poco y a menudo.
  - Nivel 2: lento primero, contar en voz alta, ojos en la partitura, leer por adelantado, saltar
    con el brazo, no volver al principio (usar el bucle) y el metrónomo es tu aliado.
- **FR-006**: Los consejos de postura y forma de la mano MUST aparecer antes de la primera lección.

**Lecciones**

- **FR-007**: Cada lección MUST tener 1 o 2 pantallas de explicación con texto breve (como máximo
  80 palabras por pantalla) y al menos un apoyo visual: mini partitura, teclado con teclas
  resaltadas o ambos. La explicación MUST poder escucharse cuando muestre música.
- **FR-007a**: Durante la explicación, el teclado (en pantalla y MIDI) MUST responder: cualquier
  tecla suena y se ilumina, y las teclas resaltadas por la explicación se distinguen al pulsarlas.
  No se evalúa nada. Se pasa al ejercicio con «Siguiente», sin requisito de pulsar ninguna tecla.
- **FR-008**: Cada lección MUST terminar con un ejercicio corto (como máximo 8 compases o 30
  segundos a tempo) que se toca y se puntúa de 0 a 3 estrellas con el mismo criterio que las piezas.
- **FR-009**: Los ejercicios de lectura, posiciones y acordes MUST ofrecer los pasos Escuchar,
  Aprender y Tocar. Los de ritmo MUST ofrecer Escuchar y Tocar. Las estrellas que cuentan para el
  avance son las del paso Tocar.
- **FR-010**: Todo ejercicio MUST poder completarse con el teclado en pantalla y con un teclado
  MIDI, con el mismo resultado si se toca igual (Principio III).

**Ritmo**

- **FR-011**: Los ejercicios de ritmo MUST empezar con una cuenta previa de un compás, audible y
  visible, y mantener un metrónomo audible y visible durante todo el ejercicio.
- **FR-012**: En los ejercicios de ritmo MUST aceptarse cualquier tecla. Cada golpe se evalúa solo
  por su momento, con la misma tolerancia temporal que el modo Tocar de las piezas. Los golpes que
  faltan o sobran cuentan como fallo.

**Acordes**

- **FR-013**: Un acorde MUST contar como acertado cuando se pulsan exactamente sus tres notas
  dentro de una ventana corta de tiempo, y como fallado si falta alguna o se añade una nota ajena.
- **FR-014**: Con el teclado en pantalla sin pulsación simultánea, MUST aceptarse las tres notas
  pulsadas una tras otra dentro de una ventana más amplia, que suenan juntas como acorde.
- **FR-014a**: FR-013 y FR-014 se aplican igual a las piezas del repertorio con acordes, en el
  Curso y en Canciones, para que el hito final pueda superarse con el teclado en pantalla
  (Principio III). Las piezas sin acordes no cambian.

**Avance y desbloqueo**

- **FR-015**: Al empezar sin progreso, solo MUST estar disponible el primer elemento puntuable de
  la Unidad 1 y los consejos que lo preceden.
- **FR-016**: Un elemento puntuable (lección o hito) MUST desbloquearse cuando el elemento
  puntuable anterior tiene 2 o más estrellas. Los consejos MUST estar disponibles en cuanto lo está
  el primer elemento puntuable que viene después de ellos, y nunca bloquean.
- **FR-017**: Un consejo MUST poder marcarse como visto. El estado «visto» se guarda y se muestra
  en el mapa.
- **FR-018**: Al tocar un elemento bloqueado en el mapa, la app MUST indicar qué hay que superar
  antes.
- **FR-019**: Cualquier elemento abierto MUST poder repetirse. Se guarda la mejor marca y lo ya
  abierto no se vuelve a bloquear.
- **FR-020**: Cada unidad salvo la primera MUST ofrecer una **prueba de nivel** con un ejercicio
  de cada bloque trabajado en las unidades anteriores. Superarla (2 o más estrellas en todos)
  abre la unidad y marca las anteriores como superadas por prueba. Sus elementos quedan como
  opcionales.

**Repertorio y progreso existente**

- **FR-021**: Un hito MUST practicarse con la pieza existente del repertorio, sin cambios, y
  compartir sus estrellas con Canciones: lo conseguido en un sitio cuenta en el otro.
- **FR-022**: Al abrir el Curso, un hito con 2 o más estrellas ya guardadas MUST figurar como
  superado, y todo lo anterior a él como desbloqueado. Las lecciones anteriores sin superar MUST
  mostrarse como opcionales y no bloquear el avance.
- **FR-023**: El Curso MUST NOT bloquear ni ocultar ninguna pieza en Canciones.

**Consejos e ilustraciones**

- **FR-024**: Cada consejo MUST tener un título y un texto de 60 palabras como máximo, en español
  y dirigido a quien empieza.
- **FR-025**: Los consejos MUST estar escritos para quien toca en un piano o teclado físico y MUST
  NOT mencionar el teclado en pantalla.
- **FR-026**: Llevan ilustración propia al menos: postura al sentarse, forma de la mano (correcta
  frente a incorrecta), los números de los dedos, encontrar el Do, tocar sin golpear, saltar con
  el brazo y ojos en la partitura. Los demás consejos llevan un icono sencillo o solo texto.
- **FR-027**: Las ilustraciones MUST ser originales del proyecto (sin fotos ni imágenes de
  terceros), adaptarse al tema claro y oscuro, y estar disponibles sin conexión.

**Navegación y presentación**

- **FR-028**: El inicio MUST mostrar una entrada «Curso» con el avance actual (unidad y elementos
  superados del total).
- **FR-029**: El Curso MUST mostrar un mapa de unidades con el estado de cada elemento: bloqueado,
  disponible, superado (con estrellas), opcional o visto (consejos).
- **FR-030**: «Continuar» en el inicio MUST llevar al siguiente elemento pendiente del Curso si lo
  último practicado fue un elemento del Curso. Si no, mantiene su comportamiento actual.
- **FR-031**: Explicaciones, ejercicios y fichas MUST respetar los ajustes de notación, nombres de
  nota, dedos y tema (Principio IV).
- **FR-032**: Los ejercicios MUST mostrar partitura y teclado sin desplazamiento en móvil apaisado.
  Las explicaciones y las fichas MUST leerse sin desplazamiento horizontal en móvil apaisado.
- **FR-033**: El progreso del Curso (estrellas de lecciones, consejos vistos, unidades superadas
  por prueba) MUST guardarse en el dispositivo junto al resto del progreso (Principio V).

**Calidad del contenido**

- **FR-034**: Cada ejercicio de lección MUST superar la misma validación automática que el
  repertorio (compases completos, notas y duraciones válidas).
- **FR-035**: Una comprobación automática MUST verificar que cada hito apunta a una pieza
  existente del repertorio incluido y que cada unidad cumple las reglas de estructura (FR-002,
  FR-005, FR-006).

**Tiempo, racha y estrellas**

- **FR-036**: El tiempo practicado en lecciones, hitos y pruebas de nivel del Curso MUST sumarse al
  tiempo de práctica, y practicar en el Curso MUST contar como día de práctica para la racha.
- **FR-037**: Las estrellas de las lecciones y de las pruebas de nivel MUST NOT sumarse al total de
  estrellas del repertorio. Inicio y Progreso MUST mostrarlas aparte («Curso: N de M estrellas»).
  Las estrellas de los hitos siguen contando en el repertorio, como hasta ahora.

### Key Entities

- **Unidad**: grupo ordenado de elementos de la ruta, con título y número. Tiene una prueba de
  nivel (salvo la primera) y un estado: bloqueada, en curso, superada o superada por prueba.
- **Elemento de la ruta**: cada paso de una unidad. Su tipo puede ser lección, hito o consejo.
  Su estado puede ser bloqueado, disponible, superado, opcional o visto.
- **Lección**: bloque (lectura, ritmo, posiciones o acordes), título, 1–2 pantallas de
  explicación y un ejercicio.
- **Ejercicio**: música corta que se toca y se puntúa. En ritmo se evalúa solo el tiempo. En
  acordes, las notas simultáneas.
- **Pieza‑hito**: referencia a una pieza existente del repertorio. No duplica su contenido.
- **Consejo**: título, texto breve, nivel e ilustración o icono opcional.
- **Prueba de nivel**: conjunto de ejercicios, uno por bloque trabajado antes de la unidad.
- **Progreso del curso**: mejores estrellas por lección, consejos vistos, unidades superadas por
  prueba y último elemento practicado. Las estrellas de los hitos son las del progreso de
  Canciones.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona sin conocimientos musicales completa la Unidad 1 (lecciones, hitos y
  consejos) en menos de 45 minutos de práctica, repartidos en una o varias sesiones.
- **SC-002**: Cada ficha de consejo se lee en 30 segundos o menos a un ritmo de lectura normal
  (60 palabras como máximo).
- **SC-003**: El 100 % de las lecciones, hitos y pruebas de nivel se pueden completar con 3
  estrellas usando solo el teclado en pantalla, en escritorio con ratón y en un móvil apaisado.
- **SC-004**: En un ejercicio de ritmo tocado exactamente a tempo se obtienen 3 estrellas. Si cada
  golpe va fuera de la tolerancia, se obtienen 0.
- **SC-005**: Al abrir el Curso con progreso previo, el 100 % de los hitos con 2 o más estrellas
  aparecen como superados, sin que se pierda ninguna estrella ni marca existente.
- **SC-006**: Las ilustraciones se distinguen bien en tema claro y en tema oscuro (revisión manual
  en ambos temas, en escritorio y en móvil apaisado).
- **SC-007**: El Curso completo, ilustraciones incluidas, funciona sin conexión tras la primera
  visita.
- **SC-008**: Desde el inicio se llega al siguiente elemento pendiente del Curso con un solo toque
  («Curso» → elemento destacado, o «Continuar»).

## Assumptions

- **Unidades**: la ruta se organiza en 3 unidades (Unidad 1 ≈ nivel 1, Unidad 2 ≈ nivel 2,
  Unidad 3 = mano izquierda y acordes). La ruta orientativa del Contexto sirve de referencia y se
  ajusta en la planificación sin salirse de los requisitos.
- **Umbral de desbloqueo**: 2 estrellas, igual que el criterio con el que la app ya anima a pasar
  de Aprender a Tocar.
- **Ejercicios a tempo**: las estrellas que cuentan son las del paso Tocar. Aprender sirve para
  practicar pero no desbloquea.
- **Tolerancia del ritmo**: la misma ventana temporal que el modo Tocar de las piezas. No se
  definen tolerancias nuevas.
- **Ventana de acorde**: unos 150 ms entre la primera y la última nota cuando se pulsan a la vez
  (MIDI o multitáctil) y hasta unos 1,5 s cuando se pulsan seguidas con el ratón. Los valores
  exactos se ajustan probando.
- **Clave de fa**: se introduce en la Unidad 3 solo con las notas que piden los tres acordes y la
  posición de Do de la mano izquierda (Si grave y de Do a Sol graves, más La y Do para Fa mayor).
- **Hitos de la Unidad 3**: no hay ninguna pieza de nivel 1–2 para la mano izquierda, así que la
  Unidad 3 solo tiene el hito final. «Old MacDonald» (mano derecha por debajo del Do central) se
  usa como hito en la Unidad 2.
- **Prueba de nivel**: no tiene límite de intentos ni penaliza suspender.
- **Consejos de niveles 3 y 4** (manos por separado, la melodía manda, teclas negras, pasar el
  pulgar, pedal, arpegios con rotación, frasear, escuchar antes, calentar): fuera del alcance de
  esta entrega. Se añadirán cuando la ruta llegue a esos niveles.
- **Fuera de alcance**: el juego de lectura rápida de notas y las estadísticas, historial y
  rachas ampliadas, que son funcionalidades aparte de la v0.6. Tampoco hay contenido nuevo del
  repertorio ni sincronización entre dispositivos (v1.0).
- **Textos e ilustraciones**: se escriben y dibujan para el proyecto. No se usan materiales de
  métodos de piano con derechos.
- **Dependencias**: se apoya en lo ya existente: motor de lección con sus modos, puntuación por
  estrellas, modo a tempo, partitura, teclado en pantalla, MIDI, progreso guardado, ajustes y uso
  sin conexión.

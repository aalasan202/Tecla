# Feature Specification: Curso en tres caminos y técnica (niveles 1–4)

**Feature Branch**: `012-curso-tres-caminos`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "v0.7 de la hoja de ruta: Curso de los niveles 1 a 4; en cada nivel, tres caminos libres (lecciones y consejos, técnica, canciones) con un «Siguiente recomendado»; lecciones y consejos nuevos para los niveles 3 y 4; escalas generadas con la digitación a la vista (enseñada, no puntuada); independencia de manos solo con teclado MIDI (constitución 1.1.0, excepción al Principio III); se conserva el progreso actual del Curso."

## Contexto

Hoy el Curso (010) es un camino único de 3 unidades:

- **Unidad 1** prepara el nivel 1; las **unidades 2 y 3**, el nivel 2 y la entrada al 3.
- Tiene 14 lecciones, 7 piezas‑hito y 13 consejos.
- Cada elemento se abre al superar el anterior con 2 estrellas, y hay pruebas de nivel para
  saltar unidades.

Funciona, pero tiene tres límites:

- **Es lineal**: si una lección se atasca, no hay otra cosa que hacer dentro del Curso.
- **No trabaja la técnica**: ni escalas, ni digitación, ni independencia de manos.
- **Se queda en el nivel 2**, aunque el repertorio llega al 4.

Esta funcionalidad reorganiza el Curso por **niveles (1 a 4)**. Dentro de cada nivel, el alumno
elige entre **tres caminos**:

| Camino | Qué contiene | Ejemplo |
|--------|--------------|---------|
| **Lecciones** | Lecciones con explicación y ejercicio puntuado, y consejos | «El puntillo», consejo «Lento primero» |
| **Técnica** | Escalas y ejercicios de independencia de manos | Escala de Sol mayor, mano derecha |
| **Canciones** | Piezas del repertorio de ese nivel | Himno a la alegría |

La app siempre propone un **«Siguiente recomendado»** que mezcla los tres caminos, para que
quien empieza nunca tenga que adivinar qué hacer.

Fuera de alcance (v0.8): el juego de lectura rápida, las canciones largas aprendidas por partes
y el historial y las estadísticas separados por camino.

## Clarifications

### Session 2026-11-27

- Q: Dentro de un nivel abierto, ¿las lecciones se pueden hacer en cualquier orden o cada una se abre al superar la anterior? → A: En cualquier orden; se muestra el orden sugerido y la recomendación lo sigue.
- Q: ¿Dónde van las lecciones de la unidad 3 actual (mano izquierda y primeros acordes)? → A: Al nivel 2; las unidades 2 y 3 forman el nivel 2.
- Q: ¿Qué se hace con la prueba de la unidad 3 al unir las unidades 2 y 3? → A: Se retira. La prueba del nivel 2 es la de la unidad 2 actual. Quien superó la de la unidad 3 conserva abiertos los niveles 1–2. Se escriben pruebas nuevas para los niveles 3 y 4; la del 3 incluye acordes.
- Q: ¿En qué tonalidades van las escalas de cada nivel? → A: N1 Do M · N2 Sol M y Fa M · N3 Re M y La m · N4 Mi m y Si♭ M.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Elegir camino dentro de un nivel (Priority: P1)

El alumno abre el Curso y ve los niveles 1 a 4, con el suyo destacado. Dentro del nivel
abierto ve tres caminos con su avance («Lecciones 3 de 5 · Técnica 1 de 4 · Canciones 2 de 6») y
puede entrar en cualquiera. Arriba aparece el «Siguiente recomendado», listo para empezar con
un toque.

**Why this priority**: es el cambio central de la versión. Sin él, la técnica y los niveles 3–4
no tienen dónde vivir. Ya aporta valor solo con el contenido actual reorganizado.

**Independent Test**: con el contenido actual repartido en niveles 1 y 2, abrir el Curso, entrar
en Canciones del nivel 1, tocar una pieza, volver y entrar en Lecciones, sin que nada lo
impida dentro del nivel.

**Acceptance Scenarios**:

1. **Given** un alumno nuevo, **When** abre el Curso, **Then** ve el nivel 1 abierto con sus tres caminos, los niveles 2–4 bloqueados con la explicación de cómo abrirlos, y el «Siguiente recomendado» apunta a la primera lección.
2. **Given** el nivel 1 abierto, **When** el alumno entra en Canciones, **Then** puede practicar cualquiera de sus piezas aunque no haya hecho ninguna lección.
3. **Given** un nivel abierto, **When** el alumno mira un camino, **Then** ve cada elemento con su estado (sin empezar, estrellas conseguidas, visto) y el orden sugerido.
4. **Given** el nivel 1 con todas sus lecciones superadas con 2 estrellas o más, **When** el alumno vuelve al Curso, **Then** el nivel 2 está abierto. El nivel 1 sigue disponible.
5. **Given** un nivel bloqueado, **When** el alumno supera su prueba de nivel, **Then** ese nivel y los anteriores quedan abiertos.
6. **Given** el nivel 2 abierto, **When** el alumno abre la lección «Corcheas» sin haber hecho «El puntillo», **Then** la lección empieza con normalidad: dentro de un nivel ninguna lección bloquea a otra.

---

### User Story 2 - Siguiente recomendado (Priority: P1)

En Inicio y en el Curso, la app propone qué hacer a continuación. La propuesta alterna los
caminos (por ejemplo, tras dos lecciones seguidas propone una escala o una canción), prioriza
lo que está sin hacer o con pocas estrellas y explica en una línea por qué lo propone.

**Why this priority**: la libertad sin guía desorienta a quien empieza (Principio IV). Es la
condición que se puso a los caminos libres.

**Independent Test**: hacer dos lecciones seguidas y comprobar que la recomendación pasa a otro
camino; sin teclado MIDI, comprobar que nunca recomienda un ejercicio de independencia de
manos.

**Acceptance Scenarios**:

1. **Given** que el alumno acaba de superar dos lecciones seguidas, **When** vuelve al Curso, **Then** el «Siguiente recomendado» es un elemento de Técnica o de Canciones del mismo nivel, con un motivo («Toca algo de lo aprendido»).
2. **Given** todas las lecciones del nivel superadas, **When** quedan elementos de Técnica o Canciones sin hacer, **Then** la recomendación sugiere uno de ellos o el nivel siguiente.
3. **Given** que no hay teclado MIDI conectado, **When** se calcula la recomendación, **Then** nunca propone un ejercicio de independencia de manos.
4. **Given** el inicio de la app, **When** el último elemento practicado fue del Curso, **Then** «Continuar» ofrece el «Siguiente recomendado» del Curso.
5. **Given** que el alumno ignora la recomendación y practica otra cosa, **When** vuelve, **Then** la recomendación se recalcula con lo que hizo, sin penalizar ni bloquear nada.

---

### User Story 3 - Escalas con digitación (Priority: P2)

En el camino Técnica, el alumno practica escalas de una octava. Cada escala muestra los
números de dedo sobre las notas y el teclado resalta dónde pasa el pulgar. Se practica con los
pasos de siempre (Escuchar, Aprender y Tocar) y se puntúa por notas y ritmo, no por los dedos.
Al subir de estrellas, la app propone la misma escala un poco más rápido.

**Why this priority**: es la primera técnica del Curso y la base de la digitación. Funciona con
el teclado en pantalla.

**Independent Test**: abrir la escala de Do mayor con la mano derecha, comprobar que se ven los
dedos 1‑2‑3‑1‑2‑3‑4‑5 y el paso del pulgar, tocarla en Tocar y recibir estrellas.

**Acceptance Scenarios**:

1. **Given** la escala de Do mayor con la mano derecha, **When** el alumno la abre, **Then** ve la partitura con los números de dedo (aunque los números estén desactivados en Ajustes) y una explicación breve del paso del pulgar.
2. **Given** una escala en Tocar, **When** el alumno la termina, **Then** recibe nota y estrellas como en cualquier pieza, sin que la digitación influya.
3. **Given** una escala con 3 estrellas a un tempo, **When** el alumno vuelve a ella, **Then** se le propone el siguiente tempo (por ejemplo, de 60 a 80 ppm) y la escala se da por dominada al llegar al tempo objetivo.
4. **Given** el nivel 3 o 4, **When** el alumno abre Técnica, **Then** encuentra escalas en las tonalidades de ese nivel, para cada mano por separado.
5. **Given** la escala de la mano izquierda, **When** se muestra, **Then** está escrita en clave de fa con su digitación propia (5‑4‑3‑2‑1‑3‑2‑1).

---

### User Story 4 - Independencia de manos con teclado MIDI (Priority: P2)

Con un teclado MIDI conectado, el alumno practica ejercicios en que cada mano hace algo
distinto: la izquierda mantiene notas largas mientras la derecha toca una melodía; después,
ritmos distintos en cada mano. Sin teclado MIDI, los ejercicios se ven, pero no se pueden
empezar, y un aviso explica por qué y cómo conectar uno.

**Why this priority**: es la habilidad que más cuesta en los niveles 3 y 4, pero depende del
hardware y la constitución (1.1.0) exige que no bloquee el avance.

**Independent Test**: sin MIDI, abrir un ejercicio de independencia y ver el aviso sin poder
empezar; con MIDI, tocarlo en Tocar y recibir estrellas.

**Acceptance Scenarios**:

1. **Given** que no hay teclado MIDI, **When** el alumno abre un ejercicio de independencia, **Then** ve la partitura y puede escucharla, ve un aviso que explica que con ratón o pantalla no se pueden tocar dos teclas a la vez y cómo conectar un teclado, y los pasos Aprender y Tocar no se pueden empezar.
2. **Given** un teclado MIDI conectado, **When** el alumno lo toca en Tocar, **Then** se puntúa con las dos manos como cualquier pieza a dos manos.
3. **Given** un alumno sin MIDI, **When** termina todo lo demás de su nivel, **Then** el nivel siguiente se abre igual: estos ejercicios no cuentan para abrir niveles ni para el avance del camino.
4. **Given** que el teclado MIDI se desconecta a mitad de un ejercicio, **When** ocurre, **Then** el intento se detiene sin puntuar y aparece el aviso.

---

### User Story 5 - Lecciones y consejos de los niveles 3 y 4 (Priority: P3)

El alumno que llega al nivel 3 encuentra lecciones nuevas para lo que piden sus piezas, como
tocar con las dos manos a la vez, el compás de 3/4, las armaduras, el pedal y las ligaduras. En
el nivel 4 encuentra el 6/8, las semicorcheas y el contrapunto sencillo. Cada nivel tiene sus
consejos ilustrados.

**Why this priority**: completa el Curso hasta el nivel 4, pero es contenido: se puede entregar
después de la estructura y la técnica.

**Independent Test**: abrir el nivel 3 (por avance o prueba de nivel) y completar una lección
nueva con su explicación y su ejercicio.

**Acceptance Scenarios**:

1. **Given** el nivel 3 abierto, **When** el alumno entra en Lecciones, **Then** encuentra entre 4 y 6 lecciones nuevas y entre 3 y 4 consejos nuevos, con el mismo formato que las de los niveles 1–2.
2. **Given** el nivel 4 abierto, **When** el alumno entra en Lecciones, **Then** encuentra entre 4 y 6 lecciones nuevas y entre 3 y 4 consejos nuevos.
3. **Given** los niveles 3 y 4, **When** el alumno quiere saltar al siguiente, **Then** puede hacer la prueba de nivel 3 o 4 como en los niveles anteriores.

---

### Edge Cases

- **Progreso del Curso anterior**: las lecciones superadas, las estrellas, los consejos vistos, las unidades saltadas por prueba y «Continuar» se conservan. Un alumno que había llegado a la unidad 3 encuentra abiertos los niveles que le corresponden, sin perder nada.
- **Hitos del Curso anterior**: pasan a ser canciones recomendadas de su nivel en el camino Canciones. Sus estrellas siguen siendo las de siempre, compartidas con la pantalla Canciones.
- **Canciones importadas**: no forman parte de ningún nivel del Curso; siguen en Canciones.
- **Pieza del repertorio con nivel que no encaja** (por ejemplo, sin nivel reconocible): va al nivel 1 o no aparece en el Curso, pero nunca rompe la vista.
- **Nivel sin elementos de un camino**: el camino se muestra vacío con un texto que lo explica; no cuenta para abrir el nivel siguiente.
- **Teclado MIDI que se conecta con un ejercicio de independencia abierto**: el aviso desaparece y se puede empezar sin salir.
- **Escala más ancha que el teclado en pantalla** en móvil apaisado: el teclado muestra la octava completa de la escala sin desplazamiento.
- **Notación Do‑Re‑Mi o C‑D‑E**: los nombres de las escalas y de las notas respetan el ajuste.
- **Bucle de compases en ejercicios de técnica**: no está disponible, igual que hoy en las lecciones del Curso.

## Requirements *(mandatory)*

### Functional Requirements

**Niveles y caminos**

- **FR-001**: El Curso MUST organizarse en 4 niveles, del 1 al 4, que se corresponden con los niveles del repertorio.
- **FR-002**: Cada nivel MUST tener tres caminos: **Lecciones** (lecciones y consejos), **Técnica** (escalas e independencia de manos) y **Canciones** (piezas del repertorio de ese nivel).
- **FR-003**: Dentro de un nivel abierto, todos los elementos de los tres caminos, lecciones incluidas, MUST poder abrirse en cualquier orden. Ninguna lección bloquea a otra del mismo nivel. Cada camino MUST mostrar un orden sugerido.
- **FR-004**: Un nivel MUST abrirse cuando todas las lecciones del nivel anterior tienen 2 estrellas o más, o cuando se supera su prueba de nivel. El nivel 1 está siempre abierto. Ni la técnica ni las canciones son requisito para abrir niveles.
- **FR-005**: Al superar una prueba de nivel, ese nivel y todos los anteriores MUST quedar abiertos. Los elementos de los niveles anteriores siguen disponibles.
- **FR-006**: Cada camino MUST mostrar su avance en el nivel: lecciones superadas, ejercicios de técnica dominados y canciones con 2 estrellas o más, frente al total del camino (sin contar los ejercicios que exigen MIDI si no hay MIDI).
- **FR-007**: El camino Canciones de un nivel MUST incluir las piezas del repertorio de ese nivel. Las antiguas piezas‑hito aparecen marcadas como recomendadas. Las estrellas de cada pieza son las mismas que en la pantalla Canciones.

**Siguiente recomendado**

- **FR-008**: El Curso e Inicio MUST mostrar un único «Siguiente recomendado», con su camino, su título y un motivo de una línea.
- **FR-009**: La recomendación MUST elegirse entre los niveles abiertos y seguir estas reglas, en orden:
  1. Nunca proponer un ejercicio que exige MIDI si no hay teclado MIDI conectado.
  2. Tras 2 elementos seguidos del mismo camino, proponer otro camino si tiene algo pendiente.
  3. Preferir lo pendiente del nivel más alto abierto: lecciones sin superar, técnica sin dominar y canciones con menos de 2 estrellas, en el orden sugerido de cada camino.
  4. Si el nivel actual está completo, proponer el siguiente nivel (su primera lección o su prueba).
- **FR-010**: La recomendación MUST recalcularse después de cada práctica y MUST NOT bloquear ni penalizar otros elementos.
- **FR-011**: «Continuar» en Inicio MUST llevar al «Siguiente recomendado» cuando lo último practicado fue del Curso (amplía la regla actual de 010).

**Técnica: escalas**

- **FR-012**: El camino Técnica MUST incluir escalas de una octava, ascendentes y descendentes, para cada mano por separado:
  - Nivel 1: Do mayor (mano derecha y mano izquierda).
  - Nivel 2: Sol mayor y Fa mayor.
  - Nivel 3: Re mayor y La menor.
  - Nivel 4: Mi menor y Si bemol mayor.
- **FR-013**: Las escalas MUST generarse a partir de la tonalidad, la mano y el tempo, no escribirse a mano una a una, y MUST mostrar siempre la digitación correcta de cada mano, aunque los números de dedo estén desactivados en Ajustes.
- **FR-014**: Cada escala MUST explicar brevemente el paso del pulgar la primera vez que se abre, y el teclado MUST señalar las notas en que ocurre.
- **FR-015**: Las escalas MUST practicarse con los pasos Escuchar, Aprender y Tocar y puntuarse como cualquier pieza (notas y ritmo). La digitación MUST NOT influir en la puntuación.
- **FR-016**: Cada escala MUST tener tres tempos: inicial, intermedio y objetivo (por ejemplo, 60, 80 y 100 ppm en negras). Con 3 estrellas en un tempo se propone el siguiente. Una escala está **dominada** al conseguir 2 estrellas o más en el tempo objetivo.

**Técnica: independencia de manos**

- **FR-017**: El camino Técnica de los niveles 2 a 4 MUST incluir ejercicios de independencia de manos con dificultad creciente:
  - Nivel 2: la mano izquierda mantiene notas largas mientras la derecha toca la melodía.
  - Nivel 3: las dos manos se mueven con figuras distintas (por ejemplo, blancas contra negras).
  - Nivel 4: ritmos distintos en cada mano y escalas a dos manos.
  - Al menos 2 ejercicios por nivel.
- **FR-018**: Los ejercicios de independencia MUST exigir teclado MIDI (constitución 1.1.0, Principio III):
  - Sin MIDI se ven y se pueden escuchar, pero no se pueden empezar en Aprender ni Tocar.
  - Un aviso explica por qué y cómo conectar un teclado.
  - Si el teclado se conecta, el ejercicio se puede empezar sin salir.
- **FR-019**: Los ejercicios de independencia MUST NOT ser requisito para abrir niveles, superar pruebas ni completar el avance de un camino sin MIDI (FR-004, FR-006).
- **FR-020**: Si el teclado MIDI se desconecta durante un ejercicio de independencia, el intento MUST detenerse sin puntuar y mostrar el aviso.

**Contenido de los niveles 3 y 4**

- **FR-021**: Los niveles 3 y 4 MUST tener cada uno entre 4 y 6 lecciones nuevas y entre 3 y 4 consejos nuevos, con el formato del Curso actual (explicación de 1–2 pantallas, ejercicio puntuado, ilustración o icono en los consejos). Temas orientativos:
  - **Nivel 3**: dos manos a la vez, el compás de 3/4, armaduras (Sol y Fa mayor), el pedal de resonancia y las ligaduras.
  - **Nivel 4**: el 6/8, las semicorcheas, el contrapunto sencillo y la lectura en dos claves a la vez.
- **FR-022**: Habrá una prueba para los niveles 2, 3 y 4, con un ejercicio por tema trabajado en el nivel anterior y 2 estrellas en todos para superarla:
  - **Nivel 2**: la prueba actual de la unidad 2.
  - **Niveles 3 y 4**: pruebas nuevas. La del nivel 3 MUST incluir un ejercicio de acordes con la mano izquierda.
  - La prueba actual de la unidad 3 se retira.
- **FR-023**: Las lecciones, consejos y piezas‑hito actuales MUST conservarse. La unidad 1 pasa a ser el nivel 1, y las unidades 2 y 3 (incluidas las lecciones de mano izquierda y acordes) forman el nivel 2.

**Conservación y coherencia**

- **FR-024**: Todo el progreso guardado del Curso (estrellas de lecciones y pruebas, consejos vistos, unidades saltadas por prueba y último elemento practicado) MUST conservarse al actualizar, y los niveles abiertos MUST reflejarlo.
- **FR-025**: Los intentos de escalas y de independencia de manos MUST registrarse en el historial (011) como intentos del Curso, con su ficha propia.
- **FR-026**: Todas las pantallas nuevas MUST respetar notación, nombres, tema y la regla de móvil apaisado sin desplazamiento (Principio IV). Las escalas y los ejercicios de técnica, salvo los de independencia, MUST funcionar con el teclado en pantalla (Principio III).

### Key Entities *(include if feature involves data)*

- **Nivel**: del 1 al 4. Tiene un estado (bloqueado o abierto), tres caminos, una prueba de nivel opcional (para saltarlo) y un avance por camino.
- **Camino**: Lecciones, Técnica o Canciones. Tiene una lista ordenada de elementos (orden sugerido) y un avance.
- **Elemento de técnica**: una escala (tonalidad, mano, tres tempos, digitación) o un ejercicio de independencia (dos manos, exige MIDI). Su estado es sin empezar, en progreso (con el tempo alcanzado) o dominado.
- **Recomendación**: el elemento propuesto, su camino, el motivo y lo practicado recientemente en que se basa.
- **Progreso del Curso** (existente, ampliado): estrellas por elemento, consejos vistos, niveles abiertos por prueba, tempo alcanzado por escala y últimos elementos practicados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde el Curso, el alumno empieza a practicar el «Siguiente recomendado» con un solo toque, y cualquier elemento de un nivel abierto con 2 toques como mucho.
- **SC-002**: Tras actualizar, el 100 % de los alumnos con progreso en el Curso anterior conservan sus estrellas, consejos vistos y unidades saltadas, y tienen abiertos al menos los niveles que ya podían practicar.
- **SC-003**: Sin teclado MIDI, es posible abrir los niveles 1 a 4 completando solo lecciones o pruebas; ningún ejercicio que exige MIDI es necesario.
- **SC-004**: En una sesión de 6 elementos siguiendo siempre la recomendación, se practican al menos 2 caminos distintos.
- **SC-005**: Cada nivel ofrece al menos 2 escalas (por mano) y, del nivel 2 en adelante, al menos 2 ejercicios de independencia; los niveles 3 y 4 tienen al menos 4 lecciones y 3 consejos cada uno.
- **SC-006**: La digitación mostrada en el 100 % de las escalas es la estándar de cada tonalidad y mano.
- **SC-007**: En una prueba con 5 personas que empiezan, al menos 4 saben decir, sin ayuda, qué les recomienda la app y por qué, y cómo cambiar de camino.

## Assumptions

- **Correspondencia de unidades y niveles** (FR-023): quien saltó unidades con cualquiera de las pruebas actuales (unidad 2 o unidad 3) tiene abiertos los niveles 1 y 2. Sus estrellas en la prueba retirada se conservan, aunque ya no se muestran.
- **Repertorio**: las piezas del repertorio incluido ya tienen nivel 1–4, que se usa tal cual. Si un nivel tiene pocas piezas, el camino Canciones muestra las que haya.
- **Ejercicios a dos manos**: los ejercicios de independencia y las escalas a dos manos del nivel 4 son la única técnica que exige MIDI. Las escalas por mano separada funcionan con el teclado en pantalla.
- **Pruebas de nivel**: siguen el modelo actual (un ejercicio por tema, 2 estrellas en todos) y no incluyen ejercicios que exijan MIDI.
- **Sesión del día**: la recomendación tiene en cuenta los últimos elementos practicados, pero no se planifica una «sesión del día» cerrada (posible mejora futura).
- **Historial**: los intentos de técnica se guardan en el historial existente. Las estadísticas por camino quedan para la v0.8.
- **Escalas menores**: se usan en su forma armónica, la habitual en métodos para principiantes.
- **Contenido nuevo**: lo escriben y revisan personas antes de publicarse, como el del Curso actual. Esta especificación fija la cantidad y los temas, no los textos.

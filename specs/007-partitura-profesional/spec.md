# Feature Specification: Partitura profesional (acordes, ligaduras y armaduras)

**Feature Branch**: `007-partitura-profesional`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Partitura con motor profesional (VexFlow) cuando el repertorio lo necesite: ligaduras, acordes, armaduras..."

## Contexto

La partitura de la lección está dibujada a mano por la app y solo sabe mostrar lo que necesitaba
el primer repertorio:

- Cada mano toca **una nota cada vez**: no hay acordes dentro de una mano.
- No hay **ligaduras**: una nota no puede cruzar la barra de compás ni sumar duraciones que no
  tengan figura propia (por ejemplo, negra + corchea ligadas).
- No hay **armaduras**: las alteraciones se escriben nota a nota, aunque la pieza esté en Sol
  mayor o en Re menor.
- Las duraciones son corchea, negra, blanca y redonda (con o sin puntillo), en 4/4, 3/4 y 2/4.

Por eso el repertorio de los niveles 3 y 4 está simplificado («Preludio en Do» como arpegios a una
nota, «Minueto en Sol» con cada Fa sostenido escrito) y la importación de MIDI y MusicXML (006)
reduce los acordes a una nota y corta las notas en la barra. La hoja de ruta (v0.5) prevé pasar a
un motor de partituras profesional para poder ampliar el repertorio con piezas reales. En 006 se
decidió guardar el archivo original de cada importada precisamente para poder mostrarla completa
más adelante sin reimportarla.

## Clarifications

### Session 2026-11-24

- Q: ¿La nueva partitura se usa para todas las piezas o solo para las que tienen acordes,
  ligaduras o armadura? → A: Para todas. Una sola partitura en toda la app; las 12 piezas actuales
  pasan a dibujarse con ella (FR-021, historia 4).
- Q: ¿Qué pasa con las piezas importadas, que hoy están simplificadas? → A: El alumno elige entre
  versión simplificada y versión completa (convertida de nuevo desde el original guardado), por
  pieza y en cualquier momento. Cada versión guarda sus propias estrellas (FR-019, historia 5).
- Q: ¿Se amplía también el ritmo? → A: Sí: semicorcheas, tresillos y compás de 6/8, además de
  acordes, ligaduras y armaduras (FR-020, historia 6).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Practicar piezas con acordes (Priority: P1)

El alumno abre una pieza en la que una mano toca acordes (por ejemplo, la izquierda con acordes
de tres notas en cada compás). La partitura muestra las notas del acorde apiladas en una misma
plica, cada una con su nombre y su dedo si están activados. En Escuchar suenan juntas; en Aprender
la lección espera a que el alumno toque todas las notas del acorde; en Tocar el acorde cuenta como
acierto si toca todas sus notas a tiempo.

**Why this priority**: los acordes son lo que más limita el repertorio a partir del nivel 3 y lo
que más se simplifica al importar. Sin ellos no hay piezas reales a dos manos.

**Independent Test**: abrir una pieza de prueba con acordes de 2 y 3 notas en la mano izquierda y
completar Escuchar, Aprender y Tocar con el teclado en pantalla y con un teclado MIDI.

**Acceptance Scenarios**:

1. **Given** una pieza con un acorde Do–Mi–Sol en la mano izquierda, **When** se abre la lección,
   **Then** las tres notas aparecen apiladas en el mismo instante, con una sola plica, y cada una
   con su nombre y su dedo (5, 3, 1) si esas opciones están activadas.
2. **Given** el paso Aprender en ese acorde, **When** el alumno toca Do y Mi pero aún no Sol,
   **Then** la lección sigue esperando, Do y Mi se marcan como tocadas y Sol sigue resaltada como
   pendiente.
3. **Given** el paso Tocar, **When** el alumno toca las tres notas dentro del margen de tiempo de
   ese acorde, **Then** el acorde cuenta como un acierto; si falta alguna, cuenta como fallo y la
   nota que faltó se marca como fallada.
4. **Given** el paso Escuchar, **When** llega el acorde, **Then** suenan sus notas a la vez y se
   iluminan a la vez en el teclado en pantalla.

---

### User Story 2 - Leer piezas con armadura (Priority: P1)

El alumno abre una pieza en Sol mayor. Al principio de cada línea de la partitura aparece la
armadura (un sostenido en Fa) y los Fa se escriben sin alteración propia; solo llevan alteración
las notas que se apartan de la armadura, y un becuadro cuando hace falta anular una alteración
anterior del mismo compás. Los nombres de las notas siguen diciendo «Fa♯».

**Why this priority**: es como se escribe la música real; sin armaduras el alumno no aprende a
leer partituras que encontrará fuera de la app, y las piezas con muchas alteraciones se ven
recargadas.

**Independent Test**: abrir «Minueto en Sol» con su armadura de un sostenido y comprobar que se
ve como en una edición impresa, con los mismos sonidos y nombres que hoy.

**Acceptance Scenarios**:

1. **Given** una pieza en Sol mayor, **When** se abre la lección, **Then** se ve la armadura de un
   sostenido y los Fa♯ no llevan sostenido propio.
2. **Given** un compás de esa pieza con un Fa natural, **When** se dibuja, **Then** ese Fa lleva
   becuadro, y un Fa♯ posterior en el mismo compás vuelve a llevar sostenido.
3. **Given** la notación C‑D‑E en Ajustes, **When** se ven los nombres de las notas, **Then** los
   Fa♯ se nombran «F♯» aunque en la partitura no lleven alteración.
4. **Given** una pieza sin armadura (Do mayor), **When** se abre, **Then** se ve como hoy.

---

### User Story 3 - Notas ligadas y ligaduras de expresión (Priority: P2)

El alumno practica una pieza en la que una nota dura más allá de la barra de compás, o una
duración que no tiene figura propia (negra ligada a corchea). La partitura la dibuja como dos
figuras unidas por una ligadura, y la lección la trata como una sola nota: se toca una vez y se
mantiene. Las ligaduras de expresión (arcos sobre varias notas distintas) se ven en la partitura
como guía de fraseo, sin cambiar lo que hay que tocar.

**Why this priority**: muchas melodías reales tienen notas que cruzan la barra o síncopas; hoy se
simplifican o no se pueden escribir. Es menos frecuente en los primeros niveles que los acordes y
las armaduras.

**Independent Test**: abrir una pieza de prueba con una blanca ligada a negra a través de la barra
y con una ligadura de expresión de cuatro notas, y completar los tres pasos.

**Acceptance Scenarios**:

1. **Given** una nota de tres pulsos que empieza en el pulso 3 de un 4/4, **When** se dibuja,
   **Then** aparece como blanca al final del compás ligada a una negra al principio del siguiente.
2. **Given** esa nota en Aprender o Tocar, **When** el alumno la toca una vez y la mantiene,
   **Then** cuenta como una sola nota acertada y la lección no espera una segunda pulsación en el
   compás siguiente.
3. **Given** una ligadura de expresión sobre cuatro notas, **When** el alumno las toca,
   **Then** cada una se evalúa como una nota normal; el arco solo se ve.

---

### User Story 4 - Las piezas de siempre siguen igual o mejor (Priority: P1)

El alumno abre cualquiera de las piezas que ya practicaba. La partitura muestra las mismas notas,
con sus nombres, dedos y colores (pendiente, acierto, fallo, tocada por la app), el cursor avanza
igual de fluido, se puede elegir un fragmento tocando la partitura para el bucle y, en móvil
apaisado, partitura y teclado caben sin desplazar la página. Sus estrellas y su progreso se
conservan.

**Why this priority**: cambiar cómo se dibuja la partitura no puede romper la práctica que ya
funciona (Principios II y IV de la constitución).

**Independent Test**: recorrer las 12 piezas del repertorio en escritorio y en móvil apaisado, en
tema claro y oscuro, con nombres y dedos activados y desactivados, y practicar un fragmento en
bucle en cada una.

**Acceptance Scenarios**:

1. **Given** cualquier pieza del repertorio actual, **When** se abre, **Then** muestra las mismas
   notas, duraciones, nombres y dedos que antes del cambio.
2. **Given** el paso Tocar, **When** el alumno acierta o falla una nota, **Then** su color cambia
   al momento, como hoy.
3. **Given** un móvil en horizontal (640 × 320), **When** se abre una lección, **Then** partitura y
   teclado caben sin desplazar la página y la partitura se desplaza con el cursor.
4. **Given** el tema oscuro, **When** se abre una lección, **Then** pentagramas, figuras y textos
   se leen con el contraste del tema.
5. **Given** la app instalada y sin conexión, **When** se abre una lección, **Then** la partitura
   se dibuja igual que con conexión.

---

### User Story 5 - Elegir la versión completa de una pieza importada (Priority: P3)

El alumno importó una pieza con acordes y notas que cruzan la barra, y la app la simplificó (006).
Ahora puede elegir, para esa pieza, entre la **versión simplificada** (la de siempre) y la
**versión completa**, convertida de nuevo desde el archivo original que se guardó al importarla,
con sus acordes, ligaduras, armadura y ritmo. Puede cambiar de versión cuando quiera; cada versión
conserva sus propias estrellas. Al importar una pieza nueva, el resumen ofrece las dos versiones.

**Why this priority**: aprovecha lo anterior para las piezas importadas, pero depende de que las
historias 1–3 y 6 funcionen.

**Independent Test**: importar una pieza con acordes y armadura, practicar la versión simplificada
y la completa, cambiar entre ellas y comprobar que cada una conserva sus estrellas.

**Acceptance Scenarios**:

1. **Given** una pieza importada antes de este cambio, **When** el alumno la abre, **Then** sigue
   en la versión simplificada, con sus estrellas, y puede pasar a la versión completa desde las
   opciones de la pieza.
2. **Given** una importada en versión completa, **When** se abre la lección, **Then** se practica
   con sus acordes, ligaduras, armadura y ritmo originales.
3. **Given** una pieza con 2 estrellas en la versión simplificada y ninguna en la completa,
   **When** el alumno cambia a la completa, **Then** la tarjeta muestra 0 estrellas; al volver a la
   simplificada vuelve a mostrar 2.
4. **Given** el resumen de importación de un archivo nuevo, **When** la pieza tiene contenido que
   habría que simplificar, **Then** el resumen ofrece «Versión completa» (marcada por defecto) y
   «Versión simplificada», con el nivel sugerido y los avisos de cada una.
5. **Given** una pieza cuya versión completa no se puede obtener (contenido aún no admitido, como
   un compás de 5/4 o varias voces en una mano), **When** el alumno la importa o intenta cambiar de
   versión, **Then** solo se ofrece la simplificada y se explica por qué.

---

### User Story 6 - Semicorcheas, tresillos y compás de 6/8 (Priority: P2)

El alumno practica piezas con ritmos más ricos: semicorcheas (también corchea con puntillo y
semicorchea), tresillos de corchea y de negra, y piezas en 6/8. La partitura los escribe como en
una edición impresa (barras agrupadas por pulsos, el «3» del tresillo) y la lección los toca y los
evalúa a su hora exacta. En 6/8 el pulso es la negra con puntillo: dos pulsos por compás, el
metrónomo marca cada uno y el tempo se indica en negras con puntillo por minuto.

**Why this priority**: muchas piezas reales de nivel 3–4 y canciones populares (barcarolas,
canciones de cuna, gigas) usan estos ritmos; hoy se aproximan o se rechazan al importar.

**Independent Test**: abrir una pieza de prueba en 6/8 con tresillos y semicorcheas y completar los
tres pasos con el metrónomo activado.

**Acceptance Scenarios**:

1. **Given** una pieza en 6/8, **When** se abre la lección, **Then** el compás se ve como 6/8, las
   corcheas se agrupan de tres en tres y el metrónomo suena dos veces por compás, más fuerte en la
   primera.
2. **Given** un tresillo de corcheas en un 4/4, **When** se dibuja, **Then** aparecen tres corcheas
   unidas con un «3», y en Tocar cada una se espera a un tercio de pulso de la anterior.
3. **Given** una corchea con puntillo y una semicorchea, **When** el alumno las toca en Tocar,
   **Then** se evalúan a 0,75 y 0,25 pulsos, con el mismo margen de acierto que hoy (limitado para
   no solaparse con la nota siguiente).
4. **Given** el control de tempo de una pieza en 6/8, **When** el alumno lo cambia, **Then** el
   valor se muestra en negras con puntillo por minuto.

---

### Edge Cases

- **Acorde con el teclado en pantalla y ratón**: con un ratón no se pueden pulsar varias teclas a
  la vez. Las notas de un acorde se pueden tocar una tras otra: en Aprender se acumulan hasta
  completar el acorde; en Tocar valen si todas caen dentro del margen de tiempo del acorde.
- **Acorde con una nota repetida en la otra mano** (las dos manos tocan el mismo Do): cada mano
  necesita su pulsación; una sola pulsación cuenta para la nota pendiente más próxima, como hoy.
- **Nota equivocada dentro de un acorde**: en Aprender se marca el error como hoy y se sigue
  esperando a las notas que faltan; en Tocar no anula las notas acertadas, pero el acorde cuenta
  como fallo si falta alguna de sus notas.
- **Ligadura que entra en un fragmento en bucle**: si el bucle empieza en un compás que continúa
  una nota ligada, esa continuación no se exige (no se puede «mantener» algo que no se tocó); el
  fragmento empieza en la primera nota que comienza dentro de él.
- **Ligadura que sale de un fragmento en bucle**: la nota se toca al final del fragmento y la
  repetición empieza a su hora, aunque la nota escrita siga sonando en el compás siguiente.
- **Armadura con muchas alteraciones** (hasta 7 sostenidos o bemoles): se dibuja completa sin
  tapar la primera nota, también en móvil apaisado.
- **Cambio de armadura a mitad de pieza**: se muestra en el compás en que cambia, con los
  becuadros de anulación que correspondan.
- **Acordes muy abiertos** (más de una octava en una mano) o con notas de segunda (Do–Re): las
  cabezas se colocan sin taparse y los nombres de nota siguen legibles.
- **Notas muy seguidas** (semicorcheas a tempo rápido): el margen de acierto de una nota no puede
  pisar el de la siguiente; si se solaparían, cada margen se recorta a la mitad de la distancia
  entre las dos notas.
- **Tresillo que no llena su pulso** (por ejemplo, corchea de tresillo + silencio de tresillo +
  corchea de tresillo): se dibuja con su silencio dentro del grupo y se evalúa igual.
- **6/8 con anacrusa, o una pieza que mezcla 6/8 y 3/4**: el cambio de compás sigue sin
  admitirse (como en 006); la anacrusa se completa con silencio al principio.
- **Cambiar de versión a mitad de una sesión**: si el alumno cambia la versión de una importada
  que era la última practicada, «Continuar» abre la versión elegida en el paso en que estaba.
- **Pieza muy larga** (300 compases, umbral de 006): la partitura se abre y se desplaza sin
  tirones, igual que hoy.

## Requirements *(mandatory)*

### Functional Requirements

**Partitura**

- **FR-001**: La partitura MUST dibujar acordes dentro de una mano (2 o más notas que empiezan a
  la vez con la misma duración) con las cabezas apiladas en una misma plica, colocadas sin taparse
  aunque haya intervalos de segunda.
- **FR-002**: La partitura MUST dibujar la armadura de la pieza al principio de cada sistema y
  donde cambie, para tonalidades de hasta 7 sostenidos o 7 bemoles, y escribir las alteraciones
  accidentales según las reglas habituales: solo cuando la nota se aparta de la armadura o de una
  alteración anterior en el mismo compás, con becuadro para anularla.
- **FR-003**: La partitura MUST dibujar las ligaduras de prolongación entre figuras de la misma
  altura, también a través de la barra de compás, y descomponer cualquier duración en figuras
  ligadas cuando no tenga figura propia o cruce la barra.
- **FR-004**: La partitura MUST dibujar ligaduras de expresión sobre un grupo de notas cuando la
  pieza las indique.
- **FR-005**: La partitura MUST seguir mostrando todo lo que muestra hoy: clave de sol y de fa,
  compás, silencios, nombres de nota con la notación de Ajustes (incluidas las alteraciones que
  vienen de la armadura), dedos, colores de estado de cada nota, cursor, fragmento en bucle
  resaltado y selección de compases tocando la partitura.
- **FR-006**: En móvil apaisado, la partitura MUST caber con el teclado sin desplazar la página
  (como en 005) y en el tema oscuro MUST usar los colores del tema.
- **FR-007**: La partitura MUST funcionar sin conexión en la app instalada.
- **FR-007a**: La partitura MUST dibujar semicorcheas (y corchea con puntillo + semicorchea),
  tresillos de corchea y de negra (con su «3» y su silencio interior si lo hay) y el compás de 6/8,
  agrupando las barras por pulsos (de dos en dos corcheas en 2/4, 3/4 y 4/4; de tres en tres en
  6/8).

**Práctica**

- **FR-008**: En Escuchar, las notas de un acorde MUST sonar e iluminarse a la vez.
- **FR-009**: En Aprender, la lección MUST esperar a que se hayan tocado todas las notas de un
  acorde, en cualquier orden y no necesariamente a la vez, antes de avanzar; cada nota tocada se
  marca en cuanto se toca.
- **FR-010**: En Tocar, un acorde MUST contar como acierto solo si todas sus notas se tocan dentro
  del margen de tiempo que hoy se aplica a una nota; cada nota del acorde se marca como acertada o
  fallada por separado.
- **FR-011**: Una nota con ligadura de prolongación MUST tratarse como una sola nota: se toca una
  vez y su duración es la suma de las figuras ligadas. Las ligaduras de expresión MUST NOT cambiar
  lo que se evalúa.
- **FR-012**: El bucle de compases MUST seguir funcionando con acordes y ligaduras, con las reglas
  de los casos límite para las notas ligadas que entran o salen del fragmento.
- **FR-012a**: En 6/8 el pulso MUST ser la negra con puntillo: dos pulsos por compás, el
  metrónomo suena en cada pulso con acento en el primero, y el tempo se muestra y se ajusta en
  negras con puntillo por minuto. En 2/4, 3/4 y 4/4 nada cambia.
- **FR-012b**: Las notas de semicorchea y de tresillo MUST esperarse y evaluarse a su hora exacta,
  con el margen de acierto de hoy recortado, si hace falta, para que no se solape con el de la
  nota siguiente de la misma mano.
- **FR-013**: La puntuación y las estrellas MUST calcularse de forma que una pieza sin acordes ni
  ligaduras dé exactamente el mismo resultado que hoy; en una pieza con acordes, cada acorde cuenta
  como un acierto o un fallo.
- **FR-014**: La digitación sugerida MUST asignar un dedo distinto a cada nota de un acorde en la
  misma mano, de forma tocable (pulgar en la nota más aguda de la izquierda y en la más grave de la
  derecha cuando el acorde cabe en la mano).

**Repertorio y datos**

- **FR-015**: La definición de una pieza MUST poder expresar acordes, ligaduras de prolongación,
  ligaduras de expresión, armadura (con sus cambios), semicorcheas, tresillos y compás de 6/8, y las 12 piezas actuales MUST seguir
  siendo válidas sin reescribirlas.
- **FR-016**: Al menos «Minueto en Sol» MUST pasar a usar su armadura, y el repertorio MUST incluir
  al menos una pieza con acordes en una mano, una con notas ligadas a través de la barra y una en
  6/8 o con tresillos y semicorcheas, de dominio público, para que las nuevas posibilidades se usen y se prueben.
- **FR-017**: La validación automática del repertorio MUST cubrir las nuevas posibilidades: las
  notas de un acorde están en la misma mano y tienen la misma duración, las ligaduras unen notas de
  la misma altura y consecutivas, y cada mano sigue llenando compases completos.
- **FR-018**: El progreso guardado (estrellas, última sesión, fragmentos) MUST conservarse para
  todas las piezas existentes, incluidas las importadas.

**Piezas importadas**

- **FR-019**: Cada pieza importada MUST tener una versión simplificada (la de 006) y, si el
  original se puede convertir sin simplificar, una versión completa con acordes, ligaduras,
  armadura y ritmo. El alumno MUST poder elegir la versión de cada pieza desde sus opciones en
  Canciones y cambiarla cuando quiera; la elección se recuerda.
- **FR-019a**: Las piezas importadas antes de este cambio MUST seguir en la versión simplificada
  hasta que el alumno elija otra. Al importar una pieza nueva, el resumen MUST ofrecer las dos
  versiones (la completa marcada por defecto), cada una con su nivel sugerido y sus avisos; si las
  dos son iguales (nada que simplificar), solo se muestra una.
- **FR-019b**: Cada versión MUST guardar sus propias estrellas; la tarjeta de la pieza y «Continuar»
  usan la versión elegida. Las importadas siguen sin contar en los totales de Inicio y Progreso
  (006, FR-019).
- **FR-019c**: Si el original no se puede convertir sin simplificar (contenido aún no admitido:
  compases distintos de 2/4, 3/4, 4/4 y 6/8, cambios de compás, varias voces en una mano), MUST
  ofrecerse solo la simplificada, explicando el motivo.
- **FR-020**: La importación MUST aceptar también el compás de 6/8, y la versión completa MUST
  conservar semicorcheas y tresillos en lugar de ajustarlos; la versión simplificada se sigue
  obteniendo como en 006 (en 6/8, con las mismas reglas de simplificación de acordes y duraciones).

**Alcance de la nueva partitura**

- **FR-021**: La nueva partitura MUST usarse para todas las piezas (incluidas e importadas, en
  cualquier versión); la partitura actual se retira cuando las 12 piezas del repertorio pasen la
  historia 4.

### Key Entities

- **Pieza** (definición del repertorio o importada): título, nivel, tempo, compás, armadura (y sus
  cambios), una o dos manos. Cada mano es una sucesión de **eventos** en el tiempo.
- **Evento**: un silencio, una nota o un acorde, con su duración (incluidas semicorcheas y
  duraciones de tresillo); puede estar ligado al siguiente (prolongación), pertenecer a una
  ligadura de expresión y a un grupo de tresillo.
- **Acorde**: dos o más alturas que empiezan a la vez en la misma mano con la misma duración; se
  evalúa como una unidad pero cada altura se marca por separado.
- **Armadura**: número de sostenidos o bemoles (−7 a +7) desde un compás dado.
- **Ligadura de expresión**: grupo de eventos consecutivos de una mano unidos por un arco; solo
  visual.
- **Versión de una pieza importada**: simplificada o completa, cada una con su definición, su nivel
  sugerido, sus avisos y sus estrellas; la pieza recuerda cuál eligió el alumno.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Las 12 piezas actuales se practican en los tres pasos con las mismas notas, nombres,
  dedos y puntuación que antes del cambio (12 de 12), comprobado con los tests del repertorio y una
  revisión a mano.
- **SC-002**: Un alumno completa Aprender y Tocar de una pieza con acordes de tres notas usando
  solo el teclado en pantalla con ratón, y también con un teclado MIDI.
- **SC-003**: Comparadas con una edición impresa de referencia, las piezas con armadura, acordes y
  ligaduras del repertorio no tienen errores de notación (alteraciones de más o de menos, ligaduras
  mal unidas, cabezas que se tapan): 0 errores en la revisión.
- **SC-004**: Al abrir una lección en un móvil de gama media, la partitura aparece en menos de 1 s
  en una pieza de hasta 100 compases y en menos de 2 s en una de 300.
- **SC-005**: La respuesta a una nota (pulsación → sonido y marca en la partitura) sigue siendo
  inmediata (< 50 ms) y el cursor avanza sin tirones en esas mismas piezas.
- **SC-006**: En móvil apaisado (640 × 320) partitura y teclado caben sin desplazar la página en el
  100 % de las piezas del repertorio.
- **SC-007**: Una pieza en 6/8 con tresillos y semicorcheas se completa en Tocar con 3 estrellas
  tocándola a tempo, y el metrónomo marca dos pulsos por compás.
- **SC-008**: En las piezas importadas, cambiar de versión conserva las estrellas de cada una (0
  pérdidas en la prueba) y las piezas importadas antes del cambio siguen abriéndose en su versión
  simplificada.

## Assumptions

- El usuario propone VexFlow como motor de partituras; elegir y justificar la dependencia
  corresponde al plan (constitución, Principio V). La especificación describe lo que se tiene que
  ver y tocar, no cómo se dibuja.
- El motor de lección sigue sin depender de cómo se dibuja la partitura (Principio I): acordes y
  ligaduras se modelan en los datos de la pieza y en el motor, y la partitura solo los muestra.
- El margen de tiempo de acierto, el teclado en pantalla y la conexión MIDI no cambian; un acorde
  aplica el margen actual a cada una de sus notas.
- Los compases admitidos pasan a ser 2/4, 3/4, 4/4 y 6/8; otros (5/4, 9/8, 12/8, 2/2) y los
  cambios de compás siguen fuera. Fusas, quintillos y otros grupos irregulares también.
- Quedan fuera: pedal sustain (otra entrada de la hoja de ruta v0.5), dinámicas, articulaciones
  (staccato, acentos), adornos, repeticiones y casillas de 1.ª/2.ª vez, cambios de clave a mitad
  de pieza y varias voces dentro de una misma mano (por ejemplo, una melodía con notas largas
  sobre un acompañamiento en la misma mano).
- Ampliar el repertorio por niveles es otra entrada de la hoja de ruta; aquí solo se añaden o
  adaptan las piezas mínimas que exige FR-016.
- Las piezas incluidas siguen siendo de dominio público (Principio V).

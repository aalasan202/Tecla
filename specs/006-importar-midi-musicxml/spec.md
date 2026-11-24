# Feature Specification: Importar canciones MIDI y MusicXML

**Feature Branch**: `006-importar-midi-musicxml`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "Importar MIDI y MusicXML para no escribir las notas a mano. El usuario puede importar la canción desde el menú de canciones, y se realizarán una serie de comprobaciones antes de meter la canción en la lista: por ejemplo que el fichero no esté corrupto, que se puedan leer bien todas las notas, sea para piano (mano izquierda y derecha), y se sugerirá un nivel de dificultad en función de la complejidad de la pieza. En un futuro se podrá importar la canción de un servidor, pero esta funcionalidad no se va a implementar aún, solo dejar el botón en la interfaz desahabilitado. Si la pieza es muy compleja avisar al usuario que puede haber problemas de rendimiento."

## Contexto

Hoy el repertorio son 12 piezas escritas a mano dentro de la app, nota a nota. Ampliarlo es
lento y el alumno no puede practicar una pieza que no esté incluida. MIDI y MusicXML son los
formatos más comunes para compartir partituras y los exportan casi todos los editores de
partituras y secuenciadores.

La práctica actual tiene límites que condicionan qué se puede importar:

- Cada mano toca **una nota cada vez** (sin acordes dentro de la misma mano).
- Las duraciones que se dibujan son corchea, negra, negra con puntillo, blanca, blanca con
  puntillo y redonda, además de los silencios.
- El repertorio incluido usa compases de **4/4 y 3/4**, y no hay armaduras: las alteraciones se ven
  nota a nota. El motor y la partitura funcionan con cualquier número de negras por compás, así que
  **2/4** también se puede practicar sin cambios en ellos.
- Una pieza es de una mano (derecha) o de dos manos (derecha e izquierda, un pentagrama cada una).
- Los niveles van del 1 al 4, cada uno con su descripción en la pantalla de Canciones.

## Clarifications

### Session 2026-11-20

- Q: ¿Qué se hace con el contenido que la práctica aún no representa (acordes en una mano,
  semicorcheas, tresillos, otros compases)? → A: En esta versión se simplifica y se avisa
  (FR-010). Cuando la partitura use un motor profesional (VexFlow, v0.5), se podrá admitir de
  forma opcional el contenido más complejo sin simplificarlo.
- Q: Si un archivo trae las dos manos mezcladas en una sola pista o pentagrama, ¿cómo se
  importa? → A: Se reparten por altura: desde el Do central hacia arriba, mano derecha; por
  debajo, izquierda. Si todas caen de un lado, queda a una mano. El resumen lo avisa (FR-008).
  Precisión del plan: solo se reparte si la pista tiene notas simultáneas; una melodía se queda
  en la mano derecha aunque baje del Do central.
- Q: ¿Se guarda el archivo original de cada pieza importada o solo la versión simplificada? →
  A: Se guardan los dos, para poder ofrecer la versión completa con VexFlow sin reimportar (FR-013).
- Q: En Inicio y en Progreso, ¿las piezas importadas cuentan en los totales (número de piezas,
  estrellas sobre el máximo)? → A: No; los totales se refieren solo al repertorio incluido. Las
  importadas guardan sus estrellas, pero no suman (FR-019).

### Session 2026-11-24

- Q: ¿Se admiten piezas en compás de 2/4 (marchas, polcas, muchas canciones infantiles)? → A: Sí.
  Se aceptan 4/4, 3/4 y 2/4; siguen rechazándose los compases con denominador distinto de 4
  (2/2, 6/8…) y los cambios de compás (FR-010). En 2/4 la nota más larga es la blanca: lo que
  dure más se corta en la barra con el aviso habitual. El 2/4 no sube el nivel sugerido: es tan
  sencillo de contar como el 4/4 (FR-006).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Importar una pieza de piano y practicarla (Priority: P1)

El alumno tiene un archivo MIDI o MusicXML de una pieza de piano sencilla (por ejemplo,
descargado de un sitio de partituras libres). Desde Canciones pulsa «Importar archivo», lo
elige, y la app lo comprueba y le muestra un resumen: título, una o dos manos, compás, tempo,
número de compases y de notas, y el nivel sugerido. El alumno puede cambiar el título y el nivel
y pulsa «Añadir». La pieza aparece en la lista, en su nivel, marcada como importada, y se
practica con los tres pasos (Escuchar, Aprender, Tocar) igual que las incluidas.

**Why this priority**: es el objetivo de la funcionalidad: añadir piezas sin escribirlas a mano.

**Independent Test**: importar un MusicXML de dos pentagramas en 4/4 con solo negras y blancas,
añadirlo y completar los tres pasos con las dos manos; luego cerrar y volver a abrir la app y
comprobar que la pieza sigue en la lista con su progreso.

**Acceptance Scenarios**:

1. **Given** la pantalla de Canciones, **When** el alumno pulsa «Importar archivo» y elige un
   archivo válido, **Then** ve un resumen de la pieza con el nivel sugerido antes de añadirla.
2. **Given** el resumen, **When** pulsa «Añadir», **Then** la pieza aparece en la lista dentro
   del nivel elegido, con la marca «Importada», y se abre como cualquier otra lección.
3. **Given** el resumen, **When** pulsa «Cancelar», **Then** no se añade nada.
4. **Given** una pieza importada, **When** se practica, **Then** partitura, teclado, digitación
   sugerida, bucle, estrellas, progreso y ajustes (notación, nombres, dedos, tema) funcionan como
   en las piezas incluidas.
5. **Given** una pieza importada, **When** se cierra y vuelve a abrir la app (también sin
   conexión), **Then** la pieza sigue en la lista con sus estrellas.

---

### User Story 2 - Saber por qué un archivo no se puede importar (Priority: P1)

El alumno elige un archivo que no sirve: está dañado, no es MIDI ni MusicXML, no tiene notas, o
no es una pieza de piano. La app no añade nada y le explica en español, sin jerga técnica, qué
ha fallado y, si es posible, qué puede hacer.

**Why this priority**: sin comprobaciones, un archivo malo rompería la lección o enseñaría mal la
pieza (Principio II); es tan importante como importar.

**Independent Test**: probar con un archivo de texto renombrado a `.mid`, un MusicXML cortado a la
mitad, un MIDI vacío y un MIDI de orquesta; en los cuatro casos aparece un mensaje claro y la
lista no cambia.

**Acceptance Scenarios**:

1. **Given** un archivo dañado o de otro formato, **When** se intenta importar, **Then** la app
   dice «El archivo no se puede leer» (o equivalente) y no añade nada.
2. **Given** un archivo válido sin notas, **When** se importa, **Then** la app avisa de que no
   contiene notas.
3. **Given** un archivo de varios instrumentos o de un instrumento que no es piano, **When** se
   importa, **Then** la app explica que solo acepta piezas de piano (ver FR-008).
4. **Given** un archivo con notas que no se pueden leer bien (fuera del teclado del piano,
   duraciones o compases que la app no representa), **When** se importa, **Then** se aplica lo
   indicado en FR-010 y el alumno sabe qué partes de la pieza se ven afectadas.

---

### User Story 3 - Aviso de pieza demasiado compleja (Priority: P2)

El alumno importa una pieza muy larga o muy densa. Antes de añadirla, el resumen le avisa de que
puede ir lenta en su dispositivo y le deja añadirla igualmente o cancelar.

**Why this priority**: la pieza sigue siendo útil, pero el alumno debe saber por qué podría
notar retrasos (la respuesta a cada nota debe ser inmediata según la constitución).

**Independent Test**: importar un MIDI de piano de más de 300 compases; el resumen muestra el
aviso de rendimiento y deja elegir entre «Añadir igualmente» y «Cancelar».

**Acceptance Scenarios**:

1. **Given** una pieza que supera el umbral de complejidad, **When** se muestra el resumen,
   **Then** aparece un aviso de posibles problemas de rendimiento.
2. **Given** ese aviso, **When** el alumno elige añadirla, **Then** se añade como las demás.
3. **Given** una pieza por debajo del umbral, **When** se muestra el resumen, **Then** no hay aviso.

---

### User Story 4 - Gestionar las piezas importadas (Priority: P3)

El alumno quiere quitar una pieza importada que ya no usa, o corregir su título o su nivel.

**Why this priority**: evita que la lista se llene de pruebas, pero no impide practicar.

**Independent Test**: borrar una pieza importada (con confirmación) y comprobar que desaparece de
la lista y del progreso; cambiar el nivel de otra y verla en su nuevo nivel.

**Acceptance Scenarios**:

1. **Given** una pieza importada, **When** el alumno la borra y confirma, **Then** desaparece de
   la lista, de «Continuar» y de su progreso.
2. **Given** una pieza importada, **When** cambia su título o su nivel, **Then** la lista lo
   refleja y se conservan sus estrellas.
3. **Given** una pieza importada con estrellas, **When** se añade o se borra, **Then** el número
   de piezas y las estrellas totales de Inicio y Progreso no cambian.
4. **Given** una pieza incluida en la app, **Then** no se puede borrar ni editar.

---

### User Story 5 - Importar desde servidor, deshabilitado (Priority: P3)

En Canciones, junto a «Importar archivo», hay un botón «Importar de servidor» deshabilitado con
una indicación de que llegará más adelante.

**Why this priority**: solo prepara la interfaz; no aporta función todavía.

**Independent Test**: el botón se ve, se distingue como no disponible, al tocarlo no hace nada y
un lector de pantalla lo anuncia como deshabilitado.

**Acceptance Scenarios**:

1. **Given** la pantalla de Canciones, **Then** se ve «Importar de servidor» deshabilitado con el
   texto «Próximamente» (o equivalente).

---

### Edge Cases

- **Anacrusa** (la pieza empieza a mitad de compás): se completa el primer compás con silencio,
  como en «Para Elisa».
- **Final incompleto o manos de distinta longitud**: se completa con silencio hasta el final del
  compás más largo.
- **Cambios de tempo o de compás a mitad de pieza**: se usa el tempo inicial; un cambio de compás
  se trata como contenido no representable (FR-010).
- **Una sola mano en archivo de dos pentagramas con uno vacío**: se importa como pieza de una mano.
- **Pieza solo para mano izquierda**: se importa como pieza de dos manos con la derecha en
  silencio.
- **Notas fuera del rango del piano (88 teclas)**: no se pueden leer; ver FR-007.
- **Nombre repetido**: se permite, pero se distingue (p. ej., «Minueto (2)»).
- **Mismo archivo importado dos veces**: se avisa de que ya existe y se puede cancelar o añadir otra copia.
- **Archivo muy grande** (más de 5 MB): se rechaza sin intentar leerlo, con un mensaje claro.
- **Almacenamiento del navegador lleno**: no se añade la pieza y se avisa; nada de lo guardado se pierde.
- **MusicXML comprimido (.mxl)** y **MusicXML con varios movimientos**: el comprimido se acepta;
  de varios movimientos se importa el primero y se avisa.
- **Móvil apaisado**: el resumen y los mensajes caben sin desplazamiento de la página o se
  desplazan dentro de su propio panel; la elección de archivo usa el selector del sistema.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla de Canciones MUST tener un botón «Importar archivo» que abre el selector
  de archivos del sistema, filtrado a MIDI (`.mid`, `.midi`) y MusicXML (`.musicxml`, `.xml`, `.mxl`).
- **FR-002**: La pantalla de Canciones MUST tener un botón «Importar de servidor» deshabilitado,
  con una indicación visible de que llegará más adelante; MUST NOT hacer nada al pulsarlo.
- **FR-003**: Antes de añadir una pieza, la app MUST comprobar, en este orden, y detenerse en el
  primer fallo con un mensaje en español que diga qué falla:
  1. que el archivo no supere el tamaño máximo;
  2. que sea un MIDI o MusicXML legible (no dañado ni de otro formato);
  3. que contenga notas;
  4. que sea una pieza de piano con una o dos manos identificables (FR-008);
  5. que todas las notas se puedan leer y representar (FR-007, FR-010).
- **FR-004**: Si el archivo supera las comprobaciones, la app MUST mostrar un resumen con: título
  (del archivo o, si no tiene, del nombre del archivo), una o dos manos, compás, tempo, número de
  compases y de notas, nivel sugerido, los avisos que haya (simplificaciones, rendimiento) y las
  acciones «Añadir» y «Cancelar».
- **FR-005**: En el resumen, el alumno MUST poder cambiar el título y el nivel (1 a 4) antes de añadir.
- **FR-006**: La app MUST sugerir un nivel del 1 al 4 a partir de la complejidad de la pieza,
  coherente con la descripción de cada nivel en Canciones:
  - Nivel 1: una mano, notas dentro de cinco teclas blancas seguidas, sin corcheas ni alteraciones.
  - Nivel 2: una mano, con saltos fuera de esa posición o corcheas.
  - Nivel 3: compás de 3/4, alteraciones o dos manos que rara vez tocan a la vez (el 2/4 no sube
    el nivel por sí solo).
  - Nivel 4: dos manos que tocan a la vez con frecuencia, o saltos grandes y pasajes rápidos.
  Se elige el nivel más alto cuyo criterio se cumpla.
- **FR-007**: Una nota MUST considerarse «no legible» si su altura está fuera de las 88 teclas del
  piano o si su duración o posición no se pueden determinar. Un archivo con notas no legibles MUST
  rechazarse indicando cuántas y en qué compases.
- **FR-008**: La app MUST aceptar como pieza de piano: un MusicXML de una parte con uno o dos
  pentagramas, o un MIDI con una o dos pistas con notas y sin instrumentos distintos del piano. Con
  dos pentagramas/pistas, el agudo es la mano derecha y el grave la izquierda.
  Con una sola pista o pentagrama que tiene notas simultáneas (las dos manos mezcladas), las
  notas MUST repartirse por altura: desde el Do central hacia arriba, mano derecha; por debajo,
  mano izquierda. Si todas caen del mismo lado, la pieza queda a una mano (o con la derecha en
  silencio, si son todas graves). El resumen MUST avisar de que las manos se han repartido
  automáticamente. Una pista o pentagrama sin notas simultáneas (una melodía) MUST importarse
  como pieza de una mano (derecha) aunque baje del Do central, como «Martinillo».
- **FR-009**: Las piezas con más de dos partes, pistas con notas o pentagramas, o con instrumentos
  que no son piano, MUST rechazarse explicando que solo se aceptan piezas de piano a una o dos manos.
- **FR-010**: El contenido que la práctica aún no representa MUST simplificarse y avisarse en el
  resumen, indicando qué se cambió y en qué compases:
  - Acordes o notas simultáneas en la misma mano: se conserva la nota más aguda en la mano
    derecha y la más grave en la izquierda.
  - Duraciones que no son corchea, negra, blanca o redonda (con o sin puntillo), incluidos
    semicorcheas y tresillos: se ajustan a la duración representable más cercana, manteniendo
    cada mano en compases completos.
  - Notas ligadas que suman una duración representable: se unen en una sola nota.
  Las piezas en compases distintos de 4/4, 3/4 y 2/4, o con cambios de compás, MUST rechazarse
  explicando el motivo, porque simplificarlas cambiaría el ritmo de toda la pieza.
  Si la simplificación afecta a más de la mitad de los compases, el resumen MUST advertir de que
  la pieza importada puede diferir bastante del original.
- **FR-011**: Si la pieza supera el umbral de complejidad (más de 300 compases o más de 1 500
  notas), el resumen MUST mostrar un aviso de que puede ir lenta en este dispositivo, y el alumno
  MUST poder añadirla igualmente o cancelar.
- **FR-012**: Una pieza añadida MUST aparecer en Canciones dentro de su nivel, con la marca
  «Importada», respetar los filtros «Una mano» / «Dos manos» y practicarse con los tres pasos,
  el bucle, la digitación sugerida y la puntuación, igual que las piezas incluidas.
- **FR-013**: Las piezas importadas MUST guardarse en el dispositivo, seguir disponibles al volver
  a abrir la app y sin conexión, y MUST NOT enviarse a ningún servidor. Junto a cada pieza MUST
  guardarse su archivo original, sin modificar, para poder convertirlo de nuevo más adelante; al
  borrar la pieza se borra también su original.
- **FR-014**: El alumno MUST poder borrar una pieza importada (con confirmación) y cambiar su
  título y nivel; al borrarla MUST eliminarse también su progreso y dejar de ofrecerse en «Continuar».
  Las piezas incluidas MUST NOT poder borrarse ni editarse.
- **FR-015**: Si el mismo archivo ya se importó, la app MUST avisar y permitir cancelar o añadir otra copia.
- **FR-016**: Si no hay espacio para guardar la pieza, la app MUST avisar y no perder nada de lo
  ya guardado.
- **FR-017**: La comprobación de un archivo MUST NOT bloquear la app: mientras se comprueba se
  muestra que está trabajando, y el alumno puede cancelar.
- **FR-018**: El resumen y los mensajes MUST usarse en escritorio, tablet y móvil apaisado, en tema
  claro y oscuro, y mostrar los nombres de nota según la notación elegida en Ajustes.
- **FR-019**: Los totales de Inicio y Progreso (número de piezas, estrellas conseguidas sobre el
  máximo posible) MUST calcularse solo con el repertorio incluido: importar o borrar una pieza
  MUST NOT cambiarlos. Las piezas importadas MUST guardar y mostrar sus propias estrellas en
  Canciones, y «Continuar» MUST poder llevar a la última pieza practicada aunque sea importada.
  El tiempo de práctica y la racha cuentan toda la práctica, también la de piezas importadas.

### Key Entities

- **Pieza importada**: una canción añadida por el alumno. Tiene identificador propio (distinto de
  los de las piezas incluidas), título, nivel (1–4), una o dos manos con sus notas y silencios,
  compás, tempo, origen (MIDI o MusicXML y nombre del archivo), el archivo original, fecha de importación, una huella del
  archivo para detectar duplicados y la lista de avisos que se mostraron al importarla.
- **Resultado de la comprobación**: o bien un motivo de rechazo (tamaño, archivo ilegible, sin
  notas, no es piano, notas no legibles, contenido no representable) con el detalle para el
  alumno, o bien la pieza propuesta con su nivel sugerido, sus métricas (compases, notas, manos,
  alteraciones, duración más corta, frecuencia con que tocan las dos manos a la vez) y sus avisos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un alumno importa y empieza a practicar una pieza de piano sencilla en menos de
  1 minuto desde que abre Canciones, sin escribir ninguna nota.
- **SC-002**: Las 12 piezas del repertorio actual, exportadas a MIDI y a MusicXML e importadas de
  nuevo, se reproducen con las mismas notas, duraciones, manos y compás que las originales.
- **SC-003**: Para esas 12 piezas, el nivel sugerido coincide con el nivel asignado a mano en al
  menos 10 de 12 y nunca se aleja más de un nivel.
- **SC-004**: El 100 % de los archivos de prueba no válidos (dañados, otro formato, vacíos, no
  piano, notas no legibles) se rechazan con un mensaje que explica el motivo, y ninguno llega a la
  lista ni provoca un error en la app.
- **SC-005**: El resumen de un archivo de hasta 300 compases aparece en menos de 2 segundos en un
  móvil de gama media.
- **SC-006**: En una pieza importada por debajo del umbral de complejidad, la respuesta a cada
  nota es tan inmediata como en las piezas incluidas (objetivo de la constitución, < 50 ms).
- **SC-007**: Las piezas importadas siguen disponibles tras cerrar la app, reiniciar el
  dispositivo y abrirla sin conexión.

## Assumptions

- Se importa un archivo cada vez; la importación de varios a la vez queda fuera de alcance.
- Tamaño máximo de archivo: 5 MB. Umbral de complejidad para el aviso de rendimiento: más de 300
  compases o más de 1 500 notas; se ajustará en el plan midiendo en un móvil de gama media.
- Del archivo se toman notas, duraciones, compás, tempo inicial y título. Se ignoran letra,
  dinámicas, pedal, articulaciones, adornos, repeticiones escritas (no se despliegan), digitación
  del archivo (la app sugiere la suya) y armadura (las alteraciones se muestran nota a nota).
- El tempo inicial se ajusta al rango de tempo que ya ofrece la lección; si no hay tempo, se usa 90.
- Los derechos de las piezas que importa cada alumno son su responsabilidad: no se publican ni
  se comparten, y la regla de dominio público de la constitución se aplica solo al repertorio
  incluido.
- Las piezas importadas se guardan en el navegador, como el progreso; no se sincronizan entre
  dispositivos (llegará con las cuentas, v1.0).
- La importación desde servidor (solo el botón deshabilitado ahora) y la partitura con motor
  profesional para acordes, ligaduras y armaduras son funcionalidades posteriores de la hoja de
  ruta. Con ese motor, la simplificación de FR-010 pasará a ser opcional a partir del archivo
  original guardado (FR-013).
- Guardar los originales ocupa espacio en el navegador: el plan elegirá un almacenamiento con
  capacidad suficiente para decenas de piezas y, si se llena, se aplica FR-016.
- Las piezas incluidas no cambian; la lista de Canciones mezcla incluidas e importadas por nivel.

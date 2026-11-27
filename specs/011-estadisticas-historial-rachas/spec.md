# Feature Specification: Estadísticas, historial y rachas

**Feature Branch**: `011-estadisticas-historial-rachas`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "Estadísticas, historial y rachas." (hoja de ruta, v0.6 · Curso y ejercicios)

## Contexto

Desde la v0.3 la app guarda, solo en el navegador: las mejores estrellas por pieza, la última
sesión (para «Continuar»), los segundos de práctica de cada día y, a partir de ahí, la racha de
días seguidos. La pantalla **Progreso** muestra hoy la racha actual, el tiempo de esta semana,
un gráfico de los últimos 7 días, el tiempo total, las estrellas de Canciones y del Curso, y la
lista de piezas y unidades.

Lo que falta:

- **Historial**: cada intento terminado se pierde. Solo queda la mejor nota, así que el alumno
  no ve si una pieza le sale cada vez mejor ni qué practicó ayer.
- **Estadísticas**: no hay una vista más allá de la última semana, ni datos por pieza (cuántas
  veces la ha tocado, cuánto ha mejorado).
- **Rachas**: solo se ve la racha actual. No hay récord, ni un calendario que muestre la
  constancia, ni un objetivo diario que dé sentido a «practicar poco y a menudo» (consejo del
  Curso).

Esta funcionalidad amplía Progreso con esas tres piezas sin cambiar cómo se practica ni cómo se
puntúa.

## Clarifications

### Session 2026-11-27

- Q: ¿Entra el objetivo diario en esta versión? → A: Sí, opcional (desactivado por defecto) y solo informativo; no cambia la regla de la racha.
- Q: ¿Cómo se organiza el contenido nuevo de Progreso? → A: En tres pestañas: Resumen (racha, calendario, estadísticas por periodo), Historial (intentos) y Piezas (listas de Canciones y Curso con su ficha).
- Q: ¿Tienen también ficha de historial las lecciones y pruebas del Curso? → A: Sí, igual que las piezas de Canciones.
- Q: ¿Qué umbral separa «poca» de «mucha» práctica en el calendario? → A: «Mucha» = objetivo diario cumplido o, sin objetivo, 10 minutos o más; «poca» = cualquier tiempo menor.
- Q: ¿Cuentan los intentos con una sola mano en la evolución y la mejora de piezas a dos manos? → A: No; solo cuentan los intentos con las dos manos (igual que las estrellas). Los de una mano aparecen en la lista del historial.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver mi historial de práctica (Priority: P1)

Quien practica termina un intento de una pieza o de una lección del Curso (paso Aprender o
Tocar) y, más tarde, abre Progreso para ver lo que ha hecho: una lista de sus intentos más
recientes con la fecha, qué tocó, en qué paso, con qué manos y qué nota sacó. Desde la ficha de
una pieza ve todos sus intentos con esa pieza y cómo ha ido cambiando la nota.

**Why this priority**: es la base de todo lo demás (las estadísticas por pieza salen del
historial) y responde a la pregunta que más motiva a quien empieza: «¿estoy mejorando?».

**Independent Test**: tocar tres veces la misma pieza en Tocar con notas distintas y una vez
otra pieza en Aprender; abrir Progreso y comprobar que aparecen los cuatro intentos, del más
reciente al más antiguo, con sus datos, y que la ficha de la primera pieza muestra sus tres
intentos y su evolución.

**Acceptance Scenarios**:

1. **Given** un alumno sin historial, **When** termina un intento en Tocar con un 82 %, **Then** en Progreso aparece ese intento con la fecha y hora, el título de la pieza, «Tocar», las manos usadas, el 82 % y sus estrellas.
2. **Given** un alumno que sale de una pieza a mitad del intento, **When** abre Progreso, **Then** ese intento no aparece en el historial (su tiempo de práctica sí cuenta, como hasta ahora).
3. **Given** una pieza a dos manos tocada en Tocar cinco veces con las dos manos y dos con la derecha sola, **When** el alumno abre su ficha, **Then** ve los siete intentos y una gráfica sencilla de la nota en Tocar a lo largo del tiempo hecha solo con los cinco de dos manos, con la mejor nota destacada.
4. **Given** un intento hecho con el bucle de compases, **When** aparece en el historial, **Then** se indica qué compases se practicaron y ese intento no entra en la gráfica de evolución de la pieza entera.
5. **Given** un intento en una lección o prueba del Curso, **When** aparece en el historial, **Then** se identifica como del Curso con el título de la lección y su unidad, y la lección tiene su propia ficha de historial como las piezas de Canciones.

---

### User Story 2 - Rachas con récord y calendario (Priority: P2)

El alumno abre Progreso y ve su racha actual, su mejor racha de siempre y un calendario de
las últimas semanas con los días en que practicó marcados según cuánto tiempo. Si hoy aún no
ha practicado y la racha sigue viva desde ayer, la app se lo recuerda en el inicio.

**Why this priority**: la constancia es lo que más hace progresar a quien empieza; ver la racha
y el récord la refuerza. Se apoya en datos que ya existen, así que funciona desde el primer día
con el historial de tiempo acumulado.

**Independent Test**: con días de práctica guardados (por ejemplo, una racha de 5 días hace un
mes y 2 días seguidos hasta hoy), abrir Progreso y comprobar racha actual = 2, mejor racha = 5,
y que el calendario marca esos días.

**Acceptance Scenarios**:

1. **Given** un historial de días con una racha pasada de 9 días y la actual de 3, **When** el alumno abre Progreso, **Then** ve «Racha: 3 días» y «Mejor racha: 9 días».
2. **Given** que la racha actual supera el récord, **When** termina la práctica del día, **Then** el récord pasa a ser la racha actual y se celebra con un mensaje breve la primera vez que ocurre ese día.
3. **Given** el calendario de Progreso, **When** el alumno lo mira, **Then** ve al menos las últimas 12 semanas, con cada día sin práctica, con poca práctica o con mucha práctica distinguibles a simple vista, y puede consultar el tiempo exacto de un día tocándolo.
4. **Given** que el alumno practicó ayer pero aún no hoy, **When** abre el inicio, **Then** la tarjeta de Progreso le avisa de que hoy mantiene la racha si practica.
5. **Given** datos de práctica guardados antes de esta versión, **When** el alumno abre Progreso por primera vez tras actualizar, **Then** la mejor racha y el calendario se calculan con esos datos.

---

### User Story 3 - Estadísticas más allá de la semana (Priority: P3)

El alumno quiere una vista de conjunto: tiempo practicado por semana o por mes, número de
intentos terminados, días practicados, nota media en Tocar en el periodo, piezas más
practicadas y piezas que más han mejorado.

**Why this priority**: es útil y motivador, pero el valor principal ya lo dan el historial y las
rachas.

**Independent Test**: con un historial de varios días y piezas, elegir el periodo «Último mes»
y comprobar que los totales coinciden con la suma de los intentos y del tiempo de ese periodo.

**Acceptance Scenarios**:

1. **Given** varios días de práctica, **When** el alumno elige entre «Últimos 7 días», «Últimos 30 días» y «Todo», **Then** el gráfico de tiempo y los totales (tiempo, días practicados, intentos terminados, nota media en Tocar) se actualizan para ese periodo.
2. **Given** un periodo con intentos de varias piezas, **When** el alumno mira las estadísticas, **Then** ve las 3 piezas en las que más tiempo o más intentos ha dedicado y las 3 que más han mejorado (de su primer intento en Tocar al mejor) en ese periodo.
3. **Given** un periodo sin intentos, **When** el alumno lo selecciona, **Then** ve un mensaje amable que le invita a practicar, sin gráficos vacíos ni ceros confusos.

---

### User Story 4 - Objetivo diario (Priority: P3)

El alumno puede fijar en Ajustes un objetivo de minutos al día (o desactivarlo). En el inicio y
en Progreso ve cuánto lleva hoy respecto al objetivo, y el calendario indica los días en que lo
cumplió.

**Why this priority**: concreta el consejo «practicar poco y a menudo», pero es opcional y no
cambia cómo cuenta la racha.

**Independent Test**: fijar un objetivo de 10 minutos, practicar 4 minutos, comprobar que el
inicio muestra «4 de 10 min»; practicar 6 más y comprobar que el día queda marcado como
objetivo cumplido.

**Acceptance Scenarios**:

1. **Given** el objetivo diario desactivado (valor por defecto), **When** el alumno usa la app, **Then** no se muestra ningún indicador de objetivo.
2. **Given** un objetivo de 10 minutos y 4 minutos practicados hoy, **When** el alumno abre el inicio, **Then** ve el avance (4 de 10 min).
3. **Given** que el alumno alcanza el objetivo durante una práctica, **When** termina esa práctica, **Then** recibe un aviso breve de objetivo cumplido, una sola vez al día.

---

### Edge Cases

- **Cambio de zona horaria o reloj del dispositivo**: los días se cuentan en la hora local del dispositivo, como hasta ahora; un intento guardado con una fecha futura no rompe la racha ni las gráficas.
- **Historial muy largo**: se guarda un número máximo de intentos detallados (ver FR-005); al superarlo se descartan los más antiguos, pero el récord de racha, el tiempo por día y los totales por pieza se conservan.
- **Pieza importada que se borra**: sus intentos desaparecen del historial y de las estadísticas, igual que hoy se borran sus estrellas.
- **Pieza que deja de existir en el repertorio** (renombrada o retirada en una actualización): sus intentos se muestran con el título guardado en el propio intento y sin enlace.
- **Borrar el progreso desde Ajustes**: borra también historial, récord de racha y estadísticas; el objetivo diario se conserva porque es un ajuste.
- **Almacenamiento lleno o no disponible**: la práctica sigue funcionando; si no se puede guardar el intento, la app no muestra errores al alumno.
- **Intentos de un segundo**: un intento que termina por completo siempre se guarda, aunque sea muy corto; las sesiones absurdas de tiempo siguen limitándose como hoy.
- **Paso Escuchar**: no se puntúa, así que no genera intentos en el historial.
- **Pantallas pequeñas**: el calendario y las gráficas caben en móvil apaisado sin desplazamiento horizontal.

## Requirements *(mandatory)*

### Functional Requirements

**Historial**

- **FR-001**: El sistema MUST registrar un intento cada vez que el alumno termina un recorrido completo en los pasos Aprender o Tocar, tanto en Canciones (incluidas las importadas) como en lecciones y pruebas del Curso.
- **FR-002**: Cada intento MUST guardar: fecha y hora, origen (Canciones o Curso), identificador y título de la pieza o lección, paso (Aprender o Tocar), manos (derecha, izquierda o ambas), tempo usado, nota (0–100 %), estrellas y, si se usó el bucle, los compases practicados.
- **FR-003**: Los intentos abandonados (salir, cambiar de paso o de pieza antes de terminar) y los del paso Escuchar MUST NOT registrarse como intentos.
- **FR-004**: Progreso MUST mostrar los intentos más recientes, del más nuevo al más antiguo, y permitir ver más hacia atrás.
- **FR-005**: El sistema MUST conservar al menos los 1000 intentos más recientes; al superar el límite descarta los más antiguos sin perder los totales por pieza ni el récord de racha.
- **FR-006**: Cada pieza de Canciones y cada lección o prueba del Curso MUST tener una ficha de historial con sus intentos, el número total de intentos, la mejor nota, la última nota y una gráfica de evolución hecha con sus intentos que cuentan para la evolución (FR-007).
- **FR-007**: Un intento **cuenta para la evolución** solo si es del paso Tocar, abarca la pieza completa (sin bucle de compases) y, en piezas a dos manos, se tocó con las dos manos. Los demás intentos (Aprender, fragmentos, una sola mano) MUST aparecer en el historial identificados como tales y MUST NOT contar en la gráfica de evolución ni en la «mejora».
- **FR-008**: El registro de intentos MUST NOT cambiar cómo se calculan las estrellas, la nota ni el desbloqueo del Curso.

**Rachas**

- **FR-009**: Un día cuenta para la racha si tiene algún tiempo de práctica registrado (regla actual), con independencia del objetivo diario.
- **FR-010**: Progreso MUST mostrar la racha actual y la mejor racha de siempre; la mejor racha MUST calcularse también a partir de los días de práctica guardados antes de esta versión.
- **FR-011**: Progreso MUST mostrar un calendario de al menos las últimas 12 semanas con tres niveles visibles: sin práctica, «poca» y «mucha». «Mucha» significa objetivo diario cumplido o, si no hay objetivo, 10 minutos o más; «poca» es cualquier tiempo menor. Al tocar un día se ve su tiempo de práctica.
- **FR-012**: Cuando la racha actual supere a la mejor, el sistema MUST mostrar una felicitación breve una sola vez ese día.
- **FR-013**: Si la racha está viva desde ayer y hoy aún no hay práctica, la tarjeta de Progreso del inicio MUST indicarlo con un mensaje que anime a mantenerla.

**Estadísticas**

- **FR-014**: Progreso MUST permitir elegir el periodo: últimos 7 días, últimos 30 días o todo.
- **FR-015**: Para el periodo elegido MUST mostrar: tiempo total, días con práctica, intentos terminados, nota media en Tocar y un gráfico de tiempo (por día en 7 y 30 días; por semana o mes en «Todo»).
- **FR-016**: Para el periodo elegido MUST mostrar las 3 piezas más practicadas y las 3 que más han mejorado (diferencia entre el primer y el mejor intento que cuentan para la evolución (FR-007) dentro del periodo, con al menos 2 intentos así).
- **FR-017**: Las estadísticas de Canciones y del Curso MUST distinguirse, igual que hoy se separan sus estrellas.
- **FR-018**: Un periodo sin datos MUST mostrar un mensaje que invite a practicar en lugar de gráficos vacíos.

**Objetivo diario**

- **FR-019**: Ajustes MUST permitir elegir un objetivo diario: desactivado (por defecto), 5, 10, 15, 20 o 30 minutos.
- **FR-020**: Con objetivo activo, el inicio y Progreso MUST mostrar el avance de hoy respecto al objetivo, y la app MUST avisar una sola vez al día al cumplirlo.

**Generales**

- **FR-025**: Progreso MUST organizarse en tres pestañas: **Resumen** (racha, mejor racha, objetivo de hoy, calendario y estadísticas por periodo), **Historial** (intentos recientes) y **Piezas** (listas de Canciones y del Curso, con acceso a la ficha de cada una). Al abrir Progreso se muestra Resumen.
- **FR-021**: Todos los datos nuevos MUST guardarse solo en el dispositivo, igual que el resto del progreso, sin enviarse a terceros.
- **FR-022**: «Borrar el progreso» en Ajustes MUST borrar también el historial, el récord de racha y las estadísticas, y su texto de confirmación MUST mencionarlo.
- **FR-023**: Las nuevas vistas MUST respetar el tema (claro/oscuro) y la notación elegida, y MUST poder usarse en escritorio, tablet y móvil apaisado.
- **FR-024**: Los datos de progreso existentes (estrellas, días, última sesión, avance del Curso) MUST seguir funcionando sin pérdida tras la actualización.

### Key Entities *(include if feature involves data)*

- **Intento**: un recorrido terminado de una pieza o lección. Atributos: momento, origen (Canciones/Curso), pieza o lección (id y título), paso, manos, tempo, nota, estrellas, fragmento (compases) opcional.
- **Día de práctica**: segundos practicados en un día local (ya existe). De él salen la racha, el récord y el calendario.
- **Récord de racha**: la racha más larga alcanzada y cuándo terminó; se conserva aunque se descarten intentos antiguos.
- **Resumen por pieza**: para cada pieza de Canciones y cada lección o prueba del Curso, número total de intentos y primera y mejor nota entre los intentos que cuentan para la evolución; se conserva aunque se descarten intentos antiguos.
- **Objetivo diario**: ajuste del alumno (desactivado o minutos al día).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los intentos terminados en Aprender o Tocar (Canciones y Curso) aparecen en el historial con todos sus datos, y ningún intento abandonado aparece.
- **SC-002**: Un alumno encuentra su mejor nota y su última nota de cualquier pieza en no más de 2 toques desde Progreso.
- **SC-003**: Tras actualizar, el 100 % de los alumnos con días de práctica guardados ven su mejor racha calculada correctamente con esos datos, sin perder estrellas ni avance del Curso.
- **SC-004**: Los totales de cada periodo (tiempo, días, intentos) coinciden exactamente con la suma de los datos guardados de ese periodo.
- **SC-005**: Progreso se abre y es usable en menos de 1 segundo con 1000 intentos guardados en un móvil de gama media.
- **SC-006**: Calendario, gráficas e historial se leen sin desplazamiento horizontal en móvil apaisado y en escritorio.
- **SC-007**: En una prueba con 5 personas que empiezan, al menos 4 saben responder sin ayuda «¿cuál es tu mejor racha?» y «¿has mejorado en esta pieza?» mirando Progreso.

## Assumptions

- Se mantiene la regla actual de racha (cualquier tiempo de práctica cuenta el día); el objetivo diario es solo informativo y no rompe rachas, para no castigar a quien empieza.
- No hay «congelaciones» ni días de descanso que protejan la racha; si se piden, irán en otra funcionalidad.
- El historial empieza vacío tras la actualización: antes no se guardaban intentos. El tiempo por día y las estrellas sí vienen de antes.
- El tiempo de Piano libre sigue sumando al tiempo del día y a la racha, pero no genera intentos.
- Las estadísticas se muestran dentro de la pantalla Progreso actual, dividida en pestañas (FR-025); no se añade una entrada nueva en el inicio.
- Las cuentas y la sincronización entre dispositivos quedan para la v1.0; todo se guarda en el navegador (Principio V).
- No se añaden exportaciones (CSV, compartir) en esta versión.

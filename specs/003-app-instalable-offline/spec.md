# Feature Specification: App instalable y uso sin conexión

**Feature Branch**: `003-app-instalable-offline`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "App instalable (PWA) y uso sin conexión" (v0.4 de la hoja de ruta, old_docs/ROADMAP.md).

## Contexto

Hoy Tecla solo se usa abriendo su dirección en el navegador y necesita conexión cada vez que se
abre. Mucha gente practica piano en sitios con mala cobertura o sin wifi (junto al piano de casa,
en un aula, de viaje) y prefiere abrir la app desde un icono, como cualquier otra aplicación.
Esta funcionalidad permite instalar Tecla en el dispositivo (escritorio, tablet o móvil) y
practicar sin conexión después de la primera visita, con todo lo necesario para ello: pantallas,
repertorio, sonido de piano, ajustes y progreso.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Practicar sin conexión (Priority: P1)

El alumno ya ha abierto Tecla al menos una vez con conexión. Más tarde, sin conexión (modo avión,
sin wifi), abre la app y practica con normalidad: elige una canción, la escucha, la aprende y la
toca, o usa Piano libre. Todo suena con el piano grabado, y sus ajustes y su progreso siguen ahí
y se siguen guardando.

**Why this priority**: es el valor central de la funcionalidad; sin ella, instalar la app no
serviría de nada en los sitios donde más se necesita.

**Independent Test**: abrir Tecla con conexión, esperar a que indique que está lista sin
conexión, activar el modo avión, recargar y recorrer Canciones → lección (Escuchar, Aprender,
Tocar), Piano libre y Ajustes, comprobando que todo funciona y suena con el piano.

**Acceptance Scenarios**:

1. **Given** el alumno abrió Tecla con conexión y la app terminó de prepararse, **When** la abre
   sin conexión, **Then** la app carga y muestra la pantalla de inicio sin errores del navegador.
2. **Given** la app está abierta sin conexión, **When** el alumno abre cualquier canción del
   repertorio y usa Escuchar, Aprender y Tocar, **Then** todo funciona igual que con conexión.
3. **Given** la app está sin conexión, **When** el alumno toca notas, **Then** suenan con el piano
   grabado, no con el sintetizador de reserva.
4. **Given** la app está sin conexión, **When** el alumno cambia un ajuste o termina una pieza con
   puntuación, **Then** el cambio y el progreso se guardan y siguen ahí al volver a abrirla.
5. **Given** la app está sin conexión, **When** el alumno entra directamente en una dirección
   interna (p. ej. una lección guardada como favorito), **Then** se abre esa pantalla.

---

### User Story 2 - Instalar Tecla como una app (Priority: P2)

Desde un navegador compatible, el alumno instala Tecla en su dispositivo. A partir de entonces
la abre desde un icono propio (escritorio, menú de inicio o pantalla de inicio del móvil), en su
propia ventana a pantalla completa, sin barra de direcciones, con el nombre y el icono de Tecla.

**Why this priority**: da comodidad y sensación de app, y hace más fácil volver a practicar
cada día; pero el uso sin conexión (P1) ya aporta valor aunque no se instale.

**Independent Test**: en Chrome o Edge de escritorio y en un móvil Android, instalar Tecla desde
el navegador; en iPhone/iPad, añadirla a la pantalla de inicio desde Safari. Abrirla desde el
icono y comprobar nombre, icono, ventana propia y que se ve sin desplazamiento en apaisado.

**Acceptance Scenarios**:

1. **Given** un navegador que permite instalar apps web, **When** el alumno visita Tecla,
   **Then** el navegador ofrece instalarla con el nombre «Tecla» y su icono.
2. **Given** Tecla está instalada, **When** el alumno la abre desde el icono, **Then** se abre en
   su propia ventana, sin barra de direcciones, con los colores de Tecla mientras carga.
3. **Given** Tecla instalada en un móvil, **When** el alumno la abre y gira el dispositivo,
   **Then** se comporta igual que en el navegador (en vertical pide girarlo; en apaisado muestra
   partitura y teclado sin desplazamiento).
4. **Given** Tecla instalada, **When** el alumno la abre, **Then** conserva los mismos ajustes y
   progreso que tenía en el navegador desde el que la instaló.
5. **Given** un navegador donde la app aún no está instalada, **When** el alumno abre Ajustes,
   **Then** ve cómo instalar Tecla en su dispositivo (un botón si el navegador lo permite, o
   instrucciones breves si no, p. ej. en iPhone).

---

### User Story 3 - Recibir las novedades sin perder nada (Priority: P3)

Cuando se publica una nueva versión de Tecla (nuevas canciones, correcciones), el alumno que la
tiene instalada o guardada para usar sin conexión la recibe la próxima vez que abre la app con
conexión, sin reinstalar nada y sin perder ajustes ni progreso. La actualización nunca
interrumpe una pieza que se está practicando.

**Why this priority**: sin esto, quien usa la app sin conexión se quedaría para siempre en una
versión antigua; pero solo importa una vez existen P1 y P2.

**Independent Test**: con la app preparada sin conexión, publicar una versión con un cambio
visible; abrir la app con conexión, comprobar que se avisa de la novedad y que, al aceptarla (o
al volver a abrir), aparece el cambio con ajustes y progreso intactos.

**Acceptance Scenarios**:

1. **Given** hay una versión nueva publicada, **When** el alumno abre la app con conexión,
   **Then** la nueva versión se descarga en segundo plano sin bloquear el uso.
2. **Given** la nueva versión está lista, **When** el alumno está en una pantalla de práctica,
   **Then** no se recarga la app por sí sola; se le ofrece un aviso discreto para actualizar.
3. **Given** el alumno acepta el aviso o cierra y vuelve a abrir la app, **When** se abre,
   **Then** ve la versión nueva con sus ajustes y su progreso intactos.
4. **Given** la descarga de la nueva versión se interrumpe (se pierde la conexión), **When** el
   alumno sigue usando la app, **Then** sigue funcionando completa con la versión anterior.

---

### Edge Cases

- **Primera visita sin terminar de preparar**: si el alumno pierde la conexión antes de que la
  app quede lista para usarse sin conexión, al volver a abrirla sin conexión puede no cargar;
  por eso la app indica cuándo está lista (FR-007).
- **Conexión intermitente o muy lenta**: la app no se queda esperando a la red; muestra lo que
  ya tiene guardado.
- **Tipografías y recursos externos**: sin conexión, los textos se ven con una tipografía
  legible y la notación musical se dibuja correctamente; nada queda en blanco ni roto.
- **Teclado MIDI sin conexión**: el MIDI funciona sin conexión en los navegadores que lo
  admiten; si el navegador no lo permite en la app instalada, se informa igual que hoy y el
  teclado en pantalla sigue disponible (Principio III).
- **El navegador borra los datos guardados** (poco espacio, limpieza del usuario): la app vuelve
  a necesitar conexión para prepararse; ajustes y progreso se pierden igual que hoy al borrar
  los datos del sitio.
- **Varias pestañas o ventanas abiertas** durante una actualización: ninguna se rompe; todas
  pasan a la versión nueva al recargarse.
- **Navegador sin soporte para apps instalables o uso sin conexión**: la app funciona como hoy,
  con conexión, sin mensajes de error.
- **Abrir la app con una dirección antigua o inexistente**: se muestra la pantalla de inicio,
  como hoy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tras una primera visita completa con conexión, la app MUST abrirse y funcionar sin
  conexión en todas sus pantallas: inicio, Canciones, lecciones (Escuchar, Aprender, Tocar),
  Piano libre y Ajustes.
- **FR-002**: Todo el repertorio incluido y el sonido de piano MUST estar disponibles sin
  conexión, sin que el alumno tenga que descargar canciones una a una.
- **FR-003**: Las direcciones internas de la app (p. ej. una lección concreta) MUST abrirse
  también sin conexión.
- **FR-004**: Ajustes y progreso MUST guardarse y leerse sin conexión exactamente igual que con
  conexión, en el propio dispositivo.
- **FR-005**: La app MUST poder instalarse en los navegadores que lo permiten (Chrome y Edge en
  escritorio y Android) y añadirse a la pantalla de inicio en Safari de iPhone/iPad, con el
  nombre «Tecla», su icono y sus colores.
- **FR-006**: Abierta desde el icono, la app MUST mostrarse en su propia ventana, sin barra de
  direcciones, y respetar las mismas reglas de orientación y pantalla que en el navegador.
- **FR-007**: La app MUST indicar al alumno, de forma discreta y comprensible, cuándo ha quedado
  lista para usarse sin conexión, y si en ese momento está sin conexión.
- **FR-008**: La pantalla de Ajustes MUST ofrecer la instalación (botón cuando el navegador lo
  permite; instrucciones breves en español cuando no, p. ej. en iPhone) y ocultarla si la app ya
  está instalada.
- **FR-009**: Cuando haya una versión nueva publicada, la app MUST descargarla en segundo plano
  al abrirse con conexión y aplicarla sin reinstalar ni perder ajustes y progreso.
- **FR-010**: Una actualización MUST NOT recargar la app por sí sola mientras el alumno practica;
  se ofrece un aviso para actualizar, y se aplica como muy tarde la próxima vez que se abre.
- **FR-011**: Si la preparación sin conexión o una actualización falla, la app MUST seguir
  funcionando con lo que ya tenía, sin mostrar errores técnicos.
- **FR-012**: Sin conexión, los textos y la notación musical MUST verse correctamente, sin
  depender de recursos externos no disponibles.
- **FR-013**: La lógica de lección y la teoría musical MUST NOT cambiar (Principio I); la app
  sigue sin enviar datos a terceros (Principio V).
- **FR-014**: En navegadores sin soporte para instalación o uso sin conexión, la app MUST seguir
  funcionando como hoy, con conexión, sin errores.

### Key Entities

- **Copia de la app en el dispositivo**: el conjunto de pantallas, repertorio, sonido de piano y
  recursos visuales guardados para funcionar sin conexión; tiene una versión, que se sustituye
  entera al actualizar.
- **Datos del alumno**: ajustes y progreso (ya existentes); viven en el dispositivo, son
  independientes de la copia de la app y sobreviven a las actualizaciones.
- **Identidad de la app instalada**: nombre, icono, colores y modo de ventana con que el sistema
  muestra Tecla al instalarla.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tras una primera visita con conexión, el 100 % de las pantallas y canciones del
  repertorio se abren y se pueden practicar en modo avión.
- **SC-002**: Sin conexión, el 100 % de las notas tocadas suenan con el piano grabado.
- **SC-003**: Abierta desde el icono o sin conexión en una visita posterior, la app muestra la
  pantalla de inicio en menos de 2 segundos en un dispositivo de gama media.
- **SC-004**: Con una conexión de unos 10 Mbit/s, la app queda lista para usarse sin conexión en
  menos de 15 segundos desde la primera visita, y lo que guarda en el dispositivo no supera
  unos 10 MB.
- **SC-005**: Un alumno sin conocimientos técnicos consigue instalar Tecla siguiendo lo que ve en
  la app en menos de 1 minuto, en escritorio, Android e iPhone.
- **SC-006**: Tras publicar una versión nueva, el 100 % de las veces se recibe como muy tarde en
  la segunda apertura con conexión, sin pérdida de ajustes ni de progreso.
- **SC-007**: Ninguna actualización interrumpe una pieza en curso (0 recargas automáticas durante
  la práctica).
- **SC-008**: Los tests existentes del motor, la música y el estado pasan sin modificaciones.

## Assumptions

- Basta una visita completa con conexión para preparar el uso sin conexión; no hay botón de
  «descargar para usar sin conexión»: se prepara sola en segundo plano.
- Se guarda todo el repertorio y todo el sonido de piano de una vez, porque su tamaño es pequeño
  (el sonido ocupa unos 2 MB); no hay selección de canciones para guardar.
- Ajustes y progreso siguen guardados en el navegador como hoy; no hay sincronización entre
  dispositivos ni entre el navegador y la app instalada en otro dispositivo (las cuentas son de
  la v1.0).
- La app instalada y la abierta en el mismo navegador comparten ajustes y progreso, que es el
  comportamiento estándar de los navegadores.
- Las tipografías de la app se sirven desde la propia app o, sin conexión, se sustituyen por
  tipografías del sistema legibles; la notación musical debe seguir viéndose bien en ambos casos.
- Firefox de escritorio no permite instalar apps web: allí se ofrece solo el uso sin conexión.
- No se publica en tiendas de aplicaciones (Google Play, App Store); la instalación es desde el
  navegador.
- No se añaden notificaciones push ni recordatorios de práctica.
- El MIDI dentro de la app instalada depende del soporte del navegador (Chrome y Edge); la
  funcionalidad no añade soporte donde el navegador no lo da.

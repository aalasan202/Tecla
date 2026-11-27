# Tecla Constitution

## Core Principles

### I. Motor separado de la interfaz

La lógica de lección (`src/engine/`) y la teoría musical (`src/music/`) MUST NOT acceder al DOM,
a React ni a APIs del navegador (Web Audio, Web MIDI, `localStorage`). Se comunican con la
interfaz mediante interfaces explícitas (p. ej. `LessonHost` con callbacks).

- Audio, MIDI y almacenamiento viven en sus propios módulos (`src/audio/`, `src/midi/`,
  `src/state/`) y se inyectan en el motor.
- Un cambio de pantalla o de diseño MUST NOT requerir cambios en el motor.

**Razón**: permite probar la lógica sin navegador y rehacer la interfaz sin romper la práctica.

### II. Lógica musical probada

Todo cambio en `src/engine/`, `src/music/` o `src/state/` MUST ir acompañado de tests que lo
cubran, y la suite MUST pasar antes de integrar en `main`.

- Las correcciones de errores en estas carpetas MUST incluir un test que reproduzca el error.
- Cada canción del repertorio MUST superar la validación automática (cada mano llena compases
  completos; notas y duraciones válidas).
- Los componentes visuales no requieren tests unitarios, pero SHOULD verificarse a mano en
  escritorio y en móvil apaisado.

**Razón**: un fallo en la partitura, el ritmo o la puntuación enseña mal al alumno; es el
núcleo del producto.

### III. Funciona sin hardware

Toda función de práctica MUST poder usarse con el teclado en pantalla. El teclado MIDI (USB o
Bluetooth) es una mejora, nunca un requisito.

- El teclado en pantalla y el MIDI MUST producir los mismos eventos de nota hacia el motor.
- Si Web MIDI no está disponible (navegador no compatible, sin `https`), la app MUST seguir
  funcionando e informar con claridad, sin errores.
- Una única conexión MIDI compartida para toda la app (`MidiProvider`).

**Excepción: independencia de manos.** Los ejercicios que piden tocar con las dos manos a la vez
partes distintas MAY exigir teclado MIDI, porque con ratón no se pueden pulsar dos teclas a la
vez. Solo se admite si se cumplen todas estas condiciones:

- Sin MIDI, el ejercicio se ve, pero no se puede empezar. Un aviso explica por qué y cómo
  conectar un teclado.
- Estos ejercicios MUST NOT bloquear el avance: no son requisito para abrir un nivel ni para
  superar una prueba. El «Siguiente recomendado» no los propone sin MIDI.
- El resto de la práctica sigue cumpliendo este principio.
- Cualquier otra función que exija hardware necesita una enmienda propia de esta constitución.

**Razón**: el público objetivo empieza desde cero y a menudo no tiene teclado MIDI.

### IV. Pensado para quien empieza, en cualquier pantalla

La experiencia MUST ser comprensible para alguien sin conocimientos musicales y usable en
escritorio, tablet y móvil en horizontal.

- Las pantallas de práctica MUST mostrar partitura y teclado sin desplazamiento en móvil
  apaisado; en vertical se pide girar el dispositivo.
- Los textos de la interfaz están en español; la notación (Do‑Re‑Mi o C‑D‑E), nombres de nota,
  dedos y tema (claro/oscuro) MUST respetar los ajustes del usuario en todas las pantallas.
- Cada pieza sigue los tres pasos: Escuchar, Aprender (espera cada nota) y Tocar (a tempo,
  con puntuación).

**Razón**: la claridad y la constancia en la práctica importan más que la cantidad de funciones.

### V. Sencillez y datos en el dispositivo

Se elige la solución más simple que cumpla la necesidad actual (YAGNI).

- Ajustes y progreso se guardan en el navegador; no se envían datos personales a terceros
  sin una enmienda de esta constitución (prevista para cuentas en v1.0).
- Añadir una dependencia de producción MUST justificarse en el plan de la funcionalidad
  (qué resuelve y por qué no basta con lo existente).
- El repertorio incluido MUST ser de dominio público o con licencia que permita su uso.

**Razón**: un proyecto pequeño se mantiene vivo si es fácil de entender, desplegar y respetuoso
con la privacidad.

## Restricciones técnicas

- **Stack**: Vite + React + TypeScript en modo estricto; tests con el runner del proyecto
  (`npm test`).
- **Plataforma**: aplicación web estática, sin backend propio; publicada en GitHub Pages.
- **Navegadores**: últimas versiones de Chrome, Edge, Firefox y Safari. Web MIDI solo se exige
  en Chrome y Edge, sobre `https` o `localhost`.
- **Rutas**: por hash (`#canciones`, `#leccion/<id>`, …) para funcionar en hosting estático.
- **Audio**: Web Audio API; el cambio a muestras de piano no debe alterar la interfaz del
  motor (Principio I).
- **Rendimiento**: la respuesta a una nota (pulsación → sonido y marca en partitura) SHOULD
  ser perceptiblemente inmediata (objetivo < 50 ms en dispositivos de gama media).

## Flujo de trabajo y calidad

- Las funcionalidades se desarrollan en ramas y se especifican con Spec Kit
  (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`).
- Cada plan MUST incluir una comprobación explícita contra los principios de esta
  constitución; cualquier desviación se justifica en la sección de complejidad del plan.
- Antes de integrar en `main`: `npm test` y `npm run build` (comprobación de tipos) MUST pasar.
- Cada push a `main` despliega automáticamente (`.github/workflows/deploy.yml`); `main` MUST
  estar siempre en estado publicable.
- Las versiones siguen la hoja de ruta (v0.4 calidad de práctica, v0.5 contenido, v0.6 curso,
  v0.7 curso en tres caminos y técnica, v0.8 lectura y repertorio largo, v1.0 cuentas); cada
  versión publicada se registra en el historial del proyecto.

## Governance

Esta constitución prevalece sobre cualquier otra práctica o documento del proyecto.

- **Enmiendas**: se proponen con `/speckit-constitution`, se documentan en el Sync Impact Report
  y se aprueban por la persona responsable del proyecto antes de integrarse.
- **Versionado** (semántico):
  - MAJOR: eliminar o redefinir un principio de forma incompatible.
  - MINOR: añadir un principio o sección, o ampliar materialmente una guía.
  - PATCH: aclaraciones, redacción y erratas.
- **Cumplimiento**: cada plan y cada revisión de cambios verifica los principios; la
  complejidad añadida MUST justificarse. `/speckit-analyze` se usa para detectar
  incoherencias entre especificación, plan, tareas y esta constitución.

**Version**: 1.1.0 | **Ratified**: 2026-11-16 | **Last Amended**: 2026-11-27

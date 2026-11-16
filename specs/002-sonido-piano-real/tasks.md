---

description: "Task list for Sonido de piano real"
---

# Tasks: Sonido de piano real

**Input**: Design documents from `specs/002-sonido-piano-real/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/audio.md](contracts/audio.md),
[quickstart.md](quickstart.md)

**Tests**: solo para las funciones puras de `src/audio/samples.ts` (elección de muestra y
afinación; ver plan › Constitution Check, Principio II). El resto se valida a mano con
[quickstart.md](quickstart.md). Los tests se escriben antes y deben fallar primero.

**Organization**: tareas agrupadas por historia de usuario de la spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede hacerse en paralelo (otro archivo, sin dependencias pendientes)
- **[Story]**: historia de usuario de la spec (US1–US3)

## Path Conventions

Proyecto único (SPA): código en `src/`, tests junto al módulo (`*.test.ts`), entorno de Vitest
`node` (sin DOM ni Web Audio). Archivos estáticos en `public/` (Vite los copia tal cual).

---

## Phase 1: Setup (muestras de piano)

**Purpose**: tener los 30 archivos de sonido y su licencia en el repositorio.

- [X] T001 *(Simplificada: los originales pesan 1,92 MB, así que el script solo descarga y comprueba el tamaño, sin `ffmpeg`; ver research R2.)* Crear el script de desarrollo `scripts/prepare-piano.mjs` (Node, sin dependencias npm; usa `ffmpeg` del PATH). Para cada nota MIDI de 21 a 108 en pasos de 3 (La0, Do1, Re♯1, Fa♯1, La1 … Do8; 30 notas) con nombre `A0`, `C1`, `Ds1`, `Fs1`, `A1` … `C8`: descargar el MP3 del Salamander Grand Piano desde `https://tonejs.github.io/audio/salamander/<nombre>.mp3` a una carpeta temporal fuera del repo, y con `ffmpeg` recortarlo a 4 s (6 s si la nota es < 45), aplicar fundido final de 0,5 s, normalizar el volumen (`loudnorm` o pico a −1 dBFS) y codificar MP3 estéreo 128 kbit/s en `public/samples/piano/<nombre>.mp3`. Al final, imprimir el tamaño total y salir con error si supera 3 MB (research R1–R2, SC-003)
- [X] T002 Ejecutar `node scripts/prepare-piano.mjs` y comprobar que `public/samples/piano/` contiene exactamente 30 MP3 con un total ≤ 3 MB; escuchar 3–4 al azar (grave, medio, agudo) para descartar cortes o ruidos
- [X] T003 [P] Crear `public/samples/piano/LICENSE.txt` con la atribución: «Salamander Grand Piano V3, by Alexander Holm — Creative Commons Attribution 3.0 (https://creativecommons.org/licenses/by/3.0/). Muestras recortadas, normalizadas y convertidas a MP3 para Tecla.» (research R6, FR-011)

---

## Phase 2: Foundational (lógica pura de muestras)

**Purpose**: elección de muestra y afinación, probadas sin navegador. Bloquea US1.

- [X] T004 Escribir `src/audio/samples.test.ts` (deben fallar): `PIANO_SAMPLES` tiene 30 entradas con `midi` = 21, 24, … 108 y `file` = `A0.mp3`, `C1.mp3`, `Ds1.mp3`, `Fs1.mp3` … `C8.mp3`; para cada `m` de 21 a 108, `sampleFor(m).midi` está a ≤ 1 semitono de `m`; «en empate, la inferior»; `sampleFor(10).midi === 21` y `sampleFor(120).midi === 108`; `playbackRate(60, 60) === 1` y `playbackRate(61, 60) ≈ 2 ** (1/12)`; `sampleUrl("./", "A0.mp3") === "./samples/piano/A0.mp3"` (data-model › Muestra, contracts/audio.md)
- [X] T005 Implementar `src/audio/samples.ts` según [contracts/audio.md](contracts/audio.md): `PIANO_SAMPLES` calculado (sin lista escrita a mano; nombres con `C, Cs, D, Ds, E, F, Fs, G, Gs, A, As, B` y octava `Math.floor(m / 12) - 1`), `sampleFor`, `playbackRate`, `sampleUrl`. Sin APIs del navegador. `npm test` en verde

**Checkpoint**: muestras en disco y lógica de elección probada.

---

## Phase 3: User Story 1 - Tocar y oír un piano real (Priority: P1) 🎯 MVP

**Goal**: cada pulsación suena con el piano grabado, afinada y sin retraso apreciable.

**Independent Test**: pasos 1–2 de [quickstart.md](quickstart.md) en Piano libre.

- [X] T006 [US1] Crear `src/audio/piano.ts` con el estado `PianoState = "loading" | "ready" | "unavailable"` (empieza en `"loading"`), `pianoState()` y `preloadPiano()`: descarga en paralelo los 30 archivos (`sampleUrl(import.meta.env.BASE_URL, file)`) como `ArrayBuffer` y los guarda en memoria; llamarla dos veces no repite la descarga. Por ahora con `fetch` directo (la caché llega en T014) (research R4, data-model › Banco de piano)
- [X] T007 [US1] En `src/audio/piano.ts`, añadir `decodePiano(ctx)`: cuando hay contexto y todos los `ArrayBuffer` están descargados, los decodifica con `ctx.decodeAudioData` y, solo si las 30 decodificaciones salen bien, pasa a `"ready"` (todo o nada). Debe funcionar en ambos órdenes: contexto antes que descarga (se decodifica al terminar la descarga) y descarga antes que contexto (se decodifica al llamar a `decodePiano`). Nunca vuelve de `"ready"` a otro estado
- [X] T008 [US1] En `src/audio/piano.ts`, añadir `playPiano(ctx, out, m, seconds, volume)`: `AudioBufferSourceNode` con el buffer de `sampleFor(m)` y `playbackRate` de `samples.ts` → `GainNode` (ganancia `volume * PIANO_GAIN`, constante ajustable, inicial 2) → `out`; a `t + seconds` la ganancia cae con `setTargetAtTime(0, t + seconds, 0.12)` y la fuente se detiene en `t + seconds + 0.6`. Registro de voces por nota MIDI: si `m` ya suena, apagar la voz anterior en 30 ms antes de empezar la nueva; borrar la voz en `onended` (research R3, data-model › Voz, FR-004, FR-005)
- [X] T009 [US1] En `src/audio/synth.ts`: renombrar el cuerpo actual de `playTone` a una función interna `synthTone` (sin cambios de sonido); `playTone(m, duration = 0.5, volume = 0.32)` mantiene la firma y llama a `playPiano(a, master, m, duration, volume)` si `pianoState() === "ready"`, o a `synthTone` en otro caso. `ensureAudio()` llama a `decodePiano(ctx)` tras crear el contexto. Actualizar el comentario de cabecera del archivo. `playClick` no cambia (contracts/audio.md, FR-006, FR-010)
- [X] T010 [US1] Llamar a `preloadPiano()` una vez en `src/main.tsx`, antes de `createRoot(...)`
- [ ] T011 [US1] Validar pasos 1–2 de [quickstart.md](quickstart.md) con `npm run dev`; ajustar `PIANO_GAIN` en `src/audio/piano.ts` para que el volumen se parezca al del sintetizador (SC-002, FR-002, FR-005)

**Checkpoint**: Piano libre y las notas del alumno suenan a piano.

---

## Phase 4: User Story 2 - Escuchar y acompañamiento con piano real (Priority: P2)

**Goal**: Escuchar y la mano automática suenan con el mismo piano y en equilibrio.

**Independent Test**: pasos 3–5 de [quickstart.md](quickstart.md).

- [ ] T012 [US2] Validar pasos 3–4 de [quickstart.md](quickstart.md) («Himno a la alegría a dos manos»: Escuchar, y Aprender/Tocar solo con la Derecha). Si el acompañamiento tapa las notas del alumno, corregir solo el escalado de volumen en `playPiano` de `src/audio/piano.ts` (no tocar los volúmenes de `src/engine/lesson.ts`); confirmar que el metrónomo sigue siendo un clic (FR-001, FR-006)
- [X] T013 [P] [US2] Añadir a la sección «Teclado MIDI» de `src/screens/SettingsScreen.tsx`, bajo los botones, un párrafo pequeño: «Sonido de piano: Salamander Grand Piano, de Alexander Holm (<a href="https://creativecommons.org/licenses/by/3.0/deed.es" target="_blank" rel="noreferrer">CC BY 3.0</a>).», con una clase de texto secundario existente en `src/styles.css` (o una nueva si no hay); comprobar el paso 5 del quickstart (FR-011)

**Checkpoint**: toda la pieza suena coherente y se muestran los créditos.

---

## Phase 5: User Story 3 - Empezar sin esperas y sin quedarse mudo (Priority: P3)

**Goal**: sintetizador como reserva mientras carga o si falla; piano guardado para siguientes visitas.

**Independent Test**: pasos 6–8 de [quickstart.md](quickstart.md).

- [X] T014 [US3] En `src/audio/piano.ts`, usar Cache Storage en `preloadPiano()`: abrir `caches.open("tecla-piano-v1")`; para cada URL, usar la respuesta en caché si existe o descargarla y guardarla con `cache.put`. Si `caches` no existe o lanza, usar `fetch` normal. Al arrancar, borrar las cachés cuyo nombre empiece por `tecla-piano-` y no sea la actual (research R5, data-model › Caché, FR-009)
- [X] T015 [US3] En `src/audio/piano.ts`, robustez: cualquier fallo de descarga (respuesta no `ok`, error de red) o de decodificación pasa a `"unavailable"`, escribe un único `console.warn` y nunca lanza hacia `playTone`; sin `AudioContext` (navegador sin Web Audio) no se descarga nada. Comprobar que el cambio a `"ready"` durante una práctica no corta las notas del sintetizador que ya suenan (FR-007, FR-008, SC-005)
- [X] T016 [US3] Validar pasos 6–8 de [quickstart.md](quickstart.md) (offline, conexión lenta y segunda visita desde la caché) (SC-003, SC-004, SC-005). *Comprobado en Chrome: si falla una muestra, el estado pasa a `unavailable`, hay un único aviso y suena el sintetizador; la segunda visita está lista en < 1 s sin red. Encontrado y corregido: una respuesta dañada se quedaba en la caché; ahora se borra al fallar. La prueba con red lenta queda en T018.*

**Checkpoint**: nunca hay teclas mudas y las visitas siguientes no descargan de nuevo.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T017 Ejecutar `npm test` y `npm run build`; confirmar que los tests existentes de `src/engine/`, `src/music/` y `src/state/` pasan sin modificar y que `dist/samples/piano/` contiene los 30 MP3 y `LICENSE.txt` (SC-006)
- [ ] T018 Recorrer la prueba manual completa de [quickstart.md](quickstart.md) (pasos 1–9), incluidos teclado del ordenador, MIDI si hay y móvil en horizontal
- [X] T019 [P] Revisar con `git diff main --stat` que `src/engine/` y `src/music/` no han cambiado y que no se ha añadido ninguna dependencia a `package.json` (Principios I y V, FR-010)
- [X] T020 [P] Marcar «Sonido de piano real (muestras) en lugar del sintetizador.» como hecho (✅) en la sección v0.4 de `old_docs/ROADMAP.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** y **Foundational (Phase 2)** son independientes entre sí; ambas
  bloquean US1.
- T002 depende de T001. T003 es independiente. T005 depende de T004.

### User Story Dependencies

- **US1 (P1)**: tras Phases 1 y 2. T006 → T007 → T008 → T009 → T010 → T011 (mismo archivo o
  dependen del anterior).
- **US2 (P2)**: T012 tras US1. T013 no depende de nada del audio: puede hacerse en cualquier
  momento.
- **US3 (P3)**: tras US1 (amplía `preloadPiano` y los estados de `piano.ts`). Independiente de
  US2.

### Parallel Opportunities

- Phase 1 ∥ Phase 2 (T001–T003 frente a T004–T005).
- T003 ∥ T001/T002.
- T013 (Ajustes) ∥ toda la fase US1.
- US2 (T012) ∥ US3 (T014–T015) tras US1, salvo que ambas pueden tocar `piano.ts`: coordinar.
- T019 ∥ T020 en el pulido.

---

## Parallel Example: Setup y Foundational

```bash
# A la vez:
Task: "T001–T002: script prepare-piano.mjs y generación de public/samples/piano/"
Task: "T004–T005: samples.test.ts y samples.ts"
Task: "T003: public/samples/piano/LICENSE.txt"
Task: "T013: créditos en src/screens/SettingsScreen.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phases 1 y 2 (T001–T005)
2. US1 (T006–T011)
3. **STOP and VALIDATE**: pasos 1–2 de [quickstart.md](quickstart.md)
4. Publicable: el piano suena en todas las pantallas (Escuchar y acompañamiento ya pasan por
   `playTone`); mientras carga, el sintetizador hace de reserva sin código extra

### Incremental Delivery

1. MVP (US1)
2. + US2: equilibrio de volúmenes y créditos → validar pasos 3–5
3. + US3: caché y fallos → validar pasos 6–8
4. Pulido (T017–T020) y merge a `main` (despliegue automático)

---

## Notes

- Cada tarea cita su requisito (FR/SC/US) o decisión de research para la trazabilidad.
- Los MP3 generados se incluyen en el commit; el script solo se vuelve a ejecutar si cambian
  las muestras (y entonces se sube la versión de la caché a `tecla-piano-v2`).
- No cambiar la firma de `playTone`, `playClick` ni `ensureAudio`, ni nada en `src/engine/`.

# Tasks: Pedal de resonancia (sustain) desde el nivel 3

**Input**: Design documents from `specs/009-pedal-sustain/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/pedal.md](contracts/pedal.md), [quickstart.md](quickstart.md)

**Tests**: incluidos. La constitución (Principio II) exige tests para todo cambio en
`src/engine/`, `src/music/` y `src/state/`.

**Organization**: por historia de usuario de la especificación: US1 (ver el pedal, P1), US2 (no
puntúa, P1) y US3 (oír el pedal, P2). La importación (FR-015) sirve sobre todo a la partitura y
va como fase propia con la etiqueta US1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia de usuario (US1, US2, US3)

## Path Conventions

Proyecto único: `src/` y tests junto al código (`*.test.ts`), en la raíz del repositorio.

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Crear la rama `009-pedal-sustain` desde `main` (`git checkout -b 009-pedal-sustain`) e incluir en ella `specs/009-pedal-sustain/` y `.specify/feature.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: modelo de datos y funciones puras del pedal que usan las tres historias.

**⚠️ CRITICAL**: ninguna historia puede empezar sin esta fase.

- [X] T002 Añadir en `src/music/types.ts` el tipo `export type PedalSpan = [from: number, to: number];` (tramo con el pedal pisado, `[pulso de inicio, pulso de fin)` en negras), el campo opcional `pedal?: PedalSpan[]` en `SongDef` («Tramos de pedal de resonancia, ordenados y sin solaparse. Solo se usan desde el nivel 3.») y el campo `pedals: PedalSpan[]` en `Score` («Tramos de pedal en uso: los de la pieza si su nivel es ≥ 3; si no, vacío»)
- [X] T003 [P] Crear `src/music/level.ts` con `export const levelOf = (s: Pick<SongDef, "level">): number => Number(/Nivel (\d+)/.exec(s.level)?.[1] ?? 1);` (movido tal cual), y cambiar `src/screens/Songs.tsx` para importarlo de ahí en lugar de definirlo
- [X] T004 [P] Escribir `src/music/pedal.test.ts` con los ejemplos de `contracts/pedal.md`: `sustainedEnd` (5 casos de la tabla), `pedalMarks([[0, 2], [2, 4]])` → down@0, line 0→2, change@2, line 2→4, up@4; un tramo suelto → down, line, up; `clipPedals([[0, 4], [4, 8]], 3, 6)` → `[[3, 4], [4, 6]]` y `clipPedals([[0, 2]], 4, 8)` → `[]`; `fitPedals([[0.1, 3.9]], …)` con notas en 0, 2, 4 y total 8 → `[[0, 4]]`, solapes `[[0, 4], [3, 6]]` → `[[0, 6]]`, tramos que quedan vacíos se descartan, extremos fuera de la pieza se ajustan y nunca lanza; `validatePedal` acepta un caso válido y da un error por cada regla incumplida (no múltiplo de 1/48, `from >= to`, desordenado o solapado, `from` sin nota que empiece ahí, `to` sin nota ni final de pieza, `to > total`)
- [X] T005 Crear `src/music/pedal.ts` con `sustainedEnd(s, d, pedals)` (si `from < s + d < to` en algún tramo devuelve `to`; si no, `s + d`), el tipo `PedalMark` y `pedalMarks(pedals)` («down» al inicio de un tramo sin tramo anterior contiguo, «change» donde `a.to === b.from`, «up» al final de un tramo sin siguiente contiguo, «line» por tramo), `clipPedals(pedals, from, to)` (limita cada tramo a `[from, to)` y descarta los que quedan vacíos), `fitPedals(spans, song)` (cada extremo al inicio de nota más cercano de cualquier mano, `to` también puede ir al final de la pieza; descarta los vacíos, fusiona solapes, nunca lanza) y `validatePedal(song)` con las reglas 1–4 de `data-model.md` (mensajes que nombran la regla), hasta que pase `src/music/pedal.test.ts`. Sin DOM ni APIs del navegador (Principio I)
- [X] T006 Llamar a `validatePedal(song)` desde `validateSong` en `src/music/validate.ts` y añadir sus errores a la lista; añadir un caso en el test de validación existente (p. ej. `src/music/score.test.ts` o el archivo que ya prueba `validateSong`) que rechace un tramo solapado
- [X] T007 En `buildScore` de `src/music/score.ts`, rellenar `pedals: levelOf(song) >= 3 ? [...(song.pedal ?? [])] : []` (importando `levelOf` de `./level`); test en `src/music/score.test.ts`: la misma pieza con `pedal` da `pedals` vacío con `level: "Nivel 2 · …"` y lleno con `"Nivel 3 · …"`

**Checkpoint**: `npm test` pasa; el pedal existe en los datos pero aún no se ve ni suena.

---

## Phase 3: User Story 1 - Ver el pedal en la partitura (Priority: P1) 🎯 MVP

**Goal**: las piezas de nivel 3–4 con acompañamiento muestran la línea de pedal bajo el pentagrama inferior; las de nivel 1–2 nunca. Con bucle, la línea se recorta al fragmento. La primera vez aparece una explicación.

**Independent Test**: abrir «Preludio en Do» y «Canción de cuna» en escritorio y en móvil apaisado: se ve la línea con gancho, «V» en los cambios y gancho final, continua a través de los tramos de dibujo, sin desplazamiento vertical; con bucle, solo dentro del fragmento. «Minueto en Sol» y las de nivel 1–2 no la muestran.

### Tests for User Story 1

- [X] T008 [P] [US1] Añadir a `src/music/repertoire.test.ts` un `describe("pedal (009)")` sobre todo el repertorio (`SONGS`): ninguna pieza de nivel 1–2 tiene `pedal` (FR-002); tienen `pedal` exactamente las 11 de research R2 (`oda2`, `oda-acordes`, `cuna`, `largo`, `despedida`, `nochedepaz`, `estrellita2`, `canon`, `preludio`, `greensleeves`, `elisa2`) y no las 5 restantes (`minueto`, `elisa`, `pregunta`, `martinillo-canon`, `rema`) (FR-003, SC-001); `level` contiene «Pedal» si y solo si hay `pedal` (FR-014); cada una pasa `validateSong` (SC-003)
- [X] T009 [P] [US1] Comprobar que la prueba de no regresión `src/music/regression.test.ts` compara id, notas, tempo y número de nivel pero no el texto completo de `level` ni `pedal`. Si compara `level` literal, cambiarla para que compare solo `levelOf` y el texto sin el sufijo « · Pedal» (FR-013), sin relajar el resto

### Implementation for User Story 1

- [X] T010 [P] [US1] Escribir `pedal` y añadir « · Pedal» al final de `level` en las 7 piezas de `src/music/songs.ts` (`oda2`, `oda-acordes`, `cuna`, `estrellita2`, `canon`, `preludio`, `greensleeves`), sin tocar id, notas, tempo ni número de nivel. Los tramos siguen los cambios de armonía según research R2: un tramo por armonía o compás, con cambio contiguo (`a.to === b.from`) en el inicio de cada armonía; el último tramo termina en el final de la pieza
- [X] T011 [P] [US1] Lo mismo en las 4 piezas de `src/music/repertoire.ts` (`largo`, `despedida`, `nochedepaz`, `elisa2`; en `elisa2`, un tramo por arpegio de la mano izquierda) hasta que pasen T008 y T009
- [X] T012 [P] [US1] Añadir `pedalHelpSeen: boolean` (por defecto `false`) a `Settings` y a los valores por defecto en `src/state/settings.ts`; actualizar `src/state/settings.test.ts` para que compruebe el valor por defecto y que un ajuste guardado sin el campo se lee con `false`
- [X] T013 [US1] En `src/components/ScoreView.tsx`, ampliar `geometryOf(score)` con una fila de pedal (`pedalRow`) bajo el pentagrama inferior (`bottom` + margen para líneas adicionales graves) y bajar `nameRow` solo cuando `score.pedals.length > 0`, sumando el alto a `height`. Sin pedal, la geometría queda idéntica a la actual (FR-012)
- [X] T014 [US1] En `src/components/ScoreView.tsx`, dibujar una capa SVG propia (fuera de los tramos de VexFlow, junto a las demás capas propias) con `pedalMarks(spans)`: `line` de `layout.xAt(from)` a `layout.xAt(to)` en `pedalRow`, gancho vertical hacia arriba en `down` y `up`, muesca en «V» hacia arriba en `change`. Si `at` es el final de la pieza, usar el borde derecho del último compás. Trazo con `currentColor`/variables del tema (FR-006), sin «Ped.» ni «✱» (FR-005). `spans` es `score.pedals` o, si la prop `loop` tiene `from` y `to`, `clipPedals(score.pedals, loop.from * score.bar, (loop.to + 1) * score.bar)` (research R8). Al quitar el bucle vuelve la línea completa
- [X] T015 [US1] Añadir a `src/styles.css` la clase de la capa de pedal (grosor y color como el de las ligaduras, también en tema oscuro) y comprobar que el ajuste de `fit` en móvil apaisado incluye la fila nueva sin desplazamiento vertical (SC-004)
- [X] T016 [US1] En `src/screens/LessonScreen.tsx`, si `score.pedals.length > 0` y `!prefs.pedalHelpSeen`, mostrar el `Popover` existente junto a la partitura con el texto de research R10 («Esta línea indica el pedal derecho (de resonancia): písalo con el pie donde empieza la línea, levántalo y vuelve a pisarlo en cada pico, y suéltalo donde termina. Es una indicación de lectura: no cuenta para la puntuación.») y un botón «Entendido» que guarda `pedalHelpSeen: true` (FR-011)

**Checkpoint**: US1 completa y demostrable con el teclado en pantalla; quickstart manual, pasos 1–3 y la parte visual del 5.

---

## Phase 4: User Story 2 - La puntuación no tiene en cuenta el pedal (Priority: P1)

**Goal**: el resultado de Aprender y Tocar es idéntico con y sin pedal, y una interpretación perfecta sin pedal da 3 estrellas.

**Independent Test**: tocar sin fallos una pieza con pedal con el teclado en pantalla: 3 estrellas, y el resumen no menciona el pedal.

### Tests for User Story 2

- [X] T017 [P] [US2] En `src/engine/lesson.test.ts`, con `testHost`, tocar en modo `play` (y en `learn`) la misma secuencia de entradas sobre una pieza de nivel 3 con `pedal` y sobre la misma sin `pedal`, y exigir `LessonResult` idénticos (`toEqual`) (FR-007, SC-002)
- [X] T018 [P] [US2] En `src/music/repertoire.test.ts`, para cada pieza con `pedal`, tocarla sin fallos en modo `play` (como el test «tocada sin fallos da 3 estrellas» de 008) y exigir 3 estrellas, y que `result.message` no contenga «pedal» (SC-002, US2-3)

### Implementation for User Story 2

- [X] T019 [US2] Revisar que `src/engine/lesson.ts` no lee `score.pedals` fuera de `sound()` y añadir un comentario con la invariante «el resultado no depende de `score.pedals`» junto a `result()`. Corregir solo si T017 o T018 fallan

**Checkpoint**: US1 + US2 forman el MVP completo de lo pedido: el pedal sale en la partitura y no puntúa.

---

## Phase 5: User Story 3 - Oír el efecto del pedal (Priority: P2)

**Goal**: Escuchar (y el acompañamiento automático) sostiene las notas según el pedal marcado. El pedal del teclado MIDI sostiene el sonido de la app en todas las pantallas. Al parar, salir, repetir el bucle o desconectar, nada se queda sonando.

**Independent Test**: escuchar «Canon de Pachelbel» y comprobar que las notas se sostienen hasta cada cambio; parar a mitad y comprobar que el sonido se corta en menos de un segundo; con un teclado MIDI, pisar el pedal en Piano libre y oír las notas sostenidas.

### Tests for User Story 3

- [X] T020 [P] [US3] En `src/engine/lesson.test.ts`: en modo `listen`, una nota dentro de un tramo pide `host.tone` con una duración en segundos igual a `(sustainedEnd − s) × segundos por pulso × 0,95`. Una nota fuera de tramos mantiene su duración actual. Con bucle, la duración nunca pasa del final del fragmento. Usar un `testHost` que registre las llamadas a `tone` y a `release`
- [X] T021 [P] [US3] En `src/engine/lesson.test.ts`: `stop()` llama a `host.release` y cada nueva repetición del bucle también. Un host sin `release` (el `testHost` actual) sigue funcionando
- [X] T022 [P] [US3] Crear `src/midi/useMidi.test.ts` (o extraer y probar una función pura `parseMidiMessage(data)` en `src/midi/message.ts`): `[0x90, 60, 100]` → nota; `[0x90, 60, 0]` → nada; `[0xb0, 64, 127]` → pedal pisado; `[0xb0, 64, 63]` → pedal levantado; `[0xb3, 64, 64]` (otro canal) → pedal pisado; `[0xb0, 7, 100]` (otro control) → nada

### Implementation for User Story 3

- [X] T023 [US3] En `src/engine/lesson.ts`: añadir `release?(): void` a `LessonHost` («Apaga todo lo que suena (al parar y al empezar cada repetición del bucle).»); en `sound(n)` usar `min(sustainedEnd(n.s, n.d, this.score.pedals), this.end) − n.s` pulsos como duración (manteniendo `× spb × 0,95`, el volumen por mano y el `flash`, que sigue usando la duración escrita); llamar a `this.host.release?.()` en `stop()` y en `nextRepetition()`. Hasta que pasen T020 y T021
- [X] T024 [US3] En `src/engine/testHost.ts`, ajustar `testHost` si hace falta para registrar `release` sin cambiar los tests existentes
- [X] T025 [P] [US3] En `src/audio/piano.ts`: guardar en cada `Voice` su fin nominal; exportar `releasePianoVoices(ctx, onlyEnded: boolean)`, que apaga en ~0,1 s (`setTargetAtTime(0, t, 0.03)` + `stop(t + 0.15)`) todas las voces o solo las que ya pasaron su fin nominal, y reprograma las demás a su fin nominal; aceptar en `playPiano` un parámetro `hold` que, si es `true`, programa el apagado en `t + SUSTAIN_MAX` (8 s) en lugar de `t + seconds`
- [X] T026 [US3] En `src/audio/synth.ts`: registro de voces del sintetizador (nodo `env` y fin nominal), con el mismo comportamiento de liberación que el piano; `export function releaseAll(): void` (apaga todo en ~0,1 s); `export function setSustain(down: boolean): void` (con `true`, `playTone` llama con `hold`; con `false`, libera las voces cuyo fin nominal ya pasó y reprograma las demás) (research R6)
- [X] T027 [US3] En `src/midi/useMidi.ts` (con la función pura de T022 si se extrajo): reconocer CC 64 en cualquier canal (≥ 64 pisado, < 64 levantado) y llamar a un nuevo parámetro opcional `onPedal(down)`; en `bind` (cada cambio de dispositivos) llamar a `onPedal(false)` (FR-010). Hasta que pase T022
- [X] T028 [US3] En `src/midi/MidiProvider.tsx`, aceptar la prop `onPedal?: (down: boolean) => void` y pasarla a `useMidi` mediante una ref estable. En `src/App.tsx`, `<MidiProvider onPedal={setSustain}>` importando `setSustain` de `./audio/synth` (FR-009; el pedal no llega al motor)
- [X] T029 [US3] En `src/screens/LessonScreen.tsx`, añadir `release: releaseAll` al host junto a `tone: playTone`, y llamar a `releaseAll()` al desmontar la pantalla (salir de la pieza) y al cambiar de paso (FR-010)

**Checkpoint**: las tres historias funcionan; quickstart manual, pasos 4, 5 (sonido) y 7.

---

## Phase 6: Importación con pedal (FR-015, aclaración Q4)

**Goal**: las piezas importadas con pedal lo muestran y lo hacen sonar si su nivel es ≥ 3, y nunca fallan por el pedal.

**Independent Test**: importar el MusicXML de prueba con pedal; con nivel ≥ 3 se ve la línea; al cambiar el nivel a 2 en la ficha desaparece y al volver a 3 reaparece.

### Tests

- [X] T030 [P] [US1] Añadir a `src/music/import/fixtures.ts` un MIDI mínimo con CC 64 (pisar en el pulso 0, levantar y pisar en el 4, levantar en el 8, más un pisado repetido que debe ignorarse) y un MusicXML con `<pedal type="start">`, `type="change"` y `type="stop"`, uno con `<sound damper-pedal="yes|no">` y otro con un tramo incoherente (stop sin start, start sin stop)
- [X] T031 [P] [US1] Tests en `src/music/import/midi.test.ts`: `parseMidi` emite eventos `pedal` con `down` según el umbral 64, y `midiToRaw` da `pedal: [[0, 4], [4, 8]]`
- [X] T032 [P] [US1] Tests en `src/import/musicxml.test.ts`: `start`/`change`/`stop` → `[[a, b], [b, c]]`; `damper-pedal` equivalente; `resume` = start y `discontinue` = stop; `continue` y `sostenuto` ignorados; tramo incoherente → se descarta o se cierra al final, sin lanzar
- [X] T033 [P] [US1] Tests en `src/music/import/convert.test.ts` y `src/music/import/full.test.ts`: la versión simplificada y la completa llevan `pedal` ajustado con `fitPedals` a sus propias notas, sin `pedal` si queda vacío, y la importación sigue siendo `ok` con pedal incoherente (SC-007)

### Implementation

- [X] T034 [US1] En `src/music/import/types.ts`, añadir `pedal?: [number, number][]` a `RawPiece` («Tramos de pedal leídos del archivo, en pulsos de negra sin cuantizar») y el evento MIDI `{ tick, type: "pedal", channel, down: boolean }` al tipo de eventos de pista
- [X] T035 [US1] En `src/music/import/midi.ts`: en `readTrack`, emitir el evento `pedal` para `kind === 0xb0 && a === 64` (`down: b >= 64`); en `midiToRaw`, emparejar pisar y levantar por orden de tick en todas las pistas, ignorar pisados repetidos, cerrar un pisado sin levantar al final de la pista y rellenar `pedal` en pulsos (`tick / division`) solo si hay tramos. Hasta que pase T031
- [X] T036 [US1] En `src/import/musicxml.ts`, dentro del `case "direction"`, leer `direction-type > pedal` (`start`/`resume` abre, `stop`/`discontinue` cierra, `change` cierra y abre, `continue`/`sostenuto` se ignoran) y `sound[damper-pedal]` en la posición `pos` actual más `<offset>`/`divisions` si existe; si al final queda uno abierto, cerrarlo en el final de la pieza; rellenar `piece.pedal`. Hasta que pase T032
- [X] T037 [US1] En `src/music/import/convert.ts` (`convertPiece`) y `src/music/import/full.ts` (`convertFull`), añadir `pedal: fitPedals(raw.pedal, song)` a la canción resultante cuando `raw.pedal` exista y el resultado no esté vacío. Hasta que pase T033
- [X] T038 [US1] Comprobar en `src/state/imported.test.ts` que una pieza importada con `pedal` lo conserva al guardarse y al editar su nivel con `editImported`, y que `buildScore` de esa pieza da `pedals` vacío en nivel 2 y lleno en nivel 3 (R3)

**Checkpoint**: quickstart manual, paso 8.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T039 [P] Actualizar la nota de `specs/009-pedal-sustain/checklists/requirements.md` (ya no dice «la importación ignora el pedal» ni «al menos 4 piezas») sin tocar las casillas
- [X] T040 [P] Actualizar el historial o la hoja de ruta del proyecto (donde se registran las versiones) con «Pedal de resonancia desde el nivel 3»
- [X] T041 Ejecutar `npm test` y `npm run build` y corregir lo que falle (constitución: flujo de trabajo)
- [ ] T042 Recorrer a mano [quickstart.md](quickstart.md), pasos 1–8, en escritorio y en móvil apaisado, en tema claro y oscuro; anotar en el PR lo comprobado y lo que no se pudo probar (p. ej. sin teclado MIDI con pedal)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias.
- **Foundational (Fase 2)**: depende de la Fase 1; bloquea todas las historias.
- **US1 (Fase 3)**, **US2 (Fase 4)** y **US3 (Fase 5)**: dependen de la Fase 2.
- **Importación (Fase 6)**: depende de la Fase 2 (`fitPedals`) y, para verse, de T013–T014.
- **Polish (Fase 7)**: tras todas las anteriores.

### User Story Dependencies

- **US1**: solo la Fase 2.
- **US2**: solo la Fase 2. T018 necesita las piezas con pedal (T010–T011); T017 no.
- **US3**: solo la Fase 2. T029 toca `LessonScreen.tsx`, igual que T016: hacerlas en secuencia.

### Within Each User Story

- Los tests se escriben antes y fallan antes de implementar.
- Datos y funciones puras antes que la vista; audio (T025–T026) antes que la conexión (T028–T029).

### Parallel Opportunities

- Fase 2: T003 y T004 en paralelo; T005 después de T004.
- US1: T008, T009, T010, T011 y T012 en paralelo; T013 → T014 → T015 en `ScoreView`/estilos; T016 al final.
- US2: T017 y T018 en paralelo.
- US3: T020, T021, T022 y T025 en paralelo; T026 tras T025.
- Fase 6: T030–T033 en paralelo; T035, T036 y T037 en paralelo tras T034.
- US1, US2 y US3 pueden avanzar en paralelo tras la Fase 2, salvo los archivos compartidos indicados.

---

## Parallel Example: User Story 1

```text
# Tests y datos a la vez:
T008 repertoire.test.ts – reglas de pedal del repertorio
T009 regression.test.ts – no regresión sin el sufijo « · Pedal»
T010 songs.ts – pedal en 7 piezas
T011 repertoire.ts – pedal en 4 piezas
T012 settings.ts – pedalHelpSeen

# Después, en secuencia:
T013 → T014 → T015 (ScoreView y estilos) → T016 (LessonScreen)
```

## Parallel Example: User Story 3

```text
T020 lesson.test.ts – duración sostenida
T021 lesson.test.ts – release   (mismo archivo que T020: en secuencia si lo edita la misma persona)
T022 useMidi.test.ts – CC 64
T025 piano.ts – voces liberables
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Fases 1 y 2.
2. Fase 3 (US1): el pedal sale en la partitura.
3. Fase 4 (US2): demostrar con tests que no puntúa.
4. **Parar y validar**: quickstart, pasos 1–3 y 6. Esto ya cumple lo pedido («sale en la partitura pero no puntúa»).

### Incremental Delivery

1. MVP (US1 + US2) → probar → integrar.
2. US3 (sonido y pedal MIDI) → probar → integrar.
3. Fase 6 (importación) → probar → integrar.
4. Polish → `npm test`, `npm run build` y quickstart completo antes de `main` (cada push a `main` publica).

### Parallel Team Strategy

Tras la Fase 2: una persona en US1 (datos y partitura), otra en US3 (motor, audio y MIDI) y otra
en la Fase 6 (importación). US2 son tests cortos que puede hacer cualquiera al terminar T010–T011.

---

## Notes

- [P] = archivos distintos y sin dependencias pendientes.
- Las piezas existentes no cambian id, notas, tempo ni número de nivel (FR-013); solo ganan
  `pedal` y « · Pedal».
- `src/music/pedal.ts` no usa DOM ni APIs del navegador (Principio I).
- Hacer commit tras cada tarea o grupo lógico.

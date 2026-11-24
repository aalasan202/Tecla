---

description: "Task list for Importar canciones MIDI y MusicXML"
---

# Tasks: Importar canciones MIDI y MusicXML

**Input**: Design documents from `specs/006-importar-midi-musicxml/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/import.md](contracts/import.md),
[quickstart.md](quickstart.md)

**Tests**: incluidos. La constitución (Principio II) exige tests para todo cambio en
`src/music/` y `src/state/`; el plan y el quickstart §1 los detallan. En `src/import/` se usan
tests con `// @vitest-environment happy-dom`. Los componentes se verifican a mano (quickstart §3).

**Organization**: tareas agrupadas por historia de usuario de la spec (US1–US5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede hacerse en paralelo (otro archivo, sin dependencias pendientes)
- **[Story]**: historia de usuario de la spec

## Path Conventions

Proyecto único (SPA): código en `src/`, tests junto al módulo (`*.test.ts`). Pulsos en negras
(negra = 1). Duraciones representables `DURATIONS = [0.5, 1, 1.5, 2, 3, 4]`. `src/music/import/`
MUST NOT usar DOM ni APIs del navegador (Principio I); lo que las necesita va en `src/import/`.
`src/engine/` y `SongDef` no cambian.

---

## Phase 1: Setup

**Purpose**: línea base en verde y herramientas de test

- [X] T001 En la rama `006-importar-midi-musicxml`, ejecutar `npm test` y `npm run build` en la raíz y confirmar que todo pasa (línea base)
- [X] T002 Añadir `happy-dom` como dependencia de desarrollo (`npm i -D happy-dom`) en `package.json`; no tocar `test.environment` de `vite.config.ts` (sigue `node`; los tests de `src/import/` lo cambian por archivo)
- [X] T003 [P] Añadir `dev-fixtures/` a `.gitignore`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: almacén que informa de fallos, catálogo de canciones, olvido de progreso y tipos comunes. Al terminar, la app se comporta exactamente igual que hoy.

**⚠️ CRITICAL**: ninguna historia puede empezar hasta completar esta fase

### Tests (escribir primero, deben fallar)

- [X] T004 [P] Crear `src/state/store.test.ts`: con un `localStorage` falso en `globalThis` (objeto con `getItem`/`setItem`/`removeItem`), `createStore("k", {a: 1}).set({a: 2})` devuelve `true` y guarda; si `setItem` lanza (simular `QuotaExceededError`), `set` devuelve `false`, el valor en memoria se actualiza igualmente y los suscriptores se notifican (comportamiento actual)
- [X] T005 [P] Ampliar `src/state/progress.test.ts`: `forgetSong("x")` quita `best.x` y pone `last` a `null` si `last.songId === "x"`; no toca `best` de otras piezas, ni `last` de otra pieza, ni `days`
- [X] T006 [P] Crear `src/state/library.test.ts`: sin importadas, `allSongs()` es igual a `SONGS` (mismo orden) y `findSong("oda")` devuelve la pieza; `findSong("nada")` → `undefined`; `isImported("imp-0123abcd")` → `true`, `isImported("oda")` → `false`; con una importada en el almacén `imported` (inyectada con `imported.set`), `allSongs()` = `SONGS` seguido de ella y `findSong` la encuentra; `repertoireStars({oda: 3, "imp-x": 2})` → `3`

### Implementation

- [X] T007 Cambiar `set` en `src/state/store.ts` para devolver `boolean` (`true` si `localStorage.setItem` no lanzó); el resto igual. Las llamadas actuales no cambian (hace pasar T004)
- [X] T008 [P] Añadir `forgetSong(id: string): void` en `src/state/progress.ts` (hace pasar T005)
- [X] T009 [P] Crear `src/music/import/types.ts` con los tipos de [data-model.md](data-model.md): `RawNote { pitch; start; dur }`, `RawPart { name?; staff?: 1 | 2; notes }`, `RawPiece { format: "midi" | "musicxml"; title?; tempo?; times: { at; beats; beatType }[]; parts; notPiano: boolean; ignored: { grace: number; cue: number } }`, `RejectReason = "tooLarge" | "unreadable" | "notScore" | "empty" | "notPiano" | "tooManyParts" | "badNotes" | "timeSignature"`, `ImportCheck`, `Proposal { song: Omit<SongDef, "id" | "level">; metrics; level: 1 | 2 | 3 | 4; warnings; heavy: boolean }`, `Metrics { bars; notes; twoHands; accidentals; rightSpan; eighthShare; simultaneousShare }`, `WarningKind = "handsSplit" | "chords" | "durations" | "cutAtBar" | "dropped" | "grace" | "farFromOriginal"`, `Warning { kind; bars: number[] }`, `ImportedSong { def: SongDef; source: { format; fileName; size }; hash: string; importedAt: number; warnings: Warning[] }`
- [X] T010 [P] Crear `src/music/import/errors.ts` con `class ImportError extends Error { constructor(readonly reason: RejectReason, readonly detail?: { count?: number; bars?: number[] }) }`
- [X] T011 Crear `src/state/imported.ts` solo con el almacén `imported = createStore<{ songs: ImportedSong[] }>("tecla-imported", { songs: [] })` (las operaciones llegan en US1/US4)
- [X] T012 Crear `src/state/library.ts` con `allSongs()`, `findSong(id)`, `useLibrary()` (suscrito a `imported.use()`; devuelve `[...SONGS, ...songs.map(s => s.def)]` memorizado), `isImported(id) = id.startsWith("imp-")` y `repertoireStars(best)` que suma solo ids de `SONGS` (hace pasar T006)
- [X] T013 [P] En `src/screens/LessonScreen.tsx`, sustituir los dos `SONGS.find(...)` por `findSong(...)` de `src/state/library.ts`
- [X] T014 [P] En `src/screens/Home.tsx`, usar `findSong` para la pieza de «Continuar» (si `last.songId` no existe, como hoy, primera pieza del repertorio) y `repertoireStars(p.best)` para el total de estrellas; `maxStars` y el texto «N piezas en 4 niveles» siguen con `SONGS` (FR-019)
- [X] T015 [P] En `src/screens/ProgressScreen.tsx`, calcular estrellas con `repertoireStars(p.best)`; «Piezas dominadas» y la lista por pieza siguen solo con `SONGS` (FR-019)
- [X] T016 [P] En `src/screens/Songs.tsx`, tomar la lista de `useLibrary()` en lugar de `SONGS` (filtros y niveles sin cambios)

**Checkpoint**: `npm test` y `npm run build` en verde; la app se ve y funciona igual que antes

---

## Phase 3: User Story 1 - Importar una pieza de piano y practicarla (Priority: P1) 🎯 MVP

**Goal**: elegir un MIDI, MusicXML o `.mxl` válido, ver el resumen con el nivel sugerido y los avisos de simplificación, añadirlo y practicarlo como cualquier pieza, también tras reabrir la app sin conexión.

**Independent Test**: quickstart §3 pasos 2–5 y 8: importar `estrellita2.musicxml` y una pieza de una sola pista con acordes, añadirlas, practicar los tres pasos y reabrir la app.

### Tests (escribir primero, deben fallar)

- [ ] T017 [P] [US1] Crear `src/music/import/fixtures.ts` (sin tests propios; lo usan tests y script): `songToMidi(song: SongDef, opts?: { singleTrack?: boolean; ppq?: number }): Uint8Array` (formato 1, división 480, pista 0 con nombre = `title`, tempo `FF 51` y compás `FF 58` de `bar`/4; una pista por mano con `C0 00` y notas en canal 0/1; silencios como espera; `singleTrack` mezcla las dos manos en una pista) y `songToMusicXml(song: SongDef): string` (`score-partwise` 4.0, una `<part>` con `<staves>` 1 o 2, `<divisions>2`, `<time>`, `<sound tempo>`, `<work-title>`, notas y silencios por compás con `<backup>` entre pentagramas; usar `<dot/>` y `<type>` acordes a la duración). Exportar también `writeMidi(tracks)` de bajo nivel para construir casos de prueba. Solo `import type` de otros módulos (sin imports de valores), para que `scripts/export-fixtures.mjs` pueda cargarlo con `node` sin compilar
- [ ] T018 [P] [US1] Crear `src/music/import/midi.test.ts`: `parseMidi(songToMidi(oda2))` da formato 1, división 480, 3 pistas, tempo 80, compás 4/4 y nombre; *running status* y note-on con velocidad 0 se leen como note-off (construido con `writeMidi`); `midiToRaw` da 2 partes con notas en pulsos (`start`, `dur` en negras) y la derecha es la de altura media más aguda aunque venga en segunda pista; sin evento de tempo → `tempo` 120; sin compás → `times` vacío
- [ ] T019 [P] [US1] Crear `src/music/import/convert.test.ts` (camino válido y simplificaciones; los rechazos llegan en US2): ida y vuelta MIDI de las 12 piezas de `SONGS` (`convertPiece(midiToRaw(parseMidi(songToMidi(s))))` → `proposal.song` con las mismas `n`/`r`/`l`, `bar` y `tempo` que `s`, sin avisos) (SC-002); toda propuesta cumple las reglas de `score.test.ts` (compases completos, manos de igual longitud, notas 21–108, duraciones en `DURATIONS`); acorde de 3 notas en la derecha → queda la más aguda y aviso `chords` con su compás; acorde en la izquierda → la más grave; semicorcheas (inicio 0,25) → inicios cuantizados a 0,5 y aviso `durations`; tresillo de corcheas → aviso `durations`, compás completo; nota de 2 pulsos que empieza en el pulso 3 de un 4/4 → se corta en la barra (aviso `cutAtBar`), resto silencio; nota de 2,5 → 2 + silencio 0,5; una sola parte con notas simultáneas → reparto por Do central (≥ 60 derecha) con aviso `handsSplit`; `songToMidi(martinillo, { singleTrack: true })` → una mano (`n`) con Sol 3 incluido, sin `handsSplit` (FR-008); todas las notas graves y simultáneas → dos manos con la derecha en silencio; avisos en más de la mitad de los compases → aviso `farFromOriginal`; tempo 37 → 40, 151 → 140, 87 → 85 (rango 40–140, paso 5); `px` 60 si más del 25 % son corcheas, si no 50
- [ ] T020 [P] [US1] Crear `src/music/import/level.test.ts`: para cada pieza de `SONGS`, `suggestLevel(measure(s))` es igual al número de `s.level` (12 de 12, SC-003); casos sueltos: una mano Do–Sol en negras → 1; una mano Do–La → 2; 3/4 → 3; dos manos con 50 % de inicios simultáneos → 4
- [ ] T021 [P] [US1] Crear `src/music/import/hash.test.ts`: `fnv1a64` de bytes vacíos = `"cbf29ce484222325"`; de `"a"` = `"af63dc4c8601ec8c"`; siempre 16 hex; distinto para un byte cambiado
- [ ] T022 [P] [US1] Crear `src/import/musicxml.test.ts` (`// @vitest-environment happy-dom`): ida y vuelta MusicXML de las 12 piezas (`convertPiece(parseMusicXml(songToMusicXml(s), "x.musicxml"))` → mismas notas, manos, compás y tempo) (SC-002); `<chord/>`, `<backup>`, `<forward>`, `<staff>2` y `<tie type="start|stop">` (dos negras ligadas → una blanca) se leen bien; `<grace/>` se ignora y cuenta en `ignored.grace`; sin `<sound tempo>` ni `<metronome>` → `tempo` indefinido (la conversión pondrá 90); título de `<work-title>` o `<movement-title>`, o el nombre del archivo sin extensión
- [ ] T023 [P] [US1] Crear `src/import/mxl.test.ts` (`// @vitest-environment happy-dom`): construir en el test un ZIP mínimo con `META-INF/container.xml` y `score.musicxml` en *deflate* (con `CompressionStream("deflate-raw")`) y en *stored*; `unzipMxl` devuelve el texto del `rootfile`; sin `container.xml`, el primer `.musicxml`/`.xml` fuera de `META-INF`
- [ ] T024 [P] [US1] Crear `src/state/imported.test.ts`: `addImported(proposal, meta, bytes, { title, level }, deps)` con `deps = { putOriginal, deleteOriginal }` falsos: guarda el original y luego la pieza con `def.id = "imp-" + hash.slice(0, 8)`, `def.level = "Nivel N · Importada de MIDI"` (o «de MusicXML») y `def.title` el elegido; devuelve `{ ok: true, id }`; si `putOriginal` rechaza → `{ ok: false, reason: "noSpace" }` y nada guardado; si `imported.set` devuelve `false` → llama a `deleteOriginal(id)` y devuelve `noSpace` (FR-016); el id existe ya (copia) → sufijo `-2`, `-3`… y el título con « (2)» si se repite

### Implementation

- [ ] T025 [P] [US1] Crear `src/music/import/midi.ts` con `parseMidi(bytes: Uint8Array): MidiFile` (cabecera `MThd`, pistas `MTrk`, longitudes variables, *running status*, notas, program change, metaeventos `03` nombre, `51` tempo, `58` compás y `2F` fin; SysEx y otros se saltan por longitud; cualquier lectura fuera de límites o cabecera incorrecta → `ImportError("unreadable")`; división SMPTE → `unreadable`) y `midiToRaw(midi, fileName): RawPiece` (partes = pistas con notas, o canales con notas en formato 0; notas emparejando note-on/note-off por canal y altura; pulsos = ticks / división; derecha = parte de altura media más aguda; título = nombre de la primera pista o nombre del archivo sin extensión; tempo = primer `51` o 120; `notPiano` si hay notas en canal 10 o un program change fuera de 0–7 en un canal con notas) según [research.md](research.md) R1–R2 (hace pasar T018)
- [ ] T026 [P] [US1] Crear `src/music/import/hash.ts` con `fnv1a64(bytes: Uint8Array): string` usando `BigInt` (offset `0xcbf29ce484222325n`, primo `0x100000001b3n`, máscara de 64 bits), resultado en 16 hex con ceros a la izquierda (hace pasar T021)
- [ ] T027 [US1] Crear `src/music/import/level.ts` con `measure(song)` y `suggestLevel(m)` con constantes con nombre: nivel 4 si dos manos y (`simultaneousShare ≥ 0.4` o `eighthShare > 0.25`); 3 si `bar === 3`, `accidentals > 0` o dos manos; 2 si `rightSpan > 5` (teclas blancas, contando la nota blanca inferior para las negras) o `eighthShare > 0.10`; si no, 1. `simultaneousShare` = inicios donde suenan las dos manos / inicios distintos con nota ([research.md](research.md) R5) (hace pasar T020)
- [ ] T028 [US1] Crear `src/music/import/convert.ts` con `DURATIONS`, `HEAVY = { bars: 300, notes: 1500 }` y `convertPiece(raw): ImportCheck` que nunca lanza, siguiendo [research.md](research.md) R4 pasos 2–7: reparto de manos (FR-008), cuantización a 0,5, una nota por mano, duraciones recortadas por la siguiente nota y la barra, mayor duración de `DURATIONS` que no supere la real y el resto silencio, huecos a silencios, relleno final hasta compás completo e igual en ambas manos, avisos con compases (base 1), tempo ajustado a 40–140 en pasos de 5 (sin tempo: 90), `px` 50/60, `bar` de `times[0]` (4 si vacío), una mano → `n`, dos → `r`/`l`; `metrics`, `level = suggestLevel(...)` y `heavy` (> `HEAVY.bars` compases o > `HEAVY.notes` notas). Paso 1 (rechazos) se deja como esqueleto que US2 completa (hace pasar T019)
- [ ] T029 [P] [US1] Crear `src/import/musicxml.ts` con `parseMusicXml(text, fileName): RawPiece` usando `DOMParser` (`application/xml`; `parsererror` → `ImportError("unreadable")`): recorrer `score-partwise` > `part` > `measure` con `divisions`, `<note>` (`pitch` step/alter/octave → MIDI; `rest`; `chord` reutiliza el inicio de la nota anterior; `duration`/`divisions` → pulsos; `staff` 1/2 → parte derecha/izquierda), `<backup>`/`<forward>`, `<tie>` para unir notas, `<grace>`/`<cue>` ignoradas y contadas, `<time>` → `times`, `<sound tempo>` o `<metronome>` → `tempo`; `<midi-program>` fuera de 1–8 → `notPiano` (hace pasar T022)
- [ ] T030 [P] [US1] Crear `src/import/mxl.ts` con `unzipMxl(bytes): Promise<string>`: leer el registro de fin de directorio central (`PK\x05\x06`), recorrer las entradas, extraer *stored* (método 0) o *deflate* (método 8) con `new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer()`, decodificar UTF-8, leer `META-INF/container.xml` (`rootfile[full-path]`) o elegir el primer `.musicxml`/`.xml` fuera de `META-INF`; cualquier fallo → `ImportError("unreadable")` (hace pasar T023)
- [ ] T031 [P] [US1] Crear `src/import/originals.ts` con IndexedDB (`indexedDB.open("tecla", 1)`, almacén `originals` con `keyPath: "id"`): `putOriginal(id, bytes, type)`, `deleteOriginal(id)`, `getOriginal(id)`; cada una envuelve la petición en una `Promise` y rechaza si falla la transacción (cuota incluida)
- [ ] T032 [US1] Crear `src/import/check.ts` con `MAX_BYTES = 5 * 1024 * 1024` y `checkFile(file, signal)`: tamaño → `file.arrayBuffer()` → detectar formato por contenido (`MThd` → MIDI; `PK` → `.mxl`; empieza por `<` tras BOM/espacios → MusicXML; si no, `unreadable`) → `RawPiece` → `convertPiece`; devuelve el `ImportCheck` más `bytes` y `hash` (`fnv1a64`); cede el hilo entre fases (`await new Promise(r => setTimeout(r, 0))`) y comprueba `signal.aborted` tras cada una (lanza `AbortError`); un `ImportError` se convierte en `{ ok: false, reason, detail }`; cualquier otra excepción → `unreadable` (FR-017)
- [ ] T033 [US1] Añadir a `src/state/imported.ts` `addImported(...)` según [contracts/import.md](contracts/import.md) con dependencias inyectables `{ putOriginal, deleteOriginal }` (por defecto las de `src/import/originals.ts`) y `findByHash(hash)` (hace pasar T024)
- [ ] T034 [US1] Crear `src/components/ImportDialog.tsx`: diálogo modal (`role="dialog"`, `aria-modal`, foco inicial en el título, Escape = Cancelar) con estados `checking` («Comprobando el archivo…» + Cancelar que aborta el `AbortController`), `summary` (campo de título; selector de nivel 1–4 con el sugerido marcado «(sugerido)»; una o dos manos, compás «4/4»/«3/4», tempo en ppm, compases y notas; lista de avisos en español con sus compases: `handsSplit` «Las manos se han repartido automáticamente (notas desde el Do central hacia arriba, mano derecha).», `chords` «Los acordes se han reducido a una nota por mano», `durations` «Algunas duraciones se han ajustado», `cutAtBar` «Algunas notas se han acortado en la barra de compás», `dropped` «Se han quitado notas demasiado cortas», `grace` «Se han omitido las notas de adorno», `farFromOriginal` «La pieza importada puede diferir bastante del original»; Cancelar / Añadir), `saving` y `noSpace` («No queda espacio en este dispositivo. Borra alguna pieza importada.»). Nombres de nota en los avisos, si los hay, con la notación de Ajustes. Al añadir, llama a `addImported` y cierra
- [ ] T035 [US1] En `src/screens/Songs.tsx`, añadir bajo la barra superior un grupo de acciones con «Importar archivo» (botón que hace `click()` sobre un `<input type="file" accept=".mid,.midi,.musicxml,.xml,.mxl" hidden>`; al elegir, abre `ImportDialog` con el archivo y limpia el `value` del input para poder elegir el mismo archivo otra vez); en las tarjetas con `isImported(s.id)`, la etiqueta «Importada» junto a «Dos manos»; tras añadir, desplazar la lista hasta la tarjeta nueva (`scrollIntoView`)
- [ ] T036 [P] [US1] En `src/styles.css`, estilos del grupo de acciones de Canciones, del diálogo (`.dialog-backdrop`, `.dialog` centrado, ancho máx. 520 px, `max-height: calc(100dvh - 32px)` con `overflow: auto` interno, zonas táctiles ≥ 40 × 40) y de `.tag.imported`, con las variables de tema existentes para claro y oscuro; en `(orientation: landscape) and (max-height: 500px)` el diálogo ocupa casi todo el alto y se desplaza por dentro (FR-018)

**Checkpoint**: quickstart §3 pasos 2–5 y 8 correctos; `npm test` en verde (incluida la ida y vuelta de las 12 piezas en MIDI y MusicXML)

---

## Phase 4: User Story 2 - Saber por qué un archivo no se puede importar (Priority: P1)

**Goal**: cada archivo no válido se rechaza con un mensaje claro en español y sin tocar la lista.

**Independent Test**: quickstart §3 paso 6 y §1 SC-004: archivo de texto renombrado a `.mid`, MIDI cortado, MIDI vacío, MIDI de batería y un MusicXML de orquesta.

### Tests (escribir primero, deben fallar)

- [ ] T037 [P] [US2] Ampliar `src/music/import/midi.test.ts`: bytes al azar → `ImportError("unreadable")`; `songToMidi(oda)` cortado a la mitad → `unreadable`; cabecera con longitud de pista mayor que el archivo → `unreadable`; `midiToRaw` con notas en canal 10 → `notPiano: true`; con `C0 28` (violín) en un canal con notas → `notPiano: true`
- [ ] T038 [P] [US2] Ampliar `src/music/import/convert.test.ts` con los rechazos: sin notas → `empty`; `notPiano` → `notPiano`; 3 partes con notas → `tooManyParts`; nota 120 y nota 10 → `badNotes` con `count: 2` y sus compases; duración `NaN` o ≤ 0 → `badNotes`; compás 6/8 → `timeSignature`; 4/4 y luego 3/4 → `timeSignature`; compás 2/2 → `timeSignature`
- [ ] T039 [P] [US2] Ampliar `src/import/musicxml.test.ts`: XML mal formado → `unreadable`; raíz `score-timewise` u `opus` → `ImportError("notScore")`; dos `<part>` con notas → 2 partes (la conversión dará `tooManyParts`); `<midi-program>41` → `notPiano`
- [ ] T040 [P] [US2] Crear `src/import/check.test.ts` (`// @vitest-environment happy-dom`): `File` de 5 MB + 1 byte → `tooLarge` sin leerlo; texto plano con extensión `.mid` → `unreadable`; MIDI válido con extensión `.xml` → se lee como MIDI (el formato se detecta por contenido); abortar el `signal` antes de terminar → la promesa rechaza con `AbortError`

### Implementation

- [ ] T041 [US2] Completar el paso 1 de `convertPiece` en `src/music/import/convert.ts`: en este orden `empty` → `notPiano` → `tooManyParts` (> 2 partes con notas) → `badNotes` (altura fuera de 21–108, o `start`/`dur` no finitos o `dur ≤ 0`; `detail.count` y `detail.bars` en base 1) → `timeSignature` (`beatType ≠ 4`, `beats ∉ {3, 4}` o más de un compás distinto en `times`) (hace pasar T038)
- [ ] T042 [P] [US2] Completar en `src/music/import/midi.ts` y `src/import/musicxml.ts` las detecciones de T037 y T039 que falten (límites de lectura, `notScore` para `score-timewise`/`opus`)
- [ ] T043 [US2] Completar `checkFile` en `src/import/check.ts` para T040 (tamaño antes de leer, detección por contenido)
- [ ] T044 [US2] Añadir a `src/components/ImportDialog.tsx` el estado `rejected` con los mensajes de [data-model.md](data-model.md) por `RejectReason` («El archivo pasa de 5 MB.», «El archivo no se puede leer. Puede estar dañado o no ser MIDI ni MusicXML.», «Exporta la partitura como MusicXML de una sola obra.», «El archivo no contiene notas.», «Solo se pueden importar piezas de piano.», «Solo se pueden importar piezas de piano a una o dos manos.», «N notas no se pueden leer (compases …).», «Solo se admiten compases de 4/4 y 3/4.») y un botón Aceptar que cierra sin añadir nada

**Checkpoint**: quickstart §3 paso 6; ningún archivo no válido llega a la lista ni produce un error en consola sin capturar

---

## Phase 5: User Story 3 - Aviso de pieza demasiado compleja (Priority: P2)

**Goal**: las piezas de más de 300 compases o 1 500 notas muestran un aviso de rendimiento y se pueden añadir igualmente.

**Independent Test**: quickstart §3 paso 9 con una pieza de más de 300 compases.

- [ ] T045 [P] [US3] Ampliar `src/music/import/convert.test.ts`: pieza generada de 301 compases → `heavy: true`; de 1 501 notas en menos de 300 compases → `heavy: true`; exactamente 300 compases y 1 500 notas → `heavy: false`
- [ ] T046 [US3] En `src/components/ImportDialog.tsx`, si `proposal.heavy`, mostrar el aviso «Esta pieza es muy larga o tiene muchas notas: puede ir lenta en este dispositivo.» destacado en el resumen y cambiar el botón a «Añadir igualmente» (FR-011)

**Checkpoint**: quickstart §3 paso 9 (aviso y alta); la medida de rendimiento se hace en Polish

---

## Phase 6: User Story 4 - Gestionar las piezas importadas (Priority: P3)

**Goal**: editar título y nivel, borrar con confirmación (también su original, estrellas y «Continuar») y detectar archivos ya importados.

**Independent Test**: quickstart §3 pasos 7 y 11.

### Tests (escribir primero, deben fallar)

- [ ] T047 [P] [US4] Ampliar `src/state/imported.test.ts`: `editImported(id, { title: "Nuevo", level: 2 })` cambia `def.title` y el número de `def.level` («Nivel 2 · Importada de …») y conserva `def.id` y `progress.best[id]`; título vacío o solo espacios → no cambia y devuelve `false`; `editImported` de un id del repertorio → `false`; `removeImported(id, deps)` quita la pieza, llama a `deleteOriginal(id)` y a `forgetSong(id)`; `findByHash(hash)` encuentra la pieza importada con ese archivo

### Implementation

- [ ] T048 [US4] Añadir `editImported` y `removeImported` en `src/state/imported.ts` (hace pasar T047)
- [ ] T049 [US4] En `src/components/ImportDialog.tsx`, estado `duplicate` antes del resumen cuando `findByHash(hash)` existe: «Ya importaste este archivo como “X”.» con Cancelar / Añadir otra copia (FR-015); y modo `edit` (título y nivel de una importada, Guardar / Cancelar) que usa `editImported`
- [ ] T050 [US4] En `src/screens/Songs.tsx`, en las tarjetas importadas, botón «⋯» (`aria-label="Opciones de X"`, fuera del enlace de la tarjeta para no abrir la lección) que abre un `Popover` (`src/components/Popover.tsx`) con «Editar» (abre `ImportDialog` en modo `edit`) y «Borrar» (confirmación «¿Borrar “X” y sus estrellas?» con Cancelar / Borrar → `removeImported`). Las piezas incluidas no muestran el botón (FR-014)
- [ ] T051 [P] [US4] En `src/styles.css`, estilos del botón «⋯» de la tarjeta (≥ 40 × 40, sin alterar el alto de la tarjeta) y del diálogo de confirmación

**Checkpoint**: quickstart §3 pasos 7 y 11

---

## Phase 7: User Story 5 - Importar desde servidor, deshabilitado (Priority: P3)

**Goal**: botón visible y deshabilitado para una función futura.

**Independent Test**: quickstart §3 paso 1.

- [ ] T052 [US5] En `src/screens/Songs.tsx`, junto a «Importar archivo», botón «Importar de servidor» con `disabled`, `aria-disabled="true"` y el texto visible «Próximamente» (p. ej., como etiqueta pequeña dentro del botón); sin manejador de clic (FR-002)
- [ ] T053 [P] [US5] En `src/styles.css`, estilo deshabilitado del botón (contraste suficiente en claro y oscuro, cursor `not-allowed`)

**Checkpoint**: quickstart §3 paso 1

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: archivos de prueba, verificación completa y medidas

- [ ] T054 [P] Crear `scripts/export-fixtures.mjs` que escribe en `dev-fixtures/` las 12 piezas como `<id>.mid`, `<id>.musicxml` y `martinillo-una-pista.mid` (usando `src/music/import/fixtures.ts`, ejecutable con `node` 24, que importa `.ts` directamente) y los archivos no válidos de los tests (`texto.mid`, `cortado.mid`, `vacio.mid`, `bateria.mid`, `tres-pistas.mid`, `seis-octavos.musicxml`, `opus.musicxml`)
- [ ] T055 Ejecutar `npm test` y `npm run build` y corregir lo que falle (tests anteriores sin cambios)
- [ ] T056 Recorrer [quickstart.md](quickstart.md) §3 completo en escritorio, en móvil apaisado (640 × 320) y en tema oscuro, con archivos de `dev-fixtures/` y 3–4 piezas reales de dominio público (una `.mxl`, una de una sola pista con acordes y una de más de 300 compases)
- [ ] T057 Medir en un móvil de gama media: tiempo hasta el resumen de un archivo de unos 300 compases (< 2 s, SC-005) y respuesta a la nota y fluidez del cursor en una pieza de unas 1 500 notas (SC-006); anotar resultados en [research.md](research.md) R7 y R9, y si no se cumplen, ajustar `HEAVY` en `src/music/import/convert.ts`
- [ ] T058 [P] Comprobar en DevTools que tras importar no hay errores en consola, que `tecla-imported` y la base IndexedDB `tecla` contienen lo esperado y que, al borrar, ambos quedan limpios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: tras Setup; bloquea todas las historias
- **US1 (Phase 3)**: tras Foundational
- **US2 (Phase 4)**: tras T028, T029, T032 y T034 (amplía conversión, lectores, comprobación y diálogo)
- **US3 (Phase 5)**: tras T028 y T034
- **US4 (Phase 6)**: tras T033, T034 y T035
- **US5 (Phase 7)**: tras Foundational (solo toca `Songs.tsx`; hacerlo después de T035 evita conflictos)
- **Polish**: al final

### Within Each User Story

- Tests antes que la implementación que los hace pasar
- `types.ts` y `errors.ts` (T009, T010) antes que cualquier módulo de `src/music/import/`
- `level.ts` (T027) antes que `convert.ts` (T028); `convert.ts` antes que `check.ts` (T032)
- Tareas sobre el mismo archivo son secuenciales: `convert.ts` (T028 → T041), `ImportDialog.tsx` (T034 → T044 → T046 → T049), `Songs.tsx` (T016 → T035 → T050 → T052), `styles.css` (T036 → T051 → T053), `imported.ts` (T011 → T033 → T048)

### Parallel Opportunities

- Phase 2: T004, T005 y T006; después T008, T009 y T010; después T013–T016
- US1 tests: T017–T024 a la vez (T018–T020 necesitan T017 para compilar, pero se escriben a la vez)
- US1 implementación: T025, T026, T029, T030 y T031 a la vez; luego T027 → T028 → T032
- US2 tests: T037–T040 a la vez
- US3 y US5 pueden ir en paralelo con US4 si se coordinan los archivos compartidos

---

## Parallel Example: User Story 1

```bash
# Tests a la vez:
Task: "Generadores songToMidi/songToMusicXml en src/music/import/fixtures.ts"
Task: "Tests del parser MIDI en src/music/import/midi.test.ts"
Task: "Tests de conversión e ida y vuelta en src/music/import/convert.test.ts"
Task: "Tests de nivel contra las 12 piezas en src/music/import/level.test.ts"
Task: "Tests de MusicXML con happy-dom en src/import/musicxml.test.ts"
# Lectores y almacenamiento a la vez:
Task: "parseMidi y midiToRaw en src/music/import/midi.ts"
Task: "parseMusicXml en src/import/musicxml.ts"
Task: "unzipMxl en src/import/mxl.ts"
Task: "IndexedDB en src/import/originals.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Rechazos de MIDI en src/music/import/midi.test.ts"
Task: "Rechazos de conversión en src/music/import/convert.test.ts"
Task: "Rechazos de MusicXML en src/import/musicxml.test.ts"
Task: "Comprobación de archivo en src/import/check.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2 (la app sigue igual)
2. Phase 3 (US1): importar, resumir, añadir y practicar
3. **STOP and VALIDATE**: quickstart §3 pasos 2–5 y 8 y la ida y vuelta de las 12 piezas

US2 es también P1 y conviene integrarla antes de publicar: sin ella, un archivo malo solo se
rechaza como «no se puede leer».

### Incremental Delivery

1. Setup + Foundational → commit
2. US1 → validar → commit
3. US2 → validar rechazos → commit (aquí ya se puede integrar en `main`)
4. US3 → commit
5. US4 + US5 → commit
6. Polish (medidas en móvil) → integrar en `main` (despliegue automático)

---

## Notes

- No tocar `src/engine/` ni `SongDef`; los tests existentes no cambian
- Ningún módulo de `src/music/import/` importa nada de `src/import/`, `react` ni APIs del navegador
- Las piezas importadas no se envían a ningún sitio (FR-013)
- Commit tras cada fase

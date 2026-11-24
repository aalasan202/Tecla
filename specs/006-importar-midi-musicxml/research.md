# Research: Importar canciones MIDI y MusicXML

Decisiones de la fase 0. Cada una: **Decisión**, **Razón**, **Alternativas**.

## Punto de partida (código actual)

| Hecho | Dónde | Consecuencia |
|-------|-------|--------------|
| Una pieza es `SongDef`: `n` (una mano) o `r` + `l`, cada una `[midi, pulsos][]`, `0` = silencio | `src/music/types.ts` | El importador produce un `SongDef`; motor, partitura, digitación y bucle no cambian. |
| Duraciones dibujadas: 0,5 · 1 · 1,5 · 2 · 3 · 4 (y silencios) | `src/components/Staff.tsx` | Conjunto de duraciones representables `D = {0.5, 1, 1.5, 2, 3, 4}`. |
| Compás = pulsos por compás (`bar`: 4, 3 o 2) | `score.ts`, `Staff.tsx`, `lesson.ts` | Cualquier compás de denominador 4 funciona; se admiten 4/4, 3/4 y 2/4 (clarificación 2026-11-24). |
| Las canciones se buscan en `SONGS` en `Home`, `LessonScreen`, `ProgressScreen`, `Songs` | `src/screens/` | Hace falta un catálogo `SONGS + importadas` para buscar, sin tocar los totales. |
| `Home` y `ProgressScreen` suman **todas** las entradas de `progress.best` | `Home.tsx:19`, `ProgressScreen.tsx:14` | Hoy solo hay ids del repertorio; con importadas habría que filtrar por `SONGS` (FR-019). |
| `createStore.set` traga los errores de `localStorage` | `src/state/store.ts` | FR-016 necesita saber si se guardó: `set` pasa a devolver `boolean`. |
| Tempo de la lección: 40–140, paso 5 | `LessonScreen.tsx:228` | El tempo importado se ajusta a ese rango. |
| Vitest en entorno `node` | `vite.config.ts` | DOMParser no existe en `node`; ver R3. |

## R1 · Lectura de MIDI

- **Decisión**: parser propio de Standard MIDI File (formato 0 y 1) en `src/music/import/midi.ts`,
  función pura `Uint8Array → MidiFile`: cabecera `MThd`, pistas `MTrk`, cantidades de longitud
  variable, *running status*, eventos de nota (note-on con velocidad 0 = note-off), program
  change, y metaeventos de nombre de pista (`03`), tempo (`51`), compás (`58`) y fin de pista.
  SysEx y el resto se saltan por su longitud. Cualquier lectura fuera de los límites o con una
  cabecera incorrecta lanza `ImportError("unreadable")`.
- **Razón**: el formato es pequeño y estable (~150 líneas). Al ser puro se prueba en `node`
  (Principio II) y no añade dependencia de producción (Principio V).
- **Alternativas**: `@tonejs/midi` (≈ 30 KB, hace lo mismo y más; no compensa la dependencia);
  `midi-file` (solo eventos, igual que el propio).

## R2 · De MIDI a partes

- **Decisión**:
  - Una **parte** es una pista con notas; en formato 0, cada canal con notas.
  - Canal 10 (percusión) con notas, o un *program change* fuera de los pianos GM (0–7) en un
    canal con notas → «no es piano» (FR-009). Sin *program change* se supone piano.
  - Más de 2 partes con notas → «no es piano a una o dos manos» (FR-009).
  - Con 2 partes, la de altura media más aguda es la derecha.
  - Pulsos = ticks / división (negra = 1). Si la división es SMPTE (bit alto) → ilegible.
  - Título: nombre de la primera pista; si no hay, nombre del archivo sin extensión.
  - Tempo: primer evento de tempo; si no hay, 120 (valor por defecto del estándar MIDI).
  - Compás: si no hay, 4/4 (estándar MIDI). Más de un compás distinto → rechazo (FR-010).
- **Razón**: son las reglas que siguen los editores de partituras al abrir un MIDI de piano.
- **Alternativas**: elegir pistas a mano (más pasos para quien empieza; queda para una versión
  posterior si hace falta).

## R3 · Lectura de MusicXML y `.mxl`

- **Decisión**:
  - `DOMParser` del navegador en `src/import/musicxml.ts` (fuera de `music/`, Principio I).
    Se recorre `score-partwise` y se produce la misma estructura neutra (`RawPiece`, ver
    [data-model.md](data-model.md)) que el MIDI. `score-timewise` y `opus` → ilegible con un
    mensaje propio («exporta la partitura como MusicXML de una sola obra»).
  - Una sola `<part>` con 1 o 2 `<staves>`; el pentagrama 1 es la derecha. Más partes con notas,
    o `<midi-program>` fuera de 1–8, → no es piano (FR-009).
  - Notas: `<pitch>` (step, alter, octave), `<duration>` en `divisions`, `<chord/>`,
    `<backup>`/`<forward>`, `<staff>`, `<tie type="start|stop">` (se unen). Notas `<grace>` y
    `<cue>` se ignoran con aviso. `<time>` y `<sound tempo>`/`<metronome>` dan compás y tempo;
    sin tempo, 90 (supuesto de la especificación).
  - `.mxl`: lector ZIP propio mínimo (directorio central, entradas *stored* o *deflate*)
    descomprimido con `DecompressionStream("deflate-raw")`; se abre el `rootfile` que indica
    `META-INF/container.xml` o, si falta, el primer `.xml`/`.musicxml` fuera de `META-INF`.
  - Tests: entorno `happy-dom` solo en los tests de `src/import/` (comentario
    `// @vitest-environment happy-dom`), como **dependencia de desarrollo**.
- **Razón**: el navegador ya trae un parser XML fiable; `DecompressionStream` está en las
  versiones actuales de Chrome, Edge, Firefox y Safari (16.4+) y en Node 24, así que no hace
  falta librería ZIP. `happy-dom` no llega al build.
- **Alternativas**: tokenizador XML propio dentro de `music/` (más código y más errores
  posibles); `fflate` o `jszip` (dependencias de producción para algo que el navegador ya hace);
  `jsdom` (más pesado que `happy-dom`).

## R4 · Conversión a lo que la práctica representa (FR-008, FR-010)

Función pura `convertPiece(raw, opts)` en `src/music/import/convert.ts`. Pasos por parte, en orden:

1. **Rechazos**: altura fuera de 21–108, o duración/inicio no numéricos → «notas no legibles»
   con número y compases (FR-007). Compás distinto de 4/4, 3/4 y 2/4, o cambios de compás → rechazo. En 2/4 ninguna nota pasa de
   2 pulsos (se corta en la barra).
2. **Reparto de manos** (una sola parte): si tiene notas simultáneas, cada nota con altura ≥ 60
   va a la derecha y < 60 a la izquierda (aviso «manos repartidas»). Sin notas simultáneas, toda
   la parte es la mano derecha (precisión de FR-008: «Martinillo» y «Au clair de la lune» bajan a
   Sol 3 y son de una mano).
3. **Cuantización de inicios** a la rejilla de corchea (0,5 pulsos).
4. **Una nota cada vez por mano**: entre las notas con el mismo inicio se queda la más aguda
   (derecha) o la más grave (izquierda). Aviso «acordes simplificados» con compases.
5. **Duraciones**: cada nota dura hasta su fin cuantizado, recortada por el inicio de la
   siguiente y por la barra de compás (aviso «nota cortada en la barra»). Si la duración no está
   en `D`, se toma la mayor de `D` que no la supere y el resto queda como silencio (aviso
   «duraciones ajustadas»). Duración < 0,5 tras cuantizar → 0,5 si cabe antes de la siguiente
   nota; si no, la nota se descarta (aviso).
6. **Huecos** → silencios; **final** → se completa con silencio hasta el compás completo y las
   dos manos acaban a la vez (como exige la validación del repertorio).
7. Si los avisos de simplificación afectan a más de la mitad de los compases → aviso
   «puede diferir bastante del original».

- **Razón**: la salida cumple las mismas reglas que el repertorio (cada mano en compases
  completos, duraciones válidas). La rejilla de corchea coincide con lo más breve que se dibuja.
- **Alternativas**: dividir las notas largas en notas ligadas (la partitura no dibuja ligaduras;
  queda para VexFlow); rejilla de semicorchea (produciría duraciones no dibujables).

## R5 · Nivel sugerido (FR-006)

Métricas sobre la pieza convertida: manos, compás, alteraciones (teclas negras), extensión de
la mano derecha en teclas blancas, proporción de notas de 0,5 pulsos y proporción de inicios
en los que suenan las dos manos a la vez.

| Nivel | Se cumple si… |
|-------|---------------|
| 4 | dos manos y (≥ 40 % de inicios simultáneos, o > 25 % de corcheas) |
| 3 | 3/4, alguna alteración, o dos manos (el 2/4 cuenta como el 4/4) |
| 2 | extensión de la derecha > 5 teclas blancas, o > 10 % de corcheas |
| 1 | el resto |

Se toma el nivel más alto que se cumpla. Comprobado con un script contra el repertorio: 12 de 12
coinciden. Ejemplos: «Himno a la alegría», 7 % de corcheas → 1; «Himno a dos manos», 30 % de
inicios simultáneos → 3; «Canon», 100 % → 4; «Preludio», solo 26 % simultáneos pero 78 % de
corcheas → 4 (sin la segunda condición salía 3). Los umbrales son constantes con nombre y un
test los fija contra las 12 piezas (SC-003).

- **Alternativas**: puntuación ponderada continua (más difícil de explicar y de ajustar).

## R6 · Almacenamiento (FR-013, FR-016) y duplicados (FR-015)

- **Decisión**:
  - Las piezas convertidas (`ImportedSong`, unos KB cada una) en `localStorage` con el
    `createStore` existente (`tecla-imported`). Se leen de forma síncrona al arrancar, así que
    `#leccion/<id>` funciona al abrir la app directamente en una lección importada.
  - Los **archivos originales** en IndexedDB (base `tecla`, almacén `originals`, clave = id de la
    pieza), con un envoltorio propio mínimo en `src/import/originals.ts`. Solo se leen para
    reconvertir en el futuro (VexFlow).
  - Al añadir: primero se guarda el original; si falla, no se añade nada. Después la pieza; si
    falla `localStorage`, se borra el original y se avisa (FR-016). `createStore.set` devuelve
    `true`/`false` según se haya guardado.
  - **Huella**: FNV-1a de 64 bits sobre los bytes del archivo, función pura en
    `src/music/import/hash.ts` (sin `crypto.subtle`, que exige contexto seguro).
  - **Id**: `imp-` + 8 caracteres de la huella; si ya existe (copia), se añade `-2`, `-3`…
- **Razón**: `localStorage` (≈ 5 MB) no basta para los originales (hasta 5 MB cada uno), pero sí
  para decenas de piezas convertidas. IndexedDB admite cientos de MB. Separarlos mantiene el
  catálogo síncrono, como el progreso y los ajustes.
- **Alternativas**: todo en IndexedDB (catálogo asíncrono: pantallas con estado de carga, más
  cambios); `idb-keyval` (dependencia para ~40 líneas); originales en `localStorage` (se llena
  con 1–2 archivos).

## R7 · No bloquear la app (FR-017, SC-005)

- **Decisión**: la comprobación corre en el hilo principal como función `async` que cede el
  control entre fases (`await` a un `setTimeout(0)`) y respeta un `AbortSignal` (botón
  Cancelar). El diálogo muestra «Comprobando…» antes de empezar a leer.
- **Razón**: con el límite de 5 MB, leer y convertir lleva décimas de segundo. Un Web Worker no
  tiene `DOMParser`, así que obligaría a un parser XML propio (R3).
- **Alternativas**: Web Worker con tokenizador XML propio (más código; se reconsidera si las
  medidas del quickstart superan 2 s).

## R8 · Catálogo y totales (FR-012, FR-019)

- **Decisión**: `src/state/library.ts` con `allSongs()`, `findSong(id)`, `useLibrary()` y
  `isImported(id)`. `Songs`, `LessonScreen` y «Continuar» usan el catálogo. Los totales de
  `Home` y `ProgressScreen` filtran `progress.best` a los ids de `SONGS`. La lista por pieza de
  Progreso sigue mostrando solo el repertorio.
- **Nivel en `SongDef`**: `level = "Nivel N · Importada de MIDI|MusicXML"`, de modo que
  `levelOf` y `detailOf` de `Songs.tsx` siguen funcionando sin cambios.
- **Ancho por pulso** (`px`): 50; 60 si más del 25 % de las notas son corcheas (como «Preludio»).

## R9 · Rendimiento de piezas grandes (FR-011, SC-006)

- **Decisión**: umbral de aviso de la especificación (más de 300 compases o más de 1 500 notas)
  como constantes. El quickstart mide una pieza de 1 500 notas en un móvil de gama media:
  respuesta a la nota y fluidez del cursor. Si no se cumple el objetivo de < 50 ms, se baja el
  umbral (la partitura dibuja todas las notas en un SVG).
- **Alternativas**: dibujar solo los compases visibles (cambio en `Staff`; fuera de alcance
  salvo que la medida lo exija).

# Research: Sonido de piano real

Decisiones de Phase 0. No quedan puntos «NEEDS CLARIFICATION» en el contexto técnico.

## R1. Banco de muestras

- **Decision**: Salamander Grand Piano V3 (Alexander Holm, Yamaha C5), licencia
  **CC BY 3.0**. Se usa un solo nivel de intensidad y una muestra **cada 3 semitonos** (Do, Re♯,
  Fa♯ y La de cada octava), de La0 (21) a Do8 (108): **30 archivos**.
- **Rationale**: es el banco libre de piano más usado en la web, suena bien y su licencia permite
  redistribuirlo con atribución (FR-011). Con una muestra cada 3 semitonos, ninguna nota se
  transpone más de ±1 semitono (más de ±2 o 3 semitonos ya altera el timbre).
- **Alternatives considered**:
  - *University of Iowa MIS Piano* (dominio público): grabaciones sueltas que hay que cortar y
    normalizar a mano; más trabajo y sin ventaja de licencia relevante.
  - *Muestras de los soundfonts de MIDI.js / FluidR3*: calidad inferior y licencias mezcladas.
  - *Una muestra por octava*: transposiciones de ±6 semitonos que suenan artificiales.
  - *Varias intensidades*: multiplica el tamaño; fuera de alcance (spec, Assumptions).

## R2. Formato y tamaño

- **Decision**: **MP3 estéreo a 128 kbit/s**, recortado a una duración máxima de 4 s (6 s en las
  dos octavas más graves) con fundido final de 0,5 s y volumen normalizado. Los archivos se
  preparan **una sola vez** con un script de desarrollo (`scripts/prepare-piano.mjs`, usa
  `ffmpeg` instalado en el equipo) y se guardan en el repositorio en
  `public/samples/piano/`. Presupuesto: **≤ 3 MB** en total (SC-003 pide ≤ 5 MB).
- **Rationale**: MP3 se decodifica con `decodeAudioData` en todos los navegadores objetivo,
  Safari incluido. 30 × ~4 s × 16 KB/s ≈ 2 MB. Un piano casi nunca necesita más de 4 s de una
  nota en una lección de principiante; las notas largas se apagan con la envolvente.
- **Alternatives considered**:
  - *Ogg Opus*: más pequeño, pero el soporte en Safari para `decodeAudioData` no es fiable en
    todas las versiones objetivo.
  - *WAV/FLAC*: decenas de MB.
  - *Descargar del CDN de Tone.js en tiempo de ejecución*: depende de un tercero (Principio V) y
    de su disponibilidad; las muestras completas pesan más.

- **Ajuste en la implementación**: los MP3 que publica Tone.js ya pesan **1,92 MB** en total
  (30 archivos), dentro del presupuesto, así que no se recortan ni se recodifican y no hace
  falta `ffmpeg`. `scripts/prepare-piano.mjs` solo los descarga y comprueba el tamaño.

## R3. Reproducción

- **Decision**: Web Audio puro, sin dependencias. Cada nota crea una *voz*:
  `AudioBufferSourceNode` (muestra más cercana, `playbackRate = 2^(Δsemitonos/12)`) → `GainNode`
  con envolvente → el `master` existente (con su compresor). Liberación: a los `seconds`
  pedidos, la ganancia cae con `setTargetAtTime` (constante 0,12 s) y la fuente se detiene
  0,6 s después.
- Repetir una nota que ya suena apaga la voz anterior en 30 ms (como el apagador de un piano),
  para que no se acumulen voces ni suba el volumen.
- `volume` (0,22–0,32 hoy) se escala con un factor fijo para que piano y sintetizador tengan una
  sonoridad parecida (se ajusta a oído en la prueba manual).
- **Rationale**: es lo mínimo que cumple FR-001..FR-005; el `master` y el compresor actuales ya
  evitan la saturación con acordes (FR-005).
- **Alternatives considered**: *Tone.js* (`Sampler` hace justo esto) — añade ~150 KB y una
  dependencia de producción para unas 80 líneas de código propio; se rechaza por el
  Principio V. *smplr / soundfont-player*: misma objeción, y descargan muestras de un CDN.

## R4. Carga y reserva

- **Decision**: la descarga de los 30 archivos empieza al arrancar la app (en paralelo, sin
  esperar a ningún gesto). La decodificación necesita un `AudioContext`; se hace en cuanto
  existe (primer gesto, `ensureAudio()`), o al terminar la descarga si ya existe. El piano pasa
  a **listo** solo cuando las 30 muestras están decodificadas (todo o nada). Hasta entonces, y
  para siempre si algo falla, `playTone` usa el sintetizador actual (FR-007, FR-008).
- **Rationale**: «todo o nada» evita mezclar dos timbres dentro de una misma melodía. Crear el
  `AudioContext` antes del gesto provoca avisos en Chrome, así que se descarga antes pero se
  decodifica después.
- **Alternatives considered**: *carga progresiva nota a nota*: mezclaría timbres; *bloquear la
  lección hasta que cargue*: contradice «nunca mudo» y el uso sin conexión.

## R5. Caché en el navegador

- **Decision**: **Cache Storage API** (`caches.open("tecla-piano-v1")`) sin service worker: si
  la respuesta está en caché se usa; si no, se descarga y se guarda. Si `caches` no existe
  (contexto no seguro) se usa `fetch` normal y la caché HTTP. Cambiar las muestras implica subir
  la versión del nombre y borrar las cachés antiguas.
- **Rationale**: GitHub Pages solo cachea 10 minutos por HTTP; Cache Storage da visitas
  siguientes en < 1 s (SC-004) y sin red. El futuro PWA de la v0.4 podrá reutilizar la misma
  caché.
- **Alternatives considered**: *IndexedDB* con los ArrayBuffer: más código para lo mismo;
  *service worker ahora*: pertenece a la funcionalidad PWA.

## R6. Atribución

- **Decision**: `public/samples/piano/LICENSE.txt` con el texto de atribución, y una línea en
  **Ajustes**: «Sonido de piano: Salamander Grand Piano, de Alexander Holm (CC BY 3.0)», con
  enlace a la licencia.
- **Rationale**: lo exige CC BY y cumple FR-011.

## R7. Dónde vive el código y qué se prueba

- **Decision**: `src/audio/synth.ts` conserva su API pública (`ensureAudio`, `playTone`,
  `playClick`), así que ni el motor ni las pantallas cambian (FR-010). Se añaden:
  - `src/audio/samples.ts`: funciones puras (lista de muestras, URL, muestra más cercana y
    `playbackRate`), **con tests** en `src/audio/samples.test.ts`.
  - `src/audio/piano.ts`: descarga, caché, decodificación y voces (navegador; prueba manual).
  - El sintetizador actual pasa a una función interna `synthTone`, usada como reserva.
- **Rationale**: el Principio II no exige tests en `src/audio/`, pero la elección de muestra y
  la afinación son lógica musical fácil de probar sin navegador.

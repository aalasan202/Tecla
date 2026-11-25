# Research: Pedal de resonancia (sustain) desde el nivel 3

Decisiones técnicas de la funcionalidad 009. Cada una resuelve una pregunta abierta del
Technical Context de [plan.md](plan.md) o una ambigüedad que la especificación dejaba al plan.

## R1. Cómo se escribe el pedal en una pieza

- **Decision**: campo opcional `pedal?: PedalSpan[]` en `SongDef`, con `PedalSpan = [from, to]`
  en pulsos de negra (la misma unidad que las duraciones de las pistas). Dos tramos contiguos
  (`a[1] === b[0]`) son un **cambio de pedal**. El pedal pertenece a la pieza, no a una mano.
- **Rationale**: en piano el pedal es único para las dos manos, así que no encaja como opción de
  `TrackEvent`. Los pulsos absolutos se escriben y revisan fácil junto a las pistas, y como el
  tick (1/48 de negra) ya está definido, la validación reutiliza `TICKS`. La forma de tupla
  sigue el estilo compacto de `TrackEvent`.
- **Alternatives considered**:
  - Marcas `pedal: "down" | "up" | "change"` en los eventos de una mano: obligan a elegir una
    mano y se rompen al transportar o reutilizar pistas (`shift`, `BASE.find(...)`).
  - Compases y pulso dentro del compás: más legible a ojo, pero obliga a convertir en todos los
    sitios (sonido, dibujo, importación).

## R2. Qué piezas incluidas llevan pedal (FR-003, aclaración Q1)

Criterio: lleva pedal toda pieza de nivel 3 o 4 con **acompañamiento**, es decir, con una mano
que sostiene notas largas, acordes o arpegios bajo la melodía. No lo llevan las piezas a una
sola línea melódica ni aquellas en las que las dos manos tocan líneas melódicas (pregunta y
respuesta, cánones), porque el pedal emborronaría la imitación.

| Pieza (id) | Nivel | Pedal | Justificación |
|------------|-------|-------|---------------|
| minueto | 3 | No | Una mano, línea melódica |
| elisa | 3 | No | Una mano, línea melódica |
| pregunta | 3 | No | Las manos alternan frases melódicas, sin acompañamiento |
| oda2 | 3 | Sí | Mano izquierda en redondas y blancas: un tramo por armonía |
| oda-acordes | 3 | Sí | Acordes por medio compás: cambio en cada acorde |
| cuna | 3 | Sí | Acompañamiento en 3/4: un tramo por compás |
| largo | 3 | Sí | Bajo en redondas: un tramo por compás |
| despedida | 3 | Sí | Acompañamiento de la mano izquierda: un tramo por armonía |
| nochedepaz | 3 | Sí | Bajo con puntillo en 3/4: un tramo por compás |
| estrellita2 | 4 | Sí | Bajo en blancas y redondas: un tramo por armonía |
| canon | 4 | Sí | Bajo de Pachelbel en blancas: cambio con cada bajo |
| preludio | 4 | Sí | Arpegios: un tramo por compás (pedal clásico de la pieza) |
| greensleeves | 4 | Sí | Bajo en negra con puntillo, 6/8: un tramo por compás |
| martinillo-canon | 4 | No | Canon: dos líneas melódicas |
| rema | 4 | No | Canon: dos líneas melódicas |
| elisa2 | 4 | Sí | Arpegios de la mano izquierda: un tramo por arpegio |

Resultado: 11 piezas con pedal (6 de nivel 3 y 5 de nivel 4) y 5 sin pedal, de las 16 de los niveles 3–4. Los tramos se
escriben a mano siguiendo los cambios de armonía. Se pisa con el inicio de la armonía y se
cambia justo con la siguiente; en Tecla los dos tramos se tocan en el mismo pulso (la técnica
del pedal sincopado, levantar un poco después, no se modela).

## R3. Cuándo se muestra y suena el pedal: regla única por nivel

- **Decision**: el pedal de una pieza (incluida o importada) solo **se usa** si su nivel actual
  es 3 o mayor. `levelOf` pasa de `src/screens/Songs.tsx` a `src/music/` para que `buildScore`
  lo use: `score.pedals = levelOf(song) >= 3 ? song.pedal ?? [] : []`. En el repertorio
  incluido, `validateSong` además **rechaza** `pedal` en los niveles 1–2 (FR-002).
- **Rationale**: una sola regla cubre las incluidas, las importadas (aclaración Q4) y el caso
  que la aclaración dejó abierto: si el alumno cambia a mano el nivel de una pieza importada,
  el pedal aparece o desaparece con el nuevo nivel, sin perderse, porque sigue guardado.
- **Alternatives considered**: borrar el pedal al importar en los niveles 1–2. Se pierde si el
  alumno sube luego el nivel de la pieza.

## R4. Sonido de la reproducción: duración prolongada por el pedal

- **Decision**: función pura `sustainedEnd(note, pedals)` en `src/music/pedal.ts`. Si la nota
  termina dentro de un tramo (`from < fin < to`), su sonido dura hasta `to`; si no, hasta su
  propio final. El motor la usa en `sound()` para todas las notas que toca él (Escuchar y
  acompañamiento automático de la otra mano en Aprender y Tocar), y sigue recortando al final
  del fragmento en bucle.
- **Rationale**: `LessonHost.tone(m, seconds)` ya programa el apagado al cabo de `seconds`, así
  que basta con alargar la duración, sin cambiar la interfaz del motor. Un cambio de pedal
  (tramos contiguos) apaga las notas del primero justo en el inicio del segundo (escenario US3-2).
  Una nota que empieza en el tramo y termina después de él no se toca (`fin >= to`).
- **Alternatives considered**: un evento de pedal `host.pedal(down)` y que el audio lleve la
  cuenta. Es más fiel, pero obliga al motor a enviar eventos temporizados aparte y a mantener
  estado de audio sincronizado; la duración calculada da el mismo resultado audible.

## R5. Liberar el sonido al parar, salir o repetir el bucle (FR-010, SC-005)

- **Decision**: nuevo método opcional `release?(): void` en `LessonHost`. El motor lo llama en
  `stop()` y al empezar cada repetición del bucle. `LessonScreen` lo conecta con una función
  nueva de `src/audio/synth.ts`, `releaseAll()`, que apaga en ~0,1 s todas las voces que suenan
  (piano de muestras y sintetizador de reserva). Para ello el sintetizador lleva también un
  registro de voces activas, como ya hace `piano.ts`.
- **Rationale**: con el pedal las notas pueden durar varios segundos; hoy `stop()` deja sonar
  lo programado. Así se garantiza «ninguna nota más de un segundo» sin tocar la interfaz
  `tone`. El método es opcional, así que `testHost` y los tests existentes no cambian.
- **Alternatives considered**: cortar solo las notas «largas». Exige que el motor sepa qué
  sonidos siguen vivos, y esa es información de audio (Principio I).

## R6. Pedal del teclado MIDI del alumno (FR-009, aclaración Q2)

- **Decision**:
  - `useMidi` reconoce Control Change 64 (`(st & 0xf0) === 0xb0 && data1 === 64`). Con un valor
    ≥ 64 el pedal está pisado y con < 64 levantado (umbral estándar; sin medio pedal). Llama a un
    nuevo `onPedal(down)` además de `onNoteOn`.
  - `MidiProvider` recibe `onPedal` como prop y `App.tsx` le pasa `setSustain` de
    `src/audio/synth.ts`. Al cambiar el estado de los dispositivos (desconexión) se llama
    `onPedal(false)`.
  - `setSustain(true)`: cada `playTone` mientras el pedal está pisado guarda su fin nominal y
    programa un apagado largo (como máximo `SUSTAIN_MAX = 8 s`, lo que dura la resonancia
    natural de una muestra). `setSustain(false)`: las voces cuyo fin nominal ya pasó se apagan
    en ~0,1 s, y las demás vuelven a su fin nominal.
- **Rationale**: el efecto es global, como en un piano real, y vale en todas las pantallas que
  suenan, incluida Piano libre. El pedal nunca llega al motor, así que la evaluación no puede
  depender de él por construcción (FR-007).
- **Alternatives considered**: pasar el pedal por `LessonHost`/`input`. Mezclaría sonido y
  evaluación, y obligaría a demostrar que no puntúa. Además Piano libre no usa el motor.

## R7. Dibujo del pedal en la partitura (FR-005, FR-006, aclaración Q3)

- **Decision**: se dibuja con SVG propio en `ScoreView`, no con `PedalMarking` de VexFlow. Una
  fila de pedal bajo el pentagrama inferior, en la geometría (`geometryOf` añade `pedalRow` y
  baja las filas de nombres solo si la pieza tiene pedal). Cada tramo es una línea de
  `layout.xAt(from)` a `layout.xAt(to)`, con:
  - un gancho vertical al pisar (inicio sin tramo anterior contiguo);
  - una muesca en «V» en cada cambio (fin de un tramo e inicio del siguiente en el mismo pulso);
  - un gancho vertical al levantar.

  Si `to` es el final de la pieza, el gancho de levantar queda en la doble barra final. El
  color usa `currentColor` y las variables del tema, como el resto de capas propias.
- **Rationale**: VexFlow 5 sí tiene `PedalMarking` con muesca, pero se ancla a `StaveNote` y la
  partitura se dibuja por tramos de 8 compases (research R10 de 007): un tramo de pedal que
  cruce el límite habría que partirlo y cerrarlo a mano, como hoy se hace con las ligaduras.
  Con coordenadas de `layout` la línea es continua por construcción (escenario US1-5), sigue el
  tema sin tocar estilos de VexFlow y se prueba sin navegador (la geometría de la línea sale de
  una función pura).
- **Alternatives considered**: `PedalMarking` de VexFlow. Se descarta por el troceado en tramos
  de dibujo y porque mezclaría el estado del dibujo con el de las marcas.

## R8. Bucle de compases

- **Decision**: con un bucle activo, la línea de pedal **también se recorta** al fragmento
  (decisión del responsable del proyecto, 2026-11-25). Una función pura
  `clipPedals(pedals, from, to)` limita cada tramo al rango en pulsos del fragmento y descarta los
  que quedan fuera. La capa de pedal dibuja `pedalMarks(clipPedals(...))`, así que un tramo
  cortado lleva su gancho de pisar o de levantar en el borde del fragmento, que es justo lo que
  suena. Fuera del fragmento no se dibuja pedal. Al quitar el bucle, vuelve la línea completa.
  El **sonido** se recorta igual: `sound()` ya limita la duración al final del fragmento, y
  `release()` corta al empezar cada repetición (R5).
- **Rationale**: lo que se ve coincide con lo que se oye en el bucle, como pide el caso límite
  de la especificación.
- **Alternatives considered**: dibujar la línea completa con el fragmento resaltado. Se
  descartó porque la línea de fuera sugiere un pedal que en el bucle no suena.

## R9. Importación de MIDI y MusicXML (FR-015, aclaración Q4)

- **Decision**:
  - **MIDI**: `readTrack` emite un evento `{ type: "pedal", tick, channel, down }` con CC 64
    (umbral 64). `midiToRaw` empareja pisar y levantar y los convierte en tramos en pulsos. Un
    pisado sin levantar dura hasta el final de la pista, y los eventos repetidos (pisar estando
    pisado) se ignoran.
  - **MusicXML**: en `<direction>`, `<direction-type><pedal type="start|stop|change|resume|discontinue"/>`
    en la posición actual de la medida (más `<offset>` si lo hay). `change` = cerrar y abrir en
    el mismo punto; `resume` cuenta como `start` y `discontinue` como `stop`; `continue` y
    `sostenuto` se ignoran. También `<sound damper-pedal="yes|no">` como alternativa.
  - `RawPiece` gana `pedal?: [number, number][]`. Una función pura `fitPedals(spans, song)`
    (en `src/music/pedal.ts`) ajusta cada extremo al inicio de nota más cercano (o al final de
    la pieza), descarta los tramos vacíos y fusiona solapes. `convertPiece` (versión
    simplificada) y `convertFull` (versión completa) la aplican, cada una sobre sus propias notas.
  - Las piezas importadas antes de 009 no tienen pedal. Como la versión completa ya se recalcula
    desde el original guardado (`originals.ts`), las que se recalculen lo ganan; no se migra nada más.
- **Rationale**: los tramos incoherentes nunca hacen fallar una importación (caso límite), y la
  regla de nivel de R3 decide si se ven.
- **Alternatives considered**: rechazar archivos con pedal incoherente. Contradice la
  especificación.

## R10. Explicación de primera vez (FR-011)

- **Decision**: nuevo ajuste `pedalHelpSeen: boolean` (por defecto `false`) en `settings`. Al
  abrir en `LessonScreen` una pieza con `score.pedals.length > 0` y el ajuste en `false`, se
  muestra un `Popover` junto a la fila de pedal con el texto: «Esta línea indica el pedal
  derecho (de resonancia): písalo con el pie donde empieza la línea, levántalo y vuelve a
  pisarlo en cada pico, y suéltalo donde termina. Es una indicación de lectura: no cuenta para
  la puntuación.» Con «Entendido» se guarda `true`.
- **Rationale**: reutiliza el componente y el almacén de ajustes que ya existen (Principio V).

## R11. Rasgo «Pedal» en las tarjetas (FR-014)

- **Decision**: se añade « · Pedal» al final del texto `level` de las 11 piezas de R2 (por
  ejemplo «Nivel 4 · Bach · Dos manos · Pedal»). El id, las notas, el tempo y el número de
  nivel no cambian (FR-013), y un test comprueba que una pieza incluida lleva «Pedal» en su
  `level` si y solo si tiene `pedal`.
- **Rationale**: `detailOf` ya muestra todo lo que sigue al nivel, sin cambios en `Songs.tsx`.
  El progreso se guarda por id, así que no se toca.

## R12. Que el pedal no puntúe (FR-007, SC-002)

- **Decision**: el motor no lee `score.pedals` para evaluar, solo para alargar el sonido
  (`sound()`). Un test toca cada pieza con pedal sin fallos y comprueba 3 estrellas. Otro
  compara el resultado de una pieza con y sin `pedal` ante la misma secuencia de entradas y
  exige un `LessonResult` idéntico. El pedal MIDI no llega al motor (R6).

# Research: Partitura profesional

Decisiones de la Fase 0. Cada una con lo decidido, por qué y qué se descartó.

## Punto de partida (código actual)

| Hecho | Dónde | Consecuencia |
|-------|-------|--------------|
| `SongDef`: cada mano es `[midi, pulsos][]`, `0` = silencio; `bar` = negras por compás | `src/music/types.ts` | Se amplía de forma compatible: las 12 piezas no se reescriben (FR-015). |
| `buildScore` crea una `ScoreNote` por nota con `x = STAFF_LEFT + s·px + 16` (espaciado proporcional al tiempo) | `src/music/score.ts` | El motor y la partitura comparten esa fórmula; hay que sustituirla por una función de posición común. |
| El motor agrupa por inicio (`groupByTime`) en Aprender y empareja por altura y distancia en Tocar | `src/engine/lesson.ts` | Un acorde = varias `ScoreNote` con el mismo `s` y la misma mano: Aprender ya espera a todas, en cualquier orden (FR-009). |
| El cursor y el clic del metrónomo usan `STAFF_LEFT + pos·px + 16` y `Math.floor(beat) % bar` | `lesson.ts` | 6/8 y el espaciado nuevo obligan a pasar por `score.xAt(beat)` y por un pulso de metrónomo distinto de la negra. |
| `Staff.tsx` dibuja SVG a mano y repinta cada nota como componente React con su marca | `src/components/Staff.tsx` | Se sustituye entero (FR-021); las marcas pasan a aplicarse sobre el SVG ya dibujado. |
| Las alteraciones se calculan por compás y mano en el componente, solo con sostenidos | `Staff.tsx`, `theory.ts` | La ortografía (Fa♯ o Sol♭, armadura, becuadros) pasa a un módulo puro con tests (SC-003). |
| La importación (006) guarda el original en IndexedDB y produce un `SongDef` simplificado | `src/music/import/`, `src/import/` | La versión completa se obtiene del mismo `RawPiece` con otra conversión. |

## R1 · Motor de dibujo: VexFlow 5.0.0, cargado aparte

- **Decisión**: `vexflow@5.0.0` (versión exacta, MIT, una sola dependencia transitiva
  `structured-clone-es`), entrada `vexflow/bravura` (fuentes Bravura y Academico incrustadas en
  base64), importada de forma dinámica solo en la lección. Vite la deja en un chunk propio y el
  service worker lo precachea con el resto (`globPatterns` incluye `*.js`; el chunk, ≈ 0,73 MB,
  queda por debajo del límite de 2 MiB de Workbox).
- **Razón**: acordes con cabezas desplazadas en segundas, armaduras, alteraciones, ligaduras de
  prolongación y de expresión, tresillos, barras agrupadas por pulso y 6/8 son exactamente lo que
  un motor de grabado resuelve y lo que más cuesta hacer bien a mano (SC-003). VexFlow dibuja en
  SVG, deja controlar cada nota y no impone su propio formato de entrada.
- **Versión**: 5.0.0 es de marzo de 2025. Las 5.1–5.10 se publicaron entre el 16 y el 24 de
  noviembre de 2026: demasiado recientes para fijarlas. Se revisará al cerrar la funcionalidad.
- **Coste medido** (esbuild, minificado): entrada con fuentes 733 KB (389 KB gzip, el base64 no
  comprime); núcleo sin fuentes 341 KB (92 KB gzip). El bundle principal actual pesa 78 KB gzip,
  así que VexFlow no entra en él: Inicio, Canciones y Progreso no lo cargan.
- **Alternativas descartadas**:
  - *Ampliar el dibujo propio*: es la opción sin dependencias, pero colocar acordes con segundas,
    barras, tresillos, ligaduras y armaduras sin colisiones es un trabajo grande y frágil.
  - *OpenSheetMusicDisplay*: dibuja MusicXML con VexFlow debajo; más pesado y con menos control
    de cada nota (colores, posiciones fijas).
  - *Verovio*: WebAssembly de varios MB.
  - *abcjs*: exige pasar todo a ABC y da poco control del espaciado.
  - *`vexflow/core` + archivo `.woff2` aparte*: ahorra base64, pero el paquete no trae los
    `.woff2`; habría que extraerlos y mantenerlos. Se puede retomar si el tamaño molesta.

## R2 · Espaciado: posiciones propias, proporcionales al tiempo

- **Decisión**: las posiciones horizontales las calcula un módulo puro
  (`src/music/layout.ts`), no VexFlow. Cada compás empieza tras un margen (clave, armadura y
  compás al principio; alteraciones si las hay) y dentro de él cada inicio de nota va a
  `x = inicioDelCompás + margen + (s − inicio)·px`. El renderizador coloca cada `TickContext` de
  VexFlow en esa `x` tras el formateo (`tickContext.setX`). `xAt(beat)` interpola entre esos
  puntos y la usan el cursor, el desplazamiento y la selección de compases.
- **Razón**: el motor ya funciona con un tiempo proporcional a la distancia (cursor a velocidad
  constante, Aprender a tempo). Con el formateo propio de VexFlow el cursor iría a tirones. Además
  así las posiciones son puras y se prueban en `node` (VexFlow mide texto con un `<canvas>`).
- **`px` por defecto**: 50 por negra como hoy; si la pieza tiene notas muy seguidas, el
  mínimo sube para que dos inicios seguidos queden a ≥ 26 px (`px ≥ 26 / menor separación`).
  Se empezó con 18 px; en la prueba de «Greensleeves» los nombres («Sol♯») y las alteraciones
  de las semicorcheas se pisaban, así que se subió a 26 px (las corcheas pasan de 50 a 52 px).
- **Riesgo**: VexFlow podría recolocar modificadores (alteraciones, puntillos) al fijar las `x`.
  Primera tarea de la implementación: prueba visual de un compás con acorde en segunda,
  alteraciones y tresillo. **Alternativa** si falla: dejar formatear a VexFlow por compás con el
  ancho que da `layout.ts` y leer de vuelta la `x` de cada `TickContext` para construir `xAt`.

- **Resultado de la prueba** (2026-11-24, `spike/vexflow.html`, Chromium): un 4/4 con armadura de
  Sol, acorde Do–Re–Sol (segunda), Fa con becuadro, tresillo de corcheas, corchea con puntillo +
  semicorchea, negra con puntillo y acordes en clave de fa. Tras `Formatter.format`, fijar
  `tickContext.setX(x)` coloca cada inicio en su `x` y las alteraciones, puntillos, cabezas
  desplazadas, barras y el «3» del tresillo se mueven con la nota sin descolocarse. La cabeza
  queda en `stave.getNoteStartX() + Stave.padding + x`; el renderizador corrige ese desfase para
  que el centro de la cabeza caiga en la `x` de `layout`. El tresillo debe crearse antes de
  añadir las notas a la `Voice` (si no, «Too many ticks»). **Se adopta la decisión de R2**; la
  alternativa no hace falta.

## R3 · Modelo de datos ampliado y compatible

- **Decisión**: un evento de mano pasa a ser `[nota, pulsos, opciones?]`, donde `nota` es un
  número (como hoy), un array de números (acorde) o `0` (silencio). `opciones` admite
  `tie` (ligada a la siguiente), `slur` (`"start"`/`"end"`) y `spell` (ortografía forzada).
  En `SongDef` se añaden `key` (−7…7), `keyChanges` y `time` (`"6/8"`). Detalle en
  [data-model.md](data-model.md).
- **Duraciones**: siguen en negras. Las de tresillo se escriben como fracciones (`1/3`, `2/3`).
  `buildScore` las convierte a **ticks enteros**, 48 por negra (divisible por 2, 3, 4, 8, 12 y
  16), y rechaza las que no caen en un tick. Así no se acumulan errores de coma flotante.
- **Notas ligadas**: `buildScore` une una nota con `tie` y la siguiente de la misma altura en una
  sola `ScoreNote` con la duración sumada (FR-011). Cómo se dibuja (figuras ligadas, cortes en la
  barra) lo decide el grabado (R5), no el autor de la pieza: una nota de 2,5 pulsos se puede
  escribir como `[64, 2.5]` sin `tie`.
- **Alternativas**: un formato nuevo tipo MusicXML para el repertorio (reescribir las 12 piezas,
  más verboso); duraciones en ticks en los datos (rompe todas las piezas).

## R4 · Ortografía, armaduras y alteraciones

- **Decisión**: módulo puro `src/music/spelling.ts`:
  - `spell(m, key, override?) → { step, alter, octave }`: en tonalidades con sostenidos (y en Do)
    las teclas negras se escriben con sostenido; con bemoles, con bemol; `override` (de la pieza o
    del MusicXML) manda. Mi♯/Si♯/Do♭/Fa♭ solo con `override`.
  - `accidentals(notes, key)`: recorre cada compás por mano y decide qué alteración se dibuja
    (ninguna si coincide con la armadura o con una anterior del compás; becuadro para anular).
  - Los nombres de nota (`Do♯`, `Si♭`, `F♯`) salen de la misma ortografía, con la notación de
    Ajustes (FR-005).
- **Razón**: SC-003 exige cero errores de alteraciones; es lógica musical, va en `src/music/`
  con tests (Principio II), no en el componente.

## R5 · Grabado: de la partitura lógica a figuras

- **Decisión**: módulo puro `src/music/engrave.ts` que, por mano y por compás, convierte las
  `ScoreNote` (y los huecos) en **figuras** dibujables:
  - Parte cada nota o silencio en la barra de compás y en figuras representables (redonda…
    semicorchea, con puntillo), unidas por ligaduras de prolongación (FR-003).
  - En 6/8 agrupa por negra con puntillo; en x/4, por negra. Las figuras no cruzan el pulso si se
    pueden escribir sin cruzarlo (regla habitual de legibilidad), salvo blancas y redondas que
    empiezan en pulso fuerte.
  - Detecta tresillos: inicios y duraciones en tercios de pulso → grupo de 3 con su «3».
  - Barras: corcheas y semicorcheas del mismo pulso con plica unidas.
  - Acordes: una figura con varias alturas.
  - Ligaduras de expresión: de la nota marcada `start` a la marcada `end`.
  El renderizador solo traduce estas figuras a objetos de VexFlow.
- **Razón**: deja casi toda la lógica difícil donde se puede probar en `node` y hace que cambiar
  de motor de dibujo no toque la música.

## R6 · Acordes en el motor y en la puntuación

- **Decisión**: un acorde son varias `ScoreNote` con el mismo `s`, misma mano y un mismo `unit`
  (identificador del evento). Aprender no cambia (ya agrupa por inicio y espera a todas).
  En Tocar cada nota se juzga como hoy y `result()` puntúa por `unit`: perfecto si todas sus
  notas son perfectas, bien si todas aciertan, fallo si falta alguna (FR-010). Las notas sueltas
  tienen su propio `unit`, así que las piezas actuales puntúan exactamente igual (FR-013, test
  de no regresión sobre las 12 piezas).
- **Teclado en pantalla con ratón**: no hace falta nada: cada nota del acorde se puede pulsar por
  separado dentro de su margen (caso límite de la spec).

## R7 · Margen de acierto con notas muy seguidas

- **Decisión**: margen de una nota = `HIT_WINDOW` (0,45 pulsos) salvo que la distancia al inicio
  anterior o siguiente de la misma mano sea **menor que una corchea**; entonces se usa la mitad
  de esa distancia. `PERFECT_WINDOW` se recorta igual. Se calcula una vez en `buildScore`.
- **Razón**: la spec pide que los márgenes no se pisen, y FR-013 exige que las piezas actuales
  puntúen exactamente igual. Hoy las corcheas (0,5) ya tienen márgenes solapados y funciona
  porque se empareja por altura y por cercanía; recortar desde la corchea cambiaría sus
  resultados. Por eso el recorte empieza por debajo de la corchea (semicorcheas, tresillos).
  **Precisión del plan** sobre el caso límite «Notas muy seguidas».

## R8 · 6/8: pulso, tempo y metrónomo

- **Decisión**: internamente todo sigue en negras (`bar = 3` en 6/8). La `Score` gana `pulse`
  (negras por pulso: 1 en x/4, 1,5 en 6/8). `tempo` de la pieza y del control se expresan en
  pulsos por minuto; el motor calcula los segundos por negra como `60 / (tempo · pulse)`. El clic
  suena cada `pulse` negras, fuerte en el primero del compás; la cuenta atrás son `COUNT_IN`
  pulsos. En x/4 `pulse = 1` y nada cambia (FR-012a).
- **Etiqueta del tempo**: «ppm» en x/4; en 6/8 «♩. por minuto» junto al control.

## R9 · Digitación de acordes

- **Decisión**: `assignFingering` trabaja sobre **eventos** (nota o acorde) en vez de notas. Un
  acorde que cabe en la mano (≤ una octava) recibe dedos distintos y crecientes según la
  distancia: derecha, pulgar en la más grave; izquierda, en la más aguda (FR-014). Las posiciones
  de mano siguen agrupando eventos seguidos que caben en cinco dedos. Con notas sueltas el
  resultado es el de hoy (test de no regresión).

## R10 · Dibujo, marcas y rendimiento

- **Decisión**: `ScoreView` (sustituye a `Staff`, misma interfaz `StaffHandle` y mismas props)
  dibuja una vez la partitura con VexFlow dentro de un `<svg>` propio, en un efecto, cuando cambian
  la pieza, la notación, nombres o dedos. Guarda un mapa `id de ScoreNote → <g>` de su cabeza.
  Las marcas (`now`, `hit`, `miss`, `auto`) se aplican como clases en esos elementos, solo las que
  cambian, sin volver a dibujar (SC-005). Cursor, fragmento en bucle, nombres y dedos son SVG
  propio superpuesto (nombres apilados en los acordes), con las clases y colores de hoy.
- **Tema**: el CSS fija `fill`/`stroke` de `.vf-*` con las variables del tema (el CSS gana a los
  atributos `fill="black"` que pone VexFlow).
- **Móvil apaisado**: el ajuste al alto (`fit`) mide el `<g>` dibujado, como hoy.
- **Piezas largas**: se dibuja todo de una vez y se mide (SC-004: < 1 s con 100 compases, < 2 s con
  300). Si no llega, se dibuja por tramos de 32 compases conforme se acercan al cursor; las
  posiciones no cambian porque vienen de `layout.ts`.
- **Mientras carga VexFlow**: el tablero muestra «Cargando partitura…»; la lección no empieza
  hasta que la partitura está dibujada.

## R11 · Piezas importadas: versión completa

- **Decisión**:
  - `RawNote` gana `spell?` (de `<step>`/`<alter>` en MusicXML) y `RawPiece` gana `keys` (de
    `<key><fifths>` o del meta `FF 59` de MIDI), además de admitir 6/8 en `times`.
  - Nueva `convertFull(raw)` en `src/music/import/full.ts`, pura: reparte manos como 006, cuantiza
    a la rejilla de semicorchea y tercio de pulso (la más cercana), conserva acordes por mano y
    duraciones exactas, toma armadura y ortografía, y devuelve un `SongDef` ampliado o
    `{ ok: false, reason }` si no es representable (varias voces en una mano, compás no admitido,
    cambio de compás) (FR-019c).
  - `convertPiece` (simplificada) pasa a admitir 6/8 y lo demás sigue como en 006 (FR-020).
  - `ImportedSong` gana `full?: { def, warnings, level }` y `version: "simple" | "full"`. La
    versión completa tiene id `<id>.full`, así cada versión guarda sus estrellas sin migrar nada
    (FR-019b). `library` expone solo la versión elegida y resuelve cualquiera de los dos ids a la
    pieza (para «Continuar» y las rutas).
  - Las importadas antes del cambio no tienen `full`: se calcula desde el original en IndexedDB
    la primera vez que el alumno pide la versión completa (FR-019a).
- **Nivel de la versión completa**: las reglas de 006 más: armadura distinta de Do o 6/8 → al
  menos 3; acordes de 3 o más notas, semicorcheas o tresillos en más del 10 % de las notas → 4.

## R12 · Repertorio mínimo (FR-016)

- **Decisión**:
  - «Minueto en Sol» con `key: 1` (sin cambiar sus notas).
  - Nueva: «Himno a la alegría con acordes» (Beethoven), izquierda con tríadas de blanca.
  - Nueva: «Canción de cuna» (Brahms, 3/4), con notas ligadas a través de la barra.
  - Nueva: «Greensleeves» (popular inglesa, 6/8), con negra con puntillo y negra–corchea.
  - Semicorcheas y tresillos se prueban con piezas de prueba en los tests (`fixtures`); FR-016 pide
    una pieza en 6/8 *o* con esos ritmos, y Greensleeves la cubre.
  Todas de dominio público (Principio V). Las cifras exactas se escriben en la implementación y
  pasan la validación de FR-017.

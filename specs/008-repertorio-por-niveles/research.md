# Research: Ampliar el repertorio de dominio público por niveles

## R1 · Criterio de dominio público

- **Decision**: solo obras populares tradicionales sin autor conocido u obras de compositores
  fallecidos antes de 1946 (más de 80 años). Los arreglos (mano izquierda, transposición,
  fragmento, canon) son del proyecto. No se incluyen letras.
- **Rationale**: es el plazo más largo habitual (vida + 70/80 años) y cubre la UE y España; las
  melodías populares del s. XIX no tienen titular.
- **Alternatives considered**: «Cumpleaños feliz» (melodía de 1893, pero con un largo historial de
  reclamaciones: se evita); «Cielito lindo» (Quirino Mendoza, † 1957: aún con derechos en algunos
  países).

## R2 · Selección de piezas (14 nuevas)

Criterio: melodías muy conocidas (el alumno reconoce si suena bien), una sola versión, la más
extendida; tonalidad sencilla (Do mayor salvo lo que exija el nivel).

| Nivel | Pieza (id) | Origen | Qué trabaja |
|-------|-----------|--------|-------------|
| 1 | María tenía un corderito (`corderito`) | Popular estadounidense, s. XIX | Cinco dedos, negras |
| 1 | Hänschen klein (`hanschen`) | Popular alemana, s. XIX | Terceras, posición fija |
| 1 | Cuando los santos (`santos`) | Espiritual afroamericano, trad. | Silencios, notas largas |
| 1 | Jingle Bells, estribillo (`jingle`) | J. L. Pierpont (1822–1893), 1857; ritmo simplificado | Puntillo |
| 2 | Bollos calientes (`bollos`) | Popular inglesa, s. XVIII | Corcheas repetidas |
| 2 | Old MacDonald (`macdonald`) | Popular angloamericana, s. XVIII–XIX | Bajar del Do central |
| 2 | El puente de Londres (`puente`) | Popular inglesa, s. XVII | Puntillo, seis notas |
| 2 | Oh! Susana (`susana`) | S. Foster (1826–1864), 1848 | Anacrusa, corcheas, saltos |
| 3 | Largo del Nuevo Mundo (`largo`) | A. Dvořák (1841–1904), 1893; fragmento | Dos manos, notas largas |
| 3 | Auld Lang Syne (`despedida`) | Popular escocesa (R. Burns, 1788) | Anacrusa, puntillo, cambios de bajo |
| 3 | Noche de paz (`nochedepaz`) | F. X. Gruber (1787–1863), 1818 | 3/4, ligadura de prolongación |
| 4 | Martinillo en canon (`martinillo-canon`) | Popular francesa, s. XVIII | Canon: dos voces independientes |
| 4 | Rema, rema (`rema`) | Popular, s. XIX | 6/8 y canon |
| 4 | Para Elisa a dos manos (`elisa2`) | L. v. Beethoven (1770–1827), 1810; fragmento | Arpegios de la izquierda alternados con la derecha, sostenidos |

Resultado: nivel 1 → 6 piezas, nivel 2 → 7, nivel 3 → 9, nivel 4 → 7. Total 29 (SC-001).

Ajuste durante la implementación: el nivel sugerido de la importación (006) exige como mucho un
10 % de corcheas en el nivel 1, y su test lo comprueba sobre todo el repertorio. «Bollos
calientes» (casi la mitad corcheas) pasa al nivel 2 y el estribillo de «Jingle Bells» usa negras
en «Oh what fun it is to ride», como en los métodos de iniciación.

- **Alternatives considered**: Minueto en Sol a dos manos y sonatinas (Clementi, Mozart K. 545):
  descartadas en esta entrega porque la mano izquierda original no se puede comprobar con
  garantía; «Amazing Grace» y «Clementina»: varias versiones rítmicas en uso; «Mañana de Grieg»:
  semicorcheas y 6/8 a la vez, mejor para un nivel 5 futuro.

## R3 · Arreglos

- **Decision**: mano izquierda del proyecto con la armonía básica (I, IV, V) en notas largas
  (nivel 3); cánones a la octava baja que entran dos compases después (nivel 4), con la voz que
  acaba antes repitiendo la última frase o cerrando con un acorde; Para Elisa con los arpegios
  originales de la izquierda.
- **Rationale**: material reconocible, fácil de comprobar de oído y con la dificultad que define
  cada nivel (FR-005).
- **Alternatives considered**: bajo de Alberti en el nivel 4 sobre melodías infantiles (repetitivo
  y menos musical que el canon).

## R4 · Orden dentro de cada nivel

- **Decision**: una lista explícita de ids (`ORDER`) en `songs.ts` fija el orden de `SONGS`;
  la pantalla de Canciones ya agrupa por nivel conservando el orden de la lista. Un test exige
  que cada id aparezca una vez y que los niveles no retrocedan.
- **Rationale**: lo más simple (Principio V); sin campo de dificultad numérico que mantener.
- **Alternatives considered**: campo `difficulty` numérico (un dato más que nadie ve) y ordenar
  por rasgos calculados (frágil y opaco).

## R5 · Origen documentado

- **Decision**: campo opcional `origin` en `SongDef` (texto: compositor y fechas o procedencia
  popular, y «arreglo»/«fragmento»), relleno en **todas** las piezas incluidas, no solo las nuevas.
  Un test exige que ninguna pieza incluida lo tenga vacío (SC-003).
- **Rationale**: el dato vive junto a las notas y se comprueba automáticamente; las importadas no
  lo necesitan.

## R6 · Comprobación de niveles

- **Decision**: tests con reglas objetivas por nivel para las piezas nuevas (FR-005, FR-007):
  nivel 1 una mano, solo teclas blancas, extensión de cinco notas y un único dedo por altura
  (la mano no se mueve); nivel 2 una mano; nivel 4 dos manos; todas ≤ 32 compases; tocar en
  «Tocar» sin fallos da 3 estrellas (SC-004).
- **Rationale**: convierte la intención pedagógica en algo verificable sin revisar a mano.

import type { SongDef, Track } from "./types";
import { chain, every } from "./pedal";

/**
 * Piezas añadidas en 008 (ampliar el repertorio por niveles). Todas de dominio público: música
 * popular tradicional o compositores fallecidos hace más de 80 años; las manos izquierdas,
 * cánones y transposiciones son arreglos del proyecto. `songs.ts` las ordena con el resto.
 */

/** Transporta una pista `semitones` (los silencios no cambian). */
const shift = (t: Track, semitones: number): Track =>
  t.map(([m, d, o]) => {
    const moved = Array.isArray(m) ? m.map((x) => x + semitones) : m === 0 ? 0 : m + semitones;
    return o ? [moved, d, o] : [moved, d];
  });

/** Un compás de 4/4 con una sola nota (o acorde) de redonda en cada elemento. */
const wholes = (...ms: number[]): Track => ms.map((m) => [m, 4]);

// --- Nivel 4: melodías de los cánones ---

/** Martinillo (Frère Jacques), ocho compases de 4/4. */
const MARTINILLO: Track = [
  [60, 1], [62, 1], [64, 1], [60, 1], [60, 1], [62, 1], [64, 1], [60, 1],
  [64, 1], [65, 1], [67, 2], [64, 1], [65, 1], [67, 2],
  [67, 0.5], [69, 0.5], [67, 0.5], [65, 0.5], [64, 1], [60, 1], [67, 0.5], [69, 0.5], [67, 0.5], [65, 0.5], [64, 1], [60, 1],
  [60, 1], [55, 1], [60, 2], [60, 1], [55, 1], [60, 2],
];

/** Rema, rema, rema tu barca: ocho compases de 6/8 (en negras: corchea 0,5). */
const REMA: Track = [
  [60, 1.5], [60, 1.5],
  [60, 1], [62, 0.5], [64, 1.5],
  [64, 1], [62, 0.5], [64, 1], [65, 0.5],
  [67, 3],
  [72, 0.5], [72, 0.5], [72, 0.5], [67, 0.5], [67, 0.5], [67, 0.5],
  [64, 0.5], [64, 0.5], [64, 0.5], [60, 0.5], [60, 0.5], [60, 0.5],
  [67, 1], [65, 0.5], [64, 1], [62, 0.5],
  [60, 3],
];

// --- Nivel 3: frases que se repiten ---

const NOCHE_A: Track = [[67, 1.5], [69, 0.5], [67, 1], [64, 3]];
const NOCHE_B: Track = [[69, 2], [69, 1], [72, 1.5], [71, 0.5], [69, 1]];
const LARGO_A: Track = [[64, 1.5], [67, 0.5], [67, 2], [64, 1.5], [62, 0.5], [60, 2]];
const DESP_BE: Track = [[62, 1.5], [60, 0.5], [62, 1], [64, 0.5], [62, 0.5]];
const DESP_END: Track = [[60, 1.5], [57, 0.5], [57, 1], [55, 1]];

// --- Nivel 4: Para Elisa ---

const E_TURN: Track = [[76, 0.5], [75, 0.5], [76, 0.5], [71, 0.5], [74, 0.5], [72, 0.5]];
/** Arpegios de la izquierda (La menor y Mi mayor), sin el silencio que los sigue. */
const L_A: Track = [[45, 0.5], [52, 0.5], [57, 0.5]];
const L_E: Track = [[40, 0.5], [52, 0.5], [56, 0.5]];

export const MORE: SongDef[] = [
  // ---------------- Nivel 1: una mano, cinco dedos (Do–Sol), sin moverse ----------------
  {
    id: "corderito", title: "María tenía un corderito", level: "Nivel 1 · Popular estadounidense", tempo: 90,
    origin: "Popular estadounidense, s. XIX («Mary Had a Little Lamb»)",
    n: [[64, 1], [62, 1], [60, 1], [62, 1], [64, 1], [64, 1], [64, 2], [62, 1], [62, 1], [62, 2], [64, 1], [67, 1], [67, 2],
      [64, 1], [62, 1], [60, 1], [62, 1], [64, 1], [64, 1], [64, 1], [64, 1], [62, 1], [62, 1], [64, 1], [62, 1], [60, 4]],
  },
  {
    id: "hanschen", title: "Hänschen klein", level: "Nivel 1 · Popular alemana", tempo: 100,
    origin: "Popular alemana, s. XIX",
    n: [[67, 1], [64, 1], [64, 2], [65, 1], [62, 1], [62, 2], [60, 1], [62, 1], [64, 1], [65, 1], [67, 1], [67, 1], [67, 2],
      [67, 1], [64, 1], [64, 2], [65, 1], [62, 1], [62, 2], [60, 1], [64, 1], [67, 1], [67, 1], [60, 4],
      [62, 1], [62, 1], [62, 1], [62, 1], [62, 1], [64, 1], [65, 2], [64, 1], [64, 1], [64, 1], [64, 1], [64, 1], [65, 1], [67, 2],
      [67, 1], [64, 1], [64, 2], [65, 1], [62, 1], [62, 2], [60, 1], [64, 1], [67, 1], [67, 1], [60, 4]],
  },
  {
    id: "santos", title: "Cuando los santos", level: "Nivel 1 · Espiritual · Silencios", tempo: 100,
    origin: "Espiritual afroamericano tradicional («When the Saints Go Marching In»)",
    n: [[0, 1], [60, 1], [64, 1], [65, 1], [67, 4], [0, 1], [60, 1], [64, 1], [65, 1], [67, 4],
      [0, 1], [60, 1], [64, 1], [65, 1], [67, 2], [64, 2], [60, 2], [64, 2], [62, 4],
      [0, 1], [64, 1], [64, 1], [62, 1], [60, 3], [60, 1], [64, 2], [67, 2], [67, 1], [65, 3],
      [0, 2], [64, 1], [65, 1], [67, 2], [64, 2], [60, 2], [62, 2], [60, 4]],
  },
  {
    id: "jingle", title: "Jingle Bells (estribillo)", level: "Nivel 1 · Pierpont · Puntillo", tempo: 110,
    origin: "James Lord Pierpont (1822–1893), 1857; estribillo con ritmo simplificado",
    n: [[64, 1], [64, 1], [64, 2], [64, 1], [64, 1], [64, 2], [64, 1], [67, 1], [60, 1.5], [62, 0.5], [64, 4],
      [65, 1], [65, 1], [65, 1], [65, 1], [65, 1], [64, 1], [64, 1], [64, 1], [64, 1], [62, 1], [62, 1], [64, 1], [62, 2], [67, 2],
      [64, 1], [64, 1], [64, 2], [64, 1], [64, 1], [64, 2], [64, 1], [67, 1], [60, 1.5], [62, 0.5], [64, 4],
      [65, 1], [65, 1], [65, 1], [65, 1], [65, 1], [64, 1], [64, 1], [64, 1], [67, 1], [67, 1], [65, 1], [62, 1], [60, 4]],
  },

  // ---------------- Nivel 2: saltos, cambios de posición y corcheas ----------------
  {
    id: "bollos", title: "Bollos calientes", level: "Nivel 2 · Popular inglesa · Corcheas", tempo: 80,
    origin: "Popular inglesa, s. XVIII («Hot Cross Buns»)",
    n: [[64, 1], [62, 1], [60, 2], [64, 1], [62, 1], [60, 2],
      [60, 0.5], [60, 0.5], [60, 0.5], [60, 0.5], [62, 0.5], [62, 0.5], [62, 0.5], [62, 0.5], [64, 1], [62, 1], [60, 2]],
  },
  {
    id: "macdonald", title: "Old MacDonald", level: "Nivel 2 · Popular · Bajo el Do central", tempo: 100,
    origin: "Popular angloamericana, s. XVIII–XIX",
    n: [[60, 1], [60, 1], [60, 1], [55, 1], [57, 1], [57, 1], [55, 2], [64, 1], [64, 1], [62, 1], [62, 1], [60, 3], [55, 1],
      [60, 1], [60, 1], [60, 1], [55, 1], [57, 1], [57, 1], [55, 2], [64, 1], [64, 1], [62, 1], [62, 1], [60, 4]],
  },
  {
    id: "puente", title: "El puente de Londres", level: "Nivel 2 · Popular inglesa · Puntillo", tempo: 100,
    origin: "Popular inglesa, s. XVII («London Bridge Is Falling Down»)",
    n: [[67, 1.5], [69, 0.5], [67, 1], [65, 1], [64, 1], [65, 1], [67, 2], [62, 1], [64, 1], [65, 2], [64, 1], [65, 1], [67, 2],
      [67, 1.5], [69, 0.5], [67, 1], [65, 1], [64, 1], [65, 1], [67, 2], [62, 2], [67, 2], [64, 1], [60, 3]],
  },
  {
    // la anacrusa se completa con silencio
    id: "susana", title: "Oh! Susana", level: "Nivel 2 · Foster · Corcheas", tempo: 100,
    origin: "Stephen Foster (1826–1864), 1848",
    n: [[0, 3], [60, 0.5], [62, 0.5],
      [64, 1], [67, 1], [67, 1.5], [69, 0.5], [67, 1], [64, 1], [60, 1.5], [62, 0.5], [64, 1], [64, 1], [62, 1], [60, 1], [62, 3], [60, 0.5], [62, 0.5],
      [64, 1], [67, 1], [67, 1.5], [69, 0.5], [67, 1], [64, 1], [60, 1.5], [62, 0.5], [64, 1], [64, 1], [62, 1], [62, 1], [60, 4]],
  },

  // ---------------- Nivel 3: dos manos con izquierda sencilla, 3/4 ----------------
  {
    // transportado de Re bemol a Do; la izquierda marca la armonía con redondas
    id: "largo", title: "Largo del Nuevo Mundo", level: "Nivel 3 · Dvořák · Dos manos · Pedal", tempo: 56,
    origin: "Antonín Dvořák (1841–1904), Sinfonía n.º 9, 2.º mov., 1893; fragmento y arreglo del proyecto",
    r: [...LARGO_A, [62, 1], [64, 1], [67, 1], [64, 1], [62, 4],
      ...LARGO_A, [62, 1], [64, 1], [62, 1], [60, 1], [60, 4]],
    l: wholes(48, 48, 43, 43, 48, 48, 43, 48),
    // un tramo por compás
    pedal: every(4, 0, 32),
  },
  {
    // Auld Lang Syne; la anacrusa se completa con silencio
    id: "despedida", title: "Canción de la despedida", level: "Nivel 3 · Popular escocesa · Dos manos · Pedal", tempo: 80,
    origin: "Popular escocesa («Auld Lang Syne», letra de R. Burns, 1788); arreglo del proyecto",
    r: [[0, 3], [55, 1],
      [60, 1.5], [60, 0.5], [60, 1], [64, 1], [62, 1.5], [60, 0.5], [62, 1], [64, 1], [60, 1.5], [60, 0.5], [64, 1], [67, 1], [69, 3], [69, 1],
      [67, 1.5], [64, 0.5], [64, 1], [60, 1], ...DESP_BE, ...DESP_END, [60, 3], [69, 1],
      [67, 1.5], [64, 0.5], [64, 1], [60, 1], [62, 1.5], [60, 0.5], [62, 1], [69, 1], [67, 1.5], [64, 0.5], [64, 1], [67, 1], [69, 3], [72, 1],
      [67, 1.5], [64, 0.5], [64, 1], [60, 1], ...DESP_BE, ...DESP_END, [60, 3], [0, 1]],
    l: [[0, 4],
      [48, 4], [43, 4], [48, 4], [41, 4], [48, 4], [43, 4], [41, 2], [43, 2], [48, 4],
      [48, 4], [43, 2], [41, 2], [48, 4], [41, 4], [48, 4], [43, 4], [41, 2], [43, 2], [48, 3], [0, 1]],
    // un tramo por bajo de la izquierda; el último se mantiene hasta el final
    pedal: chain(4, 8, 12, 16, 20, 24, 28, 30, 32, 36, 40, 42, 44, 48, 52, 56, 60, 62, 64, 68),
  },
  {
    // la izquierda mantiene la nota del acorde; el final se liga a través de la barra
    id: "nochedepaz", title: "Noche de paz", level: "Nivel 3 · Gruber · 3/4 · Dos manos · Pedal", tempo: 66, bar: 3, px: 60,
    origin: "Franz Xaver Gruber (1787–1863), «Stille Nacht», 1818; arreglo del proyecto",
    r: [...NOCHE_A, ...NOCHE_A, [74, 2], [74, 1], [71, 3], [72, 2], [72, 1], [67, 3],
      ...NOCHE_B, ...NOCHE_A, ...NOCHE_B, ...NOCHE_A,
      [74, 2], [74, 1], [77, 1.5], [74, 0.5], [71, 1], [72, 3], [76, 3],
      [72, 1.5], [67, 0.5], [64, 1], [67, 1.5], [65, 0.5], [62, 1], [60, 3, { tie: true }], [60, 3]],
    l: [[48, 3], [48, 3], [48, 3], [48, 3], [43, 3], [43, 3], [48, 3], [48, 3],
      [41, 3], [41, 3], [48, 3], [48, 3], [41, 3], [41, 3], [48, 3], [48, 3],
      [43, 3], [43, 3], [48, 3], [48, 3], [48, 3], [43, 3], [48, 3, { tie: true }], [48, 3]],
    // un tramo por compás; los dos últimos compases (nota ligada) en un solo tramo
    pedal: [...every(3, 0, 66), ...chain(66, 72)],
  },

  // ---------------- Nivel 4: independencia de manos ----------------
  {
    // canon a la octava: la izquierda entra dos compases después; la derecha repite la última frase
    id: "martinillo-canon", title: "Martinillo en canon", level: "Nivel 4 · Popular francesa · Canon", tempo: 90,
    origin: "Popular francesa, s. XVIII («Frère Jacques»); canon arreglado por el proyecto",
    r: [...MARTINILLO, [60, 1], [55, 1], [60, 2], [60, 1], [55, 1], [60, 2]],
    l: [[0, 8], ...shift(MARTINILLO, -12)],
  },
  {
    // canon a la octava en 6/8 (tempo en negras con puntillo); la derecha cierra con un acorde
    id: "rema", title: "Rema, rema", level: "Nivel 4 · Popular · 6/8 · Canon", tempo: 56, time: "6/8",
    origin: "Popular angloamericana, s. XIX («Row, Row, Row Your Boat»); canon arreglado por el proyecto",
    r: [...REMA, [67, 3], [[60, 64, 67], 3]],
    l: [[0, 6], ...shift(REMA, -12)],
  },
  {
    // los arpegios de la izquierda se alternan con la derecha, como en el original (3/8 escrito en 3/4)
    id: "elisa2", title: "Para Elisa a dos manos", level: "Nivel 4 · Beethoven · Arpegios · Pedal", tempo: 66, bar: 3, px: 64,
    origin: "Ludwig van Beethoven (1770–1827), WoO 59, 1810; fragmento",
    r: [[0, 2], [76, 0.5], [75, 0.5],
      ...E_TURN, [69, 1], [0, 0.5], [60, 0.5], [64, 0.5], [69, 0.5],
      [71, 1], [0, 0.5], [64, 0.5], [68, 0.5], [71, 0.5], [72, 1], [0, 0.5], [64, 0.5], [76, 0.5], [75, 0.5],
      ...E_TURN, [69, 1], [0, 0.5], [60, 0.5], [64, 0.5], [69, 0.5],
      [71, 1], [0, 0.5], [64, 0.5], [72, 0.5], [71, 0.5], [69, 3]],
    l: [[0, 6], ...L_A, [0, 1.5], ...L_E, [0, 1.5], ...L_A, [0, 4.5], ...L_A, [0, 1.5], ...L_E, [0, 1.5], [45, 0.5], [52, 0.5], [57, 2]],
    // un tramo por compás con arpegio de la izquierda; el giro Mi–Re♯ va sin pedal
    pedal: [...chain(6, 9, 12, 15), ...chain(18, 21, 24, 27)],
  },
];

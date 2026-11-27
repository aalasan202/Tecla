import type { SongDef, Track } from "../music/types";

/**
 * Ejercicios del Curso (010): piezas muy cortas que se tocan con el motor de siempre.
 * Todos en 4/4, de 8 compases como mucho y 30 s como mucho a su tempo.
 * Los de mano izquierda son a dos manos con la derecha en silencio.
 */

const origin = "Ejercicio del proyecto";
const DO = [48, 52, 55];
const FA = [41, 45, 48];
const SOL = [47, 50, 55]; // Si‑Re‑Sol: «Sol con el Si abajo», como en oda-acordes

/** Silencio de la mano derecha para `bars` compases de 4/4. */
const silentRight = (bars: number): Track => Array.from({ length: bars }, () => [0, 4] as [number, number]);

const one = (id: string, title: string, level: 1 | 2, tempo: number, n: Track, kind?: SongDef["kind"]): SongDef => ({
  id: `curso-${id}`,
  title,
  level: `Nivel ${level} · Curso`,
  origin,
  tempo,
  n,
  ...(kind ? { kind } : {}),
});

const left = (id: string, title: string, tempo: number, l: Track, kind?: SongDef["kind"]): SongDef => {
  const beats = l.reduce((a, [, d]) => a + d, 0);
  return { id: `curso-${id}`, title, level: "Nivel 2 · Curso", origin, tempo, r: silentRight(beats / 4), l, ...(kind ? { kind } : {}) };
};

const C4 = 60;

// ---------- Unidad 1 ----------

export const POSICION_DO = one("posicion-do", "La posición de Do", 1, 80, [
  [60, 1], [62, 1], [64, 1], [65, 1],
  [67, 1], [65, 1], [64, 1], [62, 1],
  [60, 4],
]);

export const PENTAGRAMA = one("pentagrama", "Do‑Re‑Mi‑Fa‑Sol en el pentagrama", 1, 80, [
  [60, 1], [64, 1], [62, 1], [65, 1],
  [67, 2], [64, 2],
  [62, 1], [65, 1], [64, 1], [60, 1],
  [62, 2], [60, 2],
]);

export const PULSO = one("pulso", "El pulso: negras y blancas", 1, 80, [
  [C4, 1], [C4, 1], [C4, 1], [C4, 1],
  [C4, 2], [C4, 2],
  [C4, 1], [C4, 1], [C4, 2],
  [C4, 2], [C4, 1], [C4, 1],
], "rhythm");

export const REDONDAS = one("redondas", "Redondas y silencios", 1, 80, [
  [C4, 4],
  [C4, 2], [0, 2],
  [C4, 1], [0, 1], [C4, 2],
  [C4, 4],
], "rhythm");

export const PASOS_SALTOS = one("pasos-saltos", "Pasos y saltos", 1, 80, [
  [60, 1], [62, 1], [64, 2],
  [60, 1], [64, 1], [62, 2],
  [62, 1], [65, 1], [64, 1], [67, 1],
  [65, 1], [64, 1], [62, 1], [60, 1],
  [64, 2], [60, 2],
]);

// ---------- Unidad 2 ----------

export const PUNTILLO = one("puntillo", "El puntillo", 2, 72, [
  [C4, 3], [C4, 1],
  [C4, 1.5], [C4, 0.5], [C4, 2],
  [C4, 3], [C4, 1],
  [C4, 1.5], [C4, 0.5], [C4, 1], [C4, 1],
  [C4, 4],
], "rhythm");

export const CORCHEAS = one("corcheas", "Corcheas", 2, 72, [
  [C4, 1], [C4, 1], [C4, 0.5], [C4, 0.5], [C4, 1],
  [C4, 0.5], [C4, 0.5], [C4, 0.5], [C4, 0.5], [C4, 2],
  [C4, 1], [C4, 0.5], [C4, 0.5], [C4, 1], [C4, 1],
  [C4, 4],
], "rhythm");

export const FUERA_POSICION = one("fuera-posicion", "Notas fuera de la posición", 2, 80, [
  [60, 1], [62, 1], [64, 1], [67, 1],
  [69, 2], [67, 2],
  [60, 1], [57, 1], [55, 2],
  [57, 1], [60, 1], [71, 1], [69, 1],
  [67, 2], [60, 2],
]);

export const SALTOS = one("saltos", "Cambiar de posición", 2, 80, [
  [60, 1], [62, 1], [64, 1], [65, 1],
  [67, 2], [0, 2],
  [67, 1], [69, 1], [71, 1], [72, 1],
  [74, 2], [72, 1], [71, 1],
  [67, 4],
]);

// ---------- Unidad 3 ----------

export const MI_DO = left("mi-do", "La mano izquierda en posición de Do", 72, [
  [48, 1], [50, 1], [52, 1], [53, 1],
  [55, 2], [53, 2],
  [52, 1], [50, 1], [48, 2],
  [55, 1], [52, 1], [48, 2],
]);

export const CLAVE_FA = left("clave-fa", "La clave de fa", 72, [
  [48, 1], [47, 1], [45, 1], [41, 1],
  [45, 2], [48, 2],
  [50, 1], [52, 1], [53, 1], [55, 1],
  [47, 2], [48, 2],
]);

export const ACORDE_DO = left("acorde-do", "El acorde de Do", 60, [
  [DO, 2], [DO, 2],
  [DO, 4],
  [DO, 1], [DO, 1], [DO, 2],
  [DO, 4],
], "chords");

export const ACORDES_FA_SOL = left("acordes-fa-sol", "Fa mayor y Sol mayor", 60, [
  [FA, 2], [FA, 2],
  [SOL, 2], [SOL, 2],
  [DO, 2], [FA, 2],
  [DO, 2], [SOL, 2],
  [DO, 4],
], "chords");

export const CAMBIOS = left("cambios", "Cambiar de acorde a tempo", 66, [
  [DO, 2], [FA, 2],
  [DO, 2], [SOL, 2],
  [DO, 2], [FA, 2],
  [SOL, 2], [DO, 2],
], "chords");

// ---------- Pruebas de nivel ----------

/** Unidad 2: lo trabajado en la Unidad 1 (nivel 1). */
export const TEST_U2: SongDef[] = [
  one("prueba-u2-reading", "Prueba · Lectura", 1, 80, [
    [64, 1], [62, 1], [60, 1], [62, 1],
    [64, 1], [64, 1], [64, 2],
    [62, 1], [65, 1], [67, 2],
    [64, 1], [62, 1], [60, 2],
  ]),
  one("prueba-u2-rhythm", "Prueba · Ritmo", 1, 80, [
    [C4, 1], [C4, 1], [C4, 2],
    [C4, 2], [0, 2],
    [C4, 1], [0, 1], [C4, 1], [C4, 1],
    [C4, 4],
  ], "rhythm"),
  one("prueba-u2-position", "Prueba · Posiciones", 1, 80, [
    [67, 1], [65, 1], [64, 1], [62, 1],
    [60, 1], [62, 1], [64, 2],
    [65, 1], [67, 1], [65, 1], [64, 1],
    [62, 2], [60, 2],
  ]),
];

/** Unidad 3: lo trabajado en las Unidades 1 y 2 (nivel 2). */
export const TEST_U3: SongDef[] = [
  one("prueba-u3-reading", "Prueba · Lectura", 2, 80, [
    [60, 1], [57, 1], [55, 1], [57, 1],
    [60, 1], [64, 1], [69, 1], [71, 1],
    [72, 2], [67, 2],
    [64, 1], [62, 1], [60, 2],
  ]),
  one("prueba-u3-rhythm", "Prueba · Ritmo", 2, 72, [
    [C4, 1.5], [C4, 0.5], [C4, 1], [C4, 1],
    [C4, 0.5], [C4, 0.5], [C4, 1], [C4, 2],
    [C4, 3], [C4, 1],
    [C4, 4],
  ], "rhythm"),
  one("prueba-u3-position", "Prueba · Posiciones", 2, 80, [
    [60, 1], [64, 1], [67, 2],
    [67, 1], [71, 1], [74, 2],
    [72, 1], [71, 1], [69, 1], [67, 1],
    [60, 4],
  ]),
];

// ---------- Niveles 3 y 4 (012, FR-021 y FR-022) ----------

/** Ejercicio con cualquier combinación de campos (dos manos, compás, armadura, pedal…). */
const def = (id: string, title: string, level: 3 | 4, tempo: number, parts: Partial<SongDef>): SongDef => ({
  id: `curso-${id}`,
  title,
  level: `Nivel ${level} · Curso`,
  origin,
  tempo,
  ...parts,
});

/** Pedal en cada compás de 4/4: se cambia (levantar y pisar) en cada acorde nuevo. */
const pedalBars = (bars: number): [number, number][] => Array.from({ length: bars }, (_, i) => [i * 4, (i + 1) * 4] as [number, number]);

export const DOS_MANOS = def("dos-manos", "Las dos manos a la vez", 3, 72, {
  r: [[64, 1], [62, 1], [60, 2], [64, 1], [62, 1], [60, 2], [60, 1], [62, 1], [64, 1], [65, 1], [64, 4]],
  l: [[48, 4], [43, 4], [48, 2], [43, 2], [48, 4]],
});

export const TRES_CUARTOS = def("tres-cuartos", "El compás de 3/4", 3, 90, {
  bar: 3,
  n: [[60, 2], [64, 1], [67, 2], [64, 1], [65, 1], [64, 1], [62, 1], [60, 3], [62, 2], [64, 1], [60, 3]],
});

export const ARMADURA = def("armadura", "Sol mayor: el Fa sostenido", 3, 80, {
  key: 1,
  n: [[67, 1], [69, 1], [71, 1], [72, 1], [74, 2], [72, 1], [71, 1], [69, 1], [66, 1], [67, 2], [71, 1], [69, 1], [66, 1], [69, 1], [67, 4]],
});

export const PEDAL = def("pedal", "Acordes con pedal", 3, 60, {
  kind: "chords",
  r: silentRight(4),
  l: [[DO, 4], [FA, 4], [SOL, 4], [DO, 4]],
  pedal: pedalBars(4),
});

export const LIGADURAS = def("ligaduras", "Frases con ligadura", 3, 80, {
  n: [
    [60, 1, { slur: "start" }], [62, 1], [64, 1], [65, 1, { slur: "end" }],
    [67, 2, { slur: "start" }], [65, 2, { slur: "end" }],
    [64, 1, { slur: "start" }], [62, 1], [60, 2, { slur: "end" }],
    [62, 1, { slur: "start" }], [64, 1], [60, 2, { slur: "end" }],
  ],
});

export const SEIS_OCHOS = def("seis-ochos", "El compás de 6/8", 4, 50, {
  time: "6/8",
  n: [[60, 1], [64, 0.5], [67, 1], [64, 0.5], [65, 1.5], [64, 1.5], [62, 1], [64, 0.5], [65, 1], [62, 0.5], [60, 3]],
});

export const SEMICORCHEAS = def("semicorcheas", "Semicorcheas", 4, 60, {
  n: [
    [60, 0.25], [62, 0.25], [64, 0.25], [65, 0.25], [67, 1], [67, 0.25], [65, 0.25], [64, 0.25], [62, 0.25], [60, 1],
    [64, 0.5], [65, 0.5], [67, 0.25], [65, 0.25], [64, 0.25], [62, 0.25], [60, 2],
    [60, 0.25], [62, 0.25], [64, 0.25], [65, 0.25], [67, 1], [67, 0.25], [65, 0.25], [64, 0.25], [62, 0.25], [60, 1],
    [64, 0.25], [62, 0.25], [60, 0.5], [62, 1], [60, 2],
  ],
});

export const DOS_VOCES = def("dos-voces", "Dos voces en movimiento contrario", 4, 66, {
  r: [[64, 1], [65, 1], [67, 1], [69, 1], [67, 2], [65, 2], [64, 1], [62, 1], [60, 2]],
  l: [[48, 1], [47, 1], [45, 1], [43, 1], [45, 2], [47, 2], [48, 1], [50, 1], [48, 2]],
});

export const DOS_CLAVES = def("dos-claves", "Leer en dos claves", 4, 72, {
  r: [[0, 1], [64, 1], [0, 1], [67, 1], [0, 1], [65, 1], [0, 1], [64, 1], [0, 1], [62, 1], [0, 1], [60, 1], [60, 4]],
  l: [[48, 1], [0, 1], [52, 1], [0, 1], [53, 1], [0, 1], [50, 1], [0, 1], [47, 1], [0, 1], [43, 1], [0, 1], [48, 4]],
});

export const ARPEGIOS = def("arpegios", "Arpegios de Do y Fa", 4, 72, {
  arpFingering: true,
  n: [[60, 1], [64, 1], [67, 1], [72, 1], [72, 1], [67, 1], [64, 1], [60, 1], [65, 1], [69, 1], [72, 1], [77, 1], [60, 4]],
});

/** Prueba del nivel 3: lo del nivel 2, con acordes de la mano izquierda (aclaración Q3). */
export const TEST_N3: SongDef[] = [
  one("prueba-n3-reading", "Prueba · Lectura", 2, 80, [[55, 1], [57, 1], [60, 2], [67, 1], [69, 1], [71, 2], [69, 1], [67, 1], [64, 1], [62, 1], [60, 4]]),
  one("prueba-n3-rhythm", "Prueba · Ritmo", 2, 72, [[60, 1.5], [60, 0.5], [60, 1], [60, 1], [60, 0.5], [60, 0.5], [60, 1], [60, 2], [60, 3], [60, 1], [60, 4]], "rhythm"),
  left("prueba-n3-position", "Prueba · Posiciones", 72, [[48, 1], [50, 1], [52, 1], [53, 1], [55, 2], [53, 1], [52, 1], [50, 1], [52, 1], [48, 2]]),
  left("prueba-n3-chords", "Prueba · Acordes", 60, [[DO, 4], [FA, 4], [DO, 2], [SOL, 2], [DO, 4]], "chords"),
];

/** Prueba del nivel 4: lo del nivel 3 (dos manos, 3/4, armadura y pedal; el pedal no puntúa). */
export const TEST_N4: SongDef[] = [
  def("prueba-n4-position", "Prueba · Dos manos", 3, 72, { r: [[67, 1], [65, 1], [64, 2], [62, 1], [64, 1], [60, 2]], l: [[48, 4], [43, 2], [48, 2]] }),
  def("prueba-n4-rhythm", "Prueba · Compás de 3/4", 3, 90, { bar: 3, n: [[60, 1], [64, 1], [67, 1], [65, 2], [64, 1], [62, 3], [60, 3]] }),
  def("prueba-n4-reading", "Prueba · Armadura", 3, 80, { key: -1, n: [[65, 1], [67, 1], [69, 1], [70, 1], [72, 2], [70, 1], [69, 1], [67, 1], [65, 1], [67, 2], [65, 4]] }),
  def("prueba-n4-chords", "Prueba · Acordes con pedal", 3, 60, { kind: "chords", r: silentRight(4), l: [[FA, 4], [DO, 4], [SOL, 4], [DO, 4]], pedal: pedalBars(4) }),
];

/** Todos los ejercicios (lecciones y pruebas), para validarlos juntos. */
export const EXERCISES: SongDef[] = [
  POSICION_DO, PENTAGRAMA, PULSO, REDONDAS, PASOS_SALTOS,
  PUNTILLO, CORCHEAS, FUERA_POSICION, SALTOS,
  MI_DO, CLAVE_FA, ACORDE_DO, ACORDES_FA_SOL, CAMBIOS,
  ...TEST_U2, ...TEST_U3,
  DOS_MANOS, TRES_CUARTOS, ARMADURA, PEDAL, LIGADURAS,
  SEIS_OCHOS, SEMICORCHEAS, DOS_VOCES, DOS_CLAVES, ARPEGIOS,
  ...TEST_N3, ...TEST_N4,
];

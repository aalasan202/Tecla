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

/** Todos los ejercicios (lecciones y pruebas), para validarlos juntos. */
export const EXERCISES: SongDef[] = [
  POSICION_DO, PENTAGRAMA, PULSO, REDONDAS, PASOS_SALTOS,
  PUNTILLO, CORCHEAS, FUERA_POSICION, SALTOS,
  MI_DO, CLAVE_FA, ACORDE_DO, ACORDES_FA_SOL, CAMBIOS,
  ...TEST_U2, ...TEST_U3,
];

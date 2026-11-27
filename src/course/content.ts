import type { SongDef, Track } from "../music/types";
import type { Block, CourseItem, ExplainPage, Lesson, Level, LevelN, ScaleSpec, Tip } from "./types";
import { scaleId } from "./scales";
import { INDEPENDENCE } from "./independence";
import { SONGS } from "../music/songs";
import { levelOf } from "../music/level";
import { TIPS } from "./tips";
import * as EX from "./exercises";

/**
 * El Curso (012): cuatro niveles con tres caminos (lecciones y consejos, técnica y canciones).
 * Los niveles 1 y 2 reparten las unidades de 010 (U1 → nivel 1; U2 y U3 → nivel 2) sin cambiar
 * sus ids, que se guardan en el progreso y aparecen en las URL.
 */

const DO = [48, 52, 55];
const FA = [41, 45, 48];
const SOL = [47, 50, 55];

/** Mini partitura de una explicación (mano derecha). */
const staff = (id: string, n: Track): SongDef => ({ id: `explica-${id}`, title: "Ejemplo", level: "Nivel 1 · Curso", tempo: 80, n });
/** Mini partitura de la mano izquierda (derecha en silencio). */
const staffL = (id: string, l: Track, tempo = 66): SongDef => {
  const beats = l.reduce((a, [, d]) => a + d, 0);
  return { id: `explica-${id}`, title: "Ejemplo", level: "Nivel 2 · Curso", tempo, r: Array.from({ length: beats / 4 }, () => [0, 4] as [number, number]), l };
};
const keys = (ms: number[], fingers?: number[]) => ms.map((m, i) => (fingers ? { m, finger: fingers[i] } : { m }));

type LessonOrTip = Extract<CourseItem, { type: "lesson" | "tip" }>;
type SongItem = Extract<CourseItem, { type: "song" }>;

const lesson = (id: string, block: Block, title: string, exercise: SongDef, pages: ExplainPage[]): LessonOrTip => ({
  type: "lesson",
  id: `l-${id}`,
  lesson: { id: `l-${id}`, block, title, pages, exercise } satisfies Lesson,
});
const tip = (t: Tip): LessonOrTip => ({ type: "tip", id: t.id, tip: t });
/** Pieza‑hito de 010: canción recomendada de su nivel. */
const hito = (songId: string): SongItem => ({ type: "song", id: `hito-${songId}`, songId, recommended: true });

// ---------- Unidad 1 · Primeros pasos ----------

const U1: (LessonOrTip | SongItem)[] = [
  tip(TIPS.postura),
  tip(TIPS.mano),
  tip(TIPS.dedos),
  tip(TIPS.do),
  lesson("posicion-do", "position", "El teclado y la posición de Do", EX.POSICION_DO, [
    {
      text: "El teclado repite el mismo dibujo de teclas blancas y negras. Las negras van en grupos de dos y de tres. Cada {C} está justo a la izquierda de un grupo de dos negras. Pulsa los {C} resaltados y escucha: es la misma nota, más grave o más aguda.",
      keys: keys([48, 60, 72]),
    },
    {
      text: "Coloca la mano derecha con el pulgar en el {C} central y un dedo en cada tecla blanca: {C} con el 1, {D} con el 2, {E} con el 3, {F} con el 4 y {G} con el 5. Es la posición de {C}: la mano no se mueve. Prueba a tocar las cinco notas.",
      keys: keys([60, 62, 64, 65, 67], [1, 2, 3, 4, 5]),
    },
  ]),
  lesson("pentagrama", "reading", "Do‑Re‑Mi‑Fa‑Sol en el pentagrama", EX.PENTAGRAMA, [
    {
      text: "La música se escribe en el pentagrama: cinco líneas. La clave de sol, al principio, indica que es para la mano derecha. El {C} central va en una pequeña línea adicional por debajo. Cada nota siguiente sube un escalón, de línea a espacio: {D}, {E}, {F} y {G}.",
      staff: staff("pentagrama", [[60, 2], [62, 2], [64, 2], [65, 2], [67, 4]]),
      keys: keys([60, 62, 64, 65, 67]),
    },
  ]),
  lesson("pulso", "rhythm", "El pulso: negras y blancas", EX.PULSO, [
    {
      text: "La música tiene un pulso, como el latido del corazón. Una negra dura un pulso y una blanca, dos. Escucha el ejemplo: el metrónomo marca el pulso y la nota suena con él. En el ejercicio solo importa cuándo tocas, no qué tecla.",
      staff: staff("pulso", [[60, 1], [60, 1], [60, 1], [60, 1], [60, 2], [60, 2]]),
    },
  ]),
  hito("cinco"),
  tip(TIPS.sinGolpear),
  lesson("redondas", "rhythm", "Redondas y silencios", EX.REDONDAS, [
    {
      text: "La redonda dura cuatro pulsos: un compás entero. Los silencios también duran: el silencio de negra, un pulso, y el de blanca, dos. Durante un silencio no tocas, pero sigues contando. Escucha el ejemplo y cuenta en voz baja.",
      staff: staff("redondas", [[60, 4], [60, 2], [0, 2], [60, 1], [0, 1], [60, 2]]),
    },
  ]),
  lesson("pasos-saltos", "reading", "Pasos y saltos en el pentagrama", EX.PASOS_SALTOS, [
    {
      text: "Leer es más fácil si te fijas en la distancia entre notas. Un paso va a la nota vecina, de línea a espacio, como {C}–{D}. Un salto se salta una: de línea a línea o de espacio a espacio, como {C}–{E}. Escucha y mira la diferencia.",
      staff: staff("pasos-saltos", [[60, 1], [62, 1], [64, 2], [60, 1], [64, 1], [67, 2]]),
    },
  ]),
  hito("oda"),
  tip(TIPS.pocoAMenudo),
];

// ---------- Unidad 2 · Moverse por el teclado ----------

const U2: (LessonOrTip | SongItem)[] = [
  tip(TIPS.lento),
  lesson("puntillo", "rhythm", "El puntillo", EX.PUNTILLO, [
    {
      text: "Un puntillo detrás de una nota le suma la mitad de lo que dura. Una blanca con puntillo dura tres pulsos. Una negra con puntillo dura pulso y medio, y suele ir seguida de una corchea, que completa el segundo pulso. Escucha el ritmo de ejemplo.",
      staff: staff("puntillo", [[60, 3], [60, 1], [60, 1.5], [60, 0.5], [60, 2]]),
    },
  ]),
  hito("jingle"),
  tip(TIPS.contar),
  lesson("corcheas", "rhythm", "Corcheas", EX.CORCHEAS, [
    {
      text: "Una corchea dura medio pulso: dos corcheas caben en una negra. Para contarlas, di «y» entre los números: «uno y dos y…». La primera corchea cae con el número y la segunda, con la «y». Escucha el ejemplo y cuenta con él.",
      staff: staff("corcheas", [[60, 1], [60, 0.5], [60, 0.5], [60, 1], [60, 0.5], [60, 0.5]]),
    },
  ]),
  hito("martinillo"),
  tip(TIPS.ojos),
  tip(TIPS.adelantado),
  lesson("fuera-posicion", "reading", "Notas fuera de la posición", EX.FUERA_POSICION, [
    {
      text: "Las melodías no siempre caben en cinco notas. Por debajo del {C} central están {B}, {A} y {G}; por encima del {G} siguen {A} y {B}. Para alcanzarlas, la mano se abre un poco o se desplaza. Mira dónde caen en el pentagrama.",
      staff: staff("fuera-posicion", [[55, 1], [57, 1], [60, 2], [67, 1], [69, 1], [71, 2]]),
      keys: keys([55, 57, 69, 71]),
    },
  ]),
  hito("macdonald"),
  tip(TIPS.brazo),
  lesson("saltos", "position", "Cambiar de posición y saltos", EX.SALTOS, [
    {
      text: "A veces hay que llevar la mano a otra posición. Desde la posición de {C}, la de {G} empieza con el pulgar en el {G}: {G}, {A}, {B}, {C} y {D}. Aprovecha un silencio o una nota larga para cambiar, sin prisa.",
      keys: keys([67, 69, 71, 72, 74], [1, 2, 3, 4, 5]),
    },
  ]),
  hito("susana"),
  tip(TIPS.bucle),
];

// ---------- Unidad 3 · La mano izquierda y los primeros acordes ----------

const U3: (LessonOrTip | SongItem)[] = [
  lesson("mi-do", "position", "La posición de Do con la mano izquierda", EX.MI_DO, [
    {
      text: "La mano izquierda también tiene su posición de {C}, una octava por debajo del {C} central. Ahora el meñique va en el {C}: {C} con el 5, {D} con el 4, {E} con el 3, {F} con el 2 y {G} con el 1. Los números van al revés que en la derecha.",
      keys: keys([48, 50, 52, 53, 55], [5, 4, 3, 2, 1]),
    },
  ]),
  lesson("clave-fa", "reading", "La clave de fa", EX.CLAVE_FA, [
    {
      text: "La mano izquierda lee en clave de fa. Sus dos puntos rodean la cuarta línea, que es el {F}. El {C} de la posición de la mano izquierda está en el segundo espacio y el {G}, en la línea de arriba. Por debajo quedan {B}, {A} y otro {F}.",
      staff: staffL("clave-fa", [[41, 1], [45, 1], [47, 1], [48, 1], [50, 1], [52, 1], [53, 1], [55, 1]]),
    },
  ]),
  tip(TIPS.metronomo),
  lesson("acorde-do", "chords", "Qué es un acorde: Do mayor", EX.ACORDE_DO, [
    {
      text: "Un acorde son varias notas tocadas a la vez. El acorde de {C} mayor tiene tres: {C}, {E} y {G}, una sí y otra no. Con la mano izquierda en posición de {C}, tócalo con los dedos 5, 3 y 1. En la partitura, las tres notas se escriben apiladas.",
      keys: keys(DO, [5, 3, 1]),
      staff: staffL("acorde-do", [[DO, 4]]),
    },
  ]),
  lesson("acordes-fa-sol", "chords", "Fa mayor y Sol mayor «con el Si abajo»", EX.ACORDES_FA_SOL, [
    {
      text: "El acorde de {F} mayor es {F}, {A} y {C}. La mano baja hasta el {F} y lo toca con los dedos 5, 3 y 1, igual que el de {C}.",
      keys: keys(FA, [5, 3, 1]),
      staff: staffL("fa", [[FA, 4]]),
    },
    {
      text: "El acorde de {G} mayor se toca «con el {B} abajo»: {B}, {D} y {G}. Así el pulgar se queda en el {G} y la mano casi no se mueve desde {C} mayor. Dedos 5, 3 y 1.",
      keys: keys(SOL, [5, 3, 1]),
      staff: staffL("sol", [[DO, 2], [SOL, 2]]),
    },
  ]),
  lesson("cambios", "chords", "Cambiar entre Do, Fa y Sol a tempo", EX.CAMBIOS, [
    {
      text: "Muchas canciones sencillas usan solo {C}, {F} y {G}. El truco para cambiar a tiempo es mirar el siguiente acorde antes de llegar y mover la mano entera, sin levantarla mucho. Escucha cómo suenan uno tras otro.",
      staff: staffL("cambios", [[DO, 2], [FA, 2], [DO, 2], [SOL, 2]]),
    },
  ]),
  hito("oda-acordes"),
];

// ---------- Nivel 3 · Las dos manos juntas (012) ----------

const U4: LessonOrTip[] = [
  tip(TIPS.manosSeparadas),
  lesson("dos-manos", "position", "Las dos manos a la vez", EX.DOS_MANOS, [
    {
      text: "Ahora las dos manos tocan juntas: la derecha, la melodía, y la izquierda, notas largas que la acompañan. Lee la partitura de arriba abajo: lo que está alineado suena a la vez. Empieza muy despacio y fíjate en los momentos en que las dos manos tocan juntas.",
      staff: EX.DOS_MANOS,
    },
  ]),
  lesson("tres-cuartos", "rhythm", "El compás de 3/4", EX.TRES_CUARTOS, [
    {
      text: "En el compás de 3/4 caben tres negras. Se cuenta «uno, dos, tres», con el primer pulso un poco más fuerte, como en un vals. La blanca con puntillo ocupa el compás entero. Escucha el ejemplo y cuenta con él.",
      staff: EX.TRES_CUARTOS,
    },
  ]),
  lesson("armaduras", "reading", "Armaduras: Sol y Fa mayor", EX.ARMADURA, [
    {
      text: "La armadura son las alteraciones escritas al principio del pentagrama. Valen para toda la pieza, en todas las octavas. Un sostenido en la línea del {F} indica Sol mayor: todos los {F} se tocan en la tecla negra de su derecha, el {66}.",
      staff: EX.ARMADURA,
      keys: keys([66, 67]),
    },
    {
      text: "Un bemol en la línea del {B} indica Fa mayor: todos los {B} se tocan en la tecla negra de su izquierda, el {70}. Antes de empezar una pieza, mira siempre la armadura.",
      keys: keys([65, 70]),
    },
  ]),
  tip(TIPS.escuchaPedal),
  lesson("pedal", "chords", "El pedal de resonancia", EX.PEDAL, [
    {
      text: "El pedal derecho deja sonar las cuerdas aunque levantes los dedos. La línea bajo la partitura indica cuándo pisarlo; cada pico es un cambio: levanta y vuelve a pisar justo al tocar el acorde nuevo. El pedal no cuenta para la puntuación, pero escúchalo.",
      staff: EX.PEDAL,
    },
  ]),
  lesson("ligaduras", "reading", "Ligaduras y frases", EX.LIGADURAS, [
    {
      text: "Un arco que une notas distintas es una ligadura de expresión: esas notas se tocan unidas, sin cortar el sonido entre una y otra. Al final del arco, levanta un poco la mano antes de la frase siguiente.",
      staff: EX.LIGADURAS,
    },
  ]),
  tip(TIPS.frase),
];

// ---------- Nivel 4 · Más allá del 4/4 (012) ----------

const U5: LessonOrTip[] = [
  tip(TIPS.sinParar),
  lesson("seis-ochos", "rhythm", "El compás de 6/8", EX.SEIS_OCHOS, [
    {
      text: "En el 6/8 caben seis corcheas, agrupadas de tres en tres. Se siente en dos pulsos largos, cada uno de una negra con puntillo: «uno-y-a, dos-y-a». Por eso suena como un balanceo. Escucha el ejemplo y marca los dos pulsos.",
      staff: EX.SEIS_OCHOS,
    },
  ]),
  lesson("semicorcheas", "rhythm", "Semicorcheas", EX.SEMICORCHEAS, [
    {
      text: "Una semicorchea dura la mitad de una corchea: cuatro caben en una negra. Para contarlas, di «uno-i-y-a» en cada pulso. Tócalas con los dedos cerca de las teclas y sin prisa: la clave es que las cuatro duren lo mismo.",
      staff: EX.SEMICORCHEAS,
    },
  ]),
  lesson("dos-voces", "position", "Dos voces en movimiento contrario", EX.DOS_VOCES, [
    {
      text: "En el contrapunto, cada mano canta su propia melodía. Aquí las manos se mueven en sentido contrario: cuando la derecha sube, la izquierda baja. Escucha las dos líneas a la vez y procura que las dos suenen igual de claras.",
      staff: EX.DOS_VOCES,
    },
  ]),
  tip(TIPS.dedosDificiles),
  lesson("dos-claves", "reading", "Leer en dos claves", EX.DOS_CLAVES, [
    {
      text: "Las piezas a dos manos se leen en dos pentagramas: clave de sol arriba y clave de fa abajo. Aquí las manos se alternan: lee la nota, decide qué mano la toca y busca la tecla. Con práctica, los ojos leen las dos claves a la vez.",
      staff: EX.DOS_CLAVES,
    },
  ]),
  lesson("arpegios", "chords", "Arpegios", EX.ARPEGIOS, [
    {
      text: "Un arpegio es un acorde tocado nota a nota. El de {C} mayor es {C}, {E}, {G} y otra vez {C}, una octava más arriba. La mano se abre para alcanzarlo, con los dedos 1, 2, 3 y 5. Mantén la muñeca flexible.",
      keys: keys([60, 64, 67, 72], [1, 2, 3, 5]),
      staff: EX.ARPEGIOS,
    },
  ]),
  tip(TIPS.grabarse),
];

/** Separa lecciones y consejos de los hitos, manteniendo el orden de cada camino. */
const split = (items: (LessonOrTip | SongItem)[]) => ({
  lessons: items.filter((i): i is LessonOrTip => i.type !== "song"),
  hitos: items.filter((i): i is SongItem => i.type === "song"),
});

const HITO_IDS = new Set([...U1, ...U2, ...U3].flatMap((i) => (i.type === "song" ? [i.songId] : [])));

/** Canciones de un nivel: hitos (recomendados) y después el resto del repertorio de ese nivel. */
const songsOf = (n: LevelN, hitos: SongItem[]): SongItem[] => [
  ...hitos,
  ...SONGS.filter((s) => levelOf(s) === n && !HITO_IDS.has(s.id)).map((s): SongItem => ({ type: "song", id: `cancion-${s.id}`, songId: s.id, recommended: false })),
];

const level = (n: LevelN, title: string, items: (LessonOrTip | SongItem)[], technique: Level["technique"], test: SongDef[] | null): Level => {
  const { lessons, hitos } = split(items);
  return { n, title, lessons, technique, songs: songsOf(n, hitos), test };
};

// ---------- Técnica (012, FR-012 y FR-017; aclaración Q4) ----------

type TechItem = Level["technique"][number];
const SLOW: [number, number, number] = [60, 80, 100];
const FAST: [number, number, number] = [72, 96, 120];

/** Escalas de una tonalidad: mano derecha y mano izquierda. */
const scales = (tonic: ScaleSpec["tonic"], mode: ScaleSpec["mode"], tempos: [number, number, number]): TechItem[] =>
  (["R", "L"] as const).map((hand) => {
    const spec: ScaleSpec = { tonic, mode, hand, tempos };
    return { type: "scale", id: scaleId(spec), scale: spec };
  });

const indep = (n: 2 | 3 | 4): TechItem[] => INDEPENDENCE[n].map((song) => ({ type: "independence", id: song.id, song, needsMidi: true }));

export const LEVELS: Level[] = [
  level(1, "Primeros pasos", U1, scales("C", "major", SLOW), null),
  level(2, "Moverse por el teclado", [...U2, ...U3], [...scales("G", "major", SLOW), ...scales("F", "major", SLOW), ...indep(2)], EX.TEST_U2),
  level(3, "Las dos manos juntas", U4, [...scales("D", "major", FAST), ...scales("A", "minor", FAST), ...indep(3)], EX.TEST_N3),
  level(4, "Más allá del 4/4", U5, [...scales("E", "minor", FAST), ...scales("Bb", "major", FAST), ...indep(4)], EX.TEST_N4),
];

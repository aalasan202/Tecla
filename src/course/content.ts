import type { SongDef, Track } from "../music/types";
import type { Block, ExplainPage, Lesson, PathItem, Tip, Unit } from "./types";
import { TIPS } from "./tips";
import * as EX from "./exercises";

/**
 * La ruta del Curso (010): tres unidades que alternan lecciones, consejos y piezas‑hito del
 * repertorio. Los ids son estables: se guardan en el progreso y aparecen en las URL.
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

const lesson = (id: string, block: Block, title: string, exercise: SongDef, pages: ExplainPage[]): PathItem => ({
  type: "lesson",
  id: `l-${id}`,
  lesson: { id: `l-${id}`, block, title, pages, exercise } satisfies Lesson,
});
const tip = (t: Tip): PathItem => ({ type: "tip", id: t.id, tip: t });
const hito = (songId: string): PathItem => ({ type: "milestone", id: `hito-${songId}`, songId });

// ---------- Unidad 1 · Primeros pasos ----------

const U1: Unit = {
  id: "u1",
  title: "Primeros pasos",
  level: 1,
  test: null,
  items: [
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
  ],
};

// ---------- Unidad 2 · Moverse por el teclado ----------

const U2: Unit = {
  id: "u2",
  title: "Moverse por el teclado",
  level: 2,
  test: EX.TEST_U2,
  items: [
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
  ],
};

// ---------- Unidad 3 · La mano izquierda y los primeros acordes ----------

const U3: Unit = {
  id: "u3",
  title: "La mano izquierda y los primeros acordes",
  level: 2,
  test: EX.TEST_U3,
  items: [
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
  ],
};

export const COURSE: Unit[] = [U1, U2, U3];

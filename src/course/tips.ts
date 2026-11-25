import type { Tip } from "./types";

/**
 * Consejos prácticos de los niveles 1 y 2 (010, FR-005). Como mucho 60 palabras, escritos para
 * quien toca un piano o un teclado de verdad. Los nombres de nota van con marcas ({60}, {C}).
 */
const tip = (id: string, level: 1 | 2, title: string, text: string, art: Tip["art"]): Tip => ({ id: `consejo-${id}`, level, title, text, art });
const ill = (id: Extract<Tip["art"], { kind: "illustration" }>["id"]) => ({ kind: "illustration" as const, id });
const icon = (id: Extract<Tip["art"], { kind: "icon" }>["id"]) => ({ kind: "icon" as const, id });

export const TIPS = {
  postura: tip(
    "postura",
    1,
    "Postura al sentarse",
    "Siéntate en la mitad delantera de la banqueta, centrado frente al {C} central. Ajusta la altura para que los antebrazos queden paralelos al suelo. Aléjate lo justo para que los codos queden un poco por delante del cuerpo. Apoya los dos pies en el suelo y mantén la espalda recta, sin tensión.",
    ill("posture"),
  ),
  mano: tip(
    "mano",
    1,
    "Forma de la mano",
    "Coloca la mano redondeada, como si sujetaras una pelota pequeña. Toca con la yema de los dedos, no con la uña ni con el dedo plano. El pulgar se apoya sobre su lado. La muñeca queda recta, a la altura de las teclas: ni hundida ni levantada.",
    ill("hand-shape"),
  ),
  dedos: tip(
    "dedos",
    1,
    "Los números de los dedos",
    "Cada dedo tiene un número, igual en las dos manos: el pulgar es el 1, el índice el 2, el corazón el 3, el anular el 4 y el meñique el 5. Los números que aparecen junto a las notas te dicen qué dedo usar.",
    ill("finger-numbers"),
  ),
  do: tip(
    "do",
    1,
    "Encontrar el Do",
    "Las teclas negras van en grupos de dos y de tres. El {C} es la tecla blanca justo a la izquierda de cada grupo de dos negras. El que queda más cerca del centro del piano es el {C} central, tu punto de partida.",
    ill("find-c"),
  ),
  sinGolpear: tip(
    "sin-golpear",
    1,
    "Tocar sin golpear",
    "No hace falta fuerza para que suene bien. Mantén los dedos cerca de las teclas y deja que el peso del brazo baje hasta la yema. Hombros sueltos y muñeca flexible. Si notas tensión o dolor, para, sacude las manos y vuelve a empezar despacio.",
    ill("arm-weight"),
  ),
  pocoAMenudo: tip(
    "poco-a-menudo",
    1,
    "Practicar poco y a menudo",
    "Diez o quince minutos al día rinden más que una hora el fin de semana. La mano aprende repitiendo, con descanso entre medias. Elige un momento fijo del día y mantén la racha: cada día cuenta.",
    icon("clock"),
  ),
  lento: tip(
    "lento",
    2,
    "Lento primero",
    "La velocidad llega sola. Practica primero despacio y sin errores, y sube el tempo solo cuando la pieza salga limpia. Usa Aprender, que espera cada nota, antes de pasar a Tocar.",
    icon("turtle"),
  ),
  contar: tip(
    "contar",
    2,
    "Contar en voz alta",
    "Cuenta en voz alta mientras tocas: «uno, dos, tres, cuatro». Con corcheas, añade «y» entre los números: «uno y dos y…». Contar te ayuda a no correr ni pararte, sobre todo en las notas largas y en los silencios.",
    icon("voice"),
  ),
  ojos: tip(
    "ojos",
    2,
    "Ojos en la partitura",
    "Intenta mirar la partitura y no las manos. Busca la posición por el tacto: las teclas negras son tu guía. Si necesitas mirar, hazlo un instante antes de un salto y vuelve enseguida a la partitura.",
    ill("eyes-on-score"),
  ),
  adelantado: tip(
    "adelantado",
    2,
    "Leer por adelantado",
    "Mientras tocas una nota, tus ojos ya deben estar en la siguiente. Leer un poco por delante te da tiempo para preparar el dedo y evita que te detengas a pensar a mitad de la frase.",
    icon("arrow"),
  ),
  brazo: tip(
    "brazo",
    2,
    "Saltar con el brazo",
    "Para cambiar de posición no estires los dedos: mueve el brazo entero, como un pequeño arco por encima de las teclas. Prepara la mano antes de llegar, aprovechando el final de una nota o un silencio, y cae ya con la forma correcta.",
    ill("arm-jump"),
  ),
  bucle: tip(
    "bucle",
    2,
    "No volver al principio",
    "Si siempre fallas en el mismo sitio, no vuelvas al principio cada vez. Aísla ese compás, repítelo despacio hasta que salga y después únelo con lo anterior. En Canciones, el bucle repite justo el fragmento que elijas.",
    icon("loop"),
  ),
  metronomo: tip(
    "metronomo",
    2,
    "El metrónomo es tu aliado",
    "El metrónomo mantiene el pulso estable. Empieza a un tempo lento con el que no falles y súbelo poco a poco, de cinco en cinco. Si empiezas a fallar, vuelve al tempo anterior: no es retroceder, es asentar.",
    icon("metronome"),
  ),
} satisfies Record<string, Tip>;

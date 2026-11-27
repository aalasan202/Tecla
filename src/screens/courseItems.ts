import { BLOCK_LABEL, type CourseItem, type Level, type Recommendation } from "../course/types";
import { scale, scaleName } from "../course/scales";
import { findSong } from "../state/library";
import type { Route } from "../router";
import type { SongDef } from "../music/types";

/** Ayudas de presentación de los elementos del Curso (012), compartidas por las pantallas. */

const HAND = { R: "mano derecha", L: "mano izquierda" } as const;

export function itemTitle(item: CourseItem): string {
  switch (item.type) {
    case "lesson":
      return item.lesson.title;
    case "tip":
      return item.tip.title;
    case "scale":
      return `Escala de ${scaleName(item.scale)} · ${HAND[item.scale.hand]}`;
    case "independence":
      return item.song.title;
    case "song":
      return findSong(item.songId)?.title ?? item.songId;
  }
}

/** Etiqueta corta del tipo de elemento. */
export function itemKind(item: CourseItem): string {
  switch (item.type) {
    case "lesson":
      return BLOCK_LABEL[item.lesson.block];
    case "tip":
      return "Consejo";
    case "scale":
      return "Escala";
    case "independence":
      return "Dos manos";
    case "song":
      return item.recommended ? "Recomendada" : "Canción";
  }
}

/** Partitura que representa al elemento (tarjeta de «Continuar»), si la hay. */
export function itemSong(item: CourseItem): SongDef | undefined {
  switch (item.type) {
    case "lesson":
      return item.lesson.exercise;
    case "scale":
      return scale(item.scale, item.scale.tempos[0]);
    case "independence":
      return item.song;
    case "song":
      return findSong(item.songId);
    default:
      return undefined;
  }
}

export const levelLabel = (level: Pick<Level, "n" | "title">): string => `Nivel ${level.n} · ${level.title}`;

/** Destino de una recomendación: un elemento o la prueba de un nivel. */
export function recommendationRoute(r: Recommendation): Route {
  const test = /^test:(\d)$/.exec(r.itemId);
  if (test) return { name: "courseTest", level: Number(test[1]) as 2 | 3 | 4 };
  return { name: "courseItem", itemId: r.itemId };
}

/** Qué hacer para abrir un nivel bloqueado. */
export const lockedLevelReason = (n: number): string =>
  `Supera las lecciones del nivel ${n - 1} con 2 estrellas o más, o haz la prueba de nivel si ya sabes lo que enseñan.`;

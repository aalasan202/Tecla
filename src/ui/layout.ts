/**
 * Cálculos de disposición de la lección en pantallas pequeñas. Funciones puras, sin DOM.
 */

/** Escala para que `content` quepa en `avail`; nunca amplía ni baja de `min`. */
export function fitScale(content: number, avail: number, min = 0.55): number {
  if (!(content > 0) || !(avail > 0)) return 1;
  return Math.min(1, Math.max(min, avail / content));
}

export interface KeyScrollArgs {
  /** Índices de tecla blanca que deben verse; vacío → no se mueve. */
  targets: number[];
  /** Número de teclas blancas del teclado. */
  whites: number;
  /** Ancho de una tecla blanca en pantalla. */
  keyW: number;
  /** Ancho visible. */
  view: number;
  /** Desplazamiento actual. */
  left: number;
  /** Teclas de margen a cada lado; 1 por defecto. */
  margin?: number;
}

/**
 * Desplazamiento horizontal del teclado para que las teclas `targets` se vean con `margin`
 * teclas de margen. Si ya se ven devuelve `left`; si no caben juntas, prioriza la más grave.
 * Siempre en [0, max(0, whites·keyW − view)].
 */
export function keyScroll({ targets, whites, keyW, view, left, margin = 1 }: KeyScrollArgs): number {
  if (targets.length === 0) return left;
  const max = Math.max(0, whites * keyW - view);
  const lo = Math.min(...targets);
  const hi = Math.max(...targets);
  const needLeft = (lo - margin) * keyW;
  const needRight = (hi + 1 + margin) * keyW - view;
  let next = left;
  if (needRight > needLeft) next = needLeft; // no caben juntas: manda la más grave
  else if (left > needLeft) next = needLeft;
  else if (left < needRight) next = needRight;
  return Math.min(max, Math.max(0, next));
}

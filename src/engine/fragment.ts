import type { LoopRange } from "./lesson";

/**
 * Selección del fragmento que se repite en bucle, tal como la hace el alumno: dos toques en la
 * partitura (un extremo y el otro) y botones ±1 compás. Compases en base 0. Sin DOM.
 */
export interface FragmentSelection {
  on: boolean;
  a: number | null;
  b: number | null;
}

export type FragmentEdge = "from" | "to";

export const emptySelection: FragmentSelection = { on: false, a: null, b: null };

export function toggleLoop(sel: FragmentSelection, on: boolean): FragmentSelection {
  if (!on) return emptySelection;
  return sel.on ? sel : { on: true, a: null, b: null };
}

/** Primer toque = un extremo; segundo = el otro; con el fragmento completo, empieza otro. */
export function tapMeasure(sel: FragmentSelection, i: number): FragmentSelection {
  if (!sel.on) return sel;
  if (sel.a === null || sel.b !== null) return { on: true, a: i, b: null };
  return { on: true, a: sel.a, b: i };
}

/** El rango ordenado, o null si el bucle está desactivado o falta un extremo. */
export function rangeOf(sel: FragmentSelection): LoopRange | null {
  if (!sel.on || sel.a === null || sel.b === null) return null;
  return { from: Math.min(sel.a, sel.b), to: Math.max(sel.a, sel.b) };
}

export function canNudge(sel: FragmentSelection, edge: FragmentEdge, delta: 1 | -1, measures: number): boolean {
  const r = rangeOf(sel);
  if (!r) return false;
  if (edge === "from") {
    const from = r.from + delta;
    return from >= 0 && from <= r.to;
  }
  const to = r.to + delta;
  return to < measures && to >= r.from;
}

/** Mueve el inicio o el fin un compás, sin salir de la pieza ni cruzar los extremos. */
export function nudge(sel: FragmentSelection, edge: FragmentEdge, delta: 1 | -1, measures: number): FragmentSelection {
  const r = rangeOf(sel);
  if (!r || !canNudge(sel, edge, delta, measures)) return sel;
  return edge === "from" ? { on: true, a: r.from + delta, b: r.to } : { on: true, a: r.from, b: r.to + delta };
}

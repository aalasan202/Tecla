import type { KeyChange, Layout, MeasureBox } from "./types";

/** Margen izquierdo de la partitura sin armadura (claves y compás). */
export const STAFF_LEFT = 90;
/** Distancia de la barra de compás a la primera nota. */
const NOTE_OFFSET = 16;
/** Sitio extra cuando la primera nota del compás lleva alteración. */
const ACC_ROOM = 10;
/** Ancho de cada alteración de una armadura. */
const KEY_ACC = 10;
/**
 * Separación mínima entre dos inicios de nota seguidos (research R2): con menos, los nombres
 * («Sol♯») y las alteraciones de semicorcheas seguidas se pisan.
 */
const MIN_GAP_PX = 26;
const EPS = 1e-9;

export interface LayoutInput {
  /** Negras por compás. */
  bar: number;
  /** Pulsos de la pieza (múltiplo de `bar`). */
  total: number;
  /** Inicios de nota y de silencio, en pulsos. */
  onsets: number[];
  /** Píxeles por negra pedidos (50 por defecto); sube si hay notas muy seguidas. */
  px?: number;
  keys: KeyChange[];
  /** Compases cuya primera nota lleva alteración. */
  accFirst?: Set<number>;
}

/** Ancho de una armadura de `key` alteraciones (con su separación). */
export const keyWidth = (key: number): number => (key ? Math.abs(key) * KEY_ACC + 6 : 0);

/** Píxeles por negra para que dos inicios seguidos queden a ≥ 26 px. */
export function minPx(onsets: number[], px: number): number {
  const sorted = [...new Set(onsets.map((s) => Math.round(s * 48)))].sort((a, b) => a - b);
  let gap = Infinity;
  for (let i = 1; i < sorted.length; i++) gap = Math.min(gap, (sorted[i] - sorted[i - 1]) / 48);
  return gap === Infinity ? px : Math.max(px, Math.ceil(MIN_GAP_PX / gap));
}

/**
 * Posiciones horizontales, proporcionales al tiempo dentro de cada compás. Cada compás empieza
 * tras un margen (armadura nueva, alteración en la primera nota); el cursor interpola entre los
 * inicios de nota y de compás, así que avanza a velocidad constante salvo en esos márgenes.
 */
export function layoutScore(input: LayoutInput): Layout {
  const { bar, total, keys, accFirst = new Set<number>() } = input;
  const px = minPx(input.onsets, input.px ?? 50);
  const keyOf = (i: number) => {
    let k = 0;
    for (const c of keys) if (c.at <= i) k = c.key;
    return k;
  };
  const count = Math.max(1, Math.round(total / bar));
  const left = STAFF_LEFT + keyWidth(keyOf(0));
  const measures: MeasureBox[] = [];
  let x = left;
  for (let i = 0; i < count; i++) {
    let extra = accFirst.has(i) ? ACC_ROOM : 0;
    if (i > 0 && keyOf(i) !== keyOf(i - 1)) extra += (Math.abs(keyOf(i)) + Math.abs(keyOf(i - 1))) * KEY_ACC + 8;
    const width = extra + bar * px;
    measures.push({ x, width, start: i * bar, pad: NOTE_OFFSET + extra });
    x += width;
  }
  const width = x + 40;

  // posición «local» dentro de un compás: lineal desde su primera nota
  const local = (b: number) => {
    const i = Math.min(Math.max(Math.floor(b / bar + EPS), 0), count - 1);
    const m = measures[i];
    return m.x + m.pad + (b - m.start) * px;
  };
  const anchors = [...new Set([...input.onsets, ...measures.map((m) => m.start)].map((b) => Math.round(b * 48)))]
    .sort((a, b) => a - b)
    .map((t) => [t / 48, local(t / 48)] as const);

  function xAt(beat: number): number {
    const first = anchors[0];
    const last = anchors[anchors.length - 1];
    if (beat <= first[0]) return first[1] + (beat - first[0]) * px;
    if (beat >= last[0]) return last[1] + (beat - last[0]) * px;
    let lo = 0;
    let hi = anchors.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (anchors[mid][0] <= beat) lo = mid;
      else hi = mid;
    }
    const [b0, x0] = anchors[lo];
    const [b1, x1] = anchors[hi];
    return x0 + ((beat - b0) / (b1 - b0)) * (x1 - x0);
  }

  function measureAt(px: number): number {
    let i = 0;
    for (let k = 0; k < count; k++) if (measures[k].x + 2 <= px) i = k;
    return i;
  }

  return { measures, width, left, px, xAt, measureAt };
}

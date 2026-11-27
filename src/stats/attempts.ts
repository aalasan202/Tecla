import type { HandChoice } from "../engine/lesson";
import { HISTORY_LIMIT, type Attempt, type AttemptSource, type Fragment, type HistoryData, type PieceSummary } from "./types";

/** Construye un intento y decide si cuenta para la evolución (FR-007, research R3). */
export function makeAttempt(input: {
  source: AttemptSource;
  mode: "learn" | "play";
  hands: HandChoice;
  twoHands: boolean;
  tempo: number;
  score: number;
  stars: number;
  frag?: Fragment;
}): Omit<Attempt, "at"> {
  const { source, mode, hands, twoHands, tempo, score, stars, frag } = input;
  const a: Omit<Attempt, "at"> = {
    key: source.key,
    src: source.src,
    title: source.title,
    ...(source.unit ? { unit: source.unit } : {}),
    mode,
    hands,
    twoHands,
    tempo,
    score: Math.min(1, Math.max(0, score)),
    stars,
    counts: mode === "play" && !frag && (!twoHands || hands === "both"),
  };
  if (frag) a.frag = frag;
  return a;
}

function summarize(prev: PieceSummary | undefined, a: Attempt): PieceSummary {
  const point = { at: a.at, score: a.score };
  return {
    count: (prev?.count ?? 0) + 1,
    title: a.title,
    src: a.src,
    ...(a.unit ? { unit: a.unit } : {}),
    first: prev?.first ?? (a.counts ? point : undefined),
    best: a.counts && (!prev?.best || a.score > prev.best.score) ? point : prev?.best,
    last: { ...point, mode: a.mode },
  };
}

/** Añade al final, recorta los más antiguos y actualiza el resumen. No muta `data`. */
export function addAttempt(data: Pick<HistoryData, "attempts" | "pieces">, a: Attempt, limit = HISTORY_LIMIT): Pick<HistoryData, "attempts" | "pieces"> {
  const attempts = [...data.attempts, a];
  if (attempts.length > limit) attempts.splice(0, attempts.length - limit);
  const summary = summarize(data.pieces[a.key], a);
  if (!summary.first) delete summary.first;
  if (!summary.best) delete summary.best;
  return { attempts, pieces: { ...data.pieces, [a.key]: summary } };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

/** Descarta entradas mal formadas al cargar (data-model: validación). */
export function validAttempts(raw: unknown): Attempt[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (a): a is Attempt =>
      isObj(a) &&
      typeof a.key === "string" &&
      a.key.length > 0 &&
      typeof a.at === "number" &&
      Number.isFinite(a.at) &&
      typeof a.score === "number" &&
      a.score >= 0 &&
      a.score <= 1 &&
      (a.mode === "learn" || a.mode === "play"),
  );
}

export function validPieces(raw: unknown): Record<string, PieceSummary> {
  if (!isObj(raw)) return {};
  const out: Record<string, PieceSummary> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (isObj(v) && typeof v.count === "number" && isObj(v.last)) out[k] = v as unknown as PieceSummary;
  }
  return out;
}

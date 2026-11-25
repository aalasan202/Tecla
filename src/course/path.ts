import type { Block, CourseProgress, ItemStatus, PathItem, PathState, Unit, UnitStatus } from "./types";

/** Estrellas necesarias para superar una lección o un hito. */
export const PASS_STARS = 2;

interface Flat {
  unit: Unit;
  item: PathItem;
  /** Posición global en la ruta. */
  g: number;
}

const flatten = (units: Unit[]): Flat[] => {
  const out: Flat[] = [];
  for (const unit of units) for (const item of unit.items) out.push({ unit, item, g: out.length });
  return out;
};

const scored = (f: Flat) => f.item.type !== "tip";

/**
 * Estado de cada elemento y unidad, calculado a partir del progreso (data-model, reglas 1–6).
 * Las estrellas de las lecciones salen del Curso; las de los hitos, de Canciones (`songBest`).
 */
export function pathState(units: Unit[], cp: CourseProgress, songBest: Record<string, number>): PathState {
  const flat = flatten(units);
  const starsOf = (f: Flat): number | undefined =>
    f.item.type === "lesson" ? cp.best[f.item.id] : f.item.type === "milestone" ? songBest[f.item.songId] : undefined;
  const passed = (f: Flat) => (starsOf(f) ?? 0) >= PASS_STARS;

  // frontera: último puntuable superado o perteneciente a una unidad saltada por prueba
  let frontier = -1;
  for (const f of flat) if (scored(f) && (passed(f) || cp.skipped[f.unit.id])) frontier = f.g;

  const items: PathState["items"] = {};
  let availableAt = -1;
  for (const f of flat) {
    if (!scored(f)) continue;
    const stars = starsOf(f);
    let status: ItemStatus;
    if (passed(f)) status = "passed";
    // hasta la frontera incluida (el último de una unidad saltada no está superado)
    else if (f.g <= frontier) status = "optional";
    else if (availableAt < 0 && f.g > frontier) {
      status = "available";
      availableAt = f.g;
    } else status = "locked";
    items[f.item.id] = stars === undefined ? { status } : { status, stars };
  }

  // consejos: disponibles si el primer puntuable que les sigue no está bloqueado (o, al final, si el anterior está superado)
  for (const f of flat) {
    if (scored(f)) continue;
    if (cp.seen[f.item.id]) {
      items[f.item.id] = { status: "seen" };
      continue;
    }
    const after = flat.find((x) => x.g > f.g && scored(x));
    const before = [...flat].reverse().find((x) => x.g < f.g && scored(x));
    const open = after ? items[after.item.id].status !== "locked" : !before || items[before.item.id].status !== "locked";
    items[f.item.id] = { status: open ? "available" : "locked" };
  }

  // unidades
  const unitStatus: Record<string, UnitStatus> = {};
  const nextOf = () => {
    if (availableAt >= 0) {
      // primer consejo no visto de la misma unidad, inmediatamente antes del disponible
      const target = flat[availableAt];
      let i = availableAt - 1;
      let firstTip: string | null = null;
      while (i >= 0 && !scored(flat[i]) && flat[i].unit === target.unit) {
        if (items[flat[i].item.id].status === "available") firstTip = flat[i].item.id;
        i--;
      }
      return firstTip ?? target.item.id;
    }
    const tip = flat.find((f) => items[f.item.id].status === "available");
    return tip ? tip.item.id : null;
  };
  const next = nextOf();
  const nextUnit = next ? flat.find((f) => f.item.id === next)!.unit : null;
  for (const unit of units) {
    if (cp.skipped[unit.id]) unitStatus[unit.id] = "skipped";
    else if (unit === nextUnit) unitStatus[unit.id] = "current";
    else {
      const sc = unit.items.filter((i) => i.type !== "tip");
      const done = sc.every((i) => items[i.id].status === "passed" || items[i.id].status === "optional");
      unitStatus[unit.id] = done ? "passed" : "locked";
    }
  }

  let summary: PathState["summary"] = null;
  if (nextUnit) {
    const done = nextUnit.items.filter((i) => ["passed", "seen"].includes(items[i.id].status)).length;
    summary = { unitId: nextUnit.id, done, total: nextUnit.items.length };
  }

  return { items, units: unitStatus, next, summary };
}

export function findItem(units: Unit[], itemId: string): { unit: Unit; item: PathItem; index: number } | null {
  for (const unit of units) {
    const index = unit.items.findIndex((i) => i.id === itemId);
    if (index >= 0) return { unit, item: unit.items[index], index };
  }
  return null;
}

/** Estrellas de las lecciones (no cuentan hitos ni pruebas): FR-037. */
export function courseStars(units: Unit[], cp: CourseProgress): { stars: number; max: number } {
  const lessons = units.flatMap((u) => u.items.filter((i) => i.type === "lesson"));
  return { stars: lessons.reduce((a, l) => a + (cp.best[l.id] ?? 0), 0), max: lessons.length * 3 };
}

const BLOCKS: Block[] = ["reading", "rhythm", "position", "chords"];
const blockOf = (exerciseId: string): Block => BLOCKS.find((b) => exerciseId.endsWith(`-${b}`)) ?? "reading";

/** Prueba de nivel: aprobada con 2★ o más en todos; si no, el bloque con menos estrellas. */
export function testOutcome(exerciseIds: string[], stars: Record<string, number>): { passed: boolean; weakest: Block | null } {
  let weakest: string | null = null;
  for (const id of exerciseIds) {
    const s = stars[id] ?? 0;
    if (s < PASS_STARS && (weakest === null || s < (stars[weakest] ?? 0))) weakest = id;
  }
  return weakest === null ? { passed: true, weakest: null } : { passed: false, weakest: blockOf(weakest) };
}

/** «Continuar» en Inicio: el Curso si fue lo último practicado y queda algo pendiente; si no, la pieza. */
export function continueTarget(
  courseLast: { itemId: string; at: number } | null,
  songLast: { at: number } | null,
  next: string | null,
): { kind: "course"; itemId: string } | { kind: "song" } {
  if (courseLast && next && (!songLast || courseLast.at > songLast.at)) return { kind: "course", itemId: next };
  return { kind: "song" };
}

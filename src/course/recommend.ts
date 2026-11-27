import type { CourseItem, CourseState, Level, Path, Recommendation } from "./types";

/**
 * «Siguiente recomendado» (012, FR-008–010, research R8). Reglas, en orden:
 * 1. Nada que exija MIDI si no lo hay (esos elementos ya llegan como `needsMidi`).
 * 2. Tras 2 elementos seguidos del mismo camino, otro camino si tiene algo pendiente.
 * 3. Lo pendiente del nivel abierto más alto: Lecciones → Técnica → Canciones, en el orden sugerido.
 * 4. Nivel más alto completo: la prueba del siguiente, si existe; si no, lo pendiente de niveles anteriores.
 */
const ORDER: Path[] = ["lessons", "technique", "songs"];

const REASON: Record<Path, (n: number) => string> = {
  lessons: (n) => `Sigue con las lecciones del nivel ${n}.`,
  technique: () => "Un poco de técnica.",
  songs: () => "Toca algo de lo aprendido.",
};

const listOf = (lv: Level, path: Path): CourseItem[] => (path === "lessons" ? lv.lessons : path === "technique" ? lv.technique : lv.songs);

export function recommend(levels: Level[], st: Omit<CourseState, "recommended">, recent: string[], midiOk: boolean): Recommendation | null {
  const pending = (lv: Level, path: Path) =>
    listOf(lv, path).filter((it) => st.items[it.id]?.status === "available" && (midiOk || it.type !== "independence"));

  const pathOfId = (id: string): Path | null => {
    for (const lv of levels) for (const p of ORDER) if (listOf(lv, p).some((it) => it.id === id)) return p;
    return null;
  };
  const lastTwo = recent.slice(-2).map(pathOfId);
  const avoid = lastTwo.length === 2 && lastTwo[0] !== null && lastTwo[0] === lastTwo[1] ? lastTwo[0] : null;

  const pick = (lv: Level): Recommendation | null => {
    const withItems = ORDER.filter((p) => pending(lv, p).length > 0);
    if (!withItems.length) return null;
    const path = withItems.find((p) => p !== avoid) ?? withItems[0];
    return { itemId: pending(lv, path)[0].id, level: lv.n, path, reason: REASON[path](lv.n) };
  };

  const open = levels.filter((lv) => st.levels[lv.n]?.open);
  const top = open[open.length - 1];
  if (!top) return null;
  const fromTop = pick(top);
  if (fromTop) return fromTop;

  const next = levels.find((lv) => lv.n === top.n + 1);
  if (next?.test?.length) return { itemId: `test:${next.n}`, level: next.n, path: "test", reason: `¿Te atreves con el nivel ${next.n}?` };

  for (const lv of [...open].reverse()) {
    const r = pick(lv);
    if (r) return r;
  }
  return null;
}

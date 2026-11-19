import { useEffect, useState } from "react";

/** Móvil en horizontal: la misma condición que usan Inicio y Piano libre en los estilos. */
export const COMPACT_QUERY = "(orientation: landscape) and (max-height: 500px)";

function query(): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(COMPACT_QUERY) : null;
}

/** `true` mientras la lección debe usar la disposición compacta; sigue al giro y al tamaño. */
export function useCompactLesson(): boolean {
  const [compact, setCompact] = useState(() => query()?.matches ?? false);
  useEffect(() => {
    const mq = query();
    if (!mq) return;
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return compact;
}

/** Progreso local (mejor puntuación por canción). Más adelante se sincronizará con la cuenta. */
const KEY = "tecla-best";

export type BestScores = Record<string, number>;

export function loadBest(): BestScores {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as BestScores;
  } catch {
    return {};
  }
}

export function saveBest(songId: string, stars: number): BestScores {
  const best = loadBest();
  if ((best[songId] ?? 0) < stars) {
    best[songId] = stars;
    try {
      localStorage.setItem(KEY, JSON.stringify(best));
    } catch {
      /* sin almacenamiento: el progreso dura la sesión */
    }
  }
  return best;
}

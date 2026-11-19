import type { Hand, RawTrack, Rest, Score, ScoreNote, SongDef } from "./types";
import { assignFingering } from "./fingering";

/** Margen izquierdo de la partitura (clave y compás). */
export const STAFF_LEFT = 74;
const NOTE_OFFSET = 16;

/** Convierte la definición de una canción en notas posicionadas, silencios y digitación. */
export function buildScore(song: SongDef): Score {
  const bar = song.bar ?? 4;
  const px = song.px ?? 50;
  const twoHands = !!song.l;
  const tracks: [Hand, RawTrack][] = twoHands ? [["R", song.r ?? []], ["L", song.l ?? []]] : [["R", song.n ?? []]];
  const notes: Omit<ScoreNote, "id">[] = [];
  const rests: Rest[] = [];
  let length = 0;

  for (const [h, track] of tracks) {
    let at = 0;
    for (const [m, d] of track) {
      if (m === 0) {
        // un silencio largo se parte en silencios que no cruzan la barra de compás
        let left = d;
        let pos = at;
        while (left > 0) {
          const part = Math.min(bar - (pos % bar), left);
          const centered = part >= bar ? px * (bar / 2 - 0.5) : 0;
          rests.push({ h, d: part, x: STAFF_LEFT + pos * px + NOTE_OFFSET + centered });
          pos += part;
          left -= part;
        }
      } else {
        notes.push({ m, d, s: at, h, x: STAFF_LEFT + at * px + NOTE_OFFSET, f: 0 });
      }
      at += d;
    }
    length = Math.max(length, at);
  }

  // orden temporal; a igual tiempo, mano derecha primero
  notes.sort((a, b) => a.s - b.s || (a.h === b.h ? 0 : a.h === "R" ? -1 : 1));
  const withIds: ScoreNote[] = notes.map((n, id) => ({ ...n, id }));

  assignFingering(withIds.filter((n) => n.h === "R"), { sign: 1, arpeggio: !!song.arpFingering, phraseBreaks: true, bar });
  assignFingering(withIds.filter((n) => n.h === "L"), { sign: -1, bar });

  return { song, notes: withIds, rests, total: Math.ceil(length / bar) * bar, bar, px, twoHands };
}

export const measureCount = (score: Score): number => score.total / score.bar;

/** Compás (base 0) bajo la coordenada x de la partitura, recortado a la pieza. */
export function measureAt(score: Score, x: number): number {
  const i = Math.floor((x - STAFF_LEFT - 2) / (score.bar * score.px));
  return Math.min(Math.max(i, 0), measureCount(score) - 1);
}

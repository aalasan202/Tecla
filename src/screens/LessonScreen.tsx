import { useMemo } from "react";
import { findSong } from "../state/library";
import { baseId } from "../state/imported";
import { buildScore } from "../music/score";
import { progress, recordSession, recordStars } from "../state/progress";
import { TopBar } from "../components/TopBar";
import { Practice } from "../components/Practice";
import type { Route } from "../router";

interface Props {
  songId: string;
  /** A dónde vuelve Atrás (Canciones por defecto; el Curso cuando es un hito). */
  back?: Route;
  /** Tras guardar la sesión (entrar, cambiar de paso, terminar): el Curso lo usa para «Continuar». */
  onSession?(): void;
}

export function LessonScreen({ songId, back = { name: "songs" }, onSession }: Props) {
  const song = findSong(songId);
  if (!song) {
    return (
      <div className="screen">
        <TopBar title="Canción no encontrada" back={back} />
        <p>
          Esta canción no existe. <a href="#canciones">Ver todas las canciones</a>
        </p>
      </div>
    );
  }
  return <LessonView key={song.id} songId={song.id} back={back} onSession={onSession} />;
}

function LessonView({ songId, back, onSession }: { songId: string; back: Route; onSession?: () => void }) {
  const song = findSong(songId)!;
  const twoHands = useMemo(() => buildScore(song).twoHands, [song]);
  // «Continuar» tras cambiar de versión una importada: se retoma en el mismo paso
  const resume = useMemo(() => {
    const last = progress.get().last;
    return last !== null && baseId(last.songId) === baseId(songId) ? last : null;
  }, [songId]);

  return (
    <Practice
      song={song}
      back={back}
      initialMode={resume?.mode}
      initialHands={resume?.hands}
      record={{ key: `song:${songId}`, src: "song", title: song.title }}
      onStep={(mode, hands) => {
        recordSession({ songId, mode, hands, progress: resume && resume.mode === mode && resume.hands === hands ? resume.progress : 0 });
        onSession?.();
      }}
      onAttempt={(mode, hands, p) => {
        recordSession({ songId, mode, hands, progress: p });
        onSession?.();
      }}
      onPlayResult={(r, hands) => {
        if (!twoHands || hands === "both") recordStars(songId, r.stars);
      }}
    />
  );
}

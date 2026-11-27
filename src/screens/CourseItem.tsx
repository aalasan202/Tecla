import { useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { Practice } from "../components/Practice";
import { findItem } from "../course/state";
import type { CourseItem, Level, Path } from "../course/types";
import { recordCourseStars, touchCourse } from "../state/course";
import { useCourse } from "../state/useCourse";
import type { Route } from "../router";
import { CourseLesson, CourseScale } from "./CourseLesson";
import { CourseTip } from "./CourseTip";
import { CourseTest } from "./CourseTest";
import { LessonScreen } from "./LessonScreen";
import { levelLabel, lockedLevelReason } from "./courseItems";

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="screen">
      <TopBar title={title} back={{ name: "course" }} />
      <section className="panel">
        <p>{text}</p>
        <a className="btn primary" href="#curso">
          Ir al Curso
        </a>
      </section>
    </div>
  );
}

/** `#curso/<id>`: cualquier elemento de un nivel abierto; si no existe o el nivel está bloqueado, lo explica. */
export function CourseItemScreen({ itemId }: { itemId: string }) {
  const { levels, state } = useCourse();
  const found = findItem(levels, itemId);
  if (!found) return <Notice title="No encontrado" text="Este paso del Curso no existe." />;
  if (state.items[itemId].status === "locked") return <Notice title="Todavía bloqueado" text={lockedLevelReason(found.level.n)} />;
  const back: Route = { name: "course", level: found.level.n, path: found.path };
  return <ItemView item={found.item} level={found.level} path={found.path} back={back} />;
}

function ItemView({ item, level, back }: { item: CourseItem; level: Level; path: Path; back: Route }) {
  switch (item.type) {
    case "lesson":
      return <CourseLesson lesson={item.lesson} level={level} back={back} />;
    case "tip":
      return <CourseTip tip={item.tip} back={back} />;
    case "scale":
      return <CourseScale id={item.id} spec={item.scale} level={level} back={back} />;
    case "independence":
      return <Independence item={item} level={level} back={back} />;
    case "song":
      return <CourseSong itemId={item.id} songId={item.songId} back={back} />;
  }
}

/** Canción del camino Canciones: la pieza de siempre; el Curso queda como lo último practicado. */
function CourseSong({ itemId, songId, back }: { itemId: string; songId: string; back: Route }) {
  useEffect(() => touchCourse(itemId), [itemId]);
  return <LessonScreen songId={songId} back={back} onSession={() => touchCourse(itemId)} />;
}

/** Independencia de manos: exige teclado MIDI (constitución 1.1.0, FR-018–020). */
function Independence({ item, level, back }: { item: Extract<CourseItem, { type: "independence" }>; level: Level; back: Route }) {
  useEffect(() => touchCourse(item.id), [item.id]);
  return (
    <Practice
      song={item.song}
      back={back}
      allowLoop={false}
      handsChoice={false}
      beat
      needsMidi
      record={{ key: `course:${item.id}`, src: "course", title: item.song.title, unit: levelLabel(level) }}
      onStep={() => touchCourse(item.id)}
      onPlayResult={(r) => {
        recordCourseStars(item.id, r.stars);
        touchCourse(item.id);
      }}
    />
  );
}

export function CourseTestScreen({ level }: { level: 2 | 3 | 4 }) {
  const { levels } = useCourse();
  const lv = levels[level - 1];
  if (!lv?.test?.length) return <Notice title="No encontrado" text="Este nivel no tiene prueba." />;
  return <CourseTest level={lv} />;
}

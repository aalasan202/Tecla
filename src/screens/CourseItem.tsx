import { useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { findItem } from "../course/path";
import { touchCourse } from "../state/course";
import { useCourse } from "../state/useCourse";
import { CourseLesson } from "./CourseLesson";
import { CourseTip } from "./CourseTip";
import { CourseTest } from "./CourseTest";
import { LessonScreen } from "./LessonScreen";
import { lockedReason } from "./CourseMap";

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

/** `#curso/<id>`: lección, consejo o hito; si no existe o está bloqueado, lo explica (FR-018). */
export function CourseItemScreen({ itemId }: { itemId: string }) {
  const { units, state } = useCourse();
  const found = findItem(units, itemId);
  if (!found) return <Notice title="No encontrado" text="Este paso del Curso no existe." />;
  if (state.items[itemId].status === "locked") return <Notice title="Todavía bloqueado" text={lockedReason(units, state, itemId)} />;
  const { item } = found;
  if (item.type === "lesson") return <CourseLesson lesson={item.lesson} />;
  if (item.type === "tip") return <CourseTip tip={item.tip} />;
  return <Milestone itemId={item.id} songId={item.songId} />;
}

/** Hito: la pieza del repertorio de siempre; el Curso queda como lo último practicado (R12). */
function Milestone({ itemId, songId }: { itemId: string; songId: string }) {
  useEffect(() => touchCourse(itemId), [itemId]);
  return <LessonScreen songId={songId} back={{ name: "course" }} onSession={() => touchCourse(itemId)} />;
}

export function CourseTestScreen({ unitId }: { unitId: string }) {
  const { units } = useCourse();
  const index = units.findIndex((u) => u.id === unitId);
  if (index <= 0 || !units[index].test) return <Notice title="No encontrado" text="Esta unidad no tiene prueba de nivel." />;
  return <CourseTest unit={units[index]} index={index} units={units} />;
}

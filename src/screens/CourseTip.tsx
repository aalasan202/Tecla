import type { ComponentType } from "react";
import type { IconId, Tip } from "../course/types";
import { renderText } from "../course/text";
import { TopBar } from "../components/TopBar";
import { Illustration } from "../components/illustrations";
import { IconArrow, IconClock, IconLoop, IconMetronome, IconTurtle, IconVoice } from "../components/Icons";
import { markSeen, touchCourse, course } from "../state/course";
import { settings } from "../state/settings";
import { COURSE } from "../course/content";
import { pathState } from "../course/path";
import { progress } from "../state/progress";
import { hrefFor } from "../router";

const ICONS: Record<IconId, ComponentType<{ size?: number }>> = {
  clock: IconClock,
  turtle: IconTurtle,
  voice: IconVoice,
  arrow: IconArrow,
  loop: IconLoop,
  metronome: IconMetronome,
};

/** Ficha de consejo: ilustración o icono, texto breve y «Entendido» (FR-017, FR-024). */
export function CourseTip({ tip }: { tip: Tip }) {
  const { notation } = settings.use();
  const Icon = tip.art?.kind === "icon" ? ICONS[tip.art.id] : null;

  const done = () => {
    markSeen(tip.id);
    touchCourse(tip.id);
    const next = pathState(COURSE, course.get(), progress.get().best).next;
    location.hash = next ? hrefFor({ name: "courseItem", itemId: next }) : hrefFor({ name: "course" });
  };

  return (
    <div className="screen course-tip">
      <TopBar title="Consejo" back={{ name: "course" }} />
      <article className="panel tip-card">
        <div className="tip-art">
          {tip.art?.kind === "illustration" && <Illustration id={tip.art.id} />}
          {Icon && (
            <span className="tip-icon">
              <Icon size={56} />
            </span>
          )}
        </div>
        <div className="tip-body">
          <span className="eyebrow-dark">Consejo · Nivel {tip.level}</span>
          <h2>{tip.title}</h2>
          <p>{renderText(tip.text, notation)}</p>
          <button type="button" className="btn primary" onClick={done}>
            Entendido
          </button>
        </div>
      </article>
    </div>
  );
}

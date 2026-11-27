import type { ComponentType } from "react";
import type { IconId, Tip } from "../course/types";
import { renderText } from "../course/text";
import { TopBar } from "../components/TopBar";
import { Illustration } from "../components/illustrations";
import { IconArrow, IconClock, IconLoop, IconMetronome, IconTurtle, IconVoice } from "../components/Icons";
import { markSeen, touchCourse } from "../state/course";
import { settings } from "../state/settings";
import { hrefFor, type Route } from "../router";

const ICONS: Record<IconId, ComponentType<{ size?: number }>> = {
  clock: IconClock,
  turtle: IconTurtle,
  voice: IconVoice,
  arrow: IconArrow,
  loop: IconLoop,
  metronome: IconMetronome,
};

/** Ficha de consejo: ilustración o icono, texto breve y «Entendido», que vuelve al camino (010, FR-017). */
export function CourseTip({ tip, back }: { tip: Tip; back: Route }) {
  const { notation } = settings.use();
  const Icon = tip.art?.kind === "icon" ? ICONS[tip.art.id] : null;

  const done = () => {
    markSeen(tip.id);
    touchCourse(tip.id);
    location.hash = hrefFor(back);
  };

  return (
    <div className="screen course-tip">
      <TopBar title="Consejo" back={back} />
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

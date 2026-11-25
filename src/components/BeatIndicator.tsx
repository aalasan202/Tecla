import { forwardRef, useImperativeHandle, useRef } from "react";

export interface BeatHandle {
  /** Un pulso del metrónomo; `strong` en el primero del compás. */
  pulse(strong: boolean): void;
}

/** Círculo que late con el metrónomo (010, FR-011): el pulso también se ve. */
export const BeatIndicator = forwardRef<BeatHandle>(function BeatIndicator(_props, ref) {
  const el = useRef<HTMLSpanElement>(null);
  useImperativeHandle(ref, () => ({
    pulse(strong) {
      const e = el.current;
      if (!e) return;
      e.classList.remove("on", "strong");
      // fuerza el reinicio de la animación
      void e.offsetWidth;
      e.classList.add("on");
      if (strong) e.classList.add("strong");
    },
  }));
  return <span ref={el} className="beat" aria-hidden="true" />;
});

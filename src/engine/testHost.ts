import { vi } from "vitest";
import type { LessonHost, LessonResult } from "./lesson";

/** Host falso para los tests del motor: reloj manual, marcas y llamadas espiadas. */
export function fakeHost(clock = { t: 0 }) {
  const finished: LessonResult[] = [];
  const host: LessonHost = {
    mark: vi.fn(),
    guide: vi.fn(),
    status: vi.fn(),
    playhead: vi.fn(),
    scrollTo: vi.fn(),
    flash: vi.fn(),
    tone: vi.fn(),
    click: vi.fn(),
    finish: (r) => finished.push(r),
    now: () => clock.t,
    frame: () => 0,
    cancelFrame: () => {},
  };
  return { host, finished, clock };
}

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import type { ScoreNote } from "../music/types";
import type { KeyFlash } from "../engine/lesson";
import { isWhite, noteName, octaveOf, type Notation } from "../music/theory";
import { keyScroll } from "../ui/layout";

export type KeyboardVia = "screen-touch" | "screen-mouse" | "computer-keys";

export interface KeyboardHandle {
  flash(m: number, kind: KeyFlash, ms?: number): void;
}

interface Props {
  low: number;
  high: number;
  guide: ScoreNote[];
  /** Tecla pulsada y de dónde viene (dedo, ratón o letras del ordenador): los acordes lo usan (010). */
  onPress(m: number, via: KeyboardVia): void;
  notation?: Notation;
  /** Alto de las teclas en px (170 por defecto). */
  height?: number;
  /** Mostrar las letras del teclado del ordenador. */
  letters?: boolean;
  /** Ajustar al contenedor (móvil apaisado): alto del contenedor, teclas de 28 px como mínimo,
   * sin letras y desplazamiento automático hasta las teclas guiadas. */
  fit?: boolean;
}

const WHITE_LETTERS = "asdfghjklñ";
const BLACK_LETTERS = "wertyuiop";
const MIN_WHITES = 10;
/** Ancho mínimo de una tecla blanca, en px. */
const KEY_W = 34;
const KEY_W_FIT = 28;

/** Teclas blancas del rango, con margen y un mínimo de diez. */
export function keyboardRange(low: number, high: number): number[] {
  let lo = low - 2;
  let hi = high + 2;
  while (!isWhite(lo)) lo--;
  while (!isWhite(hi)) hi++;
  const whites: number[] = [];
  for (let m = lo; m <= hi; m++) if (isWhite(m)) whites.push(m);
  while (whites.length < MIN_WHITES) {
    hi++;
    while (!isWhite(hi)) hi++;
    whites.push(hi);
  }
  return whites;
}

export const Keyboard = forwardRef<KeyboardHandle, Props>(function Keyboard({ low, high, guide, onPress, notation = "latin", height = 170, letters: showLetters = true, fit = false }, ref) {
  const whites = useMemo(() => keyboardRange(low, high), [low, high]);
  const letters = showLetters && !fit;
  const wrap = useRef<HTMLDivElement>(null);
  const keyEls = useRef(new Map<number, HTMLDivElement>());
  const press = useRef(onPress);
  press.current = onPress;

  const letterMap = useMemo(() => {
    const map = new Map<string, number>();
    whites.forEach((m, i) => {
      if (WHITE_LETTERS[i]) map.set(WHITE_LETTERS[i], m);
      if (BLACK_LETTERS[i] && i < whites.length - 1 && !isWhite(m + 1)) map.set(BLACK_LETTERS[i], m + 1);
    });
    return map;
  }, [whites]);

  useImperativeHandle(ref, () => ({
    flash(m, kind, ms = 220) {
      const el = keyEls.current.get(m);
      if (!el) return;
      // atributo propio para que React no lo borre al re-renderizar className
      el.dataset.flash = kind;
      const stamp = String(performance.now());
      el.dataset.flashId = stamp;
      setTimeout(() => {
        if (el.dataset.flashId === stamp) delete el.dataset.flash;
      }, ms);
    },
  }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) && (target as HTMLInputElement).type !== "checkbox" && (target as HTMLInputElement).type !== "range") return;
      const m = letterMap.get(e.key.toLowerCase());
      if (m !== undefined) {
        e.preventDefault();
        press.current(m, "computer-keys");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [letterMap]);

  const guideClass = new Map<number, string>();
  guide.forEach((n) => guideClass.set(n.m, n.h === "L" ? "guideL" : "guide"));
  const setRef = (m: number) => (el: HTMLDivElement | null) => {
    if (el) keyEls.current.set(m, el);
    else keyEls.current.delete(m);
  };
  const share = 100 / whites.length;

  // con fit, si el teclado no cabe entero, sigue a las teclas guiadas (la página no se mueve)
  useEffect(() => {
    const w = wrap.current;
    if (!fit || !w || w.scrollWidth <= w.clientWidth) return;
    const targets = guide.map((n) => whites.indexOf(isWhite(n.m) ? n.m : n.m - 1)).filter((i) => i >= 0);
    const left = keyScroll({ targets, whites: whites.length, keyW: w.scrollWidth / whites.length, view: w.clientWidth, left: w.scrollLeft });
    if (left !== w.scrollLeft) w.scrollTo({ left, behavior: "smooth" });
  }, [fit, guide, whites]);

  return (
    <div className={fit ? "kb-wrap fit" : "kb-wrap"} ref={wrap}>
      <div
        className="kb"
        style={{ minWidth: whites.length * (fit ? KEY_W_FIT : KEY_W), height: fit ? "100%" : height }}
        onPointerDown={(e) => {
          const key = (e.target as HTMLElement).closest<HTMLElement>(".key");
          if (!key) return;
          e.preventDefault();
          press.current(Number(key.dataset.m), e.pointerType === "touch" || e.pointerType === "pen" ? "screen-touch" : "screen-mouse");
        }}
      >
        {whites.map((m, i) => (
          <div key={m} ref={setRef(m)} data-m={m} className={`key ${m % 12 === 0 ? "c" : ""} ${guideClass.get(m) ?? ""}`}>
            <span className="nm" data-o={octaveOf(m)}>{noteName(m, notation)}</span>
            {letters && WHITE_LETTERS[i] && <span className="lt">{WHITE_LETTERS[i]}</span>}
          </div>
        ))}
        {whites.map((m, i) =>
          i === whites.length - 1 || isWhite(m + 1) ? null : (
            <div
              key={m + 1}
              ref={setRef(m + 1)}
              data-m={m + 1}
              className={`key black ${guideClass.get(m + 1) ?? ""}`}
              style={{ left: `calc(${(i + 1) * share}% - ${share * 0.32}%)`, width: `${share * 0.64}%` }}
            >
              {letters && BLACK_LETTERS[i] && <span className="lt">{BLACK_LETTERS[i]}</span>}
            </div>
          ),
        )}
      </div>
    </div>
  );
});

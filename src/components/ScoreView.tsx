import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Score, ScoreNote } from "../music/types";
import type { NoteMark } from "../engine/lesson";
import type { Notation } from "../music/theory";
import { engrave, type Engraving, type Figure } from "../music/engrave";
import { noteLabel } from "../music/spelling";
import { clipPedals, pedalMarks } from "../music/pedal";
import { fitScale } from "../ui/layout";
import type { StaffHandle, StaffProps } from "./scoreTypes";

export type { StaffHandle, StaffProps } from "./scoreTypes";

type VF = typeof import("vexflow/bravura");

let loading: Promise<VF> | null = null;
/** Carga VexFlow (con sus fuentes) una sola vez, en un chunk aparte. */
export function loadVexFlow(): Promise<VF> {
  loading ??= import("vexflow/bravura").then(
    async (vf) => {
      await vf.VexFlow.loadFonts("Bravura", "Academico");
      return vf;
    },
    (e) => {
      // sin conexión y sin caché: se reintenta al abrir otra lección
      loading = null;
      throw e;
    },
  );
  return loading;
}

/** Distancia entre líneas del pentagrama en VexFlow. */
const LINE = 10;
const TREBLE_TOP = 60;
const BASS_TOP = 170;
const STAFF_H = 4 * LINE;
const NAME_GAP = 14;
const FINGER_GAP = 12;
/** Margen alrededor del contenido medido, en unidades de la partitura. */
const FIT_PAD = 6;
/**
 * Compases por tramo de dibujo (research R10): la partitura se dibuja por tramos, los primeros
 * al abrir la lección y el resto al acercarse el cursor o cuando el navegador está libre.
 */
const CHUNK = 8;
/** Todas las clases de marca: se quitan antes de poner las nuevas. */
const MARKS = ["mk-R", "mk-L", "mk-auto", "mk-now", "mk-hit", "mk-miss"];
const SHARP_KEYS = ["C", "G", "D", "A", "E", "B", "F#", "C#"];
const FLAT_KEYS = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
const keySpec = (key: number) => (key >= 0 ? SHARP_KEYS[key] : FLAT_KEYS[-key]);

/** Fila del pedal bajo el pentagrama inferior (009): distancia, alto de los ganchos y de la «V». */
const PEDAL_GAP = 30;
const PEDAL_HOOK = 8;
const PEDAL_V = 4;
/** Sitio que se añade bajo el pentagrama cuando la pieza tiene pedal. */
const PEDAL_ROOM = 24;

interface Geometry {
  top: number;
  bottom: number;
  height: number;
  /** y de la línea de pedal (solo con pedal). */
  pedalRow: number;
  nameRow: { R: number; L: number };
  fingerRow: { R: number; L: number };
}

function geometryOf(score: Score): Geometry {
  const chord = (h: "R" | "L") => {
    const sizes = new Map<number, number>();
    for (const n of score.notes) if (n.h === h) sizes.set(n.unit, (sizes.get(n.unit) ?? 0) + 1);
    return Math.max(1, ...sizes.values());
  };
  const bottom = (score.twoHands ? BASS_TOP : TREBLE_TOP) + STAFF_H;
  // con pedal, los nombres bajan para dejar su fila; sin pedal, la geometría de siempre
  const nameR = bottom + 44 + (score.pedals.length ? PEDAL_ROOM : 0);
  const nameL = nameR + NAME_GAP * chord("R") + 6;
  const last = score.twoHands ? nameL + NAME_GAP * (chord("L") - 1) : nameR + NAME_GAP * (chord("R") - 1);
  return {
    top: TREBLE_TOP,
    bottom,
    height: last + 16,
    pedalRow: bottom + PEDAL_GAP,
    nameRow: { R: nameR, L: nameL },
    fingerRow: { R: TREBLE_TOP - 34, L: (TREBLE_TOP + STAFF_H + BASS_TOP) / 2 + 6 },
  };
}

/**
 * Partitura de la lección dibujada con VexFlow (research R10). Dibuja por tramos de compases,
 * cada uno una sola vez; las marcas de estado se aplican como clases sobre el SVG ya dibujado;
 * cursor, bucle, nombres y dedos van en SVG propio superpuesto. Las posiciones vienen de
 * `score.layout`, así que no cambian al dibujar más tramos.
 */
export const ScoreView = forwardRef<StaffHandle, StaffProps>(function ScoreView(
  { score, marks, autoIds, showNames, showFingers, notation = "latin", loop = null, onMeasure, fit = false, onReady },
  ref,
) {
  const wrap = useRef<HTMLDivElement>(null);
  const head = useRef<SVGLineElement>(null);
  const content = useRef<SVGGElement>(null);
  const engraved = useRef<SVGGElement>(null);
  const [vf, setVf] = useState<VF | null>(null);
  const [error, setError] = useState<string | null>(null);
  // elementos de cada nota en el dibujo y clase aplicada
  const elems = useRef(new Map<number, Element[]>());
  const applied = useRef(new Map<number, string>());
  const [drawn, setDrawn] = useState(0);
  // con fit: franja vertical que ocupa el dibujo y alto disponible del contenedor
  const [box, setBox] = useState<{ y: number; h: number } | null>(null);
  const [avail, setAvail] = useState(0);
  const scale = fit && box ? fitScale(box.h, avail) : 1;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const ready = useRef(onReady);
  ready.current = onReady;

  const geo = useMemo(() => geometryOf(score), [score]);
  const stacks = useMemo(() => stacksOf(score), [score]);
  const engraving = useMemo(() => engrave(score), [score]);
  const { layout } = score;
  const chunks = useRef(new Set<number>());
  const chunkCount = Math.ceil(layout.measures.length / CHUNK);

  /** Dibuja un tramo si falta; las notas nuevas vuelven a recibir su marca. */
  const drawChunk = useCallback(
    (k: number): boolean => {
      const g = engraved.current;
      if (!vf || !g || chunks.current.has(k) || k < 0 || k >= chunkCount) return false;
      chunks.current.add(k);
      const found = drawSection(vf, score, engraving, geo, g, k * CHUNK, Math.min((k + 1) * CHUNK, layout.measures.length));
      for (const [id, els] of found) {
        elems.current.set(id, [...(elems.current.get(id) ?? []), ...els]);
        applied.current.delete(id);
      }
      return true;
    },
    [vf, score, engraving, geo, chunkCount, layout],
  );

  /** Tramos que se ven, más una pantalla por delante. */
  const drawVisible = useCallback((): boolean => {
    const w = wrap.current;
    if (!w) return false;
    const s = scaleRef.current;
    const from = layout.measureAt(w.scrollLeft / s);
    const to = layout.measureAt((w.scrollLeft + 2 * w.clientWidth) / s);
    let any = false;
    for (let k = Math.floor(from / CHUNK); k <= Math.floor(to / CHUNK); k++) any = drawChunk(k) || any;
    return any;
  }, [drawChunk, layout]);

  useImperativeHandle(ref, () => ({
    setPlayhead(x) {
      const l = head.current;
      if (!l) return;
      if (x === null) l.setAttribute("opacity", "0");
      else {
        l.setAttribute("opacity", "1");
        l.setAttribute("x1", String(x));
        l.setAttribute("x2", String(x));
      }
    },
    scrollTo(x, smooth) {
      const w = wrap.current;
      if (!w) return;
      const left = Math.max(0, x * scaleRef.current - w.clientWidth * 0.3);
      if (smooth) w.scrollTo({ left, behavior: "smooth" });
      else w.scrollLeft = left;
    },
  }));

  useEffect(() => {
    let alive = true;
    loadVexFlow().then(
      (v) => alive && setVf(v),
      (e) => alive && setError(String(e)),
    );
    return () => {
      alive = false;
    };
  }, []);

  // dibujo con VexFlow: al cambiar la pieza se empieza de cero por los tramos que se ven
  useLayoutEffect(() => {
    const g = engraved.current;
    if (!vf || !g) return;
    g.replaceChildren();
    chunks.current = new Set();
    elems.current = new Map();
    applied.current = new Map();
    try {
      drawChunk(0);
      drawVisible();
    } catch (e) {
      console.error(e);
      setError(String(e));
      return;
    }
    setDrawn((d) => d + 1);
  }, [vf, drawChunk, drawVisible]);

  // el resto, tramo a tramo, cuando el navegador está libre
  useEffect(() => {
    if (!drawn) return;
    let cancelled = false;
    const idle = (cb: () => void) =>
      typeof requestIdleCallback === "function" ? requestIdleCallback(cb, { timeout: 500 }) : window.setTimeout(cb, 30);
    const step = () => {
      if (cancelled) return;
      let k = 0;
      while (k < chunkCount && chunks.current.has(k)) k++;
      if (k >= chunkCount) return;
      try {
        drawChunk(k);
      } catch (e) {
        console.error(e);
        return;
      }
      setDrawn((d) => d + 1);
      idle(step);
    };
    idle(step);
    return () => {
      cancelled = true;
    };
    // un solo recorrido por pieza: `drawn` cambia con cada tramo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawChunk, chunkCount, drawn > 0]);

  // marcas de estado: solo las que cambian, sin volver a dibujar
  useLayoutEffect(() => {
    if (!drawn) return;
    for (const n of score.notes) {
      const mark = marks[n.id] ?? null;
      const tokens = [`mk-${n.h}`, ...(autoIds.has(n.id) ? ["mk-auto"] : []), ...(mark ? [`mk-${mark}`] : [])];
      const cls = tokens.join(" ");
      if (applied.current.get(n.id) === cls) continue;
      for (const el of elems.current.get(n.id) ?? []) {
        el.classList.remove(...MARKS);
        el.classList.add(...tokens);
      }
      applied.current.set(n.id, cls);
    }
  }, [drawn, score, marks, autoIds]);

  // lista en cuanto se ven los primeros tramos (una sola vez)
  const announced = useRef(false);
  useEffect(() => {
    if (!drawn || announced.current) return;
    announced.current = true;
    ready.current?.();
  }, [drawn]);

  useLayoutEffect(() => {
    if (!fit || !drawn) {
      setBox(null);
      return;
    }
    const g = content.current;
    if (!g) return;
    const b = g.getBBox();
    setBox({ y: b.y - FIT_PAD, h: b.height + 2 * FIT_PAD });
    // se mide con los primeros tramos; los demás tienen la misma altura de pentagramas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit, drawn > 0, showNames, showFingers, notation]);

  useEffect(() => {
    const w = wrap.current;
    if (!fit || !w || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setAvail(w.clientHeight));
    ro.observe(w);
    setAvail(w.clientHeight);
    return () => ro.disconnect();
  }, [fit]);

  const width = layout.width;
  const view = fit && box ? box : { y: 0, h: geo.height };
  // el resaltado del bucle y el cursor abarcan también la fila del pedal
  const lowest = score.pedals.length ? Math.max(geo.bottom + 30, geo.pedalRow + 6) : geo.bottom + 30;
  const loopRect = loop && layout.measures[loop.from] && (
    <rect
      className="loop-range"
      x={layout.measures[loop.from].x + 2}
      width={layout.measures.slice(loop.from, (loop.to ?? loop.from) + 1).reduce((a, m) => a + m.width, 0)}
      y={geo.top - 44}
      height={lowest - (geo.top - 44)}
      rx={6}
    />
  );

  return (
    <div className="staff-wrap" ref={wrap} onScroll={() => drawVisible() && setDrawn((d) => d + 1)}>
      {!drawn && <div className="score-loading">{error ? "No se pudo dibujar la partitura" : "Cargando partitura…"}</div>}
      <svg
        className={onMeasure ? "staff score pickable" : "staff score"}
        style={drawn ? undefined : { position: "absolute", visibility: "hidden" }}
        onClick={
          onMeasure &&
          ((e) => {
            // el rectángulo del <svg> ya se mueve con el scroll del contenedor
            const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
            onMeasure(layout.measureAt(x / scale));
          })
        }
        width={width * scale}
        height={view.h * scale}
        viewBox={`0 ${view.y} ${width} ${view.h}`}
        role="img"
        aria-label={`Partitura de ${score.song.title}`}
      >
        {loopRect}
        <g ref={content}>
          <g ref={engraved} className="vfl" fill="currentColor" stroke="currentColor" strokeWidth={1} fontFamily="Bravura,Academico" fontSize="10pt" />
          {score.twoHands && showNames && (
            <>
              <text x={10} y={geo.nameRow.R} className="rowh rowh-r">MD</text>
              <text x={10} y={geo.nameRow.L} className="rowh rowh-l">MI</text>
            </>
          )}
          {(showNames || showFingers) &&
            score.notes.map((n) => (
              <Labels
                key={n.id}
                note={n}
                stack={stacks.get(n.id) ?? 0}
                mark={marks[n.id] ?? null}
                auto={autoIds.has(n.id)}
                geo={geo}
                showName={showNames}
                showFinger={showFingers}
                notation={notation}
              />
            ))}
          <PedalLine score={score} geo={geo} loop={loop} />
        </g>
        <line ref={head} x1={0} x2={0} y1={geo.top - 40} y2={lowest + 4} className="playhead" opacity={0} />
      </svg>
    </div>
  );
});

/**
 * Línea de pedal (009, research R7–R8): gancho al pisar, «V» en cada cambio y gancho al
 * levantar, con las x de `layout`, así que es continua aunque VexFlow dibuje por tramos. Con un
 * bucle completo se recorta al fragmento.
 */
const PedalLine = memo(function PedalLine({ score, geo, loop }: { score: Score; geo: Geometry; loop: StaffProps["loop"] }) {
  const { layout, bar, total } = score;
  const clip = loop && loop.to !== null && layout.measures[loop.from] && layout.measures[loop.to] ? { from: loop.from * bar, to: (loop.to + 1) * bar, box: layout.measures[loop.to] } : null;
  const spans = clip ? clipPedals(score.pedals, clip.from, clip.to) : score.pedals;
  if (!spans.length) return null;
  const last = layout.measures[layout.measures.length - 1];
  // al final de la pieza o del fragmento, el gancho cae justo antes de la barra
  const xOf = (at: number) =>
    at >= total - 1e-9 ? last.x + last.width - 4 : clip && at >= clip.to - 1e-9 ? clip.box.x + clip.box.width - 4 : layout.xAt(at);
  const y = geo.pedalRow;
  const top = y - PEDAL_HOOK;
  const marks = pedalMarks(spans);
  const changes = new Set(marks.flatMap((m) => (m.kind === "change" ? [m.at] : [])));
  const d = marks
    .map((m) => {
      if (m.kind === "line") {
        const x1 = xOf(m.from) + (changes.has(m.from) ? PEDAL_V : 0);
        const x2 = xOf(m.to) - (changes.has(m.to) ? PEDAL_V : 0);
        return `M${x1} ${y}H${x2}`;
      }
      const x = xOf(m.at);
      if (m.kind === "change") return `M${x - PEDAL_V} ${y}L${x} ${top}L${x + PEDAL_V} ${y}`;
      return `M${x} ${top}V${y}`;
    })
    .join("");
  return <path className="pedal" d={d} aria-label="Pedal de resonancia" />;
});

/** Posición de cada nota en su acorde, desde la más aguda (0) hacia abajo. */
function stacksOf(score: Score): Map<number, number> {
  const byUnit = new Map<number, ScoreNote[]>();
  for (const n of score.notes) byUnit.set(n.unit, [...(byUnit.get(n.unit) ?? []), n]);
  const out = new Map<number, number>();
  for (const list of byUnit.values()) [...list].sort((a, b) => b.m - a.m).forEach((n, k) => out.set(n.id, k));
  return out;
}

interface LabelProps {
  note: ScoreNote;
  stack: number;
  mark: NoteMark;
  auto: boolean;
  geo: Geometry;
  showName: boolean;
  showFinger: boolean;
  notation: Notation;
}

/** Nombre y dedo de una nota (apilados en los acordes: la más aguda arriba). */
const Labels = memo(function Labels({ note: n, stack, mark, auto, geo, showName, showFinger, notation }: LabelProps) {
  const cls = ["n", n.h, auto ? "auto" : "", mark ?? ""].join(" ").trim();
  // dedos de la derecha hacia arriba desde la fila; de la izquierda, hacia abajo
  const fingerY = n.h === "R" ? geo.fingerRow.R - stack * FINGER_GAP : geo.fingerRow.L + stack * FINGER_GAP;
  return (
    <g className={cls}>
      {showName && (
        <text x={n.x} y={geo.nameRow[n.h] + stack * NAME_GAP} textAnchor="middle" className="lbl">
          {noteLabel(n.spell, notation)}
        </text>
      )}
      {showFinger && (
        <text x={n.x} y={fingerY} textAnchor="middle" className="fg">
          {n.f}
        </text>
      )}
    </g>
  );
});

/**
 * Dibuja con VexFlow los compases [from, to) en un contenedor aparte y añade el resultado a
 * `target`. Las ligaduras que cruzan el borde del tramo se dibujan abiertas por ese lado.
 * Devuelve, por id de nota, los elementos que reciben las marcas (la figura entera si es una
 * nota sola; la cabeza si es parte de un acorde).
 */
function drawSection(vf: VF, score: Score, engraving: Engraving, geo: Geometry, target: SVGGElement, from: number, to: number): Map<number, Element[]> {
  const { Accidental, Beam, Curve, Dot, Formatter, Renderer, Stave, StaveConnector, StaveNote, StaveTie, Tuplet, Voice, BarlineType } = vf;
  const { layout } = score;
  const div = document.createElement("div");
  const renderer = new Renderer(div, Renderer.Backends.SVG);
  renderer.resize(layout.width, geo.height);
  const ctx = renderer.getContext();
  const timeSpec = `${score.time.beats}/${score.time.unit}`;
  const last = layout.measures.length - 1;

  type Placed = { fig: Figure; note: InstanceType<typeof StaveNote> };
  const placed: Placed[][] = engraving.hands.map(() => []);
  const staves = new Map<number, InstanceType<typeof Stave>[]>();

  engraving.hands.forEach((hand, hi) => {
    const top = hand.h === "L" ? BASS_TOP : TREBLE_TOP;
    hand.measures.slice(from, to).forEach((em) => {
      const i = em.index;
      const box = layout.measures[i];
      // con dos manos, sitio a la izquierda para la llave
      const x0 = i === 0 ? (score.twoHands ? 24 : 8) : box.x;
      const stave = new Stave(x0, top - 4 * LINE, box.x + box.width - x0);
      if (i === 0) {
        stave.addClef(hand.clef).addKeySignature(keySpec(em.key ?? 0)).addTimeSignature(timeSpec);
      } else if (em.key !== undefined) {
        const prev = engraving.hands[hi].measures.slice(0, i).reverse().find((m) => m.key !== undefined)?.key ?? 0;
        stave.addKeySignature(keySpec(em.key), keySpec(prev));
      }
      if (i === last) stave.setEndBarType(BarlineType.END);
      stave.setContext(ctx).draw();
      staves.set(i, [...(staves.get(i) ?? []), stave]);

      const notes = em.figures.map((f) => {
        const rest = f.kind === "rest";
        // la redonda cuelga de la 4.ª línea; el resto de silencios, en la central
        const restKey = f.dur === "w" ? (hand.clef === "bass" ? "f/3" : "d/5") : hand.clef === "bass" ? "d/3" : "b/4";
        const keys = rest ? [restKey] : f.keys.map((k) => `${k.step.toLowerCase()}/${k.octave}`);
        const note = new StaveNote({ keys, duration: f.dur + (rest ? "r" : ""), dots: f.dots, clef: hand.clef, autoStem: true });
        f.keys.forEach((k, ki) => k.acc && note.addModifier(new Accidental(k.acc), ki));
        if (f.dots) Dot.buildAndAttach([note], { all: true });
        note.setStave(stave);
        return note;
      });
      // el tresillo ajusta los ticks de sus notas: antes de añadirlas a la voz
      const tuplets = em.tuplets.map((t) => new Tuplet(t.figures.map((k) => notes[k]), { numNotes: 3, notesOccupied: 2, ratioed: false }));
      const voice = new Voice({ numBeats: score.time.beats, beatValue: score.time.unit }).setMode(Voice.Mode.SOFT).addTickables(notes);
      const beams = em.beams.map((b) => new Beam(b.map((k) => notes[k]), true));
      new Formatter().joinVoices([voice]).format([voice], Math.max(box.width - 20, 40));

      // cada figura en la x de layout: el centro de la cabeza cae en xAt(inicio)
      em.figures.forEach((f, k) => {
        const note = notes[k];
        const want = f.full ? box.x + box.width / 2 : layout.xAt(f.s);
        const tc = note.getTickContext();
        const now = note.getAbsoluteX() + note.getGlyphWidth() / 2;
        tc.setX(tc.getX() + want - now);
        placed[hi].push({ fig: f, note });
      });
      voice.draw(ctx, stave);
      beams.forEach((b) => b.setContext(ctx).draw());
      tuplets.forEach((t) => t.setContext(ctx).draw());
    });
  });

  // llave y barras que unen los dos pentagramas
  if (engraving.hands.length === 2) {
    staves.forEach(([up, down], i) => {
      if (!up || !down) return;
      if (i === 0) {
        new StaveConnector(up, down).setType("brace").setContext(ctx).draw();
        new StaveConnector(up, down).setType("singleLeft").setContext(ctx).draw();
      }
      new StaveConnector(up, down).setType(i === last ? "boldDoubleRight" : "singleRight").setContext(ctx).draw();
    });
  }

  // ligaduras de prolongación (también entre compases) y de expresión
  placed.forEach((list, hi) => {
    const measures = engraving.hands[hi].measures;
    // la que viene del tramo anterior entra abierta por la izquierda
    const before = measures[from - 1]?.figures.at(-1);
    const first = list[0];
    if (before?.tieToNext && first?.fig.kind === "note") {
      const idx = first.fig.keys.map((_, i) => i);
      new StaveTie({ firstNote: null, lastNote: first.note, firstIndexes: idx, lastIndexes: idx }).setContext(ctx).draw();
    }
    let open = measures.slice(0, from).flatMap((m) => m.figures).reduce<boolean>((o, f) => (f.slur === "start" ? true : f.slur === "end" ? false : o), false);
    list.forEach(({ fig, note }, k) => {
      const next = list[k + 1];
      const idx = fig.keys.map((_, i) => i);
      if (fig.tieToNext && next && next.fig.kind === "note") {
        new StaveTie({ firstNote: note, lastNote: next.note, firstIndexes: idx, lastIndexes: idx }).setContext(ctx).draw();
      } else if (fig.tieToNext && !next) {
        // la que sigue en el tramo siguiente sale abierta por la derecha
        new StaveTie({ firstNote: note, lastNote: null, firstIndexes: idx, lastIndexes: idx }).setContext(ctx).draw();
      }
      if (fig.slur === "start") {
        const end = list.slice(k + 1).find((p) => p.fig.slur === "end");
        new Curve(note, end?.note, {}).setContext(ctx).draw();
        open = !end;
      } else if (fig.slur === "end" && open) {
        new Curve(undefined, note, {}).setContext(ctx).draw();
        open = false;
      } else if (fig.slur === "end") open = false;
    });
  });

  // elementos de cada nota para las marcas
  const svg = div.querySelector("svg")!;
  // un solo recorrido del dibujo: buscar cada id por separado sería cuadrático
  const index = new Map<string, Element>();
  for (const el of svg.querySelectorAll("[id]")) index.set(el.id, el);
  const byId = (id: string | undefined) => (id ? index.get(`vf-${id}`) ?? null : null);
  const out = new Map<number, Element[]>();
  for (const list of placed)
    for (const { fig, note } of list) {
      fig.keys.forEach((k, ki) => {
        const el = fig.keys.length === 1 ? byId(note.getAttribute("id")) : byId(note.noteHeads[ki]?.getAttribute("id"));
        if (!el) return;
        const arr = out.get(k.noteId) ?? [];
        arr.push(el);
        out.set(k.noteId, arr);
      });
    }

  target.append(...Array.from(svg.childNodes));
  return out;
}

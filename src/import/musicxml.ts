import { ImportError } from "../music/import/errors";
import type { RawNote, RawPart, RawPiece } from "../music/import/types";
import type { Spell } from "../music/types";

const SPELL: Record<number, Spell> = { [-2]: "bb", [-1]: "b", 0: "n", 1: "#", 2: "##" };

const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const BEAT_UNIT: Record<string, number> = { whole: 4, half: 2, quarter: 1, eighth: 0.5, "16th": 0.25 };

const kids = (el: Element, name?: string) => [...el.children].filter((c) => !name || c.tagName === name);
const kid = (el: Element, name: string) => kids(el, name)[0];
const text = (el: Element | undefined, name: string) => (el ? kid(el, name)?.textContent?.trim() : undefined);
const num = (el: Element | undefined, name: string) => {
  const t = text(el, name);
  return t === undefined || t === "" ? NaN : Number(t);
};
const stripExt = (name: string) => name.replace(/\.[^.]*$/, "");

/**
 * Tramos de pedal a partir de las marcas en orden: «levantar» sin pisar antes se ignora, un
 * pisado repetido no abre otro tramo y uno sin levantar se cierra en `end` (009).
 */
function pedalSpans(marks: { at: number; on: boolean }[], end: number): [number, number][] {
  const out: [number, number][] = [];
  let down: number | null = null;
  for (const { at, on } of marks) {
    if (on && down === null) down = at;
    else if (!on && down !== null) {
      if (at > down) out.push([down, at]);
      down = null;
    }
  }
  if (down !== null && end > down) out.push([down, end]);
  return out;
}

interface Open {
  note: RawNote;
  staff: number;
}

/** Lee un MusicXML `score-partwise` con el DOMParser del navegador. */
export function parseMusicXml(source: string, fileName: string): RawPiece {
  const doc = new DOMParser().parseFromString(source, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new ImportError("unreadable");
  const root = doc.documentElement;
  if (!root) throw new ImportError("unreadable");
  if (root.tagName === "score-timewise" || root.tagName === "opus") throw new ImportError("notScore");
  if (root.tagName !== "score-partwise") throw new ImportError("unreadable");

  const piece: RawPiece = { format: "musicxml", times: [], parts: [], notPiano: false, ignored: { grace: 0, cue: 0 } };
  const work = kid(root, "work");
  piece.title = text(work, "work-title") || text(root, "movement-title") || stripExt(fileName);

  const programs = new Map<string, number>();
  for (const sp of kids(kid(root, "part-list") ?? root, "score-part")) {
    const program = num(kid(sp, "midi-instrument"), "midi-program");
    if (Number.isFinite(program)) programs.set(sp.getAttribute("id") ?? "", program);
  }

  const partsWithNotes: RawPart[][] = [];
  for (const part of kids(root, "part")) {
    const staves = new Map<number, RawNote[]>();
    const open: Open[] = [];
    let divisions = 1;
    let measureStart = 0;
    let unpitched = false;
    const pedalMarks: { at: number; on: boolean }[] = [];

    kids(part, "measure").forEach((measure, index) => {
      let pos = measureStart;
      let maxPos = pos;
      let lastStart = pos;
      let barLength = 0;
      for (const el of kids(measure)) {
        switch (el.tagName) {
          case "attributes": {
            const d = num(el, "divisions");
            if (d > 0) divisions = d;
            const key = kid(el, "key");
            const fifths = num(key, "fifths");
            if (key && Number.isInteger(fifths) && fifths >= -7 && fifths <= 7) (piece.keys ??= []).push({ at: measureStart, key: fifths });
            const time = kid(el, "time");
            if (time && kid(time, "beats")) {
              const beats = num(time, "beats");
              const beatType = num(time, "beat-type");
              piece.times.push({ at: measureStart, beats, beatType });
            }
            break;
          }
          case "direction":
          case "sound": {
            const sound = el.tagName === "sound" ? el : kid(el, "sound");
            const tempo = Number(sound?.getAttribute("tempo"));
            if (piece.tempo === undefined && tempo > 0) piece.tempo = tempo;
            const metronome = el.getElementsByTagName("metronome")[0];
            if (piece.tempo === undefined && metronome) {
              const unit = BEAT_UNIT[text(metronome, "beat-unit") ?? ""] ?? 1;
              const dotted = kid(metronome, "beat-unit-dot") ? 1.5 : 1;
              const perMinute = num(metronome, "per-minute");
              if (perMinute > 0) piece.tempo = perMinute * unit * dotted;
            }
            // pedal de resonancia (009): <pedal type> o <sound damper-pedal>, en la posición actual
            const offset = num(el, "offset");
            const at = pos + (Number.isFinite(offset) ? offset / divisions : 0);
            for (const p of el.getElementsByTagName("pedal")) {
              const type = p.getAttribute("type");
              if (type === "start" || type === "resume") pedalMarks.push({ at, on: true });
              else if (type === "stop" || type === "discontinue") pedalMarks.push({ at, on: false });
              else if (type === "change") pedalMarks.push({ at, on: false }, { at, on: true });
            }
            const damper = sound?.getAttribute("damper-pedal");
            if (damper) pedalMarks.push({ at, on: damper === "yes" || Number(damper) > 0 });
            break;
          }
          case "backup":
            pos -= num(el, "duration") / divisions;
            break;
          case "forward":
            pos += num(el, "duration") / divisions;
            maxPos = Math.max(maxPos, pos);
            break;
          case "note": {
            if (kid(el, "grace")) {
              piece.ignored.grace++;
              break;
            }
            const dur = num(el, "duration") / divisions;
            const chord = !!kid(el, "chord");
            const start = chord ? lastStart : pos;
            if (!chord) {
              lastStart = pos;
              pos += Number.isFinite(dur) ? dur : 0;
              maxPos = Math.max(maxPos, pos);
            }
            if (kid(el, "cue")) {
              piece.ignored.cue++;
              break;
            }
            if (kid(el, "unpitched")) unpitched = true;
            const pitch = kid(el, "pitch");
            if (!pitch) break; // silencio
            const step = STEP[text(pitch, "step") ?? ""];
            const alter = Number(text(pitch, "alter") ?? 0);
            const midi = step === undefined ? NaN : (num(pitch, "octave") + 1) * 12 + step + Math.round(alter);
            const staff = Number(text(el, "staff") ?? 1) || 1;
            const ties = kids(el, "tie").map((t) => t.getAttribute("type"));
            const notes = staves.get(staff) ?? [];
            staves.set(staff, notes);

            // ligadura: se alarga la nota abierta de la misma altura que acaba aquí
            const from = ties.includes("stop") ? open.findIndex((o) => o.staff === staff && o.note.pitch === midi && Math.abs(o.note.start + o.note.dur - start) < 1e-6) : -1;
            if (from >= 0) {
              const [o] = open.splice(from, 1);
              o.note.dur += dur;
              if (ties.includes("start")) open.push(o);
              break;
            }
            const note: RawNote = { pitch: midi, start, dur };
            // la alteración escrita (Fa♯ o Sol♭) se guarda para la versión completa
            if (text(pitch, "alter") !== undefined && SPELL[Math.round(alter)]) note.spell = SPELL[Math.round(alter)];
            notes.push(note);
            if (ties.includes("start")) open.push({ note, staff });
            break;
          }
        }
      }
      barLength = maxPos - measureStart;
      // anacrusa: el primer compás incompleto se completa con silencio al principio
      const time = piece.times[0];
      const full = time ? (time.beats * 4) / time.beatType : 4;
      if (index === 0 && barLength > 0 && barLength < full - 1e-6 && measure.getAttribute("implicit") === "yes") {
        const shift = full - barLength;
        for (const notes of staves.values()) for (const n of notes) n.start += shift;
        for (const p of pedalMarks) p.at += shift;
        barLength = full;
      }
      measureStart += barLength;
    });

    const id = part.getAttribute("id") ?? "";
    const parts = [...staves.entries()]
      .filter(([, notes]) => notes.length > 0)
      .sort(([a], [b]) => a - b)
      .map(([staff, notes]): RawPart => ({ staff: staff === 1 ? 1 : 2, notes: notes.sort((a, b) => a.start - b.start || a.pitch - b.pitch) }));
    if (parts.length) {
      partsWithNotes.push(parts);
      const pedal = pedalSpans(pedalMarks, measureStart);
      if (pedal.length) piece.pedal = pedal;
      const program = programs.get(id);
      if (unpitched || (program !== undefined && (program < 1 || program > 8))) piece.notPiano = true;
    }
  }

  // FR-008: una sola parte (con uno o dos pentagramas); FR-009: si hay más, se rechaza
  if (partsWithNotes.length > 1) throw new ImportError(piece.notPiano ? "notPiano" : "tooManyParts");
  piece.parts = partsWithNotes[0] ?? [];
  return piece;
}

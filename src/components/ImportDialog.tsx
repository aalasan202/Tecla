import { useEffect, useRef, useState } from "react";
import { checkFile, type FileCheck } from "../import/check";
import type { FullCheck, FullReason, ImportedSong, Level, Proposal, RejectDetail, RejectReason, SongVersion, Warning, WarningKind } from "../music/import/types";
import { measure } from "../music/import/level";
import type { SongDef } from "../music/types";
import { addImported, findByHash } from "../state/imported";
import { Dialog } from "./Dialog";

type Valid = Extract<FileCheck, { ok: true }> & Required<Pick<FileCheck, "bytes" | "hash" | "format">>;

type State =
  | { step: "checking" }
  | { step: "rejected"; reason: RejectReason; detail?: RejectDetail }
  | { step: "duplicate"; check: Valid; existing: ImportedSong }
  | { step: "summary"; check: Valid }
  | { step: "saving"; check: Valid }
  | { step: "noSpace" };

/** «compás 3», «compases 3 y 5», «compases 3, 5, 7… (12 en total)». */
export function barsText(bars: number[]): string {
  if (!bars.length) return "";
  if (bars.length === 1) return `compás ${bars[0]}`;
  const MAX = 6;
  if (bars.length > MAX) return `compases ${bars.slice(0, MAX).join(", ")}… (${bars.length} en total)`;
  return `compases ${bars.slice(0, -1).join(", ")} y ${bars[bars.length - 1]}`;
}

const REJECT: Record<RejectReason, (d?: RejectDetail) => string> = {
  tooLarge: () => "El archivo pasa de 5 MB.",
  unreadable: () => "El archivo no se puede leer. Puede estar dañado o no ser MIDI ni MusicXML.",
  notScore: () => "Exporta la partitura como MusicXML de una sola obra.",
  empty: () => "El archivo no contiene notas.",
  notPiano: () => "Solo se pueden importar piezas de piano.",
  tooManyParts: () => "Solo se pueden importar piezas de piano a una o dos manos.",
  badNotes: (d) => {
    const n = d?.count ?? 0;
    const where = d?.bars?.length ? ` (${barsText(d.bars)})` : "";
    return `${n === 1 ? "1 nota no se puede leer" : `${n} notas no se pueden leer`}${where}.`;
  },
  timeSignature: () => "Solo se admiten compases de 4/4, 3/4, 2/4 y 6/8.",
};

const WARNING: Record<WarningKind, string> = {
  handsSplit: "Las manos se han repartido automáticamente (notas desde el Do central hacia arriba, mano derecha).",
  chords: "Los acordes se han reducido a una nota por mano",
  durations: "Algunas duraciones se han ajustado",
  cutAtBar: "Algunas notas se han acortado en la barra de compás",
  dropped: "Se han quitado notas demasiado cortas",
  grace: "Se han omitido las notas de adorno",
  farFromOriginal: "La pieza importada puede diferir bastante del original",
};

const warningText = (w: Warning) => {
  const base = WARNING[w.kind];
  if (base.endsWith(".")) return base;
  return w.bars.length ? `${base} (${barsText(w.bars)}).` : `${base}.`;
};

/** Por qué no hay versión completa (FR-019c). */
export const FULL_REASON: Record<FullReason, string> = {
  voices: "hay varias voces en una misma mano",
  timeSignature: "el compás no es 2/4, 3/4, 4/4 ni 6/8",
  timeChange: "la pieza cambia de compás",
  unreadable: "no se ha podido convertir el original",
};

/** Las dos versiones darían lo mismo: no hay nada que simplificar. */
function sameVersions(simple: Proposal["song"], full: Proposal["song"]): boolean {
  const notes = (s: Proposal["song"]) => JSON.stringify([s.n, s.r, s.l, s.bar, s.time]);
  return !full.key && !full.keyChanges?.length && notes(simple) === notes(full);
}

/** «4/4», «3/4», «6/8». */
export const timeText = (song: Pick<SongDef, "bar" | "time">) => song.time ?? `${song.bar ?? 4}/4`;

const HEAVY_TEXT = "Esta pieza es muy larga o tiene muchas notas: puede ir lenta en este dispositivo.";
const NO_SPACE = "No queda espacio en este dispositivo. Borra alguna pieza importada.";

interface Props {
  file: File;
  onClose(): void;
  /** Se llama con el id de la pieza nueva, después de guardarla. */
  onAdded(id: string): void;
}

/** Comprueba un archivo y, si vale, enseña el resumen para añadirlo a Canciones. */
export function ImportDialog({ file, onClose, onAdded }: Props) {
  const [state, setState] = useState<State>({ step: "checking" });
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    abort.current = ctrl;
    checkFile(file, ctrl.signal).then(
      (c) => {
        if (ctrl.signal.aborted) return;
        if (!c.ok) return setState({ step: "rejected", reason: c.reason, detail: c.detail });
        const check = c as Valid;
        const existing = findByHash(check.hash);
        setState(existing ? { step: "duplicate", check, existing } : { step: "summary", check });
      },
      (e) => {
        if (ctrl.signal.aborted) return;
        console.error(e);
        setState({ step: "rejected", reason: "unreadable" });
      },
    );
    return () => ctrl.abort();
  }, [file]);

  const cancel = () => {
    abort.current?.abort();
    onClose();
  };

  switch (state.step) {
    case "checking":
      return (
        <Dialog
          title="Importar archivo"
          onCancel={cancel}
          actions={
            <button type="button" className="btn" onClick={cancel}>
              Cancelar
            </button>
          }
        >
          <p className="dialog-status" role="status">
            Comprobando el archivo…
          </p>
          <p className="muted">{file.name}</p>
        </Dialog>
      );

    case "rejected":
      return (
        <Dialog
          title="No se puede importar"
          onCancel={onClose}
          actions={
            <button type="button" className="btn primary" onClick={onClose}>
              Aceptar
            </button>
          }
        >
          <p role="alert">{REJECT[state.reason](state.detail)}</p>
          <p className="muted">{file.name}</p>
        </Dialog>
      );

    case "duplicate":
      return (
        <Dialog
          title="Archivo ya importado"
          onCancel={onClose}
          actions={
            <>
              <button type="button" className="btn" onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className="btn primary" onClick={() => setState({ step: "summary", check: state.check })}>
                Añadir otra copia
              </button>
            </>
          }
        >
          <p>Ya importaste este archivo como «{state.existing.def.title}».</p>
        </Dialog>
      );

    case "summary":
    case "saving":
      return (
        <Summary
          check={state.check}
          fileName={file.name}
          saving={state.step === "saving"}
          onCancel={onClose}
          onSave={async (title, level, version) => {
            setState({ step: "saving", check: state.check });
            const { proposal, hash, format, bytes, full } = state.check;
            const res = await addImported(proposal, { format, fileName: file.name, size: file.size, hash }, bytes, { title, level, full, version });
            if (res.ok) onAdded(res.id);
            else setState({ step: "noSpace" });
          }}
        />
      );

    case "noSpace":
      return (
        <Dialog
          title="Sin espacio"
          onCancel={onClose}
          actions={
            <button type="button" className="btn primary" onClick={onClose}>
              Aceptar
            </button>
          }
        >
          <p role="alert">{NO_SPACE}</p>
        </Dialog>
      );
  }
}

interface SummaryProps {
  check: Valid;
  fileName: string;
  saving: boolean;
  onCancel(): void;
  onSave(title: string, level: Level, version: SongVersion): void;
}

/** Lo que el resumen enseña de una versión: definición, nivel sugerido, avisos y medidas. */
interface Shown {
  song: Proposal["song"];
  level: Level;
  warnings: Warning[];
  metrics: Proposal["metrics"];
  heavy: boolean;
}

function Summary({ check, fileName, saving, onCancel, onSave }: SummaryProps) {
  const { proposal } = check;
  const full: Extract<FullCheck, { ok: true }> | null = check.full?.ok ? check.full : null;
  // las dos versiones solo se ofrecen si difieren; la completa, marcada por defecto (FR-019a)
  const both = !!full && !sameVersions(proposal.song, full.song);
  const [version, setVersion] = useState<SongVersion>(both ? "full" : "simple");
  const shown: Shown =
    version === "full" && full
      ? { song: full.song, level: full.level, warnings: full.warnings, metrics: measure(full.song), heavy: proposal.heavy }
      : proposal;
  const [title, setTitle] = useState(proposal.song.title);
  const [level, setLevel] = useState<Level>(shown.level);
  const valid = title.trim().length > 0;
  const choose = (v: SongVersion) => {
    setVersion(v);
    setLevel(v === "full" && full ? full.level : proposal.level);
  };

  return (
    <Dialog
      title="Importar pieza"
      onCancel={saving ? undefined : onCancel}
      actions={
        <>
          <button type="button" className="btn" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="import-form" className="btn primary" disabled={saving || !valid}>
            {saving ? "Añadiendo…" : shown.heavy ? "Añadir igualmente" : "Añadir"}
          </button>
        </>
      }
    >
      <form
        id="import-form"
        className="dialog-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !saving) onSave(title.trim(), level, version);
        }}
      >
        {shown.heavy && (
          <p className="dialog-warn" role="note">
            {HEAVY_TEXT}
          </p>
        )}
        {both && (
          <fieldset className="dialog-levels" disabled={saving}>
            <legend>Versión</legend>
            <div className="seg">
              <button type="button" aria-pressed={version === "full"} onClick={() => choose("full")}>
                Versión completa
              </button>
              <button type="button" aria-pressed={version === "simple"} onClick={() => choose("simple")}>
                Versión simplificada
              </button>
            </div>
          </fieldset>
        )}
        {check.full && !check.full.ok && proposal.warnings.length > 0 && (
          <p className="muted" role="note">
            Solo se puede añadir la versión simplificada: {FULL_REASON[check.full.reason]}.
          </p>
        )}
        <label className="dialog-field">
          <span>Título</span>
          <input type="text" value={title} maxLength={80} required onChange={(e) => setTitle(e.target.value)} disabled={saving} />
        </label>
        <LevelPicker value={level} suggested={shown.level} onChange={setLevel} disabled={saving} />
        <Facts shown={shown} />
        {shown.warnings.length > 0 && (
          <div className="dialog-notes">
            <h3>Ajustes al convertir</h3>
            <ul>
              {shown.warnings.map((w) => (
                <li key={w.kind}>{warningText(w)}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="muted dialog-file">{fileName}</p>
      </form>
    </Dialog>
  );
}

function Facts({ shown }: { shown: Shown }) {
  const { song, metrics } = shown;
  const rows: [string, string][] = [
    ["Manos", metrics.twoHands ? "Dos manos" : "Una mano"],
    ["Compás", timeText(song)],
    ["Tempo", song.time === "6/8" ? `${song.tempo} ♩. por minuto` : `${song.tempo} ppm`],
    ["Compases", String(metrics.bars)],
    ["Notas", String(metrics.notes)],
  ];
  return (
    <dl className="dialog-facts">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LevelPicker({
  value,
  suggested,
  onChange,
  disabled,
}: {
  value: Level;
  suggested?: Level;
  onChange(l: Level): void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="dialog-levels" disabled={disabled}>
      <legend>Nivel</legend>
      <div className="seg">
        {([1, 2, 3, 4] as Level[]).map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={value === l}
            onClick={() => onChange(l)}
            aria-label={l === suggested ? `Nivel ${l} (sugerido)` : `Nivel ${l}`}
          >
            {l}
            {l === suggested && <small> (sugerido)</small>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

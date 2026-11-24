import { useState } from "react";
import type { FullReason, Level, SongVersion } from "../music/import/types";
import type { SongDef } from "../music/types";
import { baseId, chosenDef, editImported, ensureFull, imported, removeImported, setVersion } from "../state/imported";
import { Dialog } from "./Dialog";
import { FULL_REASON, LevelPicker } from "./ImportDialog";

const levelNumber = (s: SongDef) => Number(/Nivel (\d)/.exec(s.level)?.[1] ?? 1) as Level;

interface Props {
  song: SongDef;
  onClose(): void;
}

/**
 * Opciones de una pieza importada: elegir versión simplificada o completa (FR-019), editar
 * título y nivel, o borrarla con sus estrellas (FR-014).
 */
export function ImportedSongDialog({ song, onClose }: Props) {
  const [step, setStep] = useState<"menu" | "edit" | "remove">("menu");
  const { songs } = imported.use();
  const record = songs.find((s) => s.def.id === baseId(song.id));
  const active: SongVersion = record?.version === "full" ? "full" : "simple";
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<FullReason | null>(null);
  const unavailable = failed ?? (record?.full && "unavailable" in record.full ? record.full.unavailable : null);

  const choose = async (v: SongVersion) => {
    if (v === active || !record) return;
    if (v === "full" && !record.full) {
      // piezas importadas antes de 007: la completa se calcula ahora desde el original
      setBusy(true);
      const res = await ensureFull(record.def.id);
      setBusy(false);
      if (res !== "ok") return setFailed(res);
    }
    setVersion(record.def.id, v);
  };

  if (step === "menu")
    return (
      <Dialog
        title={song.title}
        onCancel={onClose}
        actions={
          <button type="button" className="btn" onClick={onClose}>
            Cerrar
          </button>
        }
      >
        <fieldset className="dialog-levels" disabled={busy}>
          <legend>Versión</legend>
          <div className="seg">
            <button type="button" aria-pressed={active === "full"} disabled={!!unavailable} onClick={() => void choose("full")}>
              Versión completa
            </button>
            <button type="button" aria-pressed={active === "simple"} onClick={() => void choose("simple")}>
              Versión simplificada
            </button>
          </div>
          {busy && (
            <p className="muted" role="status">
              Preparando la versión completa…
            </p>
          )}
          {unavailable && (
            <p className="muted" role="note">
              La versión completa no está disponible: {FULL_REASON[unavailable]}.
            </p>
          )}
        </fieldset>
        <div className="dialog-menu">
          <button type="button" className="btn" onClick={() => setStep("edit")}>
            Editar título y nivel
          </button>
          <button type="button" className="btn danger-outline" onClick={() => setStep("remove")}>
            Borrar
          </button>
        </div>
      </Dialog>
    );

  // se edita la versión elegida en este momento (el nivel es de cada versión)
  if (step === "edit") return <Edit song={record ? chosenDef(record) : song} onClose={onClose} />;

  return (
    <Dialog
      title="Borrar pieza"
      onCancel={onClose}
      actions={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              onClose();
              void removeImported(song.id);
            }}
          >
            Borrar
          </button>
        </>
      }
    >
      <p>¿Borrar «{song.title}» y sus estrellas?</p>
    </Dialog>
  );
}

function Edit({ song, onClose }: Props) {
  const [title, setTitle] = useState(song.title);
  const [level, setLevel] = useState<Level>(levelNumber(song));
  const [failed, setFailed] = useState(false);
  const valid = title.trim().length > 0;

  return (
    <Dialog
      title="Editar pieza"
      onCancel={onClose}
      actions={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="edit-form" className="btn primary" disabled={!valid}>
            Guardar
          </button>
        </>
      }
    >
      <form
        id="edit-form"
        className="dialog-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          if (editImported(song.id, { title, level })) onClose();
          else setFailed(true);
        }}
      >
        <label className="dialog-field">
          <span>Título</span>
          <input type="text" value={title} maxLength={80} required onChange={(e) => setTitle(e.target.value)} />
        </label>
        <LevelPicker value={level} onChange={setLevel} />
        {failed && <p role="alert">No se ha podido guardar en este dispositivo.</p>}
      </form>
    </Dialog>
  );
}

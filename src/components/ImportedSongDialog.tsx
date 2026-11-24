import { useState } from "react";
import type { Level } from "../music/import/types";
import type { SongDef } from "../music/types";
import { editImported, removeImported } from "../state/imported";
import { Dialog } from "./Dialog";
import { LevelPicker } from "./ImportDialog";

const levelNumber = (s: SongDef) => Number(/Nivel (\d)/.exec(s.level)?.[1] ?? 1) as Level;

interface Props {
  song: SongDef;
  onClose(): void;
}

/** Opciones de una pieza importada: editar título y nivel, o borrarla con sus estrellas (FR-014). */
export function ImportedSongDialog({ song, onClose }: Props) {
  const [step, setStep] = useState<"menu" | "edit" | "remove">("menu");

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

  if (step === "edit") return <Edit song={song} onClose={onClose} />;

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

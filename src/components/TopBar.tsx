import type { ReactNode } from "react";
import { useMidiContext } from "../midi/MidiProvider";
import { MIDI_HELP } from "../midi/useMidi";
import { ensureAudio } from "../audio/synth";
import { goBack, type Route } from "../router";
import { IconBack, IconSettings } from "./Icons";

interface Props {
  /** Título de la pantalla; sin título se muestra la marca. */
  title?: ReactNode;
  /** A dónde vuelve Atrás si no hay historial dentro de la app. */
  back?: Route;
  showSettings?: boolean;
}

export function TopBar({ title, back, showSettings = true }: Props) {
  const midi = useMidiContext();
  const label =
    midi.status === "ok"
      ? `MIDI: ${midi.devices.join(", ")}`
      : midi.status === "none"
        ? "Sin teclado MIDI · Reintentar"
        : midi.status === "blocked"
          ? "MIDI bloqueado · Ayuda"
          : midi.status === "unsupported"
            ? "MIDI no disponible"
            : "Conectar teclado MIDI";

  return (
    <>
      <header className="top">
        <div className="top-left">
          {back && (
            <button type="button" className="icon-btn" aria-label="Atrás" onClick={() => goBack(back)}>
              <IconBack />
            </button>
          )}
          {title ? (
            <h1 className="screen-title">{title}</h1>
          ) : (
            <div className="brand">
              Tecla <small>aprende piano</small>
            </div>
          )}
        </div>
        <div className="top-right">
          <button
            type="button"
            className={`chip ${midi.status === "ok" ? "on" : midi.status === "idle" ? "" : "warn"}`}
            onClick={() => {
              ensureAudio();
              midi.connect();
            }}
          >
            <span className="chip-dot" aria-hidden="true" />
            <span className="chip-text">{label}</span>
          </button>
          {showSettings && (
            <a className="icon-btn" href="#ajustes" aria-label="Ajustes">
              <IconSettings size={20} />
            </a>
          )}
        </div>
      </header>
      {midi.status !== "idle" && midi.status !== "ok" && <p className="midihelp">{MIDI_HELP[midi.status]}</p>}
    </>
  );
}

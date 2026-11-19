import type { ReactNode } from "react";
import { useMidiContext } from "../midi/MidiProvider";
import { MIDI_HELP } from "../midi/useMidi";
import { ensureAudio } from "../audio/synth";
import { goBack, type Route } from "../router";
import { usePwaStatus } from "../pwa/sw";
import { IconBack, IconSettings } from "./Icons";

interface Props {
  /** Título de la pantalla; sin título se muestra la marca. */
  title?: ReactNode;
  /** A dónde vuelve Atrás si no hay historial dentro de la app. */
  back?: Route;
  showSettings?: boolean;
}

export function TopBar({ title, back, showSettings = true }: Props) {
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
          <ConnectionChips />
          {showSettings && (
            <a className="icon-btn" href="#ajustes" aria-label="Ajustes">
              <IconSettings size={20} />
            </a>
          )}
        </div>
      </header>
      <MidiHelp />
    </>
  );
}

/** Chips de «Sin conexión» y del estado del teclado MIDI (pulsar intenta conectar). */
export function ConnectionChips() {
  const midi = useMidiContext();
  const { online } = usePwaStatus();
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
      {!online && (
        <span className="chip offline" role="status" aria-label="Sin conexión">
          <span className="chip-dot" aria-hidden="true" />
          <span className="chip-text">Sin conexión</span>
        </span>
      )}
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
    </>
  );
}

/** Ayuda cuando el MIDI no funciona (bloqueado, sin teclado, no disponible). */
export function MidiHelp() {
  const midi = useMidiContext();
  return midi.status !== "idle" && midi.status !== "ok" ? <p className="midihelp">{MIDI_HELP[midi.status]}</p> : null;
}

/** Estado de conexión completo (chips y ayuda), para el panel de opciones de la lección. */
export function ConnectionStatus() {
  return (
    <div className="connection">
      <div className="connection-chips">
        <ConnectionChips />
      </div>
      <MidiHelp />
    </div>
  );
}

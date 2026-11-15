import { useState } from "react";
import { settings, type Theme } from "../state/settings";
import { progress } from "../state/progress";
import { useMidiContext } from "../midi/MidiProvider";
import { MIDI_HELP } from "../midi/useMidi";
import { ensureAudio, playTone } from "../audio/synth";
import type { Notation } from "../music/theory";
import { TopBar } from "../components/TopBar";

export function SettingsScreen() {
  const s = settings.use();
  const midi = useMidiContext();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="screen">
      <TopBar title="Ajustes" back={{ name: "home" }} showSettings={false} />

      <section className="panel">
        <h2>Teclado MIDI</h2>
        <p>
          {midi.status === "ok"
            ? `Conectado: ${midi.devices.join(", ")}.`
            : midi.status === "idle"
              ? "Conecta un piano digital por USB o Bluetooth para tocar con él."
              : MIDI_HELP[midi.status]}
        </p>
        <div className="row">
          <button className="btn primary" onClick={() => (ensureAudio(), midi.connect())}>
            {midi.status === "ok" ? "Buscar otra vez" : "Conectar teclado MIDI"}
          </button>
          <button className="btn" onClick={() => (ensureAudio(), [60, 64, 67, 72].forEach((m, i) => setTimeout(() => playTone(m, 0.6), i * 160)))}>
            Probar el sonido
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Partitura</h2>
        <fieldset className="option">
          <legend>Nombres de las notas</legend>
          <div className="seg" role="group">
            {(
              [
                ["latin", "Do, Re, Mi"],
                ["english", "C, D, E"],
              ] as [Notation, string][]
            ).map(([v, label]) => (
              <button key={v} aria-pressed={s.notation === v} onClick={() => settings.set({ notation: v })}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field">
          <input type="checkbox" checked={s.showNames} onChange={(e) => settings.set({ showNames: e.target.checked })} /> Mostrar el nombre bajo cada nota
        </label>
        <label className="field">
          <input type="checkbox" checked={s.showFingers} onChange={(e) => settings.set({ showFingers: e.target.checked })} /> Mostrar números de dedo
          (digitación sugerida)
        </label>
      </section>

      <section className="panel">
        <h2>Aspecto</h2>
        <fieldset className="option">
          <legend>Tema</legend>
          <div className="seg" role="group">
            {(
              [
                ["auto", "Automático"],
                ["light", "Claro"],
                ["dark", "Oscuro"],
              ] as [Theme, string][]
            ).map(([v, label]) => (
              <button key={v} aria-pressed={s.theme === v} onClick={() => settings.set({ theme: v })}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="panel">
        <h2>Datos</h2>
        <p className="muted">El progreso se guarda solo en este navegador.</p>
        {confirmReset ? (
          <div className="row">
            <span>¿Borrar estrellas, racha y tiempo de práctica?</span>
            <button
              className="btn danger"
              onClick={() => {
                progress.reset();
                setConfirmReset(false);
              }}
            >
              Sí, borrar
            </button>
            <button className="btn" onClick={() => setConfirmReset(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <button className="btn" onClick={() => setConfirmReset(true)}>
            Borrar el progreso
          </button>
        )}
      </section>
    </div>
  );
}

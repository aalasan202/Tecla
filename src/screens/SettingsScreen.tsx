import { useState } from "react";
import { DAILY_GOALS, settings, type Theme } from "../state/settings";
import { progress } from "../state/progress";
import { history } from "../state/history";
import { course } from "../state/course";
import { useMidiContext } from "../midi/MidiProvider";
import { MIDI_HELP } from "../midi/useMidi";
import { ensureAudio, playTone } from "../audio/synth";
import type { Notation } from "../music/theory";
import { TopBar } from "../components/TopBar";
import { offlineSupported, usePwaStatus } from "../pwa/sw";
import { promptInstall, useInstallOption } from "../pwa/install";

export function SettingsScreen() {
  const s = settings.use();
  const midi = useMidiContext();
  const [confirmReset, setConfirmReset] = useState(false);
  const { offlineReady } = usePwaStatus();
  const install = useInstallOption();

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
        <p className="muted">
          Sonido de piano: Salamander Grand Piano, de Alexander Holm (
          <a href="https://creativecommons.org/licenses/by/3.0/deed.es" target="_blank" rel="noreferrer">
            CC BY 3.0
          </a>
          ). Fuentes: Bricolage Grotesque, Figtree y Noto Music (
          <a href="https://openfontlicense.org" target="_blank" rel="noreferrer">
            SIL Open Font License
          </a>
          ).
        </p>
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
        <h2>Práctica</h2>
        <fieldset className="option">
          <legend>Objetivo diario</legend>
          <div className="seg" role="group">
            {DAILY_GOALS.map((v) => (
              <button key={v} aria-pressed={s.dailyGoal === v} onClick={() => settings.set({ dailyGoal: v })}>
                {v ? `${v} min` : "Desactivado"}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="muted">Solo te muestra cuánto llevas cada día; la racha cuenta cualquier día con práctica.</p>
      </section>

      {install !== "installed" && (
        <section className="panel">
          <h2>Instalar Tecla</h2>
          {install === "button" ? (
            <>
              <p>Ábrela desde un icono, en su propia ventana y sin conexión.</p>
              <div className="row">
                <button className="btn primary" onClick={() => void promptInstall()}>
                  Instalar
                </button>
              </div>
            </>
          ) : install === "ios-instructions" ? (
            <p>En iPhone o iPad: pulsa Compartir y luego «Añadir a pantalla de inicio».</p>
          ) : (
            <p>Este navegador no permite instalar apps, pero Tecla funciona sin conexión.</p>
          )}
        </section>
      )}

      {import.meta.env.DEV && (
        <section className="panel">
          <h2>Desarrollo</h2>
          <label className="field">
            <input type="checkbox" checked={s.devUnlock} onChange={(e) => settings.set({ devUnlock: e.target.checked })} /> Desbloquear todo el
            Curso
          </label>
          <p className="muted">Abre los cuatro niveles sin cambiar el progreso guardado. Solo aparece con npm run dev.</p>
        </section>
      )}

      <section className="panel">
        <h2>Datos</h2>
        <p className="muted">El progreso se guarda solo en este navegador.</p>
        {offlineSupported() && (
          <p className="muted">Disponible sin conexión: {offlineReady ? "sí" : "preparando…"}</p>
        )}
        {confirmReset ? (
          <div className="row">
            <span>¿Borrar estrellas, racha, historial, estadísticas, tiempo de práctica y el avance del Curso?</span>
            <button
              className="btn danger"
              onClick={() => {
                progress.reset();
                course.reset();
                history.reset();
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

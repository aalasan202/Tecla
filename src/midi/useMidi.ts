import { useCallback, useEffect, useRef, useState } from "react";
import { parseMidiMessage } from "./message";

export type MidiStatus = "idle" | "ok" | "none" | "blocked" | "unsupported";

export interface MidiState {
  status: MidiStatus;
  devices: string[];
  connect: () => void;
}

/**
 * Conecta con los teclados MIDI del navegador y llama a onNoteOn con cada nota pulsada, y a
 * onPedal con el pedal de resonancia (009). Al cambiar los dispositivos, el pedal se suelta.
 */
export function useMidi(onNoteOn: (note: number, velocity: number) => void, onPedal?: (down: boolean) => void): MidiState {
  const [status, setStatus] = useState<MidiStatus>("idle");
  const [devices, setDevices] = useState<string[]>([]);
  const handler = useRef(onNoteOn);
  handler.current = onNoteOn;
  const pedal = useRef(onPedal);
  pedal.current = onPedal;
  const access = useRef<MIDIAccess | null>(null);

  const bind = useCallback((acc: MIDIAccess) => {
    const names: string[] = [];
    // un teclado desconectado con el pedal pisado no debe dejar notas sonando
    pedal.current?.(false);
    acc.inputs.forEach((input) => {
      if (input.state === "disconnected") return;
      names.push(input.name || "Teclado MIDI");
      input.onmidimessage = (ev) => {
        if (!ev.data) return;
        const msg = parseMidiMessage(ev.data);
        if (msg?.type === "note") handler.current(msg.note, msg.velocity);
        else if (msg?.type === "pedal") pedal.current?.(msg.down);
      };
    });
    setDevices(names);
    setStatus(names.length ? "ok" : "none");
  }, []);

  const connect = useCallback(() => {
    if (!navigator.requestMIDIAccess) {
      setStatus("unsupported");
      return;
    }
    if (access.current) {
      bind(access.current);
      return;
    }
    navigator
      .requestMIDIAccess()
      .then((acc) => {
        access.current = acc;
        acc.onstatechange = () => bind(acc);
        bind(acc);
      })
      .catch(() => setStatus("blocked"));
  }, [bind]);

  // intento silencioso al abrir: si el permiso ya se concedió, conecta sin preguntar
  useEffect(() => {
    if (!navigator.permissions || !navigator.requestMIDIAccess) return;
    navigator.permissions
      .query({ name: "midi" as PermissionName })
      .then((p) => {
        if (p.state === "granted") connect();
      })
      .catch(() => {});
  }, [connect]);

  return { status, devices, connect };
}

export const MIDI_HELP: Record<Exclude<MidiStatus, "idle" | "ok">, string> = {
  unsupported:
    "Este navegador no admite Web MIDI. Funciona en Chrome o Edge, en ordenador o Android, y solo en páginas https. Safari, iPhone y iPad no lo admiten.",
  blocked:
    "El navegador ha denegado el acceso MIDI. En Chrome toca el candado junto a la dirección › Permisos › Dispositivos MIDI › Permitir, recarga y vuelve a pulsar el botón.",
  none:
    "El navegador no ve ningún teclado. Por Bluetooth, el piano debe estar conectado como dispositivo MIDI antes de abrir la página: en Android, con una app como MIDI BLE Connect (emparejarlo en los ajustes de Bluetooth no basta); en Mac, Configuración de Audio MIDI › Estudio MIDI › Configurar Bluetooth; en Windows suele hacer falta un puente como MIDIberry + loopMIDI. Por cable USB suele funcionar sin más.",
};

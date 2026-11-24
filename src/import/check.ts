import { convertPiece } from "../music/import/convert";
import { convertFull } from "../music/import/full";
import { ImportError } from "../music/import/errors";
import { fnv1a64 } from "../music/import/hash";
import { midiToRaw, parseMidi } from "../music/import/midi";
import type { FullCheck, ImportCheck, RawPiece, SourceFormat } from "../music/import/types";
import { parseMusicXml } from "./musicxml";
import { unzipMxl } from "./mxl";

export const MAX_BYTES = 5 * 1024 * 1024;

/** Resultado de comprobar un archivo; si vale, con la versión completa (007) junto a la simplificada. */
export type FileCheck = ImportCheck & { bytes?: Uint8Array; hash?: string; format?: SourceFormat; full?: FullCheck };

/** Cede el hilo para que la interfaz siga respondiendo, y para si se ha cancelado (FR-017). */
async function pause(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
  await new Promise((r) => setTimeout(r, 0));
  if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
}

const startsWith = (b: Uint8Array, ...sig: number[]) => sig.every((x, i) => b[i] === x);

/** Texto de un XML: UTF-8 (con o sin BOM) o UTF-16 con BOM. Si no empieza por «<», no es XML. */
function xmlText(b: Uint8Array): string | null {
  let text: string;
  if (startsWith(b, 0xff, 0xfe)) text = new TextDecoder("utf-16le").decode(b);
  else if (startsWith(b, 0xfe, 0xff)) text = new TextDecoder("utf-16be").decode(b);
  else text = new TextDecoder("utf-8").decode(b);
  text = text.replace(/^﻿/, "");
  return /^\s*</.test(text) ? text : null;
}

async function read(bytes: Uint8Array, name: string, signal: AbortSignal): Promise<RawPiece> {
  // el formato se decide por el contenido, no por la extensión
  if (startsWith(bytes, 0x4d, 0x54, 0x68, 0x64)) return midiToRaw(parseMidi(bytes), name);
  let text: string | null;
  if (startsWith(bytes, 0x50, 0x4b)) {
    text = await unzipMxl(bytes);
    await pause(signal);
  } else {
    text = xmlText(bytes);
  }
  if (text === null) throw new ImportError("unreadable");
  return parseMusicXml(text, name);
}

/** Comprueba un archivo en el orden de FR-003 y, si vale, propone la pieza. */
export async function checkFile(file: File, signal: AbortSignal): Promise<FileCheck> {
  await pause(signal);
  if (file.size > MAX_BYTES) return { ok: false, reason: "tooLarge" };
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await pause(signal);
    const raw = await read(bytes, file.name, signal);
    await pause(signal);
    const result = convertPiece(raw);
    await pause(signal);
    const full = result.ok ? convertFull(raw) : undefined;
    await pause(signal);
    return { ...result, bytes, hash: fnv1a64(bytes), format: raw.format, ...(full ? { full } : {}) };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    if (e instanceof ImportError) return { ok: false, reason: e.reason, detail: e.detail };
    return { ok: false, reason: "unreadable" };
  }
}

/** Vuelve a leer un original guardado (para calcular la versión completa de una importada de 006). */
export function rawFromBytes(bytes: Uint8Array, name: string): Promise<RawPiece> {
  return read(bytes, name, new AbortController().signal);
}

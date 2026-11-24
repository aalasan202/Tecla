import { ImportError } from "../music/import/errors";

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

interface Entry {
  name: string;
  method: number;
  size: number;
  offset: number;
}

const utf8 = (b: Uint8Array) => new TextDecoder("utf-8").decode(b);

function entries(bytes: Uint8Array): Entry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // el registro de fin de directorio está al final, tras un comentario opcional de hasta 64 KB
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ImportError("unreadable");
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const out: Entry[] = [];
  for (let i = 0; i < count; i++) {
    if (view.getUint32(p, true) !== CENTRAL) throw new ImportError("unreadable");
    const method = view.getUint16(p + 10, true);
    const size = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const offset = view.getUint32(p + 42, true);
    out.push({ name: utf8(bytes.subarray(p + 46, p + 46 + nameLen)), method, size, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

async function extract(bytes: Uint8Array, e: Entry): Promise<string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(e.offset, true) !== LOCAL) throw new ImportError("unreadable");
  const start = e.offset + 30 + view.getUint16(e.offset + 26, true) + view.getUint16(e.offset + 28, true);
  if (start + e.size > bytes.length) throw new ImportError("unreadable");
  const data = bytes.slice(start, start + e.size);
  if (e.method === 0) return utf8(data);
  if (e.method !== 8) throw new ImportError("unreadable");
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return utf8(new Uint8Array(await new Response(stream).arrayBuffer()));
}

/** Abre un MusicXML comprimido (.mxl) y devuelve el texto de su partitura principal. */
export async function unzipMxl(bytes: Uint8Array): Promise<string> {
  try {
    const list = entries(bytes);
    const container = list.find((e) => e.name === "META-INF/container.xml");
    let target: Entry | undefined;
    if (container) {
      const xml = await extract(bytes, container);
      const path = /<rootfile[^>]*full-path\s*=\s*"([^"]+)"/.exec(xml)?.[1];
      target = list.find((e) => e.name === path);
    }
    target ??= list.find((e) => !e.name.startsWith("META-INF/") && /\.(musicxml|xml)$/i.test(e.name));
    if (!target) throw new ImportError("unreadable");
    return await extract(bytes, target);
  } catch (e) {
    if (e instanceof ImportError) throw e;
    throw new ImportError("unreadable");
  }
}

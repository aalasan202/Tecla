// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { ImportError } from "../music/import/errors";
import { unzipMxl } from "./mxl";

const enc = (s: string) => new TextEncoder().encode(s);

async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** ZIP mínimo (sin CRC, que el lector no comprueba). */
async function zip(files: [string, string][], method: 0 | 8): Promise<Uint8Array> {
  const local: number[] = [];
  const central: number[] = [];
  const u16 = (n: number) => [n & 255, (n >> 8) & 255];
  const u32 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  for (const [name, content] of files) {
    const raw = enc(content);
    const data = method === 8 ? await deflate(raw) : raw;
    const nm = [...enc(name)];
    const offset = local.length;
    local.push(...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(method), ...u16(0), ...u16(0), ...u32(0), ...u32(data.length), ...u32(raw.length), ...u16(nm.length), ...u16(0), ...nm, ...data);
    central.push(...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(method), ...u16(0), ...u16(0), ...u32(0), ...u32(data.length), ...u32(raw.length), ...u16(nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...nm);
  }
  const end = [...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(central.length), ...u32(local.length), ...u16(0)];
  return new Uint8Array([...local, ...central, ...end]);
}

const SCORE = `<?xml version="1.0"?><score-partwise version="4.0"><part-list/></score-partwise>`;
const CONTAINER = `<?xml version="1.0"?><container><rootfiles><rootfile full-path="music/score.musicxml" media-type="application/vnd.recordare.musicxml+xml"/></rootfiles></container>`;

describe("unzipMxl", () => {
  it.each([[8], [0]] as const)("devuelve el rootfile de container.xml (método %s)", async (method) => {
    const bytes = await zip([["META-INF/container.xml", CONTAINER], ["otro.xml", "<nada/>"], ["music/score.musicxml", SCORE]], method);
    expect(await unzipMxl(bytes)).toBe(SCORE);
  });

  it("sin container.xml, el primer .musicxml o .xml fuera de META-INF", async () => {
    const bytes = await zip([["META-INF/otro.xml", "<no/>"], ["score.xml", SCORE]], 8);
    expect(await unzipMxl(bytes)).toBe(SCORE);
  });

  it("un ZIP roto → ilegible", async () => {
    const bytes = (await zip([["score.xml", SCORE]], 8)).slice(0, 30);
    await expect(unzipMxl(bytes)).rejects.toBeInstanceOf(ImportError);
  });
});

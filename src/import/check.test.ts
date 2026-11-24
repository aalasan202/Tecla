// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { SONGS } from "../music/songs";
import { songToMidi, songToMusicXml } from "../music/import/fixtures";
import { MAX_BYTES, checkFile } from "./check";

const oda = SONGS.find((s) => s.id === "oda")!;
const file = (data: string | Uint8Array, name: string) => new File([data as BlobPart], name);
const check = (f: File) => checkFile(f, new AbortController().signal);

describe("checkFile", () => {
  it("rechaza un archivo de más de 5 MB sin leerlo", async () => {
    const big = file(new Uint8Array(MAX_BYTES + 1), "grande.mid");
    let read = false;
    big.arrayBuffer = async () => {
      read = true;
      return new ArrayBuffer(0);
    };
    expect(await check(big)).toEqual({ ok: false, reason: "tooLarge" });
    expect(read).toBe(false);
  });

  it("un texto con extensión .mid → ilegible", async () => {
    expect(await check(file("hola, esto no es música", "texto.mid"))).toMatchObject({ ok: false, reason: "unreadable" });
  });

  it("detecta el formato por el contenido: un MIDI con extensión .xml se lee como MIDI", async () => {
    const r = await check(file(songToMidi(oda), "oda.xml"));
    expect(r.ok).toBe(true);
    expect(r.format).toBe("midi");
    expect(r.hash).toMatch(/^[0-9a-f]{16}$/);
    expect(r.bytes?.length).toBeGreaterThan(0);
  });

  it("lee MusicXML, también con BOM", async () => {
    const r = await check(file("﻿" + songToMusicXml(oda), "oda.musicxml"));
    expect(r.ok && r.proposal.song.n).toEqual(oda.n);
    expect(r.format).toBe("musicxml");
  });

  it("si se cancela antes de terminar, rechaza con AbortError", async () => {
    const ctrl = new AbortController();
    const p = checkFile(file(songToMidi(oda), "oda.mid"), ctrl.signal);
    ctrl.abort();
    await expect(p).rejects.toMatchObject({ name: "AbortError" });
  });
});

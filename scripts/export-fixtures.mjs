// Escribe en dev-fixtures/ archivos para probar a mano la importación (quickstart §3):
// las piezas del repertorio en MIDI y MusicXML, una melodía en una sola pista, una pieza
// muy larga y los archivos no válidos de los tests. Uso: node scripts/export-fixtures.mjs
// (node 24 carga los .ts directamente; ambos módulos solo tienen `import type`).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SONGS } from "../src/music/songs.ts";
import { DOS_CUARTOS, PRUEBA_COMPLETA, nameMeta, songToMidi, songToMusicXml, tempoMeta, timeMeta, twoVoicesXml, writeMidi } from "../src/music/import/fixtures.ts";

const out = join(import.meta.dirname, "..", "dev-fixtures");
mkdirSync(out, { recursive: true });
const files = [];
const put = (name, data) => {
  writeFileSync(join(out, name), data);
  files.push(name);
};
const byId = (id) => SONGS.find((s) => s.id === id);

for (const s of SONGS) {
  put(`${s.id}.mid`, songToMidi(s));
  put(`${s.id}.musicxml`, songToMusicXml(s));
}
put("martinillo-una-pista.mid", songToMidi(byId("martinillo"), { singleTrack: true }));

// dos manos mezcladas en una pista: se reparten por el Do central (aviso «manos repartidas»)
put("oda2-una-pista.mid", songToMidi(byId("oda2"), { singleTrack: true }));

// versión completa (007): Sol mayor, acordes, tresillo y nota ligada; el resumen ofrece las dos versiones
put("prueba-completa.mid", songToMidi(PRUEBA_COMPLETA));
put("prueba-completa.musicxml", songToMusicXml(PRUEBA_COMPLETA));
// dos voces en una mano: solo la versión simplificada, con el motivo
put("dos-voces.musicxml", twoVoicesXml());

// compás de 2/4 (clarificación 2026-11-24)
put("dos-cuartos.mid", songToMidi(DOS_CUARTOS));
put("dos-cuartos.musicxml", songToMusicXml(DOS_CUARTOS));

// más de 300 compases: aviso de rendimiento (FR-011)
const base = byId("oda2");
const times = 40; // oda2 tiene 8 compases → 320
const repeat = (t) => Array.from({ length: times }, () => t).flat();
put("larga.mid", songToMidi({ ...base, title: "Himno muy largo", r: repeat(base.r), l: repeat(base.l) }));

// no válidos
put("texto.mid", "Esto no es un archivo MIDI.\n");
const oda = songToMidi(byId("oda"));
put("cortado.mid", oda.slice(0, Math.floor(oda.length / 2)));
put("vacio.mid", writeMidi([[{ dt: 0, data: nameMeta("Vacío") }, { dt: 0, data: tempoMeta(90) }]]));
const hit = (dt, on) => ({ dt, data: [on ? 0x99 : 0x89, 36, on ? 100 : 0] });
put("bateria.mid", writeMidi([[{ dt: 0, data: tempoMeta(100) }, hit(0, true), hit(240, false), hit(240, true), hit(240, false)]]));
const voice = (pitch) => [
  { dt: 0, data: [0x90, pitch, 80] },
  { dt: 480, data: [0x80, pitch, 0] },
];
put("tres-pistas.mid", writeMidi([[{ dt: 0, data: tempoMeta(90) }, ...voice(72)], voice(60), voice(48)]));
// 6/8: desde 007 se admite (FR-020)
put(
  "seis-octavos.musicxml",
  songToMusicXml(byId("oda")).replace(/<beats>\d+<\/beats>\s*<beat-type>\d+<\/beat-type>/, "<beats>6</beats><beat-type>8</beat-type>"),
);
put(
  "dos-medios.musicxml",
  songToMusicXml({ ...DOS_CUARTOS, title: "Compás de 2/2" }).replace("<beats>2</beats><beat-type>4</beat-type>", "<beats>2</beats><beat-type>2</beat-type>"),
);
put(
  "opus.musicxml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<opus version="4.0"><title>Colección</title><score xlink:href="a.musicxml" xmlns:xlink="http://www.w3.org/1999/xlink"/></opus>\n`,
);
put("compas-cambiante.mid", writeMidi([[{ dt: 0, data: timeMeta(4) }, ...voice(60), { dt: 1440, data: timeMeta(3) }, ...voice(62)]]));

console.log(`${files.length} archivos en ${out}`);

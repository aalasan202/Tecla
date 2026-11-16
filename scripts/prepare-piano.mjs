// Descarga las 30 muestras del Salamander Grand Piano (CC BY 3.0, Alexander Holm) que usa Tecla
// y las guarda en public/samples/piano/. Solo hace falta volver a ejecutarlo si cambian las muestras
// (y entonces hay que subir la versión de la caché en src/audio/piano.ts).
//
//   node scripts/prepare-piano.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SOURCE = "https://tonejs.github.io/audio/salamander/";
const OUT = fileURLToPath(new URL("../public/samples/piano/", import.meta.url));
const MAX_BYTES = 3 * 1024 * 1024;
const NAMES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"];

const files = [];
for (let m = 21; m <= 108; m += 3) files.push(`${NAMES[m % 12]}${Math.floor(m / 12) - 1}.mp3`);

await mkdir(OUT, { recursive: true });
let total = 0;
for (const file of files) {
  const res = await fetch(SOURCE + file);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const data = Buffer.from(await res.arrayBuffer());
  await writeFile(OUT + file, data);
  total += data.length;
  console.log(`${file.padEnd(8)} ${(data.length / 1024).toFixed(0).padStart(4)} KB`);
}
console.log(`\n${files.length} muestras, ${(total / 1024 / 1024).toFixed(2)} MB`);
if (total > MAX_BYTES) {
  console.error("Supera el presupuesto de 3 MB (SC-003)");
  process.exit(1);
}
